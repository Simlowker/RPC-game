use anchor_lang::prelude::*;
use crate::universal_engine::{GameType, GameResult, UniversalMatch, GameConfig};

// ===========================
// ENHANCED GAME MODULE SYSTEM
// ===========================

/// Comprehensive trait that all games must implement
pub trait GameLogic {
    /// Game identification and metadata
    fn game_type(&self) -> GameType;
    fn version(&self) -> u16;
    fn name(&self) -> &'static str;
    fn description(&self) -> &'static str;
    fn min_players(&self) -> u8;
    fn max_players(&self) -> u8;

    /// Game initialization and configuration
    fn default_config(&self) -> GameConfig;
    fn validate_config(&self, config: &GameConfig) -> Result<()>;
    fn initialize_game_state(&self, match_data: &mut UniversalMatch, config: &GameConfig) -> Result<()>;

    /// Move validation and processing
    fn validate_move(&self, player: &Pubkey, move_data: &[u8], match_data: &UniversalMatch) -> Result<()>;
    fn process_move(&self, player: &Pubkey, move_data: &[u8], match_data: &mut UniversalMatch) -> Result<MoveResult>;
    fn can_make_move(&self, player: &Pubkey, match_data: &UniversalMatch) -> bool;

    /// Game state management
    fn encode_state(&self, state: &dyn GameState) -> Result<Vec<u8>>;
    fn decode_state(&self, data: &[u8]) -> Result<Box<dyn GameState>>;
    fn get_current_phase(&self, match_data: &UniversalMatch) -> GamePhase;

    /// Game resolution
    fn is_game_over(&self, match_data: &UniversalMatch) -> bool;
    fn determine_winner(&self, match_data: &UniversalMatch) -> Result<GameResult>;
    fn calculate_payouts(&self, match_data: &UniversalMatch) -> Result<Vec<Payout>>;

    /// Game-specific features
    fn supports_commit_reveal(&self) -> bool { false }
    fn supports_multiple_rounds(&self) -> bool { false }
    fn supports_partial_reveal(&self) -> bool { false }
    fn supports_spectators(&self) -> bool { false }

    /// Advanced features
    fn get_move_timeout(&self, match_data: &UniversalMatch) -> Option<i64>;
    fn handle_timeout(&self, match_data: &mut UniversalMatch) -> Result<TimeoutResult>;
    fn get_minimum_bet(&self) -> u64;
    fn get_maximum_bet(&self) -> u64;

    /// Security and validation
    fn verify_game_integrity(&self, match_data: &UniversalMatch) -> Result<()>;
    fn detect_cheating(&self, match_data: &UniversalMatch) -> Result<Option<CheatDetection>>;
}

/// Generic game state trait for type erasure
pub trait GameState: Send + Sync {
    fn as_bytes(&self) -> Vec<u8>;
    fn from_bytes(data: &[u8]) -> Result<Self> where Self: Sized;
    fn is_valid(&self) -> bool;
    fn phase(&self) -> GamePhase;
}

/// Result of processing a move
#[derive(Debug, Clone)]
pub enum MoveResult {
    Accepted,
    GameOver(GameResult),
    PhaseChange(GamePhase),
    WaitingForOpponent,
    InvalidMove(String),
    RequiresReveal,
}

/// Game phases for state management
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug)]
pub enum GamePhase {
    Setup = 0,
    Commit = 1,
    Reveal = 2,
    Playing = 3,
    Scoring = 4,
    Finished = 5,
}

/// Payout information for game resolution
#[derive(Debug, Clone)]
pub struct Payout {
    pub player: Pubkey,
    pub amount: u64,
    pub reason: PayoutReason,
}

#[derive(Debug, Clone)]
pub enum PayoutReason {
    Winner,
    Tie,
    Forfeit,
    Penalty,
    Refund,
}

/// Timeout handling result
#[derive(Debug, Clone)]
pub enum TimeoutResult {
    GameOver(GameResult),
    ForfeitPlayer(Pubkey),
    RefundAll,
    ContinueGame,
}

/// Cheat detection result
#[derive(Debug, Clone)]
pub struct CheatDetection {
    pub cheater: Pubkey,
    pub cheat_type: CheatType,
    pub evidence: Vec<u8>,
}

#[derive(Debug, Clone)]
pub enum CheatType {
    InvalidMove,
    StateManipulation,
    TimingAttack,
    CommitmentViolation,
    Custom(String),
}

// ===========================
// GAME ROUTER SYSTEM
// ===========================

/// Dynamic game router for dispatching operations
pub struct GameRouter;

impl GameRouter {
    /// Route game operations to appropriate handlers
    pub fn route_operation(
        game_type: GameType,
        operation: GameOperation,
        match_data: &mut UniversalMatch,
        context: &GameContext,
    ) -> Result<OperationResult> {
        let handler = Self::get_handler(game_type)?;
        
        match operation {
            GameOperation::Initialize(config) => {
                handler.validate_config(&config)?;
                handler.initialize_game_state(match_data, &config)?;
                Ok(OperationResult::Success)
            },
            GameOperation::ProcessMove(player, move_data) => {
                handler.validate_move(&player, &move_data, match_data)?;
                let result = handler.process_move(&player, &move_data, match_data)?;
                Ok(OperationResult::MoveProcessed(result))
            },
            GameOperation::CheckGameOver => {
                if handler.is_game_over(match_data) {
                    let winner = handler.determine_winner(match_data)?;
                    Ok(OperationResult::GameOver(winner))
                } else {
                    Ok(OperationResult::Continue)
                }
            },
            GameOperation::HandleTimeout => {
                let timeout_result = handler.handle_timeout(match_data)?;
                Ok(OperationResult::TimeoutHandled(timeout_result))
            },
            GameOperation::ValidateIntegrity => {
                handler.verify_game_integrity(match_data)?;
                if let Some(cheat) = handler.detect_cheating(match_data)? {
                    Ok(OperationResult::CheatDetected(cheat))
                } else {
                    Ok(OperationResult::Valid)
                }
            },
        }
    }

    /// Get appropriate game handler
    fn get_handler(game_type: GameType) -> Result<Box<dyn GameLogic>> {
        match game_type {
            GameType::RockPaperScissors => Ok(Box::new(RockPaperScissorsV2::new())),
            GameType::Dice => Ok(Box::new(DiceGame::new())),
            GameType::CoinFlip => Ok(Box::new(CoinFlipGame::new())),
            GameType::TicTacToe => Ok(Box::new(TicTacToeGame::new())),
            GameType::Custom(id) => Self::get_custom_handler(id),
            _ => Err(UniversalGameError::InvalidGameType.into()),
        }
    }

    /// Load custom game handlers dynamically
    fn get_custom_handler(game_id: u16) -> Result<Box<dyn GameLogic>> {
        // In a real implementation, this would load from a registry
        // of verified custom game modules
        match game_id {
            1000 => Ok(Box::new(PokerGame::new())),
            1001 => Ok(Box::new(BlackjackGame::new())),
            _ => Err(UniversalGameError::InvalidGameType.into()),
        }
    }
}

/// Game operations that can be routed
#[derive(Debug, Clone)]
pub enum GameOperation {
    Initialize(GameConfig),
    ProcessMove(Pubkey, Vec<u8>),
    CheckGameOver,
    HandleTimeout,
    ValidateIntegrity,
}

/// Context for game operations
pub struct GameContext {
    pub clock: Clock,
    pub random_seed: [u8; 32],
    pub match_authority: Pubkey,
}

/// Results from game operations
#[derive(Debug)]
pub enum OperationResult {
    Success,
    Continue,
    MoveProcessed(MoveResult),
    GameOver(GameResult),
    TimeoutHandled(TimeoutResult),
    CheatDetected(CheatDetection),
    Valid,
    Error(String),
}

// ===========================
// ENHANCED ROCK PAPER SCISSORS V2
// ===========================

pub struct RockPaperScissorsV2;

impl RockPaperScissorsV2 {
    pub fn new() -> Self {
        Self
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct RPSGameStateV2 {
    pub player1_commitment: Option<[u8; 32]>,
    pub player2_commitment: Option<[u8; 32]>,
    pub player1_revealed: Option<RPSChoice>,
    pub player2_revealed: Option<RPSChoice>,
    pub phase: GamePhase,
    pub round: u8,
    pub max_rounds: u8,
    pub player1_wins: u8,
    pub player2_wins: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug)]
pub enum RPSChoice {
    Rock = 0,
    Paper = 1,
    Scissors = 2,
}

impl RPSChoice {
    pub fn beats(self, other: RPSChoice) -> bool {
        matches!(
            (self, other),
            (RPSChoice::Rock, RPSChoice::Scissors) |
            (RPSChoice::Paper, RPSChoice::Rock) |
            (RPSChoice::Scissors, RPSChoice::Paper)
        )
    }
}

impl GameState for RPSGameStateV2 {
    fn as_bytes(&self) -> Vec<u8> {
        self.try_to_vec().unwrap_or_default()
    }

    fn from_bytes(data: &[u8]) -> Result<Self> {
        Self::try_from_slice(data).map_err(|_| UniversalGameError::InvalidGameState.into())
    }

    fn is_valid(&self) -> bool {
        self.round <= self.max_rounds &&
        self.player1_wins <= self.max_rounds &&
        self.player2_wins <= self.max_rounds
    }

    fn phase(&self) -> GamePhase {
        self.phase
    }
}

impl GameLogic for RockPaperScissorsV2 {
    fn game_type(&self) -> GameType { GameType::RockPaperScissors }
    fn version(&self) -> u16 { 2 }
    fn name(&self) -> &'static str { "Rock Paper Scissors V2" }
    fn description(&self) -> &'static str { "Enhanced RPS with multiple rounds and commit-reveal" }
    fn min_players(&self) -> u8 { 2 }
    fn max_players(&self) -> u8 { 2 }

    fn default_config(&self) -> GameConfig {
        GameConfig {
            max_players: 2,
            min_bet: 10_000_000,      // 0.01 SOL
            max_rounds: 1,
            timeout_minutes: 5,
            custom_params: [0; 7],
        }
    }

    fn validate_config(&self, config: &GameConfig) -> Result<()> {
        require!(config.max_players == 2, UniversalGameError::InvalidGameState);
        require!(config.max_rounds >= 1 && config.max_rounds <= 10, UniversalGameError::InvalidGameState);
        Ok(())
    }

    fn initialize_game_state(&self, match_data: &mut UniversalMatch, config: &GameConfig) -> Result<()> {
        let state = RPSGameStateV2 {
            player1_commitment: None,
            player2_commitment: None,
            player1_revealed: None,
            player2_revealed: None,
            phase: GamePhase::Commit,
            round: 1,
            max_rounds: config.max_rounds,
            player1_wins: 0,
            player2_wins: 0,
        };
        
        let encoded = self.encode_state(&state)?;
        match_data.write_game_state(&encoded)?;
        Ok(())
    }

    fn validate_move(&self, player: &Pubkey, move_data: &[u8], match_data: &UniversalMatch) -> Result<()> {
        require!(move_data.len() >= 1, UniversalGameError::InvalidGameState);
        
        let state = self.decode_state(match_data.read_game_state())?;
        let rps_state = state.as_any().downcast_ref::<RPSGameStateV2>()
            .ok_or(UniversalGameError::InvalidGameState)?;

        match rps_state.phase {
            GamePhase::Commit => {
                require!(move_data.len() == 32, UniversalGameError::InvalidGameState);
                // Validate commitment format
            },
            GamePhase::Reveal => {
                require!(move_data.len() >= 33, UniversalGameError::InvalidGameState);
                let choice = move_data[0];
                require!(choice <= 2, UniversalGameError::InvalidGameState);
                // Validate reveal data includes salt and matches commitment
            },
            _ => return Err(UniversalGameError::InvalidGameState.into()),
        }

        Ok(())
    }

    fn process_move(&self, player: &Pubkey, move_data: &[u8], match_data: &mut UniversalMatch) -> Result<MoveResult> {
        let mut state = self.decode_state(match_data.read_game_state())?;
        let rps_state = state.as_any_mut().downcast_mut::<RPSGameStateV2>()
            .ok_or(UniversalGameError::InvalidGameState)?;

        let is_player1 = *player == match_data.creator;
        
        match rps_state.phase {
            GamePhase::Commit => {
                let commitment: [u8; 32] = move_data.try_into()
                    .map_err(|_| UniversalGameError::InvalidGameState)?;

                if is_player1 {
                    rps_state.player1_commitment = Some(commitment);
                } else {
                    rps_state.player2_commitment = Some(commitment);
                }

                // Check if both players have committed
                if rps_state.player1_commitment.is_some() && rps_state.player2_commitment.is_some() {
                    rps_state.phase = GamePhase::Reveal;
                    let encoded = self.encode_state(rps_state)?;
                    match_data.write_game_state(&encoded)?;
                    return Ok(MoveResult::PhaseChange(GamePhase::Reveal));
                }
            },
            GamePhase::Reveal => {
                let choice_val = move_data[0];
                let salt: [u8; 32] = move_data[1..33].try_into()
                    .map_err(|_| UniversalGameError::InvalidGameState)?;
                let choice = match choice_val {
                    0 => RPSChoice::Rock,
                    1 => RPSChoice::Paper,
                    2 => RPSChoice::Scissors,
                    _ => return Err(UniversalGameError::InvalidGameState.into()),
                };

                // Verify commitment
                let commitment = self.create_commitment(choice, &salt);
                let expected = if is_player1 {
                    rps_state.player1_commitment
                } else {
                    rps_state.player2_commitment
                }.ok_or(UniversalGameError::InvalidGameState)?;

                require!(commitment == expected, UniversalGameError::InvalidGameState);

                // Record revealed choice
                if is_player1 {
                    rps_state.player1_revealed = Some(choice);
                } else {
                    rps_state.player2_revealed = Some(choice);
                }

                // Check if both players have revealed
                if let (Some(p1_choice), Some(p2_choice)) = (rps_state.player1_revealed, rps_state.player2_revealed) {
                    return self.resolve_round(rps_state, p1_choice, p2_choice, match_data);
                }
            },
            _ => return Err(UniversalGameError::InvalidGameState.into()),
        }

        let encoded = self.encode_state(rps_state)?;
        match_data.write_game_state(&encoded)?;
        Ok(MoveResult::WaitingForOpponent)
    }

    fn can_make_move(&self, player: &Pubkey, match_data: &UniversalMatch) -> bool {
        if let Ok(state) = self.decode_state(match_data.read_game_state()) {
            if let Some(rps_state) = state.as_any().downcast_ref::<RPSGameStateV2>() {
                let is_player1 = *player == match_data.creator;
                
                match rps_state.phase {
                    GamePhase::Commit => {
                        if is_player1 {
                            rps_state.player1_commitment.is_none()
                        } else {
                            rps_state.player2_commitment.is_none()
                        }
                    },
                    GamePhase::Reveal => {
                        if is_player1 {
                            rps_state.player1_revealed.is_none()
                        } else {
                            rps_state.player2_revealed.is_none()
                        }
                    },
                    _ => false,
                }
            } else { false }
        } else { false }
    }

    fn encode_state(&self, state: &dyn GameState) -> Result<Vec<u8>> {
        Ok(state.as_bytes())
    }

    fn decode_state(&self, data: &[u8]) -> Result<Box<dyn GameState>> {
        let state = RPSGameStateV2::from_bytes(data)?;
        Ok(Box::new(state))
    }

    fn get_current_phase(&self, match_data: &UniversalMatch) -> GamePhase {
        if let Ok(state) = self.decode_state(match_data.read_game_state()) {
            state.phase()
        } else {
            GamePhase::Setup
        }
    }

    fn is_game_over(&self, match_data: &UniversalMatch) -> bool {
        if let Ok(state) = self.decode_state(match_data.read_game_state()) {
            if let Some(rps_state) = state.as_any().downcast_ref::<RPSGameStateV2>() {
                let max_wins = (rps_state.max_rounds / 2) + 1;
                rps_state.player1_wins >= max_wins || 
                rps_state.player2_wins >= max_wins ||
                rps_state.phase == GamePhase::Finished
            } else { false }
        } else { false }
    }

    fn determine_winner(&self, match_data: &UniversalMatch) -> Result<GameResult> {
        let state = self.decode_state(match_data.read_game_state())?;
        let rps_state = state.as_any().downcast_ref::<RPSGameStateV2>()
            .ok_or(UniversalGameError::InvalidGameState)?;

        if rps_state.player1_wins > rps_state.player2_wins {
            Ok(GameResult::Player1Wins)
        } else if rps_state.player2_wins > rps_state.player1_wins {
            Ok(GameResult::Player2Wins)
        } else {
            Ok(GameResult::Draw)
        }
    }

    fn calculate_payouts(&self, match_data: &UniversalMatch) -> Result<Vec<Payout>> {
        let result = self.determine_winner(match_data)?;
        let total_pot = match_data.total_pot;
        
        match result {
            GameResult::Player1Wins => Ok(vec![
                Payout {
                    player: match_data.creator,
                    amount: total_pot,
                    reason: PayoutReason::Winner,
                }
            ]),
            GameResult::Player2Wins => Ok(vec![
                Payout {
                    player: match_data.opponent.unwrap(),
                    amount: total_pot,
                    reason: PayoutReason::Winner,
                }
            ]),
            GameResult::Draw => Ok(vec![
                Payout {
                    player: match_data.creator,
                    amount: match_data.bet_amount,
                    reason: PayoutReason::Tie,
                },
                Payout {
                    player: match_data.opponent.unwrap(),
                    amount: match_data.bet_amount,
                    reason: PayoutReason::Tie,
                }
            ]),
            _ => Ok(vec![]),
        }
    }

    fn supports_commit_reveal(&self) -> bool { true }
    fn supports_multiple_rounds(&self) -> bool { true }

    fn get_move_timeout(&self, _match_data: &UniversalMatch) -> Option<i64> {
        Some(300) // 5 minutes per move
    }

    fn handle_timeout(&self, match_data: &mut UniversalMatch) -> Result<TimeoutResult> {
        let state = self.decode_state(match_data.read_game_state())?;
        let rps_state = state.as_any().downcast_ref::<RPSGameStateV2>()
            .ok_or(UniversalGameError::InvalidGameState)?;

        match rps_state.phase {
            GamePhase::Commit => {
                // Forfeit player who didn't commit
                if rps_state.player1_commitment.is_none() {
                    Ok(TimeoutResult::ForfeitPlayer(match_data.creator))
                } else {
                    Ok(TimeoutResult::ForfeitPlayer(match_data.opponent.unwrap()))
                }
            },
            GamePhase::Reveal => {
                // Forfeit player who didn't reveal
                if rps_state.player1_revealed.is_none() {
                    Ok(TimeoutResult::ForfeitPlayer(match_data.creator))
                } else {
                    Ok(TimeoutResult::ForfeitPlayer(match_data.opponent.unwrap()))
                }
            },
            _ => Ok(TimeoutResult::ContinueGame),
        }
    }

    fn get_minimum_bet(&self) -> u64 { 10_000_000 } // 0.01 SOL
    fn get_maximum_bet(&self) -> u64 { 100_000_000_000 } // 100 SOL

    fn verify_game_integrity(&self, match_data: &UniversalMatch) -> Result<()> {
        let state = self.decode_state(match_data.read_game_state())?;
        require!(state.is_valid(), UniversalGameError::InvalidGameState);
        Ok(())
    }

    fn detect_cheating(&self, _match_data: &UniversalMatch) -> Result<Option<CheatDetection>> {
        // RPS is commitment-based, so cheating is cryptographically prevented
        Ok(None)
    }
}

impl RockPaperScissorsV2 {
    fn create_commitment(&self, choice: RPSChoice, salt: &[u8; 32]) -> [u8; 32] {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update([choice as u8]);
        hasher.update(salt);
        hasher.finalize().into()
    }

    fn resolve_round(
        &self,
        state: &mut RPSGameStateV2,
        p1_choice: RPSChoice,
        p2_choice: RPSChoice,
        match_data: &mut UniversalMatch,
    ) -> Result<MoveResult> {
        // Determine round winner
        if p1_choice.beats(p2_choice) {
            state.player1_wins += 1;
        } else if p2_choice.beats(p1_choice) {
            state.player2_wins += 1;
        }
        // Tie: no wins increment

        // Check if game is over
        let max_wins = (state.max_rounds / 2) + 1;
        if state.player1_wins >= max_wins || state.player2_wins >= max_wins {
            state.phase = GamePhase::Finished;
            let encoded = self.encode_state(state)?;
            match_data.write_game_state(&encoded)?;
            return Ok(MoveResult::GameOver(self.determine_winner(match_data)?));
        }

        // Start next round
        state.round += 1;
        state.player1_commitment = None;
        state.player2_commitment = None;
        state.player1_revealed = None;
        state.player2_revealed = None;
        state.phase = GamePhase::Commit;

        let encoded = self.encode_state(state)?;
        match_data.write_game_state(&encoded)?;
        Ok(MoveResult::PhaseChange(GamePhase::Commit))
    }
}

// ===========================
// STATE ENCODING UTILITIES
// ===========================

/// Efficient state encoding/decoding system
pub struct StateEncoder;

impl StateEncoder {
    /// Compress state data to fit in 128 bytes
    pub fn compress(data: &[u8]) -> Result<Vec<u8>> {
        // Simple compression - in production, use proper compression
        if data.len() <= 128 {
            Ok(data.to_vec())
        } else {
            // Truncate or use compression algorithm
            Ok(data[..128].to_vec())
        }
    }

    /// Decompress state data
    pub fn decompress(data: &[u8]) -> Result<Vec<u8>> {
        // Mirror of compress function
        Ok(data.to_vec())
    }

    /// Validate state data integrity
    pub fn validate(data: &[u8]) -> bool {
        data.len() <= 128
    }
}

// Helper trait for downcasting
trait AsAny {
    fn as_any(&self) -> &dyn std::any::Any;
    fn as_any_mut(&mut self) -> &mut dyn std::any::Any;
}

impl AsAny for RPSGameStateV2 {
    fn as_any(&self) -> &dyn std::any::Any { self }
    fn as_any_mut(&mut self) -> &mut dyn std::any::Any { self }
}

// ===========================
// MIGRATION SYSTEM
// ===========================

/// Migration utilities for upgrading from existing RPS
pub struct MigrationManager;

impl MigrationManager {
    /// Migrate existing RPS match to universal format
    pub fn migrate_rps_match(
        old_match: &crate::lib::Match,
        new_match: &mut UniversalMatch,
    ) -> Result<()> {
        // Copy basic fields
        new_match.match_id = old_match.key();
        new_match.creator = old_match.creator;
        new_match.bet_amount = old_match.bet_amount;
        new_match.total_pot = old_match.bet_amount * 2;
        
        // Set game type
        new_match.game_type = GameType::RockPaperScissors.to_u16();
        
        // Migrate status
        let status = match old_match.status {
            crate::lib::MatchStatus::WaitingForOpponent => MatchStatus::WaitingForOpponent,
            crate::lib::MatchStatus::WaitingForReveal => MatchStatus::InProgress,
            crate::lib::MatchStatus::ReadyToSettle => MatchStatus::InProgress,
            crate::lib::MatchStatus::Settled => MatchStatus::Completed,
            crate::lib::MatchStatus::Cancelled => MatchStatus::Cancelled,
            crate::lib::MatchStatus::TimedOut => MatchStatus::TimedOut,
        };
        new_match.set_status(status);

        // Initialize RPS game state
        let rps = RockPaperScissorsV2::new();
        let config = rps.default_config();
        rps.initialize_game_state(new_match, &config)?;

        Ok(())
    }

    /// Check if migration is needed
    pub fn needs_migration(match_account: &UniversalMatch) -> bool {
        // Check version field or other indicators
        match_account.game_type == 0 && match_account.game_state_len == 0
    }
}

// ===========================
// PLACEHOLDER GAME IMPLEMENTATIONS
// ===========================

// These would be implemented in separate modules

pub struct DiceGame;
impl DiceGame {
    pub fn new() -> Self { Self }
}
impl GameLogic for DiceGame {
    // Placeholder implementation
    fn game_type(&self) -> GameType { GameType::Dice }
    fn version(&self) -> u16 { 1 }
    fn name(&self) -> &'static str { "Dice Game" }
    fn description(&self) -> &'static str { "Roll dice to win" }
    fn min_players(&self) -> u8 { 2 }
    fn max_players(&self) -> u8 { 6 }
    // ... other required methods with placeholder implementations
    fn default_config(&self) -> GameConfig { GameConfig::default() }
    fn validate_config(&self, _config: &GameConfig) -> Result<()> { Ok(()) }
    fn initialize_game_state(&self, _match_data: &mut UniversalMatch, _config: &GameConfig) -> Result<()> { Ok(()) }
    fn validate_move(&self, _player: &Pubkey, _move_data: &[u8], _match_data: &UniversalMatch) -> Result<()> { Ok(()) }
    fn process_move(&self, _player: &Pubkey, _move_data: &[u8], _match_data: &mut UniversalMatch) -> Result<MoveResult> { Ok(MoveResult::Accepted) }
    fn can_make_move(&self, _player: &Pubkey, _match_data: &UniversalMatch) -> bool { true }
    fn encode_state(&self, state: &dyn GameState) -> Result<Vec<u8>> { Ok(state.as_bytes()) }
    fn decode_state(&self, _data: &[u8]) -> Result<Box<dyn GameState>> { unimplemented!() }
    fn get_current_phase(&self, _match_data: &UniversalMatch) -> GamePhase { GamePhase::Playing }
    fn is_game_over(&self, _match_data: &UniversalMatch) -> bool { false }
    fn determine_winner(&self, _match_data: &UniversalMatch) -> Result<GameResult> { Ok(GameResult::Draw) }
    fn calculate_payouts(&self, _match_data: &UniversalMatch) -> Result<Vec<Payout>> { Ok(vec![]) }
    fn get_minimum_bet(&self) -> u64 { 10_000_000 }
    fn get_maximum_bet(&self) -> u64 { 100_000_000_000 }
    fn verify_game_integrity(&self, _match_data: &UniversalMatch) -> Result<()> { Ok(()) }
    fn detect_cheating(&self, _match_data: &UniversalMatch) -> Result<Option<CheatDetection>> { Ok(None) }
    fn handle_timeout(&self, _match_data: &mut UniversalMatch) -> Result<TimeoutResult> { Ok(TimeoutResult::ContinueGame) }
}

pub struct CoinFlipGame;
impl CoinFlipGame { pub fn new() -> Self { Self } }
impl GameLogic for CoinFlipGame {
    fn game_type(&self) -> GameType { GameType::CoinFlip }
    fn version(&self) -> u16 { 1 }
    fn name(&self) -> &'static str { "Coin Flip" }
    fn description(&self) -> &'static str { "Heads or tails" }
    fn min_players(&self) -> u8 { 2 }
    fn max_players(&self) -> u8 { 2 }
    // ... placeholder implementations
    fn default_config(&self) -> GameConfig { GameConfig::default() }
    fn validate_config(&self, _config: &GameConfig) -> Result<()> { Ok(()) }
    fn initialize_game_state(&self, _match_data: &mut UniversalMatch, _config: &GameConfig) -> Result<()> { Ok(()) }
    fn validate_move(&self, _player: &Pubkey, _move_data: &[u8], _match_data: &UniversalMatch) -> Result<()> { Ok(()) }
    fn process_move(&self, _player: &Pubkey, _move_data: &[u8], _match_data: &mut UniversalMatch) -> Result<MoveResult> { Ok(MoveResult::Accepted) }
    fn can_make_move(&self, _player: &Pubkey, _match_data: &UniversalMatch) -> bool { true }
    fn encode_state(&self, state: &dyn GameState) -> Result<Vec<u8>> { Ok(state.as_bytes()) }
    fn decode_state(&self, _data: &[u8]) -> Result<Box<dyn GameState>> { unimplemented!() }
    fn get_current_phase(&self, _match_data: &UniversalMatch) -> GamePhase { GamePhase::Playing }
    fn is_game_over(&self, _match_data: &UniversalMatch) -> bool { false }
    fn determine_winner(&self, _match_data: &UniversalMatch) -> Result<GameResult> { Ok(GameResult::Draw) }
    fn calculate_payouts(&self, _match_data: &UniversalMatch) -> Result<Vec<Payout>> { Ok(vec![]) }
    fn get_minimum_bet(&self) -> u64 { 10_000_000 }
    fn get_maximum_bet(&self) -> u64 { 100_000_000_000 }
    fn verify_game_integrity(&self, _match_data: &UniversalMatch) -> Result<()> { Ok(()) }
    fn detect_cheating(&self, _match_data: &UniversalMatch) -> Result<Option<CheatDetection>> { Ok(None) }
    fn handle_timeout(&self, _match_data: &mut UniversalMatch) -> Result<TimeoutResult> { Ok(TimeoutResult::ContinueGame) }
}

pub struct TicTacToeGame;
impl TicTacToeGame { pub fn new() -> Self { Self } }
impl GameLogic for TicTacToeGame {
    fn game_type(&self) -> GameType { GameType::TicTacToe }
    fn version(&self) -> u16 { 1 }
    fn name(&self) -> &'static str { "Tic Tac Toe" }
    fn description(&self) -> &'static str { "Classic board game" }
    fn min_players(&self) -> u8 { 2 }
    fn max_players(&self) -> u8 { 2 }
    // ... placeholder implementations
    fn default_config(&self) -> GameConfig { GameConfig::default() }
    fn validate_config(&self, _config: &GameConfig) -> Result<()> { Ok(()) }
    fn initialize_game_state(&self, _match_data: &mut UniversalMatch, _config: &GameConfig) -> Result<()> { Ok(()) }
    fn validate_move(&self, _player: &Pubkey, _move_data: &[u8], _match_data: &UniversalMatch) -> Result<()> { Ok(()) }
    fn process_move(&self, _player: &Pubkey, _move_data: &[u8], _match_data: &mut UniversalMatch) -> Result<MoveResult> { Ok(MoveResult::Accepted) }
    fn can_make_move(&self, _player: &Pubkey, _match_data: &UniversalMatch) -> bool { true }
    fn encode_state(&self, state: &dyn GameState) -> Result<Vec<u8>> { Ok(state.as_bytes()) }
    fn decode_state(&self, _data: &[u8]) -> Result<Box<dyn GameState>> { unimplemented!() }
    fn get_current_phase(&self, _match_data: &UniversalMatch) -> GamePhase { GamePhase::Playing }
    fn is_game_over(&self, _match_data: &UniversalMatch) -> bool { false }
    fn determine_winner(&self, _match_data: &UniversalMatch) -> Result<GameResult> { Ok(GameResult::Draw) }
    fn calculate_payouts(&self, _match_data: &UniversalMatch) -> Result<Vec<Payout>> { Ok(vec![]) }
    fn get_minimum_bet(&self) -> u64 { 10_000_000 }
    fn get_maximum_bet(&self) -> u64 { 100_000_000_000 }
    fn verify_game_integrity(&self, _match_data: &UniversalMatch) -> Result<()> { Ok(()) }
    fn detect_cheating(&self, _match_data: &UniversalMatch) -> Result<Option<CheatDetection>> { Ok(None) }
    fn handle_timeout(&self, _match_data: &mut UniversalMatch) -> Result<TimeoutResult> { Ok(TimeoutResult::ContinueGame) }
}

pub struct PokerGame;
impl PokerGame { pub fn new() -> Self { Self } }
impl GameLogic for PokerGame {
    fn game_type(&self) -> GameType { GameType::Custom(1000) }
    fn version(&self) -> u16 { 1 }
    fn name(&self) -> &'static str { "Texas Hold'em Poker" }
    fn description(&self) -> &'static str { "Classic poker variant" }
    fn min_players(&self) -> u8 { 2 }
    fn max_players(&self) -> u8 { 9 }
    // ... placeholder implementations
    fn default_config(&self) -> GameConfig { GameConfig::default() }
    fn validate_config(&self, _config: &GameConfig) -> Result<()> { Ok(()) }
    fn initialize_game_state(&self, _match_data: &mut UniversalMatch, _config: &GameConfig) -> Result<()> { Ok(()) }
    fn validate_move(&self, _player: &Pubkey, _move_data: &[u8], _match_data: &UniversalMatch) -> Result<()> { Ok(()) }
    fn process_move(&self, _player: &Pubkey, _move_data: &[u8], _match_data: &mut UniversalMatch) -> Result<MoveResult> { Ok(MoveResult::Accepted) }
    fn can_make_move(&self, _player: &Pubkey, _match_data: &UniversalMatch) -> bool { true }
    fn encode_state(&self, state: &dyn GameState) -> Result<Vec<u8>> { Ok(state.as_bytes()) }
    fn decode_state(&self, _data: &[u8]) -> Result<Box<dyn GameState>> { unimplemented!() }
    fn get_current_phase(&self, _match_data: &UniversalMatch) -> GamePhase { GamePhase::Playing }
    fn is_game_over(&self, _match_data: &UniversalMatch) -> bool { false }
    fn determine_winner(&self, _match_data: &UniversalMatch) -> Result<GameResult> { Ok(GameResult::Draw) }
    fn calculate_payouts(&self, _match_data: &UniversalMatch) -> Result<Vec<Payout>> { Ok(vec![]) }
    fn get_minimum_bet(&self) -> u64 { 10_000_000 }
    fn get_maximum_bet(&self) -> u64 { 100_000_000_000 }
    fn verify_game_integrity(&self, _match_data: &UniversalMatch) -> Result<()> { Ok(()) }
    fn detect_cheating(&self, _match_data: &UniversalMatch) -> Result<Option<CheatDetection>> { Ok(None) }
    fn handle_timeout(&self, _match_data: &mut UniversalMatch) -> Result<TimeoutResult> { Ok(TimeoutResult::ContinueGame) }
}

pub struct BlackjackGame;
impl BlackjackGame { pub fn new() -> Self { Self } }
impl GameLogic for BlackjackGame {
    fn game_type(&self) -> GameType { GameType::Custom(1001) }
    fn version(&self) -> u16 { 1 }
    fn name(&self) -> &'static str { "Blackjack" }
    fn description(&self) -> &'static str { "Classic card game" }
    fn min_players(&self) -> u8 { 1 }
    fn max_players(&self) -> u8 { 7 }
    // ... placeholder implementations
    fn default_config(&self) -> GameConfig { GameConfig::default() }
    fn validate_config(&self, _config: &GameConfig) -> Result<()> { Ok(()) }
    fn initialize_game_state(&self, _match_data: &mut UniversalMatch, _config: &GameConfig) -> Result<()> { Ok(()) }
    fn validate_move(&self, _player: &Pubkey, _move_data: &[u8], _match_data: &UniversalMatch) -> Result<()> { Ok(()) }
    fn process_move(&self, _player: &Pubkey, _move_data: &[u8], _match_data: &mut UniversalMatch) -> Result<MoveResult> { Ok(MoveResult::Accepted) }
    fn can_make_move(&self, _player: &Pubkey, _match_data: &UniversalMatch) -> bool { true }
    fn encode_state(&self, state: &dyn GameState) -> Result<Vec<u8>> { Ok(state.as_bytes()) }
    fn decode_state(&self, _data: &[u8]) -> Result<Box<dyn GameState>> { unimplemented!() }
    fn get_current_phase(&self, _match_data: &UniversalMatch) -> GamePhase { GamePhase::Playing }
    fn is_game_over(&self, _match_data: &UniversalMatch) -> bool { false }
    fn determine_winner(&self, _match_data: &UniversalMatch) -> Result<GameResult> { Ok(GameResult::Draw) }
    fn calculate_payouts(&self, _match_data: &UniversalMatch) -> Result<Vec<Payout>> { Ok(vec![]) }
    fn get_minimum_bet(&self) -> u64 { 10_000_000 }
    fn get_maximum_bet(&self) -> u64 { 100_000_000_000 }
    fn verify_game_integrity(&self, _match_data: &UniversalMatch) -> Result<()> { Ok(()) }
    fn detect_cheating(&self, _match_data: &UniversalMatch) -> Result<Option<CheatDetection>> { Ok(None) }
    fn handle_timeout(&self, _match_data: &mut UniversalMatch) -> Result<TimeoutResult> { Ok(TimeoutResult::ContinueGame) }
}