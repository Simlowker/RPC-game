use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as SplTransfer};

// Modules
pub mod universal_engine;
pub mod games;

use universal_engine::*;
use games::rock_paper_scissors::*;
use games::GameLogic;

declare_id!("UNIVxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"); // À remplacer après déploiement

#[program]
pub mod universal_pvp {
    use super::*;

    // ===========================
    // INITIALISATION
    // ===========================
    
    /// Initialise le registre de jeux (une seule fois)
    pub fn initialize_registry(
        ctx: Context<InitializeRegistry>,
    ) -> Result<()> {
        let registry = &mut ctx.accounts.game_registry;
        registry.authority = ctx.accounts.authority.key();
        registry.total_games = 0;
        registry.active_games = Vec::new();
        registry.paused = false;
        
        msg!("🎮 Universal PvP Registry initialized with 0% fees!");
        Ok(())
    }
    
    /// Enregistre un nouveau type de jeu
    pub fn register_game(
        ctx: Context<RegisterGame>,
        game_type: GameType,
        name: String,
    ) -> Result<()> {
        let registry = &mut ctx.accounts.game_registry;
        let clock = Clock::get()?;
        
        require!(
            registry.total_games < GameRegistry::MAX_GAMES as u32,
            UniversalGameError::RegistryFull
        );
        
        let game_def = GameDefinition {
            game_id: registry.total_games,
            game_type,
            name: name.clone(),
            creator: ctx.accounts.creator.key(),
            created_at: clock.unix_timestamp,
            total_matches: 0,
            is_active: true,
            game_token: None, // Sera ajouté plus tard si un token est créé
        };
        
        registry.active_games.push(game_def);
        registry.total_games += 1;
        
        emit!(GameRegistered {
            game_id: registry.total_games - 1,
            game_type,
            creator: ctx.accounts.creator.key(),
            name,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("✅ Game registered: {} (ID: {})", name, registry.total_games - 1);
        Ok(())
    }

    // ===========================
    // CRÉATION DE MATCH (0% FRAIS!)
    // ===========================
    
    /// Crée un nouveau match PvP avec 0% de frais
    pub fn create_universal_match(
        ctx: Context<CreateUniversalMatch>,
        game_type: GameType,
        bet_amount: u64,
        game_config: GameConfig,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let creator = &ctx.accounts.creator;
        let clock = Clock::get()?;
        
        // Validations
        require!(bet_amount >= game_config.min_bet, UniversalGameError::InsufficientBet);
        require!(bet_amount <= game_config.max_bet, UniversalGameError::BetTooLarge);
        
        // Initialiser le match avec 0% de frais!
        match_account.match_id = match_account.key();
        match_account.game_type = game_type;
        match_account.creator = creator.key();
        match_account.opponent = None;
        match_account.bet_amount = bet_amount;
        match_account.token_mint = ctx.accounts.token_mint.as_ref().map(|m| m.key());
        match_account.total_pot = bet_amount * 2; // Pot total SANS FRAIS!
        match_account.status = MatchStatus::WaitingForOpponent;
        match_account.game_state = Vec::new();
        match_account.winner = None;
        match_account.created_at = clock.unix_timestamp;
        match_account.started_at = None;
        match_account.ended_at = None;
        match_account.timeout_seconds = 300; // 5 minutes par défaut
        match_account.game_config = game_config;
        match_account.vault_bump = ctx.bumps.vault;
        
        // Transférer le pari du créateur vers le vault
        if let Some(token_mint) = &ctx.accounts.token_mint {
            // Transfer SPL tokens
            let cpi_accounts = SplTransfer {
                from: ctx.accounts.creator_token_account.as_ref().unwrap().to_account_info(),
                to: ctx.accounts.vault_token_account.as_ref().unwrap().to_account_info(),
                authority: creator.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.as_ref().unwrap().to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, bet_amount)?;
        } else {
            // Transfer SOL
            let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
                &creator.key(),
                &ctx.accounts.vault.key(),
                bet_amount,
            );
            anchor_lang::solana_program::program::invoke(
                &transfer_instruction,
                &[
                    creator.to_account_info(),
                    ctx.accounts.vault.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }
        
        emit!(MatchCreated {
            match_id: match_account.key(),
            game_type,
            creator: creator.key(),
            bet_amount,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("🎮 Match created with 0% fees! Type: {:?}, Bet: {}", game_type, bet_amount);
        Ok(())
    }
    
    // ===========================
    // REJOINDRE UN MATCH
    // ===========================
    
    pub fn join_match(
        ctx: Context<JoinMatch>,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let opponent = &ctx.accounts.opponent;
        let clock = Clock::get()?;
        
        require!(
            match_account.status == MatchStatus::WaitingForOpponent,
            UniversalGameError::MatchAlreadyStarted
        );
        
        require!(
            match_account.opponent.is_none(),
            UniversalGameError::MatchAlreadyStarted
        );
        
        // Transférer le pari de l'opposant
        let bet_amount = match_account.bet_amount;
        
        if let Some(token_mint) = &match_account.token_mint {
            // Transfer SPL tokens
            let cpi_accounts = SplTransfer {
                from: ctx.accounts.opponent_token_account.as_ref().unwrap().to_account_info(),
                to: ctx.accounts.vault_token_account.as_ref().unwrap().to_account_info(),
                authority: opponent.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.as_ref().unwrap().to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, bet_amount)?;
        } else {
            // Transfer SOL
            let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
                &opponent.key(),
                &ctx.accounts.vault.key(),
                bet_amount,
            );
            anchor_lang::solana_program::program::invoke(
                &transfer_instruction,
                &[
                    opponent.to_account_info(),
                    ctx.accounts.vault.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }
        
        match_account.opponent = Some(opponent.key());
        match_account.status = MatchStatus::InProgress;
        match_account.started_at = Some(clock.unix_timestamp);
        
        emit!(MatchJoined {
            match_id: match_account.key(),
            opponent: opponent.key(),
            timestamp: clock.unix_timestamp,
        });
        
        msg!("⚔️ Match joined! Game started between {} and {}", 
            match_account.creator, opponent.key());
        Ok(())
    }
    
    // ===========================
    // SOUMETTRE UN MOUVEMENT
    // ===========================
    
    pub fn submit_move(
        ctx: Context<SubmitMove>,
        move_data: Vec<u8>,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let player = &ctx.accounts.player;
        
        require!(
            match_account.status == MatchStatus::InProgress,
            UniversalGameError::InvalidGameState
        );
        
        // Valider le mouvement selon le type de jeu
        match match_account.game_type {
            GameType::RockPaperScissors => {
                let rps = RockPaperScissors;
                rps.validate_move(&move_data)?;
            },
            // Ajouter d'autres types de jeux ici
            _ => return Err(UniversalGameError::InvalidGameType.into()),
        }
        
        // Stocker le mouvement dans game_state
        match_account.game_state.extend_from_slice(&move_data);
        
        msg!("📝 Move submitted by {}", player.key());
        Ok(())
    }
    
    // ===========================
    // DÉTERMINER LE GAGNANT
    // ===========================
    
    pub fn settle_match(
        ctx: Context<SettleMatch>,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let clock = Clock::get()?;
        
        require!(
            match_account.status == MatchStatus::InProgress,
            UniversalGameError::InvalidGameState
        );
        
        // Déterminer le gagnant selon le type de jeu
        let result = match match_account.game_type {
            GameType::RockPaperScissors => {
                let rps = RockPaperScissors;
                rps.determine_winner(match_account)?
            },
            // Ajouter d'autres types de jeux ici
            _ => return Err(UniversalGameError::InvalidGameType.into()),
        };
        
        // Déterminer le gagnant et distribuer le pot (100% au gagnant!)
        let winner = match result {
            GameResult::Player1Wins => Some(match_account.creator),
            GameResult::Player2Wins => match_account.opponent,
            GameResult::Draw => None, // En cas d'égalité, partager 50/50
            GameResult::Cancelled => None,
        };
        
        match_account.winner = winner;
        match_account.status = MatchStatus::Completed;
        match_account.ended_at = Some(clock.unix_timestamp);
        
        // Distribuer les gains (0% de frais!)
        if let Some(winner_pubkey) = winner {
            // Le gagnant reçoit 100% du pot!
            let winner_amount = match_account.total_pot;
            
            // Transfer depuis le vault
            // (Code de transfer ici, similaire aux fonctions précédentes)
            msg!("💰 Winner {} receives {} (100% of pot!)", winner_pubkey, winner_amount);
        } else if result == GameResult::Draw {
            // En cas d'égalité, chacun récupère sa mise
            let refund_amount = match_account.bet_amount;
            msg!("🤝 Draw! Each player gets back {}", refund_amount);
            // (Code de refund ici)
        }
        
        emit!(MatchCompleted {
            match_id: match_account.key(),
            winner,
            total_pot: match_account.total_pot,
            game_result: result,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("✅ Match settled! Result: {:?}", result);
        Ok(())
    }
}

// ===========================
// CONTEXTS
// ===========================

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(
        init,
        payer = authority,
        space = GameRegistry::LEN,
        seeds = [b"game_registry"],
        bump
    )]
    pub game_registry: Account<'info, GameRegistry>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterGame<'info> {
    #[account(
        mut,
        seeds = [b"game_registry"],
        bump
    )]
    pub game_registry: Account<'info, GameRegistry>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateUniversalMatch<'info> {
    #[account(
        init,
        payer = creator,
        space = UniversalMatch::LEN,
        seeds = [b"match", creator.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub match_account: Account<'info, UniversalMatch>,
    
    #[account(
        mut,
        seeds = [b"vault", match_account.key().as_ref()],
        bump
    )]
    /// CHECK: Vault PDA for holding funds
    pub vault: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub token_mint: Option<Account<'info, Mint>>,
    pub creator_token_account: Option<Account<'info, TokenAccount>>,
    pub vault_token_account: Option<Account<'info, TokenAccount>>,
    pub token_program: Option<Program<'info, Token>>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct JoinMatch<'info> {
    #[account(mut)]
    pub match_account: Account<'info, UniversalMatch>,
    
    #[account(
        mut,
        seeds = [b"vault", match_account.key().as_ref()],
        bump
    )]
    /// CHECK: Vault PDA
    pub vault: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub opponent: Signer<'info>,
    
    pub opponent_token_account: Option<Account<'info, TokenAccount>>,
    pub vault_token_account: Option<Account<'info, TokenAccount>>,
    pub token_program: Option<Program<'info, Token>>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitMove<'info> {
    #[account(mut)]
    pub match_account: Account<'info, UniversalMatch>,
    
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct SettleMatch<'info> {
    #[account(mut)]
    pub match_account: Account<'info, UniversalMatch>,
    
    #[account(
        mut,
        seeds = [b"vault", match_account.key().as_ref()],
        bump
    )]
    /// CHECK: Vault PDA
    pub vault: UncheckedAccount<'info>,
    
    /// CHECK: Creator account to receive winnings
    pub creator: UncheckedAccount<'info>,
    
    /// CHECK: Opponent account to receive winnings
    pub opponent: Option<UncheckedAccount<'info>>,
    
    pub system_program: Program<'info, System>,
}