use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

// ===========================
// OPTIMIZED UNIVERSAL GAME ENGINE - 0% FEES
// ===========================

/// Highly optimized game types with minimal storage footprint
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug)]
pub enum GameType {
    RockPaperScissors = 0,  // Classic RPS
    Dice = 1,               // Dice games
    CoinFlip = 2,           // Coin flip
    HighCard = 3,           // Card games
    TicTacToe = 4,          // Board games
    Slots = 5,              // Slot machines
    Poker = 6,              // Poker variants
    Blackjack = 7,          // Blackjack
    Custom(u16),            // Custom games with 16-bit ID (65K games)
}

impl GameType {
    pub fn to_u16(self) -> u16 {
        match self {
            GameType::Custom(id) => 1000 + id,
            _ => self as u8 as u16,
        }
    }

    pub fn from_u16(value: u16) -> Result<Self> {
        match value {
            0 => Ok(GameType::RockPaperScissors),
            1 => Ok(GameType::Dice),
            2 => Ok(GameType::CoinFlip),
            3 => Ok(GameType::HighCard),
            4 => Ok(GameType::TicTacToe),
            5 => Ok(GameType::Slots),
            6 => Ok(GameType::Poker),
            7 => Ok(GameType::Blackjack),
            1000..=u16::MAX => Ok(GameType::Custom(value - 1000)),
            _ => Err(UniversalGameError::InvalidGameType.into()),
        }
    }
}

/// Ultra-optimized universal match structure (320 bytes total)
#[account]
pub struct UniversalMatch {
    // === Core Identity (68 bytes) ===
    pub match_id: Pubkey,                    // 32 bytes
    pub creator: Pubkey,                     // 32 bytes
    pub game_type: u16,                      // 2 bytes (supports 65K game types)
    pub vault_bump: u8,                      // 1 byte
    pub flags: u8,                           // 1 byte (packed boolean flags)

    // === Financial (53 bytes) ===
    pub bet_amount: u64,                     // 8 bytes
    pub total_pot: u64,                      // 8 bytes
    pub token_mint: Option<Pubkey>,          // 33 bytes (1 + 32)
    pub fee_bps: u16,                        // 2 bytes (basis points)
    pub creator_stake: u16,                  // 2 bytes (percentage of initial stake)

    // === Players (33 bytes) ===
    pub opponent: Option<Pubkey>,            // 33 bytes (1 + 32)

    // === Game State (148 bytes) ===
    pub game_state: [u8; 128],               // 128 bytes (fixed size for optimal packing)
    pub game_state_len: u8,                  // 1 byte (actual length used)
    pub game_config: GameConfig,             // 19 bytes (optimized)

    // === Timing (18 bytes) ===
    pub created_at: i64,                     // 8 bytes
    pub timeout_at: i64,                     // 8 bytes (single timeout field)
    pub phase_deadline: u16,                 // 2 bytes (minutes from creation)

    // Total: 320 bytes (optimized from ~450 bytes)
}

impl UniversalMatch {
    pub const LEN: usize = 320;
    pub const MAX_GAME_STATE_SIZE: usize = 128;

    // Flag bit positions
    pub const FLAG_HAS_OPPONENT: u8 = 1 << 0;
    pub const FLAG_STARTED: u8 = 1 << 1;
    pub const FLAG_COMPLETED: u8 = 1 << 2;
    pub const FLAG_CANCELLED: u8 = 1 << 3;
    pub const FLAG_TIMED_OUT: u8 = 1 << 4;
    pub const FLAG_DISPUTED: u8 = 1 << 5;
    pub const FLAG_REVEAL_PHASE: u8 = 1 << 6;
    pub const FLAG_WINNER_DECIDED: u8 = 1 << 7;

    /// Get current match status from flags
    pub fn status(&self) -> MatchStatus {
        if self.flags & Self::FLAG_CANCELLED != 0 {
            MatchStatus::Cancelled
        } else if self.flags & Self::FLAG_TIMED_OUT != 0 {
            MatchStatus::TimedOut
        } else if self.flags & Self::FLAG_DISPUTED != 0 {
            MatchStatus::Disputed
        } else if self.flags & Self::FLAG_COMPLETED != 0 {
            MatchStatus::Completed
        } else if self.flags & Self::FLAG_STARTED != 0 {
            MatchStatus::InProgress
        } else {
            MatchStatus::WaitingForOpponent
        }
    }

    /// Set status by updating flags efficiently
    pub fn set_status(&mut self, status: MatchStatus) {
        // Clear status flags
        self.flags &= !(Self::FLAG_CANCELLED | Self::FLAG_TIMED_OUT | 
                       Self::FLAG_DISPUTED | Self::FLAG_COMPLETED | 
                       Self::FLAG_STARTED);

        match status {
            MatchStatus::Cancelled => self.flags |= Self::FLAG_CANCELLED,
            MatchStatus::TimedOut => self.flags |= Self::FLAG_TIMED_OUT,
            MatchStatus::Disputed => self.flags |= Self::FLAG_DISPUTED,
            MatchStatus::Completed => self.flags |= Self::FLAG_COMPLETED | Self::FLAG_STARTED,
            MatchStatus::InProgress => self.flags |= Self::FLAG_STARTED,
            MatchStatus::WaitingForOpponent => {} // Default state
        }
    }

    /// Check if match can timeout
    pub fn can_timeout(&self) -> bool {
        let clock = Clock::get().unwrap();
        clock.unix_timestamp > self.timeout_at
    }

    /// Calculate winner amount (100% of pot - 0% fees!)
    pub fn calculate_winner_amount(&self) -> u64 {
        self.total_pot
    }

    /// Write game state efficiently
    pub fn write_game_state(&mut self, data: &[u8]) -> Result<()> {
        require!(data.len() <= Self::MAX_GAME_STATE_SIZE, UniversalGameError::GameStateTooLarge);
        
        self.game_state[..data.len()].copy_from_slice(data);
        self.game_state_len = data.len() as u8;
        Ok(())
    }

    /// Read active game state
    pub fn read_game_state(&self) -> &[u8] {
        &self.game_state[..self.game_state_len as usize]
    }

    /// Initialize match with optimal defaults
    pub fn initialize(
        &mut self,
        match_id: Pubkey,
        creator: Pubkey,
        game_type: GameType,
        bet_amount: u64,
        game_config: GameConfig,
        timeout_seconds: i64,
        vault_bump: u8,
    ) {
        let clock = Clock::get().unwrap();
        
        self.match_id = match_id;
        self.creator = creator;
        self.game_type = game_type.to_u16();
        self.bet_amount = bet_amount;
        self.total_pot = bet_amount.saturating_mul(2);
        self.game_config = game_config;
        self.created_at = clock.unix_timestamp;
        self.timeout_at = clock.unix_timestamp.saturating_add(timeout_seconds);
        self.vault_bump = vault_bump;
        self.flags = 0; // All flags false initially
        self.game_state_len = 0;
        self.fee_bps = 0; // 0% fees!
        self.creator_stake = 10000; // 100% in basis points
    }
}

/// Optimized game configuration (19 bytes)
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
pub struct GameConfig {
    pub max_players: u8,                     // 1 byte
    pub min_bet: u64,                        // 8 bytes
    pub max_rounds: u8,                      // 1 byte
    pub timeout_minutes: u16,                // 2 bytes
    pub custom_params: [u8; 7],              // 7 bytes (reduced from 16)
}

/// Optimized match status enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug)]
pub enum MatchStatus {
    WaitingForOpponent = 0,
    InProgress = 1,
    Completed = 2,
    Cancelled = 3,
    Disputed = 4,
    TimedOut = 5,
}

/// Game result types
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug)]
pub enum GameResult {
    Player1Wins = 0,
    Player2Wins = 1,
    Draw = 2,
    Cancelled = 3,
    InvalidGame = 4,
}

// ===========================
// ENHANCED GAME REGISTRY SYSTEM
// ===========================

/// Scalable game registry with optimized storage
#[account]
pub struct GameRegistry {
    pub authority: Pubkey,                   // 32 bytes
    pub total_games: u32,                    // 4 bytes
    pub active_games_count: u32,             // 4 bytes
    pub total_matches_played: u64,           // 8 bytes
    pub total_volume: u64,                   // 8 bytes (in lamports)
    pub registry_version: u16,               // 2 bytes
    pub flags: u8,                           // 1 byte (paused, etc.)
    pub reserved: [u8; 5],                   // 5 bytes for future use
    // Note: Game definitions stored in separate accounts for scalability
}

impl GameRegistry {
    pub const LEN: usize = 8 + 32 + 4 + 4 + 8 + 8 + 2 + 1 + 5; // 72 bytes
    pub const MAX_GAMES_PER_REGISTRY: u32 = 10_000;

    pub const FLAG_PAUSED: u8 = 1 << 0;
    pub const FLAG_MAINTENANCE: u8 = 1 << 1;
    pub const FLAG_EMERGENCY: u8 = 1 << 2;

    pub fn is_paused(&self) -> bool {
        self.flags & Self::FLAG_PAUSED != 0
    }

    pub fn set_paused(&mut self, paused: bool) {
        if paused {
            self.flags |= Self::FLAG_PAUSED;
        } else {
            self.flags &= !Self::FLAG_PAUSED;
        }
    }
}

/// Individual game definition account (separate for scalability)
#[account]
pub struct GameDefinition {
    pub game_id: u32,                        // 4 bytes
    pub game_type: u16,                      // 2 bytes
    pub creator: Pubkey,                     // 32 bytes
    pub name: [u8; 32],                      // 32 bytes (fixed size string)
    pub description: [u8; 128],              // 128 bytes (fixed size description)
    pub created_at: i64,                     // 8 bytes
    pub last_updated: i64,                   // 8 bytes
    pub total_matches: u64,                  // 8 bytes
    pub total_volume: u64,                   // 8 bytes
    pub version: u16,                        // 2 bytes
    pub flags: u8,                           // 1 byte (active, verified, etc.)
    pub reputation_score: u16,               // 2 bytes (0-10000)
    pub default_config: GameConfig,          // 19 bytes
    pub creator_fee_bps: u16,                // 2 bytes (creator can set optional fee)
    pub game_token: Option<Pubkey>,          // 33 bytes
    pub code_hash: [u8; 32],                 // 32 bytes (for integrity verification)
    pub reserved: [u8; 8],                   // 8 bytes for future use
}

impl GameDefinition {
    pub const LEN: usize = 8 + 4 + 2 + 32 + 32 + 128 + 8 + 8 + 8 + 8 + 2 + 1 + 2 + 19 + 2 + 33 + 32 + 8; // 337 bytes

    pub const FLAG_ACTIVE: u8 = 1 << 0;
    pub const FLAG_VERIFIED: u8 = 1 << 1;
    pub const FLAG_FEATURED: u8 = 1 << 2;
    pub const FLAG_DEPRECATED: u8 = 1 << 3;
    pub const FLAG_BETA: u8 = 1 << 4;

    pub fn is_active(&self) -> bool {
        self.flags & Self::FLAG_ACTIVE != 0
    }

    pub fn is_verified(&self) -> bool {
        self.flags & Self::FLAG_VERIFIED != 0
    }

    pub fn set_name(&mut self, name: &str) -> Result<()> {
        require!(name.len() <= 32, UniversalGameError::NameTooLong);
        self.name.fill(0);
        self.name[..name.len()].copy_from_slice(name.as_bytes());
        Ok(())
    }

    pub fn get_name(&self) -> String {
        let len = self.name.iter().position(|&b| b == 0).unwrap_or(32);
        String::from_utf8_lossy(&self.name[..len]).to_string()
    }
}

// ===========================
// TOKEN SYSTEM ARCHITECTURE
// ===========================

/// Per-game token information
#[account]
pub struct GameToken {
    pub game_id: u32,                        // 4 bytes
    pub token_mint: Pubkey,                  // 32 bytes
    pub creator: Pubkey,                     // 32 bytes
    pub total_supply: u64,                   // 8 bytes
    pub circulating_supply: u64,             // 8 bytes
    pub rewards_distributed: u64,            // 8 bytes
    pub total_burned: u64,                   // 8 bytes
    pub last_reward_distribution: i64,       // 8 bytes
    pub reward_rate_per_match: u64,          // 8 bytes
    pub staking_pool: Pubkey,                // 32 bytes
    pub flags: u8,                           // 1 byte
    pub decimals: u8,                        // 1 byte
    pub reserved: [u8; 6],                   // 6 bytes
}

impl GameToken {
    pub const LEN: usize = 8 + 4 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 32 + 1 + 1 + 6; // 164 bytes

    pub const FLAG_ACTIVE: u8 = 1 << 0;
    pub const FLAG_MINTABLE: u8 = 1 << 1;
    pub const FLAG_BURNABLE: u8 = 1 << 2;
    pub const FLAG_STAKEABLE: u8 = 1 << 3;
}

/// Staking pool for game tokens
#[account]
pub struct StakingPool {
    pub game_token: Pubkey,                  // 32 bytes
    pub pool_authority: Pubkey,              // 32 bytes
    pub total_staked: u64,                   // 8 bytes
    pub total_rewards_paid: u64,             // 8 bytes
    pub reward_per_token_stored: u128,       // 16 bytes
    pub last_update_time: i64,               // 8 bytes
    pub reward_rate: u64,                    // 8 bytes (tokens per second)
    pub pool_bump: u8,                       // 1 byte
    pub flags: u8,                           // 1 byte
    pub reserved: [u8; 6],                   // 6 bytes
}

impl StakingPool {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 16 + 8 + 8 + 1 + 1 + 6; // 128 bytes
}

// ===========================
// COMMUNITY GOVERNANCE
// ===========================

/// Game submission proposal
#[account]
pub struct GameProposal {
    pub proposal_id: u32,                    // 4 bytes
    pub proposer: Pubkey,                    // 32 bytes
    pub game_type: u16,                      // 2 bytes
    pub name: [u8; 32],                      // 32 bytes
    pub description: [u8; 256],              // 256 bytes
    pub code_hash: [u8; 32],                 // 32 bytes
    pub created_at: i64,                     // 8 bytes
    pub voting_ends_at: i64,                 // 8 bytes
    pub yes_votes: u64,                      // 8 bytes
    pub no_votes: u64,                       // 8 bytes
    pub total_voting_power: u64,             // 8 bytes
    pub status: u8,                          // 1 byte (pending, approved, rejected)
    pub flags: u8,                           // 1 byte
    pub security_audit_hash: [u8; 32],       // 32 bytes
    pub reserved: [u8; 6],                   // 6 bytes
}

impl GameProposal {
    pub const LEN: usize = 8 + 4 + 32 + 2 + 32 + 256 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 32 + 6; // 446 bytes

    pub const STATUS_PENDING: u8 = 0;
    pub const STATUS_APPROVED: u8 = 1;
    pub const STATUS_REJECTED: u8 = 2;
    pub const STATUS_UNDER_REVIEW: u8 = 3;
}

/// Creator reputation tracking
#[account]
pub struct CreatorReputation {
    pub creator: Pubkey,                     // 32 bytes
    pub games_created: u32,                  // 4 bytes
    pub total_matches_played: u64,           // 8 bytes
    pub total_volume_generated: u64,         // 8 bytes
    pub reputation_score: u32,               // 4 bytes (0-1,000,000)
    pub positive_votes: u32,                 // 4 bytes
    pub negative_votes: u32,                 // 4 bytes
    pub bugs_reported: u16,                  // 2 bytes
    pub bugs_fixed: u16,                     // 2 bytes
    pub last_updated: i64,                   // 8 bytes
    pub tier: u8,                            // 1 byte (bronze, silver, gold, diamond)
    pub flags: u8,                           // 1 byte
    pub reserved: [u8; 6],                   // 6 bytes
}

impl CreatorReputation {
    pub const LEN: usize = 8 + 32 + 4 + 8 + 8 + 4 + 4 + 4 + 2 + 2 + 8 + 1 + 1 + 6; // 92 bytes

    pub const TIER_BRONZE: u8 = 0;
    pub const TIER_SILVER: u8 = 1;
    pub const TIER_GOLD: u8 = 2;
    pub const TIER_DIAMOND: u8 = 3;

    pub const FLAG_VERIFIED_CREATOR: u8 = 1 << 0;
    pub const FLAG_TRUSTED: u8 = 1 << 1;
    pub const FLAG_BLOCKED: u8 = 1 << 2;
}

// ===========================
// EVENTS
// ===========================

#[event]
pub struct MatchCreatedV2 {
    pub match_id: Pubkey,
    pub game_type: u16,
    pub creator: Pubkey,
    pub bet_amount: u64,
    pub timestamp: i64,
    pub timeout_at: i64,
}

#[event]
pub struct GameRegisteredV2 {
    pub game_id: u32,
    pub game_type: u16,
    pub creator: Pubkey,
    pub name: String,
    pub timestamp: i64,
    pub reputation_required: bool,
}

#[event]
pub struct TokenCreated {
    pub game_id: u32,
    pub token_mint: Pubkey,
    pub creator: Pubkey,
    pub initial_supply: u64,
    pub timestamp: i64,
}

#[event]
pub struct ProposalCreated {
    pub proposal_id: u32,
    pub proposer: Pubkey,
    pub game_type: u16,
    pub voting_ends_at: i64,
}

#[event]
pub struct ProposalVoted {
    pub proposal_id: u32,
    pub voter: Pubkey,
    pub vote: bool, // true for yes, false for no
    pub voting_power: u64,
}

// ===========================
// ERRORS
// ===========================

#[error_code]
pub enum UniversalGameError {
    #[msg("Invalid game type")]
    InvalidGameType,
    
    #[msg("Game state too large (max 128 bytes)")]
    GameStateTooLarge,
    
    #[msg("Match already started")]
    MatchAlreadyStarted,
    
    #[msg("Match not found")]
    MatchNotFound,
    
    #[msg("Insufficient bet amount")]
    InsufficientBet,
    
    #[msg("Bet amount exceeds maximum")]
    BetTooLarge,
    
    #[msg("Game is not active")]
    GameNotActive,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Match has timed out")]
    MatchTimeout,
    
    #[msg("Invalid game state")]
    InvalidGameState,
    
    #[msg("Registry is full")]
    RegistryFull,
    
    #[msg("Name too long (max 32 characters)")]
    NameTooLong,
    
    #[msg("Game not verified")]
    GameNotVerified,
    
    #[msg("Insufficient reputation")]
    InsufficientReputation,
    
    #[msg("Proposal voting has ended")]
    VotingEnded,
    
    #[msg("Already voted on this proposal")]
    AlreadyVoted,
    
    #[msg("Insufficient voting power")]
    InsufficientVotingPower,
    
    #[msg("Custom game error")]
    CustomError,
}