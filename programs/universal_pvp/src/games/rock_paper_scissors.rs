use anchor_lang::prelude::*;
use crate::universal_engine::{GameType, GameResult, GameConfig, UniversalMatch};
use super::GameLogic;

// ===========================
// ROCK PAPER SCISSORS MODULE
// ===========================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug)]
pub enum RPSChoice {
    Rock = 0,
    Paper = 1,
    Scissors = 2,
}

impl RPSChoice {
    pub fn from_u8(value: u8) -> Result<Self> {
        match value {
            0 => Ok(RPSChoice::Rock),
            1 => Ok(RPSChoice::Paper),
            2 => Ok(RPSChoice::Scissors),
            _ => Err(error!(RPSGameError::InvalidChoice)),
        }
    }
    
    pub fn beats(&self, other: &RPSChoice) -> bool {
        matches!(
            (self, other),
            (RPSChoice::Rock, RPSChoice::Scissors) |
            (RPSChoice::Paper, RPSChoice::Rock) |
            (RPSChoice::Scissors, RPSChoice::Paper)
        )
    }
}

pub struct RockPaperScissors;

impl GameLogic for RockPaperScissors {
    fn validate_move(&self, move_data: &[u8]) -> Result<()> {
        require!(move_data.len() >= 1, RPSGameError::InvalidMoveData);
        let choice_value = move_data[0];
        require!(choice_value <= 2, RPSGameError::InvalidChoice);
        Ok(())
    }
    
    fn determine_winner(&self, match_data: &UniversalMatch) -> Result<GameResult> {
        // Extraire les choix depuis game_state
        let game_state = &match_data.game_state;
        require!(game_state.len() >= 2, RPSGameError::IncompleteGameState);
        
        let player1_choice = RPSChoice::from_u8(game_state[0])?;
        let player2_choice = RPSChoice::from_u8(game_state[1])?;
        
        if player1_choice == player2_choice {
            Ok(GameResult::Draw)
        } else if player1_choice.beats(&player2_choice) {
            Ok(GameResult::Player1Wins)
        } else {
            Ok(GameResult::Player2Wins)
        }
    }
    
    fn encode_move(&self, move_data: &[u8]) -> Vec<u8> {
        move_data.to_vec()
    }
    
    fn decode_move(&self, encoded: &[u8]) -> Result<Vec<u8>> {
        Ok(encoded.to_vec())
    }
    
    fn default_config(&self) -> GameConfig {
        GameConfig {
            max_players: 2,
            min_bet: 10_000_000,      // 0.01 SOL
            max_bet: 100_000_000_000, // 100 SOL
            rounds: 1,
            custom_params: [0; 16],
        }
    }
}

// ===========================
// RPS SPECIFIC STRUCTURES
// ===========================

/// État spécifique pour RPS avec système de commit-reveal
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct RPSGameState {
    pub player1_commitment: [u8; 32],
    pub player2_commitment: [u8; 32],
    pub player1_revealed: Option<RPSChoice>,
    pub player2_revealed: Option<RPSChoice>,
    pub reveal_deadline: i64,
}

impl RPSGameState {
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::new();
        bytes.extend_from_slice(&self.player1_commitment);
        bytes.extend_from_slice(&self.player2_commitment);
        
        // Encode revealed choices
        match self.player1_revealed {
            Some(choice) => {
                bytes.push(1); // Has value
                bytes.push(choice as u8);
            },
            None => {
                bytes.push(0); // No value
                bytes.push(0);
            }
        }
        
        match self.player2_revealed {
            Some(choice) => {
                bytes.push(1); // Has value
                bytes.push(choice as u8);
            },
            None => {
                bytes.push(0); // No value
                bytes.push(0);
            }
        }
        
        bytes.extend_from_slice(&self.reveal_deadline.to_le_bytes());
        bytes
    }
    
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        require!(bytes.len() >= 76, RPSGameError::InvalidStateData);
        
        let mut player1_commitment = [0u8; 32];
        player1_commitment.copy_from_slice(&bytes[0..32]);
        
        let mut player2_commitment = [0u8; 32];
        player2_commitment.copy_from_slice(&bytes[32..64]);
        
        let player1_revealed = if bytes[64] == 1 {
            Some(RPSChoice::from_u8(bytes[65])?)
        } else {
            None
        };
        
        let player2_revealed = if bytes[66] == 1 {
            Some(RPSChoice::from_u8(bytes[67])?)
        } else {
            None
        };
        
        let reveal_deadline = i64::from_le_bytes(
            bytes[68..76].try_into().unwrap()
        );
        
        Ok(RPSGameState {
            player1_commitment,
            player2_commitment,
            player1_revealed,
            player2_revealed,
            reveal_deadline,
        })
    }
}

// ===========================
// RPS HELPER FUNCTIONS
// ===========================

use sha2::{Digest, Sha256};

pub fn create_commitment(choice: RPSChoice, salt: &[u8; 32]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update([choice as u8]);
    hasher.update(salt);
    hasher.finalize().into()
}

pub fn verify_commitment(
    commitment: &[u8; 32],
    choice: RPSChoice,
    salt: &[u8; 32]
) -> bool {
    let computed = create_commitment(choice, salt);
    computed == *commitment
}

// ===========================
// RPS ERRORS
// ===========================

#[error_code]
pub enum RPSGameError {
    #[msg("Invalid choice for Rock Paper Scissors")]
    InvalidChoice,
    
    #[msg("Invalid move data")]
    InvalidMoveData,
    
    #[msg("Incomplete game state")]
    IncompleteGameState,
    
    #[msg("Invalid state data")]
    InvalidStateData,
    
    #[msg("Commitment verification failed")]
    CommitmentVerificationFailed,
    
    #[msg("Reveal deadline passed")]
    RevealDeadlinePassed,
    
    #[msg("Already revealed")]
    AlreadyRevealed,
    
    #[msg("Not ready to reveal")]
    NotReadyToReveal,
}