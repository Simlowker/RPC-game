# 🔄 Plan de Migration vers Programme Universel

## Stratégie : Transformer RPS en Programme Universel Extensible

### Phase 1 : Restructuration du Programme (Jour 1-3)

#### A. Créer la Structure Universelle
```rust
// Nouveau fichier : programs/rps/src/universal_game_engine.rs

pub mod universal_game_engine {
    // 1. Enum pour types de jeux
    pub enum GameType {
        RockPaperScissors,  // Premier jeu
        // Futurs jeux à ajouter
        Dice,              
        CoinFlip,
        // ... 50+ jeux possibles
    }
    
    // 2. Structure de match universelle
    pub struct UniversalMatch {
        pub game_type: GameType,
        pub players: Vec<Pubkey>,
        pub game_state: Vec<u8>,  // Données flexibles
        pub bet_amount: u64,
        // ... reste des champs
    }
}
```

#### B. Adapter RPS comme Module
```rust
// programs/rps/src/games/rock_paper_scissors.rs

pub mod rock_paper_scissors {
    use crate::universal_game_engine::*;
    
    // RPS devient un "plugin" du système universel
    impl GameLogic for RockPaperScissors {
        fn validate_move(&self, move_data: &[u8]) -> Result<()> {
            // Validation spécifique RPS
        }
        
        fn determine_winner(&self, moves: Vec<GameMove>) -> GameResult {
            // Logique RPS existante
        }
    }
}
```

### Phase 2 : Architecture 0% Frais (Jour 4-5)

#### Structure de Revenus Alternative
```rust
// programs/rps/src/tokenomics.rs

pub struct ZeroFeeModel {
    // Pas de treasury pour frais de match
    pub game_tokens: HashMap<GameType, TokenInfo>,
    pub launchpad_config: LaunchpadConfig,
    pub premium_features: Option<PremiumConfig>,
}

// Revenus via tokens, pas via matchs
pub fn create_match_zero_fee(
    ctx: Context<CreateMatch>,
    game_type: GameType,
    bet_amount: u64,
) -> Result<()> {
    // Aucun frais prélevé !
    let total_pot = bet_amount * 2;
    let winner_gets = total_pot;  // 100% au gagnant
}
```

### Phase 3 : Système Extensible (Jour 6-7)

#### Configuration pour Nouveaux Jeux
```rust
// programs/rps/src/game_registry.rs

pub struct GameRegistry {
    pub registered_games: Vec<GameDefinition>,
    pub pending_games: Vec<ProposedGame>,
    pub creator_rewards: CreatorIncentives,
}

// N'importe qui peut proposer un jeu
pub fn propose_new_game(
    ctx: Context<ProposeGame>,
    game_spec: GameSpecification,
) -> Result<()> {
    // Validation communautaire
    // Pas besoin de redéployer le programme !
}
```

## 📁 Structure de Fichiers Recommandée

```
rps-game/
├── programs/
│   └── universal_pvp/           # Renommer de 'rps'
│       ├── src/
│       │   ├── lib.rs           # Point d'entrée universel
│       │   ├── universal_engine.rs  # Moteur principal
│       │   ├── tokenomics.rs    # Modèle 0% frais
│       │   ├── game_registry.rs # Gestion des jeux
│       │   ├── games/           # Modules de jeux
│       │   │   ├── mod.rs
│       │   │   ├── rock_paper_scissors.rs  # RPS existant
│       │   │   ├── dice.rs      # Futur
│       │   │   └── coin_flip.rs # Futur
│       │   └── launchpad/       # Système de tokens
│       │       ├── mod.rs
│       │       └── token_launch.rs
│       └── Cargo.toml
```

## 🚀 Étapes de Migration

### Semaine 1 : Core Universal Engine
- [ ] Créer structure universelle
- [ ] Adapter RPS comme premier jeu
- [ ] Implémenter 0% frais
- [ ] Tests unitaires

### Semaine 2 : Extension & Token System
- [ ] Ajouter 2ème jeu (Dice ou CoinFlip)
- [ ] Créer système de tokens basique
- [ ] Interface d'ajout de jeux
- [ ] Tests d'intégration

### Semaine 3 : Finalisation pour Mainnet
- [ ] Audit de sécurité
- [ ] Optimisation gas
- [ ] Documentation API
- [ ] Préparation déploiement

## 💰 Comparaison des Coûts

| Approche | Coût | Temps | Risque |
|----------|------|-------|--------|
| Nouveau projet | 0 SOL (dev) + 2 SOL (deploy) | 3-4 semaines | Repartir de zéro |
| Migration actuel | 0 SOL (dev) + 2 SOL (deploy) | 2-3 semaines | Minimal |
| Déployer RPS puis Universal | 1.5 + 2 = 3.5 SOL | 4 semaines | Migration utilisateurs |

## ✅ Décision Recommandée

**MIGRER le projet existant** car :

1. **Économie de temps** : 1-2 semaines de moins
2. **Code testé** : RPS déjà fonctionnel
3. **Économie d'argent** : Un seul déploiement (2 SOL au lieu de 3.5)
4. **Continuité** : Pas de migration d'utilisateurs

## 🎯 Actions Immédiates

```bash
# 1. Renommer le programme
cd rps-game/programs
mv rps universal_pvp

# 2. Mettre à jour Cargo.toml
sed -i 's/name = "rps"/name = "universal_pvp"/' universal_pvp/Cargo.toml

# 3. Créer la structure universelle
mkdir -p universal_pvp/src/games
mkdir -p universal_pvp/src/launchpad

# 4. Commencer la refactorisation
```

## 🔑 Points Clés pour Mainnet

1. **Program ID sera différent** - Nouveau programme = nouvelle adresse
2. **Taille estimée** : ~800KB (vs 500KB pour RPS seul)
3. **Coût déploiement** : ~2 SOL (un peu plus que RPS seul)
4. **Extensibilité garantie** : Ajout de jeux sans redéploiement

## 📊 Timeline Réaliste

| Semaine | Objectif | Livrable |
|---------|----------|----------|
| 1 | Architecture universelle | RPS fonctionnel en mode universel |
| 2 | Multi-jeux + 0% frais | 2-3 jeux testables sur devnet |
| 3 | Polish + Tests | Prêt pour mainnet |
| 4 | Déploiement | Live sur mainnet avec RPS |

## 🚦 Critères de Succès

- [ ] RPS fonctionne dans système universel
- [ ] Peut ajouter nouveau jeu sans redéployer
- [ ] 0% frais vérifié
- [ ] Tests passent à 100%
- [ ] Gas optimisé (<5000 compute units)
- [ ] Documentation complète

---

**Décision Finale : ADAPTER le projet existant en programme universel**

Commençons la transformation maintenant ! 🚀