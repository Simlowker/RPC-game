use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

// ===========================
// UNIVERSAL GAME ENGINE - 0% FEES
// ===========================

/// Types de jeux supportés par la plateforme
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug)]
pub enum GameType {
    RockPaperScissors,  // Premier jeu
    Dice,               // Jeu de dés (futur)
    CoinFlip,           // Pile ou face (futur)
    HighCard,           // Carte haute (futur)
    Custom(u32),        // Jeux custom avec ID
}

/// Structure universelle pour tous les matchs PvP
#[account]
pub struct UniversalMatch {
    // === Informations de base ===
    pub match_id: Pubkey,
    pub game_type: GameType,
    pub creator: Pubkey,
    pub opponent: Option<Pubkey>,
    
    // === Paris (0% de frais!) ===
    pub bet_amount: u64,
    pub token_mint: Option<Pubkey>,  // SOL si None, sinon SPL token
    pub total_pot: u64,               // bet_amount * 2 (SANS FRAIS!)
    
    // === État du jeu ===
    pub status: MatchStatus,
    pub game_state: Vec<u8>,          // Données flexibles selon le jeu
    pub round_state: Vec<u8>,         // État du gestionnaire de rounds
    pub winner: Option<Pubkey>,
    
    // === Timing ===
    pub created_at: i64,
    pub started_at: Option<i64>,
    pub ended_at: Option<i64>,
    pub timeout_seconds: i64,
    
    // === Metadata ===
    pub game_config: GameConfig,
    pub vault_bump: u8,
}

impl UniversalMatch {
    pub const MAX_GAME_STATE_SIZE: usize = 256;  // Taille max pour game_state
    pub const MAX_ROUND_STATE_SIZE: usize = 128; // Taille max pour round_state
    
    pub const LEN: usize = 8 +       // Discriminator
        32 +                          // match_id
        1 + 4 +                       // game_type (enum avec variant)
        32 +                          // creator
        1 + 32 +                      // opponent (Option)
        8 +                           // bet_amount
        1 + 32 +                      // token_mint (Option)
        8 +                           // total_pot
        1 + 4 +                       // status (enum)
        4 + Self::MAX_GAME_STATE_SIZE + // game_state (Vec)
        4 + Self::MAX_ROUND_STATE_SIZE + // round_state (Vec)
        1 + 32 +                      // winner (Option)
        8 +                           // created_at
        1 + 8 +                       // started_at (Option)
        1 + 8 +                       // ended_at (Option)
        8 +                           // timeout_seconds
        32 +                          // game_config
        1;                            // vault_bump
        
    /// Vérifie si le match peut être annulé (timeout)
    pub fn can_timeout(&self) -> bool {
        let clock = Clock::get().unwrap();
        match self.status {
            MatchStatus::WaitingForOpponent => {
                clock.unix_timestamp > self.created_at + self.timeout_seconds
            },
            MatchStatus::InProgress => {
                if let Some(started) = self.started_at {
                    clock.unix_timestamp > started + self.timeout_seconds
                } else {
                    false
                }
            },
            _ => false
        }
    }
    
    /// Calcule le montant pour le gagnant (100% du pot!)
    pub fn calculate_winner_amount(&self) -> u64 {
        self.total_pot  // 0% de frais = 100% au gagnant!
    }
}

/// Configuration spécifique au type de jeu
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
pub struct GameConfig {
    pub max_players: u8,
    pub min_bet: u64,
    pub max_bet: u64,
    pub rounds: u8,
    pub custom_params: [u8; 16],  // Paramètres custom selon le jeu
}

/// Status du match
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug)]
pub enum MatchStatus {
    WaitingForOpponent,
    InProgress,
    Completed,
    Cancelled,
    Disputed,
}

/// Résultat du jeu
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug)]
pub enum GameResult {
    Player1Wins,
    Player2Wins,
    Draw,
    Cancelled,
}

// ===========================
// GAME REGISTRY SYSTEM
// ===========================

/// Registre des jeux disponibles sur la plateforme
#[account]
pub struct GameRegistry {
    pub authority: Pubkey,
    pub total_games: u32,
    pub active_games: Vec<GameDefinition>,
    pub paused: bool,
}

impl GameRegistry {
    pub const MAX_GAMES: usize = 100;  // Support jusqu'à 100 jeux
    
    pub const LEN: usize = 8 +         // Discriminator
        32 +                            // authority
        4 +                             // total_games
        4 + (Self::MAX_GAMES * GameDefinition::LEN) + // active_games
        1;                              // paused
}

/// Définition d'un jeu dans le registre
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct GameDefinition {
    pub game_id: u32,
    pub game_type: GameType,
    pub name: String,
    pub creator: Pubkey,
    pub created_at: i64,
    pub total_matches: u64,
    pub is_active: bool,
    pub game_token: Option<Pubkey>,  // Token optionnel du jeu
}

impl GameDefinition {
    pub const LEN: usize = 
        4 +                    // game_id
        1 + 4 +                // game_type
        4 + 32 +               // name (String max 32 chars)
        32 +                   // creator
        8 +                    // created_at
        8 +                    // total_matches
        1 +                    // is_active
        1 + 32;                // game_token (Option)
}

// ===========================
// TOKEN SYSTEM (Pour revenus)
// ===========================

/// Information sur le token d'un jeu
#[account]
pub struct GameToken {
    pub game_id: u32,
    pub token_mint: Pubkey,
    pub creator: Pubkey,
    pub total_supply: u64,
    pub circulating_supply: u64,
    pub rewards_distributed: u64,
    pub is_active: bool,
}

impl GameToken {
    pub const LEN: usize = 8 +  // Discriminator
        4 +                      // game_id
        32 +                     // token_mint
        32 +                     // creator
        8 +                      // total_supply
        8 +                      // circulating_supply
        8 +                      // rewards_distributed
        1;                       // is_active
}

// ===========================
// DISPUTE RESOLUTION
// ===========================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug)]
pub enum DisputeResolution {
    Player1Wins,
    Player2Wins,
    Draw,
    Cancel,
}

// ===========================
// EVENTS
// ===========================

#[event]
pub struct MatchCreated {
    pub match_id: Pubkey,
    pub game_type: GameType,
    pub creator: Pubkey,
    pub bet_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct MatchJoined {
    pub match_id: Pubkey,
    pub opponent: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct MatchCompleted {
    pub match_id: Pubkey,
    pub winner: Option<Pubkey>,
    pub total_pot: u64,
    pub game_result: GameResult,
    pub timestamp: i64,
}

#[event]
pub struct GameRegistered {
    pub game_id: u32,
    pub game_type: GameType,
    pub creator: Pubkey,
    pub name: String,
    pub timestamp: i64,
}

#[event]
pub struct WinningsClaimed {
    pub match_id: Pubkey,
    pub claimer: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct MatchCancelled {
    pub match_id: Pubkey,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct MatchDisputed {
    pub match_id: Pubkey,
    pub disputer: Pubkey,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct DisputeResolved {
    pub match_id: Pubkey,
    pub resolution: DisputeResolution,
    pub resolver: Pubkey,
    pub timestamp: i64,
}

// ===========================
// ERRORS
// ===========================

#[error_code]
pub enum UniversalGameError {
    #[msg("Invalid game type")]
    InvalidGameType,
    
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
    
    #[msg("Game registry is full")]
    RegistryFull,
    
    #[msg("Match not completed")]
    MatchNotCompleted,
    
    #[msg("Cannot cancel match")]
    CannotCancel,
    
    #[msg("Cannot dispute match")]
    CannotDispute,
    
    #[msg("Match not disputed")]
    NotDisputed,
    
    #[msg("Insufficient funds in vault")]
    InsufficientFunds,
    
    #[msg("Custom game error")]
    CustomError,
}