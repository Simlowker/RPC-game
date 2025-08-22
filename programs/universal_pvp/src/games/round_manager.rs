use anchor_lang::prelude::*;
use crate::universal_engine::{GameResult, UniversalMatch, MatchStatus};

// ===========================
// SYSTÈME DE GESTION DES ROUNDS
// ===========================

/// Structure pour gérer les manches multiples et les égalités
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct RoundManager {
    /// Nombre total de rounds configurés (ex: Best of 3, 5, 7...)
    pub total_rounds: u8,
    /// Nombre de rounds joués jusqu'à présent
    pub rounds_played: u8,
    /// Score du joueur 1
    pub player1_score: u8,
    /// Score du joueur 2
    pub player2_score: u8,
    /// Historique des résultats de chaque round
    pub round_history: Vec<RoundResult>,
    /// Rounds nécessaires pour gagner (total_rounds / 2 + 1)
    pub rounds_to_win: u8,
    /// Nombre d'égalités consécutives (pour éviter les boucles infinies)
    pub consecutive_draws: u8,
    /// Maximum d'égalités avant forcer un tirage au sort
    pub max_consecutive_draws: u8,
}

/// Résultat d'un round individuel
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct RoundResult {
    pub round_number: u8,
    pub result: GameResult,
    pub timestamp: i64,
    /// Données spécifiques au jeu pour ce round (ex: choix RPS)
    pub round_data: Vec<u8>,
}

impl RoundManager {
    /// Créer un nouveau gestionnaire de rounds
    pub fn new(total_rounds: u8, max_consecutive_draws: u8) -> Self {
        let rounds_to_win = (total_rounds / 2) + 1;
        
        RoundManager {
            total_rounds,
            rounds_played: 0,
            player1_score: 0,
            player2_score: 0,
            round_history: Vec::new(),
            rounds_to_win,
            consecutive_draws: 0,
            max_consecutive_draws,
        }
    }
    
    /// Traiter le résultat d'un round
    pub fn process_round_result(
        &mut self, 
        result: GameResult,
        timestamp: i64,
        round_data: Vec<u8>,
    ) -> RoundOutcome {
        // Enregistrer le round dans l'historique
        self.round_history.push(RoundResult {
            round_number: self.rounds_played + 1,
            result: result.clone(),
            timestamp,
            round_data,
        });
        
        self.rounds_played += 1;
        
        // Gérer le résultat
        match result {
            GameResult::Player1Wins => {
                self.player1_score += 1;
                self.consecutive_draws = 0;
                
                // Vérifier si le joueur 1 a gagné le match
                if self.player1_score >= self.rounds_to_win {
                    return RoundOutcome::MatchWon(GameResult::Player1Wins);
                }
            },
            GameResult::Player2Wins => {
                self.player2_score += 1;
                self.consecutive_draws = 0;
                
                // Vérifier si le joueur 2 a gagné le match
                if self.player2_score >= self.rounds_to_win {
                    return RoundOutcome::MatchWon(GameResult::Player2Wins);
                }
            },
            GameResult::Draw => {
                self.consecutive_draws += 1;
                
                // Si trop d'égalités consécutives, forcer une résolution
                if self.consecutive_draws >= self.max_consecutive_draws {
                    return RoundOutcome::ForcedResolution;
                }
                
                // En cas d'égalité, ne pas compter comme un round joué
                self.rounds_played -= 1;
                return RoundOutcome::DrawRequiresReplay;
            },
            GameResult::Cancelled => {
                // En cas d'annulation, retourner une résolution forcée
                return RoundOutcome::ForcedResolution;
            },
        }
        
        // Si on a atteint le nombre maximum de rounds sans vainqueur clair
        if self.rounds_played >= self.total_rounds {
            // Déterminer le gagnant par le score
            if self.player1_score > self.player2_score {
                return RoundOutcome::MatchWon(GameResult::Player1Wins);
            } else if self.player2_score > self.player1_score {
                return RoundOutcome::MatchWon(GameResult::Player2Wins);
            } else {
                // Égalité parfaite après tous les rounds
                return RoundOutcome::ForcedResolution;
            }
        }
        
        // Le match continue
        RoundOutcome::ContinueMatch
    }
    
    /// Obtenir le statut actuel du match
    pub fn get_match_status(&self) -> MatchProgress {
        MatchProgress {
            rounds_played: self.rounds_played,
            total_rounds: self.total_rounds,
            player1_score: self.player1_score,
            player2_score: self.player2_score,
            rounds_remaining: self.get_minimum_rounds_remaining(),
            is_match_point: self.is_match_point(),
            leader: self.get_current_leader(),
        }
    }
    
    /// Calculer le nombre minimum de rounds restants
    fn get_minimum_rounds_remaining(&self) -> u8 {
        let p1_rounds_needed = self.rounds_to_win.saturating_sub(self.player1_score);
        let p2_rounds_needed = self.rounds_to_win.saturating_sub(self.player2_score);
        p1_rounds_needed.min(p2_rounds_needed)
    }
    
    /// Vérifier si c'est une balle de match pour un joueur
    fn is_match_point(&self) -> bool {
        (self.player1_score == self.rounds_to_win - 1) || 
        (self.player2_score == self.rounds_to_win - 1)
    }
    
    /// Obtenir le leader actuel
    fn get_current_leader(&self) -> Option<u8> {
        if self.player1_score > self.player2_score {
            Some(1)
        } else if self.player2_score > self.player1_score {
            Some(2)
        } else {
            None
        }
    }
    
    /// Forcer une résolution en cas de trop d'égalités
    pub fn forced_resolution(&self) -> GameResult {
        // Utiliser plusieurs critères pour déterminer le gagnant
        
        // 1. D'abord vérifier le score
        if self.player1_score > self.player2_score {
            return GameResult::Player1Wins;
        } else if self.player2_score > self.player1_score {
            return GameResult::Player2Wins;
        }
        
        // 2. Si égalité parfaite, utiliser un tirage pseudo-aléatoire
        // basé sur les timestamps des rounds pour la fairness
        let hash_sum: i64 = self.round_history
            .iter()
            .map(|r| r.timestamp)
            .sum();
        
        if hash_sum % 2 == 0 {
            GameResult::Player1Wins
        } else {
            GameResult::Player2Wins
        }
    }
    
    /// Sérialiser l'état du gestionnaire de rounds
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::new();
        bytes.push(self.total_rounds);
        bytes.push(self.rounds_played);
        bytes.push(self.player1_score);
        bytes.push(self.player2_score);
        bytes.push(self.rounds_to_win);
        bytes.push(self.consecutive_draws);
        bytes.push(self.max_consecutive_draws);
        
        // Ajouter l'historique
        bytes.push(self.round_history.len() as u8);
        for round in &self.round_history {
            bytes.push(round.round_number);
            bytes.push(round.result.to_u8());
            bytes.extend_from_slice(&round.timestamp.to_le_bytes());
            bytes.push(round.round_data.len() as u8);
            bytes.extend_from_slice(&round.round_data);
        }
        
        bytes
    }
    
    /// Désérialiser depuis des bytes
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        require!(bytes.len() >= 8, RoundManagerError::InvalidData);
        
        let mut index = 0;
        let total_rounds = bytes[index];
        index += 1;
        let rounds_played = bytes[index];
        index += 1;
        let player1_score = bytes[index];
        index += 1;
        let player2_score = bytes[index];
        index += 1;
        let rounds_to_win = bytes[index];
        index += 1;
        let consecutive_draws = bytes[index];
        index += 1;
        let max_consecutive_draws = bytes[index];
        index += 1;
        
        let history_len = bytes[index] as usize;
        index += 1;
        
        let mut round_history = Vec::new();
        for _ in 0..history_len {
            let round_number = bytes[index];
            index += 1;
            let result = GameResult::from_u8(bytes[index])?;
            index += 1;
            
            let timestamp = i64::from_le_bytes(
                bytes[index..index+8].try_into().unwrap()
            );
            index += 8;
            
            let data_len = bytes[index] as usize;
            index += 1;
            
            let round_data = bytes[index..index+data_len].to_vec();
            index += data_len;
            
            round_history.push(RoundResult {
                round_number,
                result,
                timestamp,
                round_data,
            });
        }
        
        Ok(RoundManager {
            total_rounds,
            rounds_played,
            player1_score,
            player2_score,
            round_history,
            rounds_to_win,
            consecutive_draws,
            max_consecutive_draws,
        })
    }
}

// ===========================
// TYPES DE RÉSULTATS
// ===========================

/// Résultat après traitement d'un round
#[derive(Debug, Clone, PartialEq)]
pub enum RoundOutcome {
    /// Le match continue, prochain round
    ContinueMatch,
    /// Un joueur a gagné le match complet
    MatchWon(GameResult),
    /// Égalité, rejouer immédiatement
    DrawRequiresReplay,
    /// Trop d'égalités, forcer une résolution
    ForcedResolution,
}

/// État de progression du match
#[derive(Debug, Clone)]
pub struct MatchProgress {
    pub rounds_played: u8,
    pub total_rounds: u8,
    pub player1_score: u8,
    pub player2_score: u8,
    pub rounds_remaining: u8,
    pub is_match_point: bool,
    pub leader: Option<u8>, // 1 pour player1, 2 pour player2, None pour égalité
}

// ===========================
// TRAIT D'EXTENSION POUR GameResult
// ===========================

impl GameResult {
    pub fn to_u8(&self) -> u8 {
        match self {
            GameResult::Player1Wins => 1,
            GameResult::Player2Wins => 2,
            GameResult::Draw => 0,
            GameResult::Cancelled => 3,
        }
    }
    
    pub fn from_u8(value: u8) -> Result<Self> {
        match value {
            0 => Ok(GameResult::Draw),
            1 => Ok(GameResult::Player1Wins),
            2 => Ok(GameResult::Player2Wins),
            _ => Err(error!(RoundManagerError::InvalidGameResult)),
        }
    }
}

// ===========================
// ERREURS
// ===========================

#[error_code]
pub enum RoundManagerError {
    #[msg("Invalid round manager data")]
    InvalidData,
    
    #[msg("Invalid game result value")]
    InvalidGameResult,
    
    #[msg("Round limit exceeded")]
    RoundLimitExceeded,
    
    #[msg("Match already completed")]
    MatchAlreadyCompleted,
}