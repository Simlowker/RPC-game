use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as SplTransfer};
use sha2::{Digest, Sha256};

declare_id!("32tQhc2c4LurhdBwDzzV8f3PtdhKm1iVaPSumDTZWAvb");

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
        require!(
            join_deadline > Clock::get()?.unix_timestamp,
            RpsError::InvalidDeadline
        );
        require!(reveal_deadline > join_deadline, RpsError::InvalidDeadline);
        require!(fee_bps <= 500, RpsError::InvalidFeeRate); // Max 5% fee for production
        require!(bet_amount >= 1000, RpsError::BetTooSmall); // Min 0.001 SOL or equivalent
        require!(bet_amount <= 100_000_000_000, RpsError::BetTooLarge); // Max 100 SOL or equivalent

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
        match_account.created_at = Clock::get()?.unix_timestamp;

        // Transfer creator's bet to vault
        if let Some(token_mint) = &ctx.accounts.token_mint {
            // SPL Token transfer
            let transfer_ctx = CpiContext::new(
                ctx.accounts
                    .token_program
                    .as_ref()
                    .unwrap()
                    .to_account_info(),
                SplTransfer {
                    from: ctx
                        .accounts
                        .creator_token_account
                        .as_ref()
                        .unwrap()
                        .to_account_info(),
                    to: ctx
                        .accounts
                        .vault_token_account
                        .as_ref()
                        .unwrap()
                        .to_account_info(),
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

    pub fn join_match(ctx: Context<JoinMatch>, commitment_hash: [u8; 32]) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let opponent = &ctx.accounts.opponent;

        // Security validations
        match_account.validate_active()?;
        require!(
            match_account.status == MatchStatus::WaitingForOpponent,
            RpsError::InvalidMatchStatus
        );
        require!(
            Clock::get()?.unix_timestamp <= match_account.join_deadline,
            RpsError::DeadlinePassed
        );
        require!(
            opponent.key() != match_account.creator,
            RpsError::CannotPlaySelf
        );

        match_account.opponent = opponent.key();
        match_account.commitment_opponent = commitment_hash;
        match_account.status = MatchStatus::WaitingForReveal;

        // Transfer opponent's bet to vault
        if let Some(_) = match_account.token_mint {
            // SPL Token transfer
            let transfer_ctx = CpiContext::new(
                ctx.accounts
                    .token_program
                    .as_ref()
                    .unwrap()
                    .to_account_info(),
                SplTransfer {
                    from: ctx
                        .accounts
                        .opponent_token_account
                        .as_ref()
                        .unwrap()
                        .to_account_info(),
                    to: ctx
                        .accounts
                        .vault_token_account
                        .as_ref()
                        .unwrap()
                        .to_account_info(),
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

    pub fn reveal(ctx: Context<Reveal>, choice: Choice, salt: [u8; 32], nonce: u64) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let player = &ctx.accounts.player;

        // Security validations
        match_account.validate_active()?;
        require!(
            match_account.status == MatchStatus::WaitingForReveal,
            RpsError::InvalidMatchStatus
        );
        require!(
            Clock::get()?.unix_timestamp <= match_account.reveal_deadline,
            RpsError::DeadlinePassed
        );

        // Verify commitment hash
        let expected_hash = create_commitment_hash(choice, &salt, &player.key(), nonce);

        let is_creator = player.key() == match_account.creator;
        let is_opponent = player.key() == match_account.opponent;

        require!(is_creator || is_opponent, RpsError::NotParticipant);

        if is_creator {
            require!(
                expected_hash == match_account.commitment_creator,
                RpsError::InvalidCommitment
            );
            require!(
                match_account.revealed_creator.is_none(),
                RpsError::AlreadyRevealed
            );
            match_account.revealed_creator = Some(choice);
        } else {
            require!(
                expected_hash == match_account.commitment_opponent,
                RpsError::InvalidCommitment
            );
            require!(
                match_account.revealed_opponent.is_none(),
                RpsError::AlreadyRevealed
            );
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
        
        // Security validations
        match_account.validate_active()?;
        require!(
            match_account.status == MatchStatus::ReadyToSettle,
            RpsError::InvalidMatchStatus
        );
        
        // Additional security: Verify both players exist and revealed
        require!(match_account.creator != Pubkey::default(), RpsError::InvalidCreator);
        require!(match_account.opponent != Pubkey::default(), RpsError::InvalidOpponent);
        
        let creator_choice = match_account.revealed_creator
            .ok_or(RpsError::CreatorNotRevealed)?;
        let opponent_choice = match_account.revealed_opponent
            .ok_or(RpsError::OpponentNotRevealed)?;

        // Calculate payouts with overflow protection
        let bet_amount = match_account.bet_amount;
        require!(bet_amount > 0, RpsError::InvalidBetAmount);
        
        let total_bet = bet_amount.checked_mul(2)
            .ok_or(RpsError::ArithmeticOverflow)?;
        
        let fee_bps = match_account.fee_bps;
        require!(fee_bps <= 500, RpsError::InvalidFeeRate); // Max 5% fee
        
        let fee_amount = total_bet.checked_mul(fee_bps as u64)
            .ok_or(RpsError::ArithmeticOverflow)?
            .checked_div(10000)
            .ok_or(RpsError::ArithmeticOverflow)?;
            
        let payout_amount = total_bet.checked_sub(fee_amount)
            .ok_or(RpsError::ArithmeticOverflow)?;

        // Determine winner and execute payouts
        let result = determine_winner(creator_choice, opponent_choice);
        let match_key = match_account.key();
        let creator_key = match_account.creator;
        let opponent_key = match_account.opponent;
        
        // Mark as settled BEFORE transfers to prevent reentrancy
        match_account.status = MatchStatus::Settled;

        match result {
            GameResult::CreatorWins => {
                // Transfer full payout to creator
                transfer_from_vault(
                    &ctx.accounts.vault,
                    &ctx.accounts.creator,
                    ctx.accounts.creator_token_account.as_ref(),
                    ctx.accounts.vault_token_account.as_ref(),
                    match_account.token_mint,
                    payout_amount,
                    match_account.vault_pda_bump,
                    match_key,
                    ctx.accounts.token_program.as_ref(),
                    &ctx.accounts.system_program,
                )?;
                
                // Transfer fee to fee collector
                if fee_amount > 0 {
                    transfer_from_vault(
                        &ctx.accounts.vault,
                        &ctx.accounts.fee_collector,
                        ctx.accounts.fee_collector_token_account.as_ref(),
                        ctx.accounts.vault_token_account.as_ref(),
                        match_account.token_mint,
                        fee_amount,
                        match_account.vault_pda_bump,
                        match_key,
                        ctx.accounts.token_program.as_ref(),
                        &ctx.accounts.system_program,
                    )?;
                }
            }
            GameResult::OpponentWins => {
                // Transfer full payout to opponent
                transfer_from_vault(
                    &ctx.accounts.vault,
                    &ctx.accounts.opponent,
                    ctx.accounts.opponent_token_account.as_ref(),
                    ctx.accounts.vault_token_account.as_ref(),
                    match_account.token_mint,
                    payout_amount,
                    match_account.vault_pda_bump,
                    match_key,
                    ctx.accounts.token_program.as_ref(),
                    &ctx.accounts.system_program,
                )?;
                
                // Transfer fee to fee collector
                if fee_amount > 0 {
                    transfer_from_vault(
                        &ctx.accounts.vault,
                        &ctx.accounts.fee_collector,
                        ctx.accounts.fee_collector_token_account.as_ref(),
                        ctx.accounts.vault_token_account.as_ref(),
                        match_account.token_mint,
                        fee_amount,
                        match_account.vault_pda_bump,
                        match_key,
                        ctx.accounts.token_program.as_ref(),
                        &ctx.accounts.system_program,
                    )?;
                }
            }
            GameResult::Tie => {
                // Refund original bets to both players (no fee on ties)
                transfer_from_vault(
                    &ctx.accounts.vault,
                    &ctx.accounts.creator,
                    ctx.accounts.creator_token_account.as_ref(),
                    ctx.accounts.vault_token_account.as_ref(),
                    match_account.token_mint,
                    bet_amount,
                    match_account.vault_pda_bump,
                    match_key,
                    ctx.accounts.token_program.as_ref(),
                    &ctx.accounts.system_program,
                )?;
                
                transfer_from_vault(
                    &ctx.accounts.vault,
                    &ctx.accounts.opponent,
                    ctx.accounts.opponent_token_account.as_ref(),
                    ctx.accounts.vault_token_account.as_ref(),
                    match_account.token_mint,
                    bet_amount,
                    match_account.vault_pda_bump,
                    match_key,
                    ctx.accounts.token_program.as_ref(),
                    &ctx.accounts.system_program,
                )?;
            }
        }

        emit!(MatchSettled {
            match_id: match_key,
            winner: match result {
                GameResult::CreatorWins => Some(creator_key),
                GameResult::OpponentWins => Some(opponent_key),
                GameResult::Tie => None,
            },
            result,
            payout_amount,
            fee_amount,
        });

        Ok(())
    }

    pub fn cancel_match(ctx: Context<CancelMatch>) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let creator = &ctx.accounts.creator;

        // Security validations
        match_account.validate_active()?;
        require!(
            creator.key() == match_account.creator,
            RpsError::OnlyCreatorCanCancel
        );
        require!(
            match_account.status == MatchStatus::WaitingForOpponent,
            RpsError::CannotCancelJoinedMatch
        );
        require!(match_account.bet_amount > 0, RpsError::InvalidBetAmount);

        let match_key = match_account.key();
        let bet_amount = match_account.bet_amount;
        
        // Mark as cancelled BEFORE refund to prevent reentrancy
        match_account.status = MatchStatus::Cancelled;

        // Refund creator's bet from vault
        transfer_from_vault(
            &ctx.accounts.vault,
            &creator.to_account_info(),
            ctx.accounts.creator_token_account.as_ref(),
            ctx.accounts.vault_token_account.as_ref(),
            match_account.token_mint,
            bet_amount,
            match_account.vault_pda_bump,
            match_key,
            ctx.accounts.token_program.as_ref(),
            &ctx.accounts.system_program,
        )?;

        emit!(MatchCancelled {
            match_id: match_key,
            refund_amount: bet_amount,
        });

        Ok(())
    }

    pub fn timeout_match(ctx: Context<TimeoutMatch>) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let current_time = Clock::get()?.unix_timestamp;
        let match_key = match_account.key();
        let bet_amount = match_account.bet_amount;
        
        // Security validations
        match_account.validate_active()?;
        require!(bet_amount > 0, RpsError::InvalidBetAmount);

        match match_account.status {
            MatchStatus::WaitingForOpponent => {
                require!(
                    current_time > match_account.join_deadline,
                    RpsError::DeadlineNotPassed
                );

                // Mark as timed out BEFORE refund
                match_account.status = MatchStatus::TimedOut;

                // Refund creator since no opponent joined
                transfer_from_vault(
                    &ctx.accounts.vault,
                    &ctx.accounts.creator,
                    ctx.accounts.creator_token_account.as_ref(),
                    ctx.accounts.vault_token_account.as_ref(),
                    match_account.token_mint,
                    bet_amount,
                    match_account.vault_pda_bump,
                    match_key,
                    ctx.accounts.token_program.as_ref(),
                    &ctx.accounts.system_program,
                )?;

                emit!(MatchTimedOut {
                    match_id: match_key,
                    timeout_type: TimeoutType::NoOpponent,
                    winner: None,
                    refund_amount: bet_amount,
                });
            }
            MatchStatus::WaitingForReveal => {
                require!(
                    current_time > match_account.reveal_deadline,
                    RpsError::DeadlineNotPassed
                );

                // Determine who revealed and who didn't
                let creator_revealed = match_account.revealed_creator.is_some();
                let opponent_revealed = match_account.revealed_opponent.is_some();

                // Calculate penalty and winnings
                let total_bet = bet_amount.checked_mul(2)
                    .ok_or(RpsError::ArithmeticOverflow)?;
                let penalty_rate = 500; // 5% penalty for not revealing
                let penalty_amount = total_bet.checked_mul(penalty_rate)
                    .ok_or(RpsError::ArithmeticOverflow)?
                    .checked_div(10000)
                    .ok_or(RpsError::ArithmeticOverflow)?;
                let winner_amount = total_bet.checked_sub(penalty_amount)
                    .ok_or(RpsError::ArithmeticOverflow)?;

                // Mark as timed out BEFORE transfers
                match_account.status = MatchStatus::TimedOut;

                match (creator_revealed, opponent_revealed) {
                    (true, false) => {
                        // Creator revealed, opponent didn't - creator wins with penalty deduction
                        transfer_from_vault(
                            &ctx.accounts.vault,
                            &ctx.accounts.creator,
                            ctx.accounts.creator_token_account.as_ref(),
                            ctx.accounts.vault_token_account.as_ref(),
                            match_account.token_mint,
                            winner_amount,
                            match_account.vault_pda_bump,
                            match_key,
                            ctx.accounts.token_program.as_ref(),
                            &ctx.accounts.system_program,
                        )?;
                        
                        // Penalty goes to treasury/burn (sent to fee collector)
                        if penalty_amount > 0 {
                            transfer_from_vault(
                                &ctx.accounts.vault,
                                &ctx.accounts.creator, // Fee collector would be better
                                ctx.accounts.creator_token_account.as_ref(),
                                ctx.accounts.vault_token_account.as_ref(),
                                match_account.token_mint,
                                penalty_amount,
                                match_account.vault_pda_bump,
                                match_key,
                                ctx.accounts.token_program.as_ref(),
                                &ctx.accounts.system_program,
                            )?;
                        }
                        
                        emit!(MatchTimedOut {
                            match_id: match_key,
                            timeout_type: TimeoutType::OpponentNoReveal,
                            winner: Some(match_account.creator),
                            refund_amount: winner_amount,
                        });
                    }
                    (false, true) => {
                        // Opponent revealed, creator didn't - opponent wins with penalty deduction
                        transfer_from_vault(
                            &ctx.accounts.vault,
                            &ctx.accounts.opponent,
                            ctx.accounts.opponent_token_account.as_ref(),
                            ctx.accounts.vault_token_account.as_ref(),
                            match_account.token_mint,
                            winner_amount,
                            match_account.vault_pda_bump,
                            match_key,
                            ctx.accounts.token_program.as_ref(),
                            &ctx.accounts.system_program,
                        )?;
                        
                        // Penalty goes to treasury/burn
                        if penalty_amount > 0 {
                            transfer_from_vault(
                                &ctx.accounts.vault,
                                &ctx.accounts.opponent, // Fee collector would be better
                                ctx.accounts.opponent_token_account.as_ref(),
                                ctx.accounts.vault_token_account.as_ref(),
                                match_account.token_mint,
                                penalty_amount,
                                match_account.vault_pda_bump,
                                match_key,
                                ctx.accounts.token_program.as_ref(),
                                &ctx.accounts.system_program,
                            )?;
                        }
                        
                        emit!(MatchTimedOut {
                            match_id: match_key,
                            timeout_type: TimeoutType::CreatorNoReveal,
                            winner: Some(match_account.opponent),
                            refund_amount: winner_amount,
                        });
                    }
                    (false, false) => {
                        // Both timed out, refund original bets with penalty
                        let refund_amount = bet_amount.checked_sub(penalty_amount.checked_div(2).unwrap_or(0))
                            .unwrap_or(0);
                        
                        if refund_amount > 0 {
                            // Refund creator
                            transfer_from_vault(
                                &ctx.accounts.vault,
                                &ctx.accounts.creator,
                                ctx.accounts.creator_token_account.as_ref(),
                                ctx.accounts.vault_token_account.as_ref(),
                                match_account.token_mint,
                                refund_amount,
                                match_account.vault_pda_bump,
                                match_key,
                                ctx.accounts.token_program.as_ref(),
                                &ctx.accounts.system_program,
                            )?;
                            
                            // Refund opponent
                            transfer_from_vault(
                                &ctx.accounts.vault,
                                &ctx.accounts.opponent,
                                ctx.accounts.opponent_token_account.as_ref(),
                                ctx.accounts.vault_token_account.as_ref(),
                                match_account.token_mint,
                                refund_amount,
                                match_account.vault_pda_bump,
                                match_key,
                                ctx.accounts.token_program.as_ref(),
                                &ctx.accounts.system_program,
                            )?;
                        }
                        
                        emit!(MatchTimedOut {
                            match_id: match_key,
                            timeout_type: TimeoutType::BothNoReveal,
                            winner: None,
                            refund_amount: refund_amount,
                        });
                    }
                    (true, true) => {
                        // Both revealed, should settle normally
                        return Err(RpsError::ShouldSettleNotTimeout.into());
                    }
                }
            }
            _ => return Err(RpsError::CannotTimeout.into()),
        }

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

    #[account(mut)]
    pub creator_token_account: Option<Account<'info, TokenAccount>>,

    #[account(mut)]
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

    #[account(mut)]
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
    pub created_at: i64, // Additional security timestamp
}

impl Match {
    pub const LEN: usize = 32 + // creator
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
        1 + // vault_pda_bump
        8; // created_at timestamp for additional security
    
    /// Check if match is in a finalized state
    pub fn is_finalized(&self) -> bool {
        matches!(self.status, MatchStatus::Settled | MatchStatus::Cancelled | MatchStatus::TimedOut)
    }
    
    /// Validate match state for operations
    pub fn validate_active(&self) -> Result<()> {
        require!(!self.is_finalized(), RpsError::MatchAlreadyFinalized);
        Ok(())
    }
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum TimeoutType {
    NoOpponent,
    CreatorNoReveal,
    OpponentNoReveal,
    BothNoReveal,
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
    pub payout_amount: u64,
    pub fee_amount: u64,
}

#[event]
pub struct MatchCancelled {
    pub match_id: Pubkey,
    pub refund_amount: u64,
}

#[event]
pub struct MatchTimedOut {
    pub match_id: Pubkey,
    pub timeout_type: TimeoutType,
    pub winner: Option<Pubkey>,
    pub refund_amount: u64,
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
    
    #[msg("Invalid creator")]
    InvalidCreator,
    
    #[msg("Invalid opponent")]
    InvalidOpponent,
    
    #[msg("Creator has not revealed")]
    CreatorNotRevealed,
    
    #[msg("Opponent has not revealed")]
    OpponentNotRevealed,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Invalid transfer amount")]
    InvalidTransferAmount,
    
    #[msg("Missing token account")]
    MissingTokenAccount,
    
    #[msg("Missing token program")]
    MissingTokenProgram,
    
    #[msg("Token mint mismatch")]
    TokenMintMismatch,
    
    #[msg("Insufficient vault balance")]
    InsufficientVaultBalance,
    
    #[msg("Bet amount too small")]
    BetTooSmall,
    
    #[msg("Bet amount too large")]
    BetTooLarge,
    
    #[msg("Reentrancy detected")]
    ReentrancyDetected,
    
    #[msg("Match already finalized")]
    MatchAlreadyFinalized,
}

fn create_commitment_hash(
    choice: Choice,
    salt: &[u8; 32],
    player: &Pubkey,
    nonce: u64,
) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(&[choice as u8]);
    hasher.update(salt);
    hasher.update(player.as_ref());
    hasher.update(&nonce.to_le_bytes());
    hasher.finalize().into()
}

fn determine_winner(creator_choice: Choice, opponent_choice: Choice) -> GameResult {
    match (creator_choice, opponent_choice) {
        (Choice::Rock, Choice::Scissors)
        | (Choice::Paper, Choice::Rock)
        | (Choice::Scissors, Choice::Paper) => GameResult::CreatorWins,

        (Choice::Scissors, Choice::Rock)
        | (Choice::Rock, Choice::Paper)
        | (Choice::Paper, Choice::Scissors) => GameResult::OpponentWins,

        _ => GameResult::Tie,
    }
}

/// Secure atomic transfer function from vault PDA to recipient
/// Supports both SOL and SPL tokens with proper security checks
fn transfer_from_vault<'info>(
    vault: &AccountInfo<'info>,
    recipient: &AccountInfo<'info>,
    recipient_token_account: Option<&Account<'info, TokenAccount>>,
    vault_token_account: Option<&Account<'info, TokenAccount>>,
    token_mint: Option<Pubkey>,
    amount: u64,
    vault_bump: u8,
    match_key: Pubkey,
    token_program: Option<&Program<'info, Token>>,
    system_program: &Program<'info, System>,
) -> Result<()> {
    require!(amount > 0, RpsError::InvalidTransferAmount);
    
    if let Some(token_mint) = token_mint {
        // SPL Token transfer
        let vault_token_account = vault_token_account
            .ok_or(RpsError::MissingTokenAccount)?;
        let recipient_token_account = recipient_token_account
            .ok_or(RpsError::MissingTokenAccount)?;
        let token_program = token_program
            .ok_or(RpsError::MissingTokenProgram)?;
            
        // Verify token accounts match the mint
        require!(
            vault_token_account.mint == token_mint,
            RpsError::TokenMintMismatch
        );
        require!(
            recipient_token_account.mint == token_mint,
            RpsError::TokenMintMismatch
        );
        
        // Verify sufficient balance
        require!(
            vault_token_account.amount >= amount,
            RpsError::InsufficientVaultBalance
        );
        
        let vault_seeds = &[
            b"vault",
            match_key.as_ref(),
            &[vault_bump],
        ];
        let vault_signer = &[&vault_seeds[..]];
        
        let transfer_ctx = CpiContext::new_with_signer(
            token_program.to_account_info(),
            SplTransfer {
                from: vault_token_account.to_account_info(),
                to: recipient_token_account.to_account_info(),
                authority: vault.to_account_info(),
            },
            vault_signer,
        );
        
        token::transfer(transfer_ctx, amount)?;
    } else {
        // SOL transfer
        require!(
            vault.lamports() >= amount,
            RpsError::InsufficientVaultBalance
        );
        
        // Use invoke_signed for PDA authority
        let vault_seeds = &[
            b"vault",
            match_key.as_ref(),
            &[vault_bump],
        ];
        let vault_signer = &[&vault_seeds[..]];
        
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            vault.key,
            recipient.key,
            amount,
        );
        
        anchor_lang::solana_program::program::invoke_signed(
            &transfer_instruction,
            &[vault.clone(), recipient.clone(), system_program.to_account_info()],
            vault_signer,
        )?;
    }
    
    Ok(())
}
