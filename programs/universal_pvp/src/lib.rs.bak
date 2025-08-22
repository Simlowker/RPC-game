use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as SplTransfer};

// Modules
pub mod universal_engine;
pub mod games;

use universal_engine::*;
use games::rock_paper_scissors::*;
use games::GameLogic;

declare_id!("4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR");

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
        
        let game_id = registry.total_games - 1;
        let game_name = name.clone();
        emit!(GameRegistered {
            game_id,
            game_type,
            creator: ctx.accounts.creator.key(),
            name,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("✅ Game registered: {} (ID: {})", game_name, game_id);
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
        
        // Vérifications de base
        require!(
            match_account.status == MatchStatus::WaitingForOpponent,
            UniversalGameError::MatchAlreadyStarted
        );
        
        require!(
            match_account.opponent.is_none(),
            UniversalGameError::MatchAlreadyStarted
        );
        
        // Transférer le pari de l'opposant vers le vault
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
        
        // Mettre à jour le statut du match
        match_account.opponent = Some(opponent.key());
        match_account.status = MatchStatus::InProgress;
        match_account.started_at = Some(clock.unix_timestamp);
        
        // Initialiser le système de rounds si nécessaire
        if match_account.game_config.rounds > 1 {
            use games::round_manager::RoundManager;
            
            // Créer un gestionnaire de rounds avec un maximum de 5 égalités consécutives
            let round_manager = RoundManager::new(
                match_account.game_config.rounds,
                5 // max_consecutive_draws
            );
            
            // Sérialiser et stocker dans round_state
            match_account.round_state = round_manager.to_bytes();
            
            msg!("🎯 Multi-round match initialized: {} rounds to play", 
                match_account.game_config.rounds);
        }
        
        // Initialiser le game_state selon le type de jeu
        match match_account.game_type {
            GameType::RockPaperScissors => {
                use games::rock_paper_scissors::RPSGameState;
                
                // Initialiser l'état RPS avec commit-reveal
                let rps_state = RPSGameState {
                    player1_commitment: [0u8; 32],  // Sera rempli lors du commit
                    player2_commitment: [0u8; 32],  // Sera rempli lors du commit
                    player1_revealed: None,
                    player2_revealed: None,
                    reveal_deadline: clock.unix_timestamp + 300, // 5 minutes pour révéler
                };
                
                // Sérialiser et stocker dans game_state
                match_account.game_state = rps_state.to_bytes();
                
                msg!("✂️ RPS commit-reveal system initialized");
            },
            GameType::Dice => {
                // Pour Dice, initialiser avec un état simple
                match_account.game_state = vec![0; 16]; // 16 bytes pour l'état du jeu de dés
                msg!("🎲 Dice game state initialized");
            },
            GameType::CoinFlip => {
                // État simple pour pile ou face
                match_account.game_state = vec![0; 8]; // 8 bytes suffisent
                msg!("🪙 Coin flip game state initialized");
            },
            GameType::HighCard => {
                // État pour le jeu de carte haute
                match_account.game_state = vec![0; 32]; // 32 bytes pour les cartes
                msg!("🃏 High card game state initialized");
            },
            GameType::Custom(_id) => {
                // État générique pour jeux custom
                match_account.game_state = vec![0; 64]; // 64 bytes génériques
                msg!("🎮 Custom game state initialized");
            },
        }
        
        // Émettre l'événement de match rejoint
        emit!(MatchJoined {
            match_id: match_account.key(),
            opponent: opponent.key(),
            timestamp: clock.unix_timestamp,
        });
        
        msg!("⚔️ Match joined! {} vs {} - {} with 0% fees!", 
            match_account.creator, 
            opponent.key(),
            match match_account.game_type {
                GameType::RockPaperScissors => "Rock Paper Scissors",
                GameType::Dice => "Dice Game",
                GameType::CoinFlip => "Coin Flip",
                GameType::HighCard => "High Card",
                GameType::Custom(id) => {
                    msg!("Custom Game ID: {}", id);
                    "Custom Game"
                },
            }
        );
        
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
            GameType::Dice => {
                use games::dice::DiceGame;
                let dice = DiceGame;
                dice.validate_move(&move_data)?;
            },
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
        
        // Déterminer le résultat du round actuel selon le type de jeu
        let round_result = match match_account.game_type {
            GameType::RockPaperScissors => {
                let rps = RockPaperScissors;
                rps.determine_winner(match_account)?
            },
            GameType::Dice => {
                use games::dice::DiceGame;
                let dice = DiceGame;
                dice.determine_winner(match_account)?
            },
            GameType::CoinFlip => {
                // Pour CoinFlip, implémenter une logique simple basée sur game_state
                require!(match_account.game_state.len() >= 2, UniversalGameError::InvalidGameState);
                let player1_choice = match_account.game_state[0]; // 0 = heads, 1 = tails
                let player2_choice = match_account.game_state[1];
                
                // Simuler un tirage au sort pseudo-aléatoire basé sur le timestamp
                let coin_result = (clock.unix_timestamp % 2) as u8;
                
                if player1_choice == coin_result && player2_choice != coin_result {
                    GameResult::Player1Wins
                } else if player2_choice == coin_result && player1_choice != coin_result {
                    GameResult::Player2Wins
                } else {
                    GameResult::Draw
                }
            },
            GameType::HighCard => {
                // Pour HighCard, utiliser les 2 premiers bytes comme cartes
                require!(match_account.game_state.len() >= 2, UniversalGameError::InvalidGameState);
                let player1_card = match_account.game_state[0];
                let player2_card = match_account.game_state[1];
                
                if player1_card > player2_card {
                    GameResult::Player1Wins
                } else if player2_card > player1_card {
                    GameResult::Player2Wins
                } else {
                    GameResult::Draw
                }
            },
            GameType::Custom(_) => {
                // Pour les jeux custom, utiliser une logique basique
                require!(match_account.game_state.len() >= 2, UniversalGameError::InvalidGameState);
                let player1_value = match_account.game_state[0];
                let player2_value = match_account.game_state[1];
                
                if player1_value > player2_value {
                    GameResult::Player1Wins
                } else if player2_value > player1_value {
                    GameResult::Player2Wins
                } else {
                    GameResult::Draw
                }
            },
        };
        
        // Gérer les rounds multiples si configurés
        if match_account.game_config.rounds > 1 && !match_account.round_state.is_empty() {
            use games::round_manager::RoundManager;
            
            // Restaurer le gestionnaire de rounds
            let mut round_manager = RoundManager::from_bytes(&match_account.round_state)?;
            
            // Traiter le résultat du round actuel
            let round_outcome = round_manager.process_round_result(
                round_result,
                clock.unix_timestamp,
                match_account.game_state.clone(),
            );
            
            // Sauvegarder l'état mis à jour
            match_account.round_state = round_manager.to_bytes();
            
            match round_outcome {
                games::round_manager::RoundOutcome::ContinueMatch => {
                    // Le match continue, réinitialiser les états de jeu pour le prochain round
                    match match_account.game_type {
                        GameType::RockPaperScissors => {
                            use games::rock_paper_scissors::RPSGameState;
                            let rps_state = RPSGameState {
                                player1_commitment: [0u8; 32],
                                player2_commitment: [0u8; 32],
                                player1_revealed: None,
                                player2_revealed: None,
                                reveal_deadline: clock.unix_timestamp + 300,
                            };
                            match_account.game_state = rps_state.to_bytes();
                        },
                        GameType::Dice => {
                            match_account.game_state = vec![0; 16];
                        },
                        GameType::CoinFlip => {
                            match_account.game_state = vec![0; 8];
                        },
                        GameType::HighCard => {
                            match_account.game_state = vec![0; 32];
                        },
                        GameType::Custom(_) => {
                            match_account.game_state = vec![0; 64];
                        },
                    }
                    
                    let progress = round_manager.get_match_status();
                    msg!("🎯 Round {} completed. Score: {} - {}. Match continues...", 
                        progress.rounds_played, 
                        progress.player1_score, 
                        progress.player2_score
                    );
                    
                    return Ok(());
                },
                
                games::round_manager::RoundOutcome::DrawRequiresReplay => {
                    // Égalité, préparer pour un rejeu immédiat
                    match match_account.game_type {
                        GameType::RockPaperScissors => {
                            use games::rock_paper_scissors::RPSGameState;
                            let rps_state = RPSGameState {
                                player1_commitment: [0u8; 32],
                                player2_commitment: [0u8; 32],
                                player1_revealed: None,
                                player2_revealed: None,
                                reveal_deadline: clock.unix_timestamp + 300,
                            };
                            match_account.game_state = rps_state.to_bytes();
                        },
                        _ => {
                            // Réinitialiser l'état pour les autres jeux
                            match_account.game_state = vec![0; match_account.game_state.len()];
                        }
                    }
                    
                    msg!("⚖️ Round draw! Replay required. Consecutive draws: {}", 
                        round_manager.consecutive_draws
                    );
                    
                    return Ok(());
                },
                
                games::round_manager::RoundOutcome::MatchWon(final_result) => {
                    // Un joueur a gagné le match complet
                    let winner = match final_result {
                        GameResult::Player1Wins => Some(match_account.creator),
                        GameResult::Player2Wins => match_account.opponent,
                        _ => None,
                    };
                    
                    match_account.winner = winner;
                    match_account.status = MatchStatus::Completed;
                    match_account.ended_at = Some(clock.unix_timestamp);
                    
                    let progress = round_manager.get_match_status();
                    emit!(MatchCompleted {
                        match_id: match_account.key(),
                        winner,
                        total_pot: match_account.total_pot,
                        game_result: final_result,
                        timestamp: clock.unix_timestamp,
                    });
                    
                    msg!("🏆 Match completed! Final score: {} - {}. Winner: {:?}", 
                        progress.player1_score, 
                        progress.player2_score, 
                        winner
                    );
                    
                    return Ok(());
                },
                
                games::round_manager::RoundOutcome::ForcedResolution => {
                    // Trop d'égalités ou résolution forcée
                    let forced_result = round_manager.forced_resolution();
                    let winner = match forced_result {
                        GameResult::Player1Wins => Some(match_account.creator),
                        GameResult::Player2Wins => match_account.opponent,
                        _ => None,
                    };
                    
                    match_account.winner = winner;
                    match_account.status = MatchStatus::Completed;
                    match_account.ended_at = Some(clock.unix_timestamp);
                    
                    emit!(MatchCompleted {
                        match_id: match_account.key(),
                        winner,
                        total_pot: match_account.total_pot,
                        game_result: forced_result,
                        timestamp: clock.unix_timestamp,
                    });
                    
                    msg!("⚖️ Match resolved by forced resolution after {} consecutive draws. Winner: {:?}", 
                        round_manager.max_consecutive_draws, 
                        winner
                    );
                    
                    return Ok(());
                }
            }
        } else {
            // Match à round unique
            let winner = match round_result {
                GameResult::Player1Wins => Some(match_account.creator),
                GameResult::Player2Wins => match_account.opponent,
                GameResult::Draw => None, // Égalité, partage 50/50 dans claim_winnings
                GameResult::Cancelled => None,
            };
            
            match_account.winner = winner;
            match_account.status = MatchStatus::Completed;
            match_account.ended_at = Some(clock.unix_timestamp);
            
            emit!(MatchCompleted {
                match_id: match_account.key(),
                winner,
                total_pot: match_account.total_pot,
                game_result: round_result,
                timestamp: clock.unix_timestamp,
            });
            
            msg!("✅ Single-round match settled! Result: {:?}", round_result);
        }
        
        Ok(())
    }
    
    // ===========================
    // RÉCLAMER LES GAINS
    // ===========================
    
    pub fn claim_winnings(
        ctx: Context<ClaimWinnings>,
    ) -> Result<()> {
        let match_account = &ctx.accounts.match_account;
        let vault = &mut ctx.accounts.vault;
        let claimer = &ctx.accounts.claimer;
        let clock = Clock::get()?;
        
        // Vérifications de sécurité
        require!(
            match_account.status == MatchStatus::Completed,
            UniversalGameError::MatchNotCompleted
        );
        
        // Vérifier que le match a bien un vault avec des fonds
        require!(
            match_account.total_pot > 0,
            UniversalGameError::InvalidGameState
        );
        
        // Déterminer le montant à réclamer selon le résultat
        let (claim_amount, is_winner) = if let Some(winner) = match_account.winner {
            // Cas d'un gagnant unique - 100% du pot au gagnant (0% de frais!)
            require!(
                claimer.key() == winner,
                UniversalGameError::Unauthorized
            );
            (match_account.total_pot, true) // 100% du pot total au gagnant!
        } else {
            // Cas d'égalité - chaque joueur récupère sa mise
            require!(
                claimer.key() == match_account.creator || 
                Some(claimer.key()) == match_account.opponent,
                UniversalGameError::Unauthorized
            );
            (match_account.bet_amount, false) // Chacun récupère sa mise originale
        };
        
        // Vérifier qu'il y a assez de fonds dans le vault
        if match_account.token_mint.is_some() {
            // Pour SPL tokens, vérifier le solde du vault
            let vault_token_account = ctx.accounts.vault_token_account.as_ref().unwrap();
            require!(
                vault_token_account.amount >= claim_amount,
                UniversalGameError::InsufficientFunds
            );
        } else {
            // Pour SOL, vérifier les lamports du vault
            require!(
                vault.lamports() >= claim_amount,
                UniversalGameError::InsufficientFunds
            );
        }
        
        // Transférer les fonds depuis le vault
        if let Some(_token_mint) = &match_account.token_mint {
            // Transfer SPL tokens avec les seeds du vault
            let match_key = match_account.key();
            let seeds = &[
                b"vault",
                match_key.as_ref(),
                &[match_account.vault_bump],
            ];
            let signer = &[&seeds[..]];
            
            let cpi_accounts = SplTransfer {
                from: ctx.accounts.vault_token_account.as_ref().unwrap().to_account_info(),
                to: ctx.accounts.claimer_token_account.as_ref().unwrap().to_account_info(),
                authority: vault.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.as_ref().unwrap().to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, claim_amount)?;
            
            msg!("💰 SPL Token transfer completed: {} tokens to {}", claim_amount, claimer.key());
        } else {
            // Transfer SOL directement
            **vault.try_borrow_mut_lamports()? -= claim_amount;
            **claimer.try_borrow_mut_lamports()? += claim_amount;
            
            msg!("💰 SOL transfer completed: {} lamports to {}", claim_amount, claimer.key());
        }
        
        // Émettre l'événement de réclamation
        emit!(WinningsClaimed {
            match_id: match_account.key(),
            claimer: claimer.key(),
            amount: claim_amount,
            timestamp: clock.unix_timestamp,
        });
        
        // Messages de succès selon le type de réclamation
        if is_winner {
            msg!("🏆 WINNER! {} claimed the full pot of {} (100% - no fees!)", 
                claimer.key(), claim_amount);
        } else {
            msg!("⚖️ DRAW: {} reclaimed their bet of {}", 
                claimer.key(), claim_amount);
        }
        
        Ok(())
    }
    
    // ===========================
    // FERMER UN MATCH COMPLÉTÉ
    // ===========================
    
    pub fn close_match(
        ctx: Context<CloseMatch>,
    ) -> Result<()> {
        let match_account = &ctx.accounts.match_account;
        let vault = &ctx.accounts.vault;
        let authority = &ctx.accounts.authority;
        
        // Vérifications de sécurité
        require!(
            match_account.status == MatchStatus::Completed,
            UniversalGameError::MatchNotCompleted
        );
        
        // Seuls les participants peuvent fermer le match
        require!(
            authority.key() == match_account.creator || 
            Some(authority.key()) == match_account.opponent,
            UniversalGameError::Unauthorized
        );
        
        // Vérifier que le vault est vide (tous les gains ont été réclamés)
        if match_account.token_mint.is_some() {
            // Pour SPL tokens
            let vault_token_account = ctx.accounts.vault_token_account.as_ref().unwrap();
            require!(
                vault_token_account.amount == 0,
                UniversalGameError::InsufficientFunds // Il reste des fonds à réclamer
            );
        } else {
            // Pour SOL, s'assurer que seuls les frais de rent restent
            let rent_exempt_minimum = Rent::get()?.minimum_balance(0);
            require!(
                vault.lamports() <= rent_exempt_minimum,
                UniversalGameError::InsufficientFunds // Il reste des fonds à réclamer
            );
        }
        
        msg!("🗑️ Match {} closed successfully", match_account.key());
        
        // Le compte sera automatiquement fermé par Anchor grâce à l'attribut close
        Ok(())
    }
    
    // ===========================
    // ANNULER UN MATCH
    // ===========================
    
    pub fn cancel_match(
        ctx: Context<CancelMatch>,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let vault = &mut ctx.accounts.vault;
        let requester = &ctx.accounts.requester;
        let clock = Clock::get()?;
        
        // Vérifier si le match peut être annulé
        require!(
            match_account.status == MatchStatus::WaitingForOpponent ||
            match_account.can_timeout(),
            UniversalGameError::CannotCancel
        );
        
        // Vérifier l'autorisation
        require!(
            requester.key() == match_account.creator ||
            Some(requester.key()) == match_account.opponent,
            UniversalGameError::Unauthorized
        );
        
        match_account.status = MatchStatus::Cancelled;
        match_account.ended_at = Some(clock.unix_timestamp);
        
        // Rembourser le créateur
        let refund_amount = match_account.bet_amount;
        
        if match_account.token_mint.is_some() {
            // Refund SPL tokens
            let match_key = match_account.key();
            let seeds = &[
                b"vault",
                match_key.as_ref(),
                &[match_account.vault_bump],
            ];
            let signer = &[&seeds[..]];
            
            let cpi_accounts = SplTransfer {
                from: ctx.accounts.vault_token_account.as_ref().unwrap().to_account_info(),
                to: ctx.accounts.creator_token_account.as_ref().unwrap().to_account_info(),
                authority: vault.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.as_ref().unwrap().to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, refund_amount)?;
            
            // Si un opposant a rejoint, le rembourser aussi
            if match_account.opponent.is_some() {
                let cpi_accounts_opponent = SplTransfer {
                    from: ctx.accounts.vault_token_account.as_ref().unwrap().to_account_info(),
                    to: ctx.accounts.opponent_token_account.as_ref().unwrap().to_account_info(),
                    authority: vault.to_account_info(),
                };
                let cpi_ctx_opponent = CpiContext::new_with_signer(
                    ctx.accounts.token_program.as_ref().unwrap().to_account_info(),
                    cpi_accounts_opponent,
                    signer
                );
                token::transfer(cpi_ctx_opponent, refund_amount)?;
            }
        } else {
            // Refund SOL
            **vault.try_borrow_mut_lamports()? -= refund_amount;
            **ctx.accounts.creator.try_borrow_mut_lamports()? += refund_amount;
            
            // Si un opposant a rejoint, le rembourser aussi
            if let Some(opponent_account) = &ctx.accounts.opponent {
                **vault.try_borrow_mut_lamports()? -= refund_amount;
                **opponent_account.try_borrow_mut_lamports()? += refund_amount;
            }
        }
        
        emit!(MatchCancelled {
            match_id: match_account.key(),
            reason: if match_account.can_timeout() { "timeout".to_string() } else { "no_opponent".to_string() },
            timestamp: clock.unix_timestamp,
        });
        
        msg!("❌ Match cancelled and funds refunded!");
        Ok(())
    }
    
    // ===========================
    // DISPUTER UN MATCH
    // ===========================
    
    pub fn dispute_match(
        ctx: Context<DisputeMatch>,
        reason: String,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let disputer = &ctx.accounts.disputer;
        let clock = Clock::get()?;
        
        // Vérifications
        require!(
            match_account.status == MatchStatus::InProgress ||
            match_account.status == MatchStatus::Completed,
            UniversalGameError::CannotDispute
        );
        
        require!(
            disputer.key() == match_account.creator ||
            Some(disputer.key()) == match_account.opponent,
            UniversalGameError::Unauthorized
        );
        
        // Marquer comme disputé
        match_account.status = MatchStatus::Disputed;
        
        let dispute_reason = reason.clone();
        emit!(MatchDisputed {
            match_id: match_account.key(),
            disputer: disputer.key(),
            reason,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("⚠️ Match disputed by {}. Reason: {}", disputer.key(), dispute_reason);
        Ok(())
    }
    
    // ===========================
    // RÉSOUDRE UN LITIGE
    // ===========================
    
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        resolution: DisputeResolution,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let authority = &ctx.accounts.authority;
        let registry = &ctx.accounts.game_registry;
        let clock = Clock::get()?;
        
        // Vérifications
        require!(
            match_account.status == MatchStatus::Disputed,
            UniversalGameError::NotDisputed
        );
        
        require!(
            authority.key() == registry.authority,
            UniversalGameError::Unauthorized
        );
        
        // Appliquer la résolution
        match resolution {
            DisputeResolution::Player1Wins => {
                match_account.winner = Some(match_account.creator);
                match_account.status = MatchStatus::Completed;
            },
            DisputeResolution::Player2Wins => {
                match_account.winner = match_account.opponent;
                match_account.status = MatchStatus::Completed;
            },
            DisputeResolution::Draw => {
                match_account.winner = None;
                match_account.status = MatchStatus::Completed;
            },
            DisputeResolution::Cancel => {
                match_account.status = MatchStatus::Cancelled;
            },
        }
        
        match_account.ended_at = Some(clock.unix_timestamp);
        
        emit!(DisputeResolved {
            match_id: match_account.key(),
            resolution,
            resolver: authority.key(),
            timestamp: clock.unix_timestamp,
        });
        
        msg!("⚖️ Dispute resolved: {:?}", resolution);
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
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
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
    pub claimer: Signer<'info>,
    
    pub claimer_token_account: Option<Account<'info, TokenAccount>>,
    pub vault_token_account: Option<Account<'info, TokenAccount>>,
    pub token_program: Option<Program<'info, Token>>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelMatch<'info> {
    #[account(mut)]
    pub match_account: Account<'info, UniversalMatch>,
    
    #[account(
        mut,
        seeds = [b"vault", match_account.key().as_ref()],
        bump = match_account.vault_bump
    )]
    /// CHECK: Vault PDA
    pub vault: UncheckedAccount<'info>,
    
    pub requester: Signer<'info>,
    
    #[account(mut)]
    /// CHECK: Creator to refund
    pub creator: UncheckedAccount<'info>,
    
    #[account(mut)]
    /// CHECK: Opponent to refund if exists
    pub opponent: Option<UncheckedAccount<'info>>,
    
    pub creator_token_account: Option<Account<'info, TokenAccount>>,
    pub opponent_token_account: Option<Account<'info, TokenAccount>>,
    pub vault_token_account: Option<Account<'info, TokenAccount>>,
    pub token_program: Option<Program<'info, Token>>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DisputeMatch<'info> {
    #[account(mut)]
    pub match_account: Account<'info, UniversalMatch>,
    
    pub disputer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut)]
    pub match_account: Account<'info, UniversalMatch>,
    
    #[account(
        seeds = [b"game_registry"],
        bump
    )]
    pub game_registry: Account<'info, GameRegistry>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseMatch<'info> {
    #[account(
        mut,
        close = authority,
        constraint = match_account.status == MatchStatus::Completed
    )]
    pub match_account: Account<'info, UniversalMatch>,
    
    #[account(
        mut,
        seeds = [b"vault", match_account.key().as_ref()],
        bump = match_account.vault_bump
    )]
    /// CHECK: Vault PDA que l'on ferme aussi
    pub vault: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    // Comptes optionnels pour SPL tokens
    pub vault_token_account: Option<Account<'info, TokenAccount>>,
    pub token_program: Option<Program<'info, Token>>,
    
    pub system_program: Program<'info, System>,
}