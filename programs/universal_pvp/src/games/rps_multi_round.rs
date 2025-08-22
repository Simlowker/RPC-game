use anchor_lang::prelude::*;
use crate::universal_engine::{GameType, GameResult, GameConfig, UniversalMatch};
use super::GameLogic;
use super::round_manager::{RoundManager, RoundOutcome, MatchProgress};
use super::rock_paper_scissors::{RPSChoice, RPSGameError};

// ===========================
// RPS MULTI-ROUND VERSION
// ===========================

/// Structure pour un jeu RPS en plusieurs manches
pub struct RPSMultiRound {
    pub best_of: u8,  // Best of 3, 5, 7, etc.
    pub max_draws: u8, // Nombre maximum d'égalités consécutives
}

impl RPSMultiRound {
    pub fn new(best_of: u8) -> Self {
        RPSMultiRound {
            best_of,
            max_draws: 3, // Par défaut, 3 égalités max avant tirage forcé
        }
    }
    
    /// Traiter un round de RPS avec gestion automatique des égalités
    pub fn process_round(
        &self,
        match_data: &mut UniversalMatch,
        player1_choice: RPSChoice,
        player2_choice: RPSChoice,
    ) -> Result<RoundOutcome> {
        // Désérialiser le gestionnaire de rounds depuis round_state
        let mut round_manager = if match_data.round_state.is_empty() {
            // Premier round, initialiser le gestionnaire
            RoundManager::new(self.best_of, self.max_draws)
        } else {
            RoundManager::from_bytes(&match_data.round_state)?
        };
        
        // Déterminer le résultat du round actuel
        let round_result = if player1_choice == player2_choice {
            GameResult::Draw
        } else if player1_choice.beats(&player2_choice) {
            GameResult::Player1Wins
        } else {
            GameResult::Player2Wins
        };
        
        // Créer les données du round pour l'historique
        let round_data = vec![player1_choice as u8, player2_choice as u8];
        
        // Traiter le résultat avec le gestionnaire de rounds
        let clock = Clock::get()?;
        let outcome = round_manager.process_round_result(
            round_result,
            clock.unix_timestamp,
            round_data,
        );
        
        // Sauvegarder l'état mis à jour
        match_data.round_state = round_manager.to_bytes();
        
        // Gérer le résultat
        match &outcome {
            RoundOutcome::MatchWon(final_result) => {
                // Déterminer le gagnant final
                match final_result {
                    GameResult::Player1Wins => {
                        match_data.winner = Some(match_data.creator);
                    },
                    GameResult::Player2Wins => {
                        match_data.winner = match_data.opponent;
                    },
                    _ => {}
                }
                match_data.status = crate::universal_engine::MatchStatus::Completed;
            },
            RoundOutcome::DrawRequiresReplay => {
                // Égalité, préparer pour le rejeu immédiat
                msg!("Draw detected! Immediate replay required. Draw streak: {}", 
                     round_manager.consecutive_draws);
            },
            RoundOutcome::ForcedResolution => {
                // Trop d'égalités, forcer une résolution
                let forced_result = round_manager.forced_resolution();
                match forced_result {
                    GameResult::Player1Wins => {
                        match_data.winner = Some(match_data.creator);
                    },
                    GameResult::Player2Wins => {
                        match_data.winner = match_data.opponent;
                    },
                    _ => {}
                }
                match_data.status = crate::universal_engine::MatchStatus::Completed;
                msg!("Too many draws! Forced resolution applied.");
            },
            RoundOutcome::ContinueMatch => {
                // Le match continue, prochain round
                let progress = round_manager.get_match_status();
                msg!("Round complete! Score: P1({}) - P2({}). Rounds remaining: {}", 
                     progress.player1_score, 
                     progress.player2_score,
                     progress.rounds_remaining);
            }
        }
        
        Ok(outcome)
    }
    
    /// Obtenir le statut actuel du match multi-rounds
    pub fn get_match_progress(match_data: &UniversalMatch) -> Result<MatchProgress> {
        if match_data.round_state.is_empty() {
            // Pas encore commencé
            return Err(error!(RPSGameError::IncompleteGameState));
        }
        
        let round_manager = RoundManager::from_bytes(&match_data.round_state)?;
        Ok(round_manager.get_match_status())
    }
}

impl GameLogic for RPSMultiRound {
    fn validate_move(&self, move_data: &[u8]) -> Result<()> {
        require!(move_data.len() >= 1, RPSGameError::InvalidMoveData);
        let choice_value = move_data[0];
        require!(choice_value <= 2, RPSGameError::InvalidChoice);
        Ok(())
    }
    
    fn determine_winner(&self, match_data: &UniversalMatch) -> Result<GameResult> {
        // Pour la version multi-round, on utilise le gestionnaire de rounds
        if match_data.round_state.is_empty() {
            return Err(error!(RPSGameError::IncompleteGameState));
        }
        
        let round_manager = RoundManager::from_bytes(&match_data.round_state)?;
        
        // Vérifier si un gagnant a été déterminé
        if round_manager.player1_score >= round_manager.rounds_to_win {
            Ok(GameResult::Player1Wins)
        } else if round_manager.player2_score >= round_manager.rounds_to_win {
            Ok(GameResult::Player2Wins)
        } else {
            // Match toujours en cours
            Ok(GameResult::Draw)
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
            rounds: self.best_of,      // Nombre de rounds configuré
            custom_params: [0; 16],
        }
    }
}

// ===========================
// INSTRUCTIONS SPÉCIFIQUES
// ===========================

/// Instruction pour jouer un round dans un match multi-rounds
pub fn play_round(
    ctx: Context<PlayRound>,
    player_choice: u8,
) -> Result<()> {
    let match_account = &mut ctx.accounts.match_account;
    let player = ctx.accounts.player.key();
    
    // Déterminer si c'est le joueur 1 ou 2
    let is_player1 = player == match_account.creator;
    let is_player2 = match_account.opponent == Some(player);
    
    require!(is_player1 || is_player2, UniversalGameError::Unauthorized);
    
    // Convertir le choix en RPSChoice
    let choice = RPSChoice::from_u8(player_choice)?;
    
    // Stocker temporairement le choix dans game_state
    if is_player1 {
        match_account.game_state[0] = player_choice;
        match_account.game_state[2] = 1; // Marquer que P1 a joué
    } else {
        match_account.game_state[1] = player_choice;
        match_account.game_state[3] = 1; // Marquer que P2 a joué
    }
    
    // Si les deux joueurs ont joué, traiter le round
    if match_account.game_state[2] == 1 && match_account.game_state[3] == 1 {
        let p1_choice = RPSChoice::from_u8(match_account.game_state[0])?;
        let p2_choice = RPSChoice::from_u8(match_account.game_state[1])?;
        
        // Utiliser le nombre de rounds depuis la configuration
        let best_of = match_account.game_config.rounds;
        let rps_game = RPSMultiRound::new(best_of);
        
        let outcome = rps_game.process_round(
            match_account,
            p1_choice,
            p2_choice,
        )?;
        
        // Réinitialiser les marqueurs pour le prochain round
        match_account.game_state[2] = 0;
        match_account.game_state[3] = 0;
        
        // Émettre un événement selon le résultat
        match outcome {
            RoundOutcome::MatchWon(result) => {
                emit!(RoundCompleted {
                    match_id: match_account.match_id,
                    round_result: result,
                    is_final: true,
                    timestamp: Clock::get()?.unix_timestamp,
                });
            },
            RoundOutcome::DrawRequiresReplay => {
                emit!(DrawDetected {
                    match_id: match_account.match_id,
                    replay_required: true,
                    timestamp: Clock::get()?.unix_timestamp,
                });
            },
            RoundOutcome::ContinueMatch => {
                let progress = RPSMultiRound::get_match_progress(match_account)?;
                emit!(RoundCompleted {
                    match_id: match_account.match_id,
                    round_result: GameResult::Draw, // Placeholder
                    is_final: false,
                    timestamp: Clock::get()?.unix_timestamp,
                });
            },
            _ => {}
        }
    }
    
    Ok(())
}

// ===========================
// CONTEXTES
// ===========================

#[derive(Accounts)]
pub struct PlayRound<'info> {
    #[account(mut)]
    pub match_account: Account<'info, UniversalMatch>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// ===========================
// EVENTS SPÉCIFIQUES
// ===========================

#[event]
pub struct RoundCompleted {
    pub match_id: Pubkey,
    pub round_result: GameResult,
    pub is_final: bool,
    pub timestamp: i64,
}

#[event]
pub struct DrawDetected {
    pub match_id: Pubkey,
    pub replay_required: bool,
    pub timestamp: i64,
}

use crate::universal_engine::UniversalGameError;