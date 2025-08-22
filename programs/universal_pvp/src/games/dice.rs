use anchor_lang::prelude::*;
use crate::universal_engine::{GameType, GameResult, GameConfig, UniversalMatch};
use super::GameLogic;

// ===========================
// DICE GAME MODULE
// ===========================

/// Structure pour le jeu de dés
pub struct DiceGame;

/// Résultat d'un lancer de dés
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct DiceRoll {
    pub player: Pubkey,
    pub dice1: u8,
    pub dice2: u8,
    pub total: u8,
}

impl DiceRoll {
    pub fn new(player: Pubkey, dice1: u8, dice2: u8) -> Self {
        DiceRoll {
            player,
            dice1,
            dice2,
            total: dice1 + dice2,
        }
    }
    
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        require!(bytes.len() >= 34, DiceGameError::InvalidData);
        
        let mut player_bytes = [0u8; 32];
        player_bytes.copy_from_slice(&bytes[0..32]);
        let player = Pubkey::new_from_array(player_bytes);
        
        let dice1 = bytes[32];
        let dice2 = bytes[33];
        
        Ok(DiceRoll::new(player, dice1, dice2))
    }
    
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::new();
        bytes.extend_from_slice(&self.player.to_bytes());
        bytes.push(self.dice1);
        bytes.push(self.dice2);
        bytes
    }
}

impl GameLogic for DiceGame {
    fn validate_move(&self, move_data: &[u8]) -> Result<()> {
        require!(move_data.len() >= 2, DiceGameError::InvalidMoveData);
        
        let dice1 = move_data[0];
        let dice2 = move_data[1];
        
        // Valider que les dés sont entre 1 et 6
        require!(dice1 >= 1 && dice1 <= 6, DiceGameError::InvalidDiceValue);
        require!(dice2 >= 1 && dice2 <= 6, DiceGameError::InvalidDiceValue);
        
        Ok(())
    }
    
    fn determine_winner(&self, match_data: &UniversalMatch) -> Result<GameResult> {
        let game_state = &match_data.game_state;
        
        // Format attendu : [dice1_p1, dice2_p1, dice1_p2, dice2_p2]
        require!(game_state.len() >= 4, DiceGameError::IncompleteGameState);
        
        // Récupérer les lancers des deux joueurs
        let player1_roll = DiceRoll::new(
            match_data.creator,
            game_state[0],
            game_state[1]
        );
        
        let player2_pubkey = match_data.opponent.ok_or(DiceGameError::NoOpponent)?;
        let player2_roll = DiceRoll::new(
            player2_pubkey,
            game_state[2],
            game_state[3]
        );
        
        // Comparer les totaux
        if player1_roll.total > player2_roll.total {
            Ok(GameResult::Player1Wins)
        } else if player2_roll.total > player1_roll.total {
            Ok(GameResult::Player2Wins)
        } else {
            // En cas d'égalité, regarder le plus haut dé unique
            let p1_max = player1_roll.dice1.max(player1_roll.dice2);
            let p2_max = player2_roll.dice1.max(player2_roll.dice2);
            
            if p1_max > p2_max {
                Ok(GameResult::Player1Wins)
            } else if p2_max > p1_max {
                Ok(GameResult::Player2Wins)
            } else {
                Ok(GameResult::Draw)
            }
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
            min_bet: 5_000_000,       // 0.005 SOL
            max_bet: 1_000_000_000_000, // 1000 SOL
            rounds: 1,
            custom_params: [0; 16],
        }
    }
}

// ===========================
// DICE GAME STATE
// ===========================

/// État du jeu de dés avec support pour plusieurs rounds
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct DiceGameState {
    pub player1_rolls: Vec<DiceRoll>,
    pub player2_rolls: Vec<DiceRoll>,
    pub current_round: u8,
    pub max_rounds: u8,
    pub seed: [u8; 32], // Seed pour la génération aléatoire
}

impl DiceGameState {
    pub fn new(max_rounds: u8, seed: [u8; 32]) -> Self {
        DiceGameState {
            player1_rolls: Vec::new(),
            player2_rolls: Vec::new(),
            current_round: 0,
            max_rounds,
            seed,
        }
    }
    
    pub fn add_roll(&mut self, player: Pubkey, dice1: u8, dice2: u8) -> Result<()> {
        let roll = DiceRoll::new(player, dice1, dice2);
        
        if self.player1_rolls.len() < self.max_rounds as usize {
            self.player1_rolls.push(roll);
        } else if self.player2_rolls.len() < self.max_rounds as usize {
            self.player2_rolls.push(roll);
        } else {
            return Err(DiceGameError::MaxRoundsReached.into());
        }
        
        if self.player1_rolls.len() == self.player2_rolls.len() {
            self.current_round += 1;
        }
        
        Ok(())
    }
    
    pub fn get_winner(&self) -> Result<GameResult> {
        require!(
            self.current_round == self.max_rounds,
            DiceGameError::GameNotComplete
        );
        
        let mut player1_wins = 0;
        let mut player2_wins = 0;
        
        for i in 0..self.max_rounds as usize {
            let p1_roll = &self.player1_rolls[i];
            let p2_roll = &self.player2_rolls[i];
            
            if p1_roll.total > p2_roll.total {
                player1_wins += 1;
            } else if p2_roll.total > p1_roll.total {
                player2_wins += 1;
            }
        }
        
        if player1_wins > player2_wins {
            Ok(GameResult::Player1Wins)
        } else if player2_wins > player1_wins {
            Ok(GameResult::Player2Wins)
        } else {
            Ok(GameResult::Draw)
        }
    }
}

// ===========================
// RANDOM NUMBER GENERATION
// ===========================

use sha2::{Digest, Sha256};

/// Génère des nombres aléatoires pour les dés en utilisant la blockchain
pub fn generate_dice_rolls(
    slot: u64,
    match_id: &Pubkey,
    player: &Pubkey,
    round: u8,
) -> (u8, u8) {
    let mut hasher = Sha256::new();
    hasher.update(slot.to_le_bytes());
    hasher.update(match_id.as_ref());
    hasher.update(player.as_ref());
    hasher.update([round]);
    
    let hash = hasher.finalize();
    
    // Utiliser les deux premiers bytes du hash pour les dés
    let dice1 = (hash[0] % 6) + 1;
    let dice2 = (hash[1] % 6) + 1;
    
    (dice1, dice2)
}

// ===========================
// DICE GAME ERRORS
// ===========================

#[error_code]
pub enum DiceGameError {
    #[msg("Invalid dice value (must be 1-6)")]
    InvalidDiceValue,
    
    #[msg("Invalid move data")]
    InvalidMoveData,
    
    #[msg("Incomplete game state")]
    IncompleteGameState,
    
    #[msg("Invalid data format")]
    InvalidData,
    
    #[msg("No opponent found")]
    NoOpponent,
    
    #[msg("Maximum rounds reached")]
    MaxRoundsReached,
    
    #[msg("Game not complete")]
    GameNotComplete,
    
    #[msg("Invalid seed")]
    InvalidSeed,
}