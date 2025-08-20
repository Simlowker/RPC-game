use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer as SplTransfer};
use sha2::{Digest, Sha256};

declare_id!("zYQ16fyWiwZWgWjpQ9JBzL4QwLbp5MbezSBwSi2YTfY");

#[program]
pub mod rps {
    use super::*;

    pub fn create_match(
        ctx: Context<CreateMatch>,
        bet_amount: u64,
        commitment_hash: [u8; 32],
        join_deadline: i64,
        reveal_deadline: i64,
        fee_bps: u16,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let creator = &ctx.accounts.creator;
        
        require!(bet_amount > 0, RpsError::InvalidBetAmount);
        require!(join_deadline > Clock::get()?.unix_timestamp, RpsError::InvalidDeadline);
        require!(reveal_deadline > join_deadline, RpsError::InvalidDeadline);
        require!(fee_bps <= 1000, RpsError::InvalidFeeRate); // Max 10% fee

        match_account.creator = creator.key();
        match_account.opponent = Pubkey::default();
        match_account.bet_amount = bet_amount;
        match_account.token_mint = ctx.accounts.token_mint.as_ref().map(|m| m.key());
        match_account.commitment_creator = commitment_hash;
        match_account.commitment_opponent = [0; 32];
        match_account.revealed_creator = None;
        match_account.revealed_opponent = None;
        match_account.join_deadline = join_deadline;
        match_account.reveal_deadline = reveal_deadline;
        match_account.status = MatchStatus::WaitingForOpponent;
        match_account.fee_bps = fee_bps;
        match_account.vault_pda_bump = ctx.bumps.vault;

        // Transfer creator's bet to vault
        if let Some(token_mint) = &ctx.accounts.token_mint {
            // SPL Token transfer
            let transfer_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                SplTransfer {
                    from: ctx.accounts.creator_token_account.as_ref().unwrap().to_account_info(),
                    to: ctx.accounts.vault_token_account.as_ref().unwrap().to_account_info(),
                    authority: creator.to_account_info(),
                },
            );
            token::transfer(transfer_ctx, bet_amount)?;
        } else {
            // SOL transfer
            let lamports = bet_amount;
            let creator_info = creator.to_account_info();
            let vault_info = ctx.accounts.vault.to_account_info();
            
            **creator_info.try_borrow_mut_lamports()? -= lamports;
            **vault_info.try_borrow_mut_lamports()? += lamports;
        }

        emit!(MatchCreated {
            match_id: match_account.key(),
            creator: creator.key(),
            bet_amount,
            token_mint: match_account.token_mint,
            join_deadline,
        });

        Ok(())
    }

    pub fn join_match(
        ctx: Context<JoinMatch>,
        commitment_hash: [u8; 32],
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let opponent = &ctx.accounts.opponent;
        
        require!(match_account.status == MatchStatus::WaitingForOpponent, RpsError::InvalidMatchStatus);
        require!(Clock::get()?.unix_timestamp <= match_account.join_deadline, RpsError::DeadlinePassed);
        require!(opponent.key() != match_account.creator, RpsError::CannotPlaySelf);

        match_account.opponent = opponent.key();
        match_account.commitment_opponent = commitment_hash;
        match_account.status = MatchStatus::WaitingForReveal;

        // Transfer opponent's bet to vault
        if let Some(_) = match_account.token_mint {
            // SPL Token transfer
            let transfer_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                SplTransfer {
                    from: ctx.accounts.opponent_token_account.as_ref().unwrap().to_account_info(),
                    to: ctx.accounts.vault_token_account.as_ref().unwrap().to_account_info(),
                    authority: opponent.to_account_info(),
                },
            );
            token::transfer(transfer_ctx, match_account.bet_amount)?;
        } else {
            // SOL transfer
            let lamports = match_account.bet_amount;
            let opponent_info = opponent.to_account_info();
            let vault_info = ctx.accounts.vault.to_account_info();
            
            **opponent_info.try_borrow_mut_lamports()? -= lamports;
            **vault_info.try_borrow_mut_lamports()? += lamports;
        }

        emit!(MatchJoined {
            match_id: match_account.key(),
            opponent: opponent.key(),
        });

        Ok(())
    }

    pub fn reveal(
        ctx: Context<Reveal>,
        choice: Choice,
        salt: [u8; 32],
        nonce: u64,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let player = &ctx.accounts.player;
        
        require!(match_account.status == MatchStatus::WaitingForReveal, RpsError::InvalidMatchStatus);
        require!(Clock::get()?.unix_timestamp <= match_account.reveal_deadline, RpsError::DeadlinePassed);
        
        // Verify commitment hash
        let expected_hash = create_commitment_hash(choice, &salt, &player.key(), nonce);
        
        let is_creator = player.key() == match_account.creator;
        let is_opponent = player.key() == match_account.opponent;
        
        require!(is_creator || is_opponent, RpsError::NotParticipant);
        
        if is_creator {
            require!(expected_hash == match_account.commitment_creator, RpsError::InvalidCommitment);
            require!(match_account.revealed_creator.is_none(), RpsError::AlreadyRevealed);
            match_account.revealed_creator = Some(choice);
        } else {
            require!(expected_hash == match_account.commitment_opponent, RpsError::InvalidCommitment);
            require!(match_account.revealed_opponent.is_none(), RpsError::AlreadyRevealed);
            match_account.revealed_opponent = Some(choice);
        }

        // Check if both players have revealed
        if match_account.revealed_creator.is_some() && match_account.revealed_opponent.is_some() {
            match_account.status = MatchStatus::ReadyToSettle;
        }

        emit!(ChoiceRevealed {
            match_id: match_account.key(),
            player: player.key(),
            choice,
        });

        Ok(())
    }

    pub fn settle(ctx: Context<Settle>) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        
        require!(match_account.status == MatchStatus::ReadyToSettle, RpsError::InvalidMatchStatus);
        
        let creator_choice = match_account.revealed_creator.unwrap();
        let opponent_choice = match_account.revealed_opponent.unwrap();
        
        let result = determine_winner(creator_choice, opponent_choice);
        let total_bet = match_account.bet_amount * 2;
        let fee_amount = (total_bet * match_account.fee_bps as u64) / 10000;
        let payout_amount = total_bet - fee_amount;
        
        match result {
            GameResult::CreatorWins => {
                transfer_from_vault(
                    &ctx.accounts,
                    &ctx.accounts.creator.to_account_info(),
                    payout_amount,
                    match_account,
                )?;
            },
            GameResult::OpponentWins => {
                transfer_from_vault(
                    &ctx.accounts,
                    &ctx.accounts.opponent.to_account_info(),
                    payout_amount,
                    match_account,
                )?;
            },
            GameResult::Tie => {
                // Refund both players their original bets
                transfer_from_vault(
                    &ctx.accounts,
                    &ctx.accounts.creator.to_account_info(),
                    match_account.bet_amount,
                    match_account,
                )?;
                transfer_from_vault(
                    &ctx.accounts,
                    &ctx.accounts.opponent.to_account_info(),
                    match_account.bet_amount,
                    match_account,
                )?;
            }
        }
        
        // Transfer fee to fee collector if there's a fee
        if fee_amount > 0 && result != GameResult::Tie {
            transfer_from_vault(
                &ctx.accounts,
                &ctx.accounts.fee_collector.to_account_info(),
                fee_amount,
                match_account,
            )?;
        }
        
        match_account.status = MatchStatus::Settled;
        
        emit!(MatchSettled {
            match_id: match_account.key(),
            winner: match result {
                GameResult::CreatorWins => Some(match_account.creator),
                GameResult::OpponentWins => Some(match_account.opponent),
                GameResult::Tie => None,
            },
            result,
        });

        Ok(())
    }

    pub fn cancel_match(ctx: Context<CancelMatch>) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let creator = &ctx.accounts.creator;
        
        require!(creator.key() == match_account.creator, RpsError::OnlyCreatorCanCancel);
        require!(match_account.status == MatchStatus::WaitingForOpponent, RpsError::CannotCancelJoinedMatch);
        
        // Refund creator's bet
        transfer_from_vault(
            &ctx.accounts,
            &creator.to_account_info(),
            match_account.bet_amount,
            match_account,
        )?;
        
        match_account.status = MatchStatus::Cancelled;
        
        emit!(MatchCancelled {
            match_id: match_account.key(),
        });

        Ok(())
    }

    pub fn timeout_match(ctx: Context<TimeoutMatch>) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let current_time = Clock::get()?.unix_timestamp;
        
        match match_account.status {
            MatchStatus::WaitingForOpponent => {
                require!(current_time > match_account.join_deadline, RpsError::DeadlineNotPassed);
                
                // Refund creator
                transfer_from_vault(
                    &ctx.accounts,
                    &ctx.accounts.creator.to_account_info(),
                    match_account.bet_amount,
                    match_account,
                )?;
                
                match_account.status = MatchStatus::TimedOut;
            },
            MatchStatus::WaitingForReveal => {
                require!(current_time > match_account.reveal_deadline, RpsError::DeadlineNotPassed);
                
                // Determine who revealed and who didn't
                let creator_revealed = match_account.revealed_creator.is_some();
                let opponent_revealed = match_account.revealed_opponent.is_some();
                
                match (creator_revealed, opponent_revealed) {
                    (true, false) => {
                        // Creator wins by default
                        let total_bet = match_account.bet_amount * 2;
                        transfer_from_vault(
                            &ctx.accounts,
                            &ctx.accounts.creator.to_account_info(),
                            total_bet,
                            match_account,
                        )?;
                    },
                    (false, true) => {
                        // Opponent wins by default
                        let total_bet = match_account.bet_amount * 2;
                        transfer_from_vault(
                            &ctx.accounts,
                            &ctx.accounts.opponent.to_account_info(),
                            total_bet,
                            match_account,
                        )?;
                    },
                    (false, false) => {
                        // Both timed out, refund both
                        transfer_from_vault(
                            &ctx.accounts,
                            &ctx.accounts.creator.to_account_info(),
                            match_account.bet_amount,
                            match_account,
                        )?;
                        transfer_from_vault(
                            &ctx.accounts,
                            &ctx.accounts.opponent.to_account_info(),
                            match_account.bet_amount,
                            match_account,
                        )?;
                    },
                    (true, true) => {
                        // Both revealed, should settle normally
                        return Err(RpsError::ShouldSettleNotTimeout.into());
                    }
                }
                
                match_account.status = MatchStatus::TimedOut;
            },
            _ => return Err(RpsError::CannotTimeout.into()),
        }
        
        emit!(MatchTimedOut {
            match_id: match_account.key(),
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bet_amount: u64)]
pub struct CreateMatch<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Match::LEN,
        seeds = [b"match", creator.key().as_ref(), &Clock::get().unwrap().unix_timestamp.to_le_bytes()],
        bump
    )]
    pub match_account: Account<'info, Match>,
    
    #[account(
        init,
        payer = creator,
        space = 0,
        seeds = [b"vault", match_account.key().as_ref()],
        bump
    )]
    /// CHECK: PDA for escrow vault
    pub vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub token_mint: Option<Account<'info, Mint>>,
    
    #[account(
        mut,
        constraint = creator_token_account.as_ref().map_or(true, |acc| acc.owner == creator.key())
    )]
    pub creator_token_account: Option<Account<'info, TokenAccount>>,
    
    #[account(
        init_if_needed,
        payer = creator,
        associated_token::mint = token_mint,
        associated_token::authority = vault,
        constraint = token_mint.is_some() == vault_token_account.is_some()
    )]
    pub vault_token_account: Option<Account<'info, TokenAccount>>,
    
    pub token_program: Option<Program<'info, Token>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinMatch<'info> {
    #[account(mut)]
    pub match_account: Account<'info, Match>,
    
    #[account(
        mut,
        seeds = [b"vault", match_account.key().as_ref()],
        bump = match_account.vault_pda_bump
    )]
    /// CHECK: PDA for escrow vault
    pub vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub opponent: Signer<'info>,
    
    #[account(
        mut,
        constraint = opponent_token_account.as_ref().map_or(true, |acc| acc.owner == opponent.key())
    )]
    pub opponent_token_account: Option<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    pub vault_token_account: Option<Account<'info, TokenAccount>>,
    
    pub token_program: Option<Program<'info, Token>>,
}

#[derive(Accounts)]
pub struct Reveal<'info> {
    #[account(mut)]
    pub match_account: Account<'info, Match>,
    
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct Settle<'info> {
    #[account(mut)]
    pub match_account: Account<'info, Match>,
    
    #[account(
        mut,
        seeds = [b"vault", match_account.key().as_ref()],
        bump = match_account.vault_pda_bump
    )]
    /// CHECK: PDA for escrow vault
    pub vault: AccountInfo<'info>,
    
    #[account(mut)]
    /// CHECK: Creator account for potential payout
    pub creator: AccountInfo<'info>,
    
    #[account(mut)]
    /// CHECK: Opponent account for potential payout
    pub opponent: AccountInfo<'info>,
    
    #[account(mut)]
    /// CHECK: Fee collector account
    pub fee_collector: AccountInfo<'info>,
    
    #[account(mut)]
    pub creator_token_account: Option<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    pub opponent_token_account: Option<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    pub vault_token_account: Option<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    pub fee_collector_token_account: Option<Account<'info, TokenAccount>>,
    
    pub token_program: Option<Program<'info, Token>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelMatch<'info> {
    #[account(mut)]
    pub match_account: Account<'info, Match>,
    
    #[account(
        mut,
        seeds = [b"vault", match_account.key().as_ref()],
        bump = match_account.vault_pda_bump
    )]
    /// CHECK: PDA for escrow vault
    pub vault: AccountInfo<'info>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(mut)]
    pub creator_token_account: Option<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    pub vault_token_account: Option<Account<'info, TokenAccount>>,
    
    pub token_program: Option<Program<'info, Token>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TimeoutMatch<'info> {
    #[account(mut)]
    pub match_account: Account<'info, Match>,
    
    #[account(
        mut,
        seeds = [b"vault", match_account.key().as_ref()],
        bump = match_account.vault_pda_bump
    )]
    /// CHECK: PDA for escrow vault
    pub vault: AccountInfo<'info>,
    
    #[account(mut)]
    /// CHECK: Creator account for potential refund
    pub creator: AccountInfo<'info>,
    
    #[account(mut)]
    /// CHECK: Opponent account for potential refund
    pub opponent: AccountInfo<'info>,
    
    #[account(mut)]
    pub creator_token_account: Option<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    pub opponent_token_account: Option<Account<'info, TokenAccount>>,
    
    #[account(mut)]
    pub vault_token_account: Option<Account<'info, TokenAccount>>,
    
    pub token_program: Option<Program<'info, Token>>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Match {
    pub creator: Pubkey,
    pub opponent: Pubkey,
    pub bet_amount: u64,
    pub token_mint: Option<Pubkey>,
    pub commitment_creator: [u8; 32],
    pub commitment_opponent: [u8; 32],
    pub revealed_creator: Option<Choice>,
    pub revealed_opponent: Option<Choice>,
    pub join_deadline: i64,
    pub reveal_deadline: i64,
    pub status: MatchStatus,
    pub fee_bps: u16,
    pub vault_pda_bump: u8,
}

impl Match {
    pub const LEN: usize = 
        32 + // creator
        32 + // opponent
        8 + // bet_amount
        1 + 32 + // token_mint (Option<Pubkey>)
        32 + // commitment_creator
        32 + // commitment_opponent
        1 + 1 + // revealed_creator (Option<Choice>)
        1 + 1 + // revealed_opponent (Option<Choice>)
        8 + // join_deadline
        8 + // reveal_deadline
        1 + // status
        2 + // fee_bps
        1; // vault_pda_bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum Choice {
    Rock,
    Paper,
    Scissors,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum MatchStatus {
    WaitingForOpponent,
    WaitingForReveal,
    ReadyToSettle,
    Settled,
    Cancelled,
    TimedOut,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum GameResult {
    CreatorWins,
    OpponentWins,
    Tie,
}

#[event]
pub struct MatchCreated {
    pub match_id: Pubkey,
    pub creator: Pubkey,
    pub bet_amount: u64,
    pub token_mint: Option<Pubkey>,
    pub join_deadline: i64,
}

#[event]
pub struct MatchJoined {
    pub match_id: Pubkey,
    pub opponent: Pubkey,
}

#[event]
pub struct ChoiceRevealed {
    pub match_id: Pubkey,
    pub player: Pubkey,
    pub choice: Choice,
}

#[event]
pub struct MatchSettled {
    pub match_id: Pubkey,
    pub winner: Option<Pubkey>,
    pub result: GameResult,
}

#[event]
pub struct MatchCancelled {
    pub match_id: Pubkey,
}

#[event]
pub struct MatchTimedOut {
    pub match_id: Pubkey,
}

#[error_code]
pub enum RpsError {
    #[msg("Invalid bet amount")]
    InvalidBetAmount,
    
    #[msg("Invalid deadline")]
    InvalidDeadline,
    
    #[msg("Invalid fee rate")]
    InvalidFeeRate,
    
    #[msg("Invalid match status for this operation")]
    InvalidMatchStatus,
    
    #[msg("Deadline has passed")]
    DeadlinePassed,
    
    #[msg("Cannot play against yourself")]
    CannotPlaySelf,
    
    #[msg("Invalid commitment hash")]
    InvalidCommitment,
    
    #[msg("Choice already revealed")]
    AlreadyRevealed,
    
    #[msg("Not a participant in this match")]
    NotParticipant,
    
    #[msg("Only creator can cancel the match")]
    OnlyCreatorCanCancel,
    
    #[msg("Cannot cancel a match that has been joined")]
    CannotCancelJoinedMatch,
    
    #[msg("Deadline has not passed yet")]
    DeadlineNotPassed,
    
    #[msg("Match should be settled, not timed out")]
    ShouldSettleNotTimeout,
    
    #[msg("Cannot timeout in current status")]
    CannotTimeout,
}

fn create_commitment_hash(choice: Choice, salt: &[u8; 32], player: &Pubkey, nonce: u64) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(&[choice as u8]);
    hasher.update(salt);
    hasher.update(player.as_ref());
    hasher.update(&nonce.to_le_bytes());
    hasher.finalize().into()
}

fn determine_winner(creator_choice: Choice, opponent_choice: Choice) -> GameResult {
    match (creator_choice, opponent_choice) {
        (Choice::Rock, Choice::Scissors) |
        (Choice::Paper, Choice::Rock) |
        (Choice::Scissors, Choice::Paper) => GameResult::CreatorWins,
        
        (Choice::Scissors, Choice::Rock) |
        (Choice::Rock, Choice::Paper) |
        (Choice::Paper, Choice::Scissors) => GameResult::OpponentWins,
        
        _ => GameResult::Tie,
    }
}

fn transfer_from_vault<'info>(
    accounts: &Settle<'info>,
    recipient: &AccountInfo<'info>,
    amount: u64,
    match_account: &Match,
) -> Result<()> {
    if let Some(_) = match_account.token_mint {
        // SPL Token transfer
        let vault_seeds = &[
            b"vault",
            match_account.key().as_ref(),
            &[match_account.vault_pda_bump],
        ];
        let signer_seeds = &[&vault_seeds[..]];
        
        let transfer_ctx = CpiContext::new_with_signer(
            accounts.token_program.as_ref().unwrap().to_account_info(),
            SplTransfer {
                from: accounts.vault_token_account.as_ref().unwrap().to_account_info(),
                to: if recipient.key() == match_account.creator {
                    accounts.creator_token_account.as_ref().unwrap().to_account_info()
                } else if recipient.key() == match_account.opponent {
                    accounts.opponent_token_account.as_ref().unwrap().to_account_info()
                } else {
                    accounts.fee_collector_token_account.as_ref().unwrap().to_account_info()
                },
                authority: accounts.vault.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_ctx, amount)?;
    } else {
        // SOL transfer
        let vault_info = &accounts.vault;
        let recipient_info = recipient;
        
        **vault_info.try_borrow_mut_lamports()? -= amount;
        **recipient_info.try_borrow_mut_lamports()? += amount;
    }
    
    Ok(())
}