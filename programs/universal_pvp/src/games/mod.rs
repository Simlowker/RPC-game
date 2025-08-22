pub mod rock_paper_scissors;
pub mod dice;
pub mod round_manager;

// Futurs modules de jeux
// pub mod coin_flip;
// pub mod high_card;

use anchor_lang::prelude::*;
use crate::universal_engine::{GameType, GameResult, UniversalMatch};

/// Trait que tous les jeux doivent implémenter
pub trait GameLogic {
    /// Valide un mouvement pour ce jeu
    fn validate_move(&self, move_data: &[u8]) -> Result<()>;
    
    /// Détermine le gagnant basé sur les mouvements
    fn determine_winner(&self, match_data: &UniversalMatch) -> Result<GameResult>;
    
    /// Encode un mouvement en bytes
    fn encode_move(&self, move_data: &[u8]) -> Vec<u8>;
    
    /// Décode un mouvement depuis les bytes
    fn decode_move(&self, encoded: &[u8]) -> Result<Vec<u8>>;
    
    /// Retourne la configuration par défaut du jeu
    fn default_config(&self) -> crate::universal_engine::GameConfig;
}