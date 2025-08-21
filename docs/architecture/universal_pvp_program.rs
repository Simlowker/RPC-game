use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as SplTransfer, MintTo, Burn};

// Modules
pub mod universal_engine;
pub mod game_module_system;
pub mod token_system;
pub mod community_governance;

use universal_engine::*;
use game_module_system::*;
use token_system::*;
use community_governance::*;

declare_id!("UNIVpvp11111111111111111111111111111111111");

#[program]
pub mod universal_pvp {
    use super::*;

    // ===========================
    // SYSTEM INITIALIZATION
    // ===========================

    /// Initialize the universal PvP registry (one-time setup)
    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        platform_config: PlatformConfig,
    ) -> Result<()> {
        let registry = &mut ctx.accounts.game_registry;
        let platform_state = &mut ctx.accounts.platform_state;
        let clock = Clock::get()?;

        // Initialize registry
        registry.authority = ctx.accounts.authority.key();
        registry.total_games = 0;
        registry.active_games_count = 0;
        registry.total_matches_played = 0;
        registry.total_volume = 0;
        registry.registry_version = 1;
        registry.flags = 0;

        // Initialize platform state
        platform_state.authority = ctx.accounts.authority.key();
        platform_state.created_at = clock.unix_timestamp;
        platform_state.total_revenue = 0;
        platform_state.platform_fee_bps = 0; // 0% fees!
        platform_state.config = platform_config;
        platform_state.flags = PlatformState::FLAG_ACTIVE;

        emit!(PlatformInitialized {
            authority: ctx.accounts.authority.key(),
            timestamp: clock.unix_timestamp,
            config: platform_config,
        });

        msg!("🎮 Universal PvP Platform initialized with 0% fees!");
        Ok(())
    }

    /// Register a new game type
    pub fn register_game(
        ctx: Context<RegisterGame>,
        game_type: GameType,
        name: String,
        description: String,
        config: GameConfig,
        code_hash: [u8; 32],
    ) -> Result<()> {
        let registry = &mut ctx.accounts.game_registry;
        let game_def = &mut ctx.accounts.game_definition;
        let creator_rep = &mut ctx.accounts.creator_reputation;
        let clock = Clock::get()?;

        require!(
            registry.active_games_count < GameRegistry::MAX_GAMES_PER_REGISTRY,
            UniversalGameError::RegistryFull
        );

        require!(!registry.is_paused(), UniversalGameError::GameNotActive);
        require!(name.len() <= 32, UniversalGameError::NameTooLong);
        require!(description.len() <= 128, UniversalGameError::NameTooLong);

        // Initialize game definition
        game_def.game_id = registry.total_games;
        game_def.game_type = game_type.to_u16();
        game_def.creator = ctx.accounts.creator.key();
        game_def.set_name(&name)?;
        game_def.description.fill(0);
        game_def.description[..description.len()].copy_from_slice(description.as_bytes());
        game_def.created_at = clock.unix_timestamp;
        game_def.last_updated = clock.unix_timestamp;
        game_def.total_matches = 0;
        game_def.total_volume = 0;
        game_def.version = 1;
        game_def.flags = GameDefinition::FLAG_ACTIVE;
        game_def.reputation_score = 5000; // Start at 50%
        game_def.default_config = config;
        game_def.creator_fee_bps = 0; // Creator can set later
        game_def.game_token = None;
        game_def.code_hash = code_hash;

        // Update registry
        registry.total_games += 1;
        registry.active_games_count += 1;

        // Update creator reputation
        creator_rep.creator = ctx.accounts.creator.key();
        creator_rep.games_created += 1;
        creator_rep.last_updated = clock.unix_timestamp;

        // Calculate reputation tier
        if creator_rep.games_created >= 10 && creator_rep.reputation_score >= 800_000 {
            creator_rep.tier = CreatorReputation::TIER_DIAMOND;
        } else if creator_rep.games_created >= 5 && creator_rep.reputation_score >= 600_000 {
            creator_rep.tier = CreatorReputation::TIER_GOLD;
        } else if creator_rep.games_created >= 2 && creator_rep.reputation_score >= 400_000 {
            creator_rep.tier = CreatorReputation::TIER_SILVER;
        }

        emit!(GameRegisteredV2 {
            game_id: game_def.game_id,
            game_type: game_def.game_type,
            creator: ctx.accounts.creator.key(),
            name,
            timestamp: clock.unix_timestamp,
            reputation_required: false,
        });

        msg!("✅ Game registered: {} (ID: {})", game_def.get_name(), game_def.game_id);
        Ok(())
    }

    // ===========================
    // MATCH CREATION & MANAGEMENT (0% FEES!)
    // ===========================

    /// Create a new universal PvP match with 0% platform fees
    pub fn create_match(
        ctx: Context<CreateUniversalMatch>,
        game_type: GameType,
        bet_amount: u64,
        timeout_seconds: i64,
        custom_config: Option<GameConfig>,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let game_def = &ctx.accounts.game_definition;
        let creator = &ctx.accounts.creator;
        let clock = Clock::get()?;

        require!(game_def.is_active(), UniversalGameError::GameNotActive);
        require!(bet_amount >= game_def.default_config.min_bet, UniversalGameError::InsufficientBet);

        // Use custom config or default
        let config = custom_config.unwrap_or(game_def.default_config);

        // Validate configuration using game logic
        let router = GameRouter;
        let context = GameContext {
            clock,
            random_seed: [0; 32], // In production, use verifiable randomness
            match_authority: ctx.accounts.match_account.key(),
        };

        // Initialize match with optimal memory layout
        match_account.initialize(
            ctx.accounts.match_account.key(),
            creator.key(),
            game_type,
            bet_amount,
            config,
            timeout_seconds,
            ctx.bumps.vault,
        );

        match_account.token_mint = ctx.accounts.token_mint.as_ref().map(|m| m.key());

        // Initialize game-specific state
        GameRouter::route_operation(
            game_type,
            GameOperation::Initialize(config),
            match_account,
            &context,
        )?;

        // Transfer creator's bet to vault (0% fees!)
        if let Some(_token_mint) = &ctx.accounts.token_mint {
            // SPL Token transfer
            let cpi_accounts = SplTransfer {
                from: ctx.accounts.creator_token_account.as_ref().unwrap().to_account_info(),
                to: ctx.accounts.vault_token_account.as_ref().unwrap().to_account_info(),
                authority: creator.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.as_ref().unwrap().to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, bet_amount)?;
        } else {
            // SOL transfer
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

        emit!(MatchCreatedV2 {
            match_id: match_account.match_id,
            game_type: game_type.to_u16(),
            creator: creator.key(),
            bet_amount,
            timestamp: clock.unix_timestamp,
            timeout_at: match_account.timeout_at,
        });

        msg!("🎮 Match created with 0% fees! Game: {:?}, Bet: {}", game_type, bet_amount);
        Ok(())
    }

    /// Join an existing match
    pub fn join_match(
        ctx: Context<JoinMatch>,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let opponent = &ctx.accounts.opponent;
        let clock = Clock::get()?;

        require!(
            match_account.status() == MatchStatus::WaitingForOpponent,
            UniversalGameError::MatchAlreadyStarted
        );

        require!(!match_account.can_timeout(), UniversalGameError::MatchTimeout);
        require!(opponent.key() != match_account.creator, UniversalGameError::Unauthorized);

        // Transfer opponent's bet to vault
        let bet_amount = match_account.bet_amount;

        if let Some(_token_mint) = match_account.token_mint {
            // SPL Token transfer
            let cpi_accounts = SplTransfer {
                from: ctx.accounts.opponent_token_account.as_ref().unwrap().to_account_info(),
                to: ctx.accounts.vault_token_account.as_ref().unwrap().to_account_info(),
                authority: opponent.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.as_ref().unwrap().to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, bet_amount)?;
        } else {
            // SOL transfer
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

        // Update match state
        match_account.opponent = Some(opponent.key());
        match_account.flags |= UniversalMatch::FLAG_HAS_OPPONENT | UniversalMatch::FLAG_STARTED;

        emit!(MatchJoined {
            match_id: match_account.match_id,
            opponent: opponent.key(),
            timestamp: clock.unix_timestamp,
        });

        msg!("⚔️ Match joined! Game started between {} and {}", 
            match_account.creator, opponent.key());
        Ok(())
    }

    /// Submit a move in the game
    pub fn submit_move(
        ctx: Context<SubmitMove>,
        move_data: Vec<u8>,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let player = &ctx.accounts.player;
        let clock = Clock::get()?;

        require!(
            match_account.status() == MatchStatus::InProgress,
            UniversalGameError::InvalidGameState
        );

        require!(!match_account.can_timeout(), UniversalGameError::MatchTimeout);

        // Verify player is participant
        require!(
            player.key() == match_account.creator || 
            Some(player.key()) == match_account.opponent,
            UniversalGameError::Unauthorized
        );

        // Route move to appropriate game handler
        let game_type = GameType::from_u16(match_account.game_type)?;
        let context = GameContext {
            clock,
            random_seed: [0; 32], // Use VRF in production
            match_authority: match_account.key(),
        };

        let result = GameRouter::route_operation(
            game_type,
            GameOperation::ProcessMove(player.key(), move_data.clone()),
            match_account,
            &context,
        )?;

        match result {
            OperationResult::GameOver(game_result) => {
                match_account.flags |= UniversalMatch::FLAG_COMPLETED;
                
                // Distribute winnings (100% to winner - 0% fees!)
                self.distribute_winnings(match_account, &ctx.accounts, game_result)?;

                emit!(MatchCompleted {
                    match_id: match_account.match_id,
                    winner: match result {
                        GameResult::Player1Wins => Some(match_account.creator),
                        GameResult::Player2Wins => match_account.opponent,
                        _ => None,
                    },
                    total_pot: match_account.total_pot,
                    game_result,
                    timestamp: clock.unix_timestamp,
                });
            },
            OperationResult::MoveProcessed(move_result) => {
                emit!(MoveSubmitted {
                    match_id: match_account.match_id,
                    player: player.key(),
                    move_result: format!("{:?}", move_result),
                    timestamp: clock.unix_timestamp,
                });
            },
            _ => {}
        }

        msg!("📝 Move submitted by {}", player.key());
        Ok(())
    }

    /// Force settle a match (in case of timeout or dispute)
    pub fn settle_match(
        ctx: Context<SettleMatch>,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let clock = Clock::get()?;

        // Check if game can be settled
        let game_type = GameType::from_u16(match_account.game_type)?;
        let context = GameContext {
            clock,
            random_seed: [0; 32],
            match_authority: match_account.key(),
        };

        // Handle timeout if applicable
        if match_account.can_timeout() {
            let result = GameRouter::route_operation(
                game_type,
                GameOperation::HandleTimeout,
                match_account,
                &context,
            )?;

            match result {
                OperationResult::TimeoutHandled(timeout_result) => {
                    match timeout_result {
                        TimeoutResult::GameOver(game_result) => {
                            self.distribute_winnings(match_account, &ctx.accounts, game_result)?;
                        },
                        TimeoutResult::ForfeitPlayer(forfeiter) => {
                            let winner = if forfeiter == match_account.creator {
                                match_account.opponent.unwrap()
                            } else {
                                match_account.creator
                            };
                            self.distribute_winnings(
                                match_account, 
                                &ctx.accounts, 
                                if forfeiter == match_account.creator { 
                                    GameResult::Player2Wins 
                                } else { 
                                    GameResult::Player1Wins 
                                }
                            )?;
                        },
                        TimeoutResult::RefundAll => {
                            self.refund_all_players(match_account, &ctx.accounts)?;
                        },
                        _ => {}
                    }
                },
                _ => {}
            }
        } else {
            // Check if game is naturally over
            let result = GameRouter::route_operation(
                game_type,
                GameOperation::CheckGameOver,
                match_account,
                &context,
            )?;

            if let OperationResult::GameOver(game_result) = result {
                self.distribute_winnings(match_account, &ctx.accounts, game_result)?;
            }
        }

        match_account.flags |= UniversalMatch::FLAG_COMPLETED;

        emit!(MatchSettled {
            match_id: match_account.match_id,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // ===========================
    // TOKEN SYSTEM OPERATIONS
    // ===========================

    /// Create a token for a game
    pub fn create_game_token(
        ctx: Context<CreateGameToken>,
        initial_supply: u64,
        decimals: u8,
        token_config: TokenConfig,
    ) -> Result<()> {
        let game_token = &mut ctx.accounts.game_token;
        let game_def = &mut ctx.accounts.game_definition;
        let clock = Clock::get()?;

        require!(game_def.is_active(), UniversalGameError::GameNotActive);
        require!(game_def.creator == ctx.accounts.creator.key(), UniversalGameError::Unauthorized);
        require!(game_def.game_token.is_none(), UniversalGameError::CustomError);

        // Initialize game token account
        game_token.game_id = game_def.game_id;
        game_token.token_mint = ctx.accounts.token_mint.key();
        game_token.creator = ctx.accounts.creator.key();
        game_token.total_supply = initial_supply;
        game_token.circulating_supply = 0;
        game_token.rewards_distributed = 0;
        game_token.total_burned = 0;
        game_token.last_reward_distribution = clock.unix_timestamp;
        game_token.reward_rate_per_match = token_config.reward_rate_per_match;
        game_token.staking_pool = Pubkey::default(); // Created separately
        game_token.flags = GameToken::FLAG_ACTIVE | GameToken::FLAG_MINTABLE;
        game_token.decimals = decimals;

        // Update game definition
        game_def.game_token = Some(ctx.accounts.token_mint.key());

        // Mint initial supply to creator
        if initial_supply > 0 {
            let cpi_accounts = MintTo {
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.creator_token_account.to_account_info(),
                authority: ctx.accounts.token_mint.to_account_info(), // Mint authority
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::mint_to(cpi_ctx, initial_supply)?;
            
            game_token.circulating_supply = initial_supply;
        }

        emit!(TokenCreated {
            game_id: game_token.game_id,
            token_mint: game_token.token_mint,
            creator: game_token.creator,
            initial_supply,
            timestamp: clock.unix_timestamp,
        });

        msg!("🪙 Game token created for game {} with supply {}", game_def.game_id, initial_supply);
        Ok(())
    }

    /// Distribute token rewards to players
    pub fn distribute_rewards(
        ctx: Context<DistributeRewards>,
        match_id: Pubkey,
    ) -> Result<()> {
        let game_token = &mut ctx.accounts.game_token;
        let match_account = &ctx.accounts.match_account;
        let clock = Clock::get()?;

        require!(
            match_account.status() == MatchStatus::Completed,
            UniversalGameError::InvalidGameState
        );

        let reward_amount = game_token.reward_rate_per_match;
        if reward_amount > 0 && game_token.flags & GameToken::FLAG_MINTABLE != 0 {
            // Mint rewards to both players
            let players = vec![
                match_account.creator,
                match_account.opponent.unwrap_or(match_account.creator),
            ];

            for player in players {
                if let Some(player_token_account) = ctx.remaining_accounts.iter()
                    .find(|acc| acc.key() == player) {
                    
                    let cpi_accounts = MintTo {
                        mint: ctx.accounts.token_mint.to_account_info(),
                        to: player_token_account.clone(),
                        authority: ctx.accounts.mint_authority.to_account_info(),
                    };
                    let cpi_program = ctx.accounts.token_program.to_account_info();
                    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
                    token::mint_to(cpi_ctx, reward_amount)?;
                }
            }

            game_token.rewards_distributed += reward_amount * 2;
            game_token.circulating_supply += reward_amount * 2;
            game_token.last_reward_distribution = clock.unix_timestamp;
        }

        emit!(RewardsDistributed {
            game_id: game_token.game_id,
            match_id,
            reward_amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // ===========================
    // COMMUNITY GOVERNANCE
    // ===========================

    /// Submit a proposal for a new game
    pub fn submit_game_proposal(
        ctx: Context<SubmitGameProposal>,
        game_type: GameType,
        name: String,
        description: String,
        code_hash: [u8; 32],
        voting_duration: i64,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.game_proposal;
        let proposer_rep = &ctx.accounts.proposer_reputation;
        let platform_state = &ctx.accounts.platform_state;
        let clock = Clock::get()?;

        // Check proposer reputation
        require!(
            proposer_rep.reputation_score >= platform_state.config.min_proposal_reputation,
            UniversalGameError::InsufficientReputation
        );

        proposal.proposal_id = platform_state.total_proposals;
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.game_type = game_type.to_u16();
        proposal.name.fill(0);
        proposal.name[..name.len().min(32)].copy_from_slice(name.as_bytes());
        proposal.description.fill(0);
        proposal.description[..description.len().min(256)].copy_from_slice(description.as_bytes());
        proposal.code_hash = code_hash;
        proposal.created_at = clock.unix_timestamp;
        proposal.voting_ends_at = clock.unix_timestamp + voting_duration;
        proposal.yes_votes = 0;
        proposal.no_votes = 0;
        proposal.total_voting_power = 0;
        proposal.status = GameProposal::STATUS_PENDING;
        proposal.flags = 0;

        emit!(ProposalCreated {
            proposal_id: proposal.proposal_id,
            proposer: ctx.accounts.proposer.key(),
            game_type: game_type.to_u16(),
            voting_ends_at: proposal.voting_ends_at,
        });

        msg!("📝 Game proposal submitted: {} by {}", name, ctx.accounts.proposer.key());
        Ok(())
    }

    /// Vote on a game proposal
    pub fn vote_on_proposal(
        ctx: Context<VoteOnProposal>,
        vote: bool, // true for yes, false for no
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.game_proposal;
        let voter_rep = &ctx.accounts.voter_reputation;
        let clock = Clock::get()?;

        require!(
            clock.unix_timestamp <= proposal.voting_ends_at,
            UniversalGameError::VotingEnded
        );

        require!(
            proposal.status == GameProposal::STATUS_PENDING,
            UniversalGameError::InvalidGameState
        );

        // Calculate voting power based on reputation
        let voting_power = self.calculate_voting_power(voter_rep);
        require!(voting_power > 0, UniversalGameError::InsufficientVotingPower);

        // Record vote
        if vote {
            proposal.yes_votes += voting_power;
        } else {
            proposal.no_votes += voting_power;
        }
        proposal.total_voting_power += voting_power;

        emit!(ProposalVoted {
            proposal_id: proposal.proposal_id,
            voter: ctx.accounts.voter.key(),
            vote,
            voting_power,
        });

        // Check if voting threshold reached
        let total_votes = proposal.yes_votes + proposal.no_votes;
        let approval_threshold = (total_votes * 60) / 100; // 60% approval needed

        if proposal.yes_votes >= approval_threshold && 
           total_votes >= 1000 { // Minimum participation
            proposal.status = GameProposal::STATUS_APPROVED;
        } else if clock.unix_timestamp > proposal.voting_ends_at {
            proposal.status = if proposal.yes_votes > proposal.no_votes {
                GameProposal::STATUS_APPROVED
            } else {
                GameProposal::STATUS_REJECTED
            };
        }

        Ok(())
    }

    // ===========================
    // ADMIN & MAINTENANCE
    // ===========================

    /// Emergency pause the platform
    pub fn emergency_pause(
        ctx: Context<EmergencyAction>,
    ) -> Result<()> {
        let platform_state = &mut ctx.accounts.platform_state;
        
        require!(
            ctx.accounts.authority.key() == platform_state.authority,
            UniversalGameError::Unauthorized
        );

        platform_state.flags |= PlatformState::FLAG_PAUSED;
        
        emit!(PlatformPaused {
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("🚨 Platform emergency paused");
        Ok(())
    }

    /// Resume platform operations
    pub fn resume_platform(
        ctx: Context<EmergencyAction>,
    ) -> Result<()> {
        let platform_state = &mut ctx.accounts.platform_state;
        
        require!(
            ctx.accounts.authority.key() == platform_state.authority,
            UniversalGameError::Unauthorized
        );

        platform_state.flags &= !PlatformState::FLAG_PAUSED;
        
        emit!(PlatformResumed {
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("✅ Platform operations resumed");
        Ok(())
    }
}

// ===========================
// IMPLEMENTATION HELPERS
// ===========================

impl<'info> universal_pvp<'info> {
    /// Distribute winnings to the winner (100% payout - 0% fees!)
    fn distribute_winnings(
        &self,
        match_account: &UniversalMatch,
        accounts: &SettleMatch,
        game_result: GameResult,
    ) -> Result<()> {
        let total_pot = match_account.total_pot;
        let match_key = match_account.match_id;
        let vault_bump = match_account.vault_bump;

        match game_result {
            GameResult::Player1Wins => {
                self.transfer_from_vault(
                    &accounts.vault,
                    &accounts.creator,
                    accounts.creator_token_account.as_ref(),
                    accounts.vault_token_account.as_ref(),
                    match_account.token_mint,
                    total_pot, // 100% to winner!
                    vault_bump,
                    match_key,
                    accounts.token_program.as_ref(),
                    &accounts.system_program,
                )?;
            },
            GameResult::Player2Wins => {
                self.transfer_from_vault(
                    &accounts.vault,
                    &accounts.opponent.as_ref().unwrap(),
                    accounts.opponent_token_account.as_ref(),
                    accounts.vault_token_account.as_ref(),
                    match_account.token_mint,
                    total_pot, // 100% to winner!
                    vault_bump,
                    match_key,
                    accounts.token_program.as_ref(),
                    &accounts.system_program,
                )?;
            },
            GameResult::Draw => {
                // Refund original bets
                let bet_amount = match_account.bet_amount;
                
                self.transfer_from_vault(
                    &accounts.vault,
                    &accounts.creator,
                    accounts.creator_token_account.as_ref(),
                    accounts.vault_token_account.as_ref(),
                    match_account.token_mint,
                    bet_amount,
                    vault_bump,
                    match_key,
                    accounts.token_program.as_ref(),
                    &accounts.system_program,
                )?;
                
                self.transfer_from_vault(
                    &accounts.vault,
                    &accounts.opponent.as_ref().unwrap(),
                    accounts.opponent_token_account.as_ref(),
                    accounts.vault_token_account.as_ref(),
                    match_account.token_mint,
                    bet_amount,
                    vault_bump,
                    match_key,
                    accounts.token_program.as_ref(),
                    &accounts.system_program,
                )?;
            },
            _ => {
                return Err(UniversalGameError::InvalidGameState.into());
            }
        }

        Ok(())
    }

    /// Refund all players in case of disputes
    fn refund_all_players(
        &self,
        match_account: &UniversalMatch,
        accounts: &SettleMatch,
    ) -> Result<()> {
        let bet_amount = match_account.bet_amount;
        let match_key = match_account.match_id;
        let vault_bump = match_account.vault_bump;

        // Refund creator
        self.transfer_from_vault(
            &accounts.vault,
            &accounts.creator,
            accounts.creator_token_account.as_ref(),
            accounts.vault_token_account.as_ref(),
            match_account.token_mint,
            bet_amount,
            vault_bump,
            match_key,
            accounts.token_program.as_ref(),
            &accounts.system_program,
        )?;

        // Refund opponent if exists
        if let Some(opponent) = accounts.opponent.as_ref() {
            self.transfer_from_vault(
                &accounts.vault,
                opponent,
                accounts.opponent_token_account.as_ref(),
                accounts.vault_token_account.as_ref(),
                match_account.token_mint,
                bet_amount,
                vault_bump,
                match_key,
                accounts.token_program.as_ref(),
                &accounts.system_program,
            )?;
        }

        Ok(())
    }

    /// Secure vault transfer function
    fn transfer_from_vault<'a>(
        &self,
        vault: &AccountInfo<'a>,
        recipient: &AccountInfo<'a>,
        recipient_token_account: Option<&Account<'a, TokenAccount>>,
        vault_token_account: Option<&Account<'a, TokenAccount>>,
        token_mint: Option<Pubkey>,
        amount: u64,
        vault_bump: u8,
        match_key: Pubkey,
        token_program: Option<&Program<'a, Token>>,
        system_program: &Program<'a, System>,
    ) -> Result<()> {
        require!(amount > 0, UniversalGameError::InvalidGameState);

        if let Some(_token_mint) = token_mint {
            // SPL Token transfer
            let vault_token_account = vault_token_account
                .ok_or(UniversalGameError::InvalidGameState)?;
            let recipient_token_account = recipient_token_account
                .ok_or(UniversalGameError::InvalidGameState)?;
            let token_program = token_program
                .ok_or(UniversalGameError::InvalidGameState)?;

            require!(
                vault_token_account.amount >= amount,
                UniversalGameError::InsufficientBet
            );

            let vault_seeds = &[
                b"vault",
                match_key.as_ref(),
                &[vault_bump],
            ];
            let vault_signer = &[&vault_seeds[..]];

            let cpi_accounts = SplTransfer {
                from: vault_token_account.to_account_info(),
                to: recipient_token_account.to_account_info(),
                authority: vault.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                token_program.to_account_info(),
                cpi_accounts,
                vault_signer,
            );
            token::transfer(cpi_ctx, amount)?;
        } else {
            // SOL transfer
            require!(
                vault.lamports() >= amount,
                UniversalGameError::InsufficientBet
            );

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

    /// Calculate voting power based on reputation
    fn calculate_voting_power(&self, reputation: &CreatorReputation) -> u64 {
        let base_power = 1;
        let reputation_multiplier = reputation.reputation_score / 100_000; // 0.1x per 10k reputation
        let tier_multiplier = match reputation.tier {
            CreatorReputation::TIER_DIAMOND => 4,
            CreatorReputation::TIER_GOLD => 3,
            CreatorReputation::TIER_SILVER => 2,
            CreatorReputation::TIER_BRONZE => 1,
            _ => 1,
        };

        base_power * (1 + reputation_multiplier) * tier_multiplier
    }
}

// ===========================
// PLATFORM CONFIGURATION
// ===========================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct PlatformConfig {
    pub min_bet_amount: u64,
    pub max_bet_amount: u64,
    pub max_timeout_seconds: i64,
    pub min_proposal_reputation: u32,
    pub voting_duration: i64,
    pub proposal_deposit: u64,
}

impl Default for PlatformConfig {
    fn default() -> Self {
        Self {
            min_bet_amount: 10_000_000,        // 0.01 SOL
            max_bet_amount: 100_000_000_000,   // 100 SOL
            max_timeout_seconds: 86400,        // 24 hours
            min_proposal_reputation: 100_000,  // 10% reputation score
            voting_duration: 604800,           // 7 days
            proposal_deposit: 100_000_000,     // 0.1 SOL
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct TokenConfig {
    pub reward_rate_per_match: u64,
    pub staking_reward_rate: u64,
    pub burn_rate_bps: u16,
    pub max_supply: u64,
}

/// Platform state account
#[account]
pub struct PlatformState {
    pub authority: Pubkey,                   // 32 bytes
    pub created_at: i64,                     // 8 bytes
    pub total_revenue: u64,                  // 8 bytes
    pub platform_fee_bps: u16,               // 2 bytes (always 0!)
    pub total_proposals: u32,                // 4 bytes
    pub config: PlatformConfig,              // Variable size
    pub flags: u8,                           // 1 byte
    pub reserved: [u8; 7],                   // 7 bytes
}

impl PlatformState {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 2 + 4 + 48 + 1 + 7; // ~120 bytes

    pub const FLAG_ACTIVE: u8 = 1 << 0;
    pub const FLAG_PAUSED: u8 = 1 << 1;
    pub const FLAG_MAINTENANCE: u8 = 1 << 2;
    pub const FLAG_EMERGENCY: u8 = 1 << 3;
}

// ===========================
// CONTEXT DEFINITIONS
// ===========================

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = authority,
        space = GameRegistry::LEN,
        seeds = [b"game_registry"],
        bump
    )]
    pub game_registry: Account<'info, GameRegistry>,
    
    #[account(
        init,
        payer = authority,
        space = PlatformState::LEN,
        seeds = [b"platform_state"],
        bump
    )]
    pub platform_state: Account<'info, PlatformState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(game_type: GameType, name: String)]
pub struct RegisterGame<'info> {
    #[account(
        mut,
        seeds = [b"game_registry"],
        bump
    )]
    pub game_registry: Account<'info, GameRegistry>,
    
    #[account(
        init,
        payer = creator,
        space = GameDefinition::LEN,
        seeds = [b"game", game_registry.total_games.to_le_bytes().as_ref()],
        bump
    )]
    pub game_definition: Account<'info, GameDefinition>,
    
    #[account(
        init_if_needed,
        payer = creator,
        space = CreatorReputation::LEN,
        seeds = [b"reputation", creator.key().as_ref()],
        bump
    )]
    pub creator_reputation: Account<'info, CreatorReputation>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(game_type: GameType, bet_amount: u64)]
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
        init,
        payer = creator,
        space = 0,
        seeds = [b"vault", match_account.key().as_ref()],
        bump
    )]
    /// CHECK: PDA for escrow vault
    pub vault: UncheckedAccount<'info>,
    
    #[account(
        seeds = [b"game", game_type.to_u16().to_le_bytes().as_ref()],
        bump
    )]
    pub game_definition: Account<'info, GameDefinition>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub token_mint: Option<Account<'info, Mint>>,
    #[account(mut)]
    pub creator_token_account: Option<Account<'info, TokenAccount>>,
    #[account(mut)]
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
        bump = match_account.vault_bump
    )]
    /// CHECK: Vault PDA
    pub vault: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub opponent: Signer<'info>,
    
    #[account(mut)]
    pub opponent_token_account: Option<Account<'info, TokenAccount>>,
    #[account(mut)]
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
        bump = match_account.vault_bump
    )]
    /// CHECK: Vault PDA
    pub vault: UncheckedAccount<'info>,
    
    /// CHECK: Creator account for winnings
    #[account(mut)]
    pub creator: UncheckedAccount<'info>,
    
    /// CHECK: Opponent account for winnings
    #[account(mut)]
    pub opponent: Option<UncheckedAccount<'info>>,
    
    #[account(mut)]
    pub creator_token_account: Option<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub opponent_token_account: Option<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub vault_token_account: Option<Account<'info, TokenAccount>>,
    pub token_program: Option<Program<'info, Token>>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateGameToken<'info> {
    #[account(
        init,
        payer = creator,
        space = GameToken::LEN,
        seeds = [b"game_token", game_definition.game_id.to_le_bytes().as_ref()],
        bump
    )]
    pub game_token: Account<'info, GameToken>,
    
    #[account(mut)]
    pub game_definition: Account<'info, GameDefinition>,
    
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub creator_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeRewards<'info> {
    #[account(mut)]
    pub game_token: Account<'info, GameToken>,
    
    pub match_account: Account<'info, UniversalMatch>,
    
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    
    /// CHECK: Mint authority for the token
    pub mint_authority: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(game_type: GameType, name: String)]
pub struct SubmitGameProposal<'info> {
    #[account(
        init,
        payer = proposer,
        space = GameProposal::LEN,
        seeds = [b"proposal", platform_state.total_proposals.to_le_bytes().as_ref()],
        bump
    )]
    pub game_proposal: Account<'info, GameProposal>,
    
    #[account(
        mut,
        seeds = [b"platform_state"],
        bump
    )]
    pub platform_state: Account<'info, PlatformState>,
    
    #[account(
        seeds = [b"reputation", proposer.key().as_ref()],
        bump
    )]
    pub proposer_reputation: Account<'info, CreatorReputation>,
    
    #[account(mut)]
    pub proposer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VoteOnProposal<'info> {
    #[account(mut)]
    pub game_proposal: Account<'info, GameProposal>,
    
    #[account(
        seeds = [b"reputation", voter.key().as_ref()],
        bump
    )]
    pub voter_reputation: Account<'info, CreatorReputation>,
    
    pub voter: Signer<'info>,
}

#[derive(Accounts)]
pub struct EmergencyAction<'info> {
    #[account(
        mut,
        seeds = [b"platform_state"],
        bump
    )]
    pub platform_state: Account<'info, PlatformState>,
    
    pub authority: Signer<'info>,
}

// ===========================
// EVENTS
// ===========================

#[event]
pub struct PlatformInitialized {
    pub authority: Pubkey,
    pub timestamp: i64,
    pub config: PlatformConfig,
}

#[event]
pub struct MoveSubmitted {
    pub match_id: Pubkey,
    pub player: Pubkey,
    pub move_result: String,
    pub timestamp: i64,
}

#[event]
pub struct MatchSettled {
    pub match_id: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct RewardsDistributed {
    pub game_id: u32,
    pub match_id: Pubkey,
    pub reward_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct PlatformPaused {
    pub timestamp: i64,
}

#[event]
pub struct PlatformResumed {
    pub timestamp: i64,
}