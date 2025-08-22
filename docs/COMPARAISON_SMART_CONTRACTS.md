# 🔄 COMPARAISON DES SMART CONTRACTS

## 📊 ÉTAT ACTUEL

### 1️⃣ **Branche Principale (`programs/rps/`)**
**État : VIDE ❌**
- Le dossier existe mais ne contient aucun code
- `programs/rps/src/` est complètement vide
- Aucun smart contract déployable

### 2️⃣ **Programme Archivé (`.archive/old-projects/rps-game/programs/rps/`)**
**État : COMPLET ✅**
- Contient 3 versions du smart contract :
  1. `lib_original_rps.rs` - Version RPS classique
  2. `lib.rs` - Version universelle actuelle
  3. `lib_universal.rs` - Backup de la version universelle

## 🆚 COMPARAISON DES VERSIONS

| Aspect | RPS Original (`lib_original_rps.rs`) | Programme Universel (`lib.rs`) |
|--------|---------------------------------------|----------------------------------|
| **Architecture** | Mono-jeu (RPS uniquement) | Multi-jeux extensible |
| **Program ID** | `32tQhc2c4LurhdBwDzzV8f3PtdhKm1iVaPSumDTZWAvb` | `UNIVxxxxxx...` (à définir) |
| **Frais** | Variable (0-5% via `fee_bps`) | **0% FIXE** 🎉 |
| **Structure Match** | `RpsMatch` (spécifique RPS) | `UniversalMatch` (générique) |
| **Jeux supportés** | 1 (Rock Paper Scissors) | Illimité (RPS, Dice, CoinFlip, etc.) |
| **État du jeu** | Fields fixes (commitment, choices) | `game_state: Vec<u8>` flexible |
| **Extensibilité** | ❌ Redéploiement nécessaire | ✅ Ajout de jeux sans redéployer |
| **Taille** | ~500KB | ~800KB |
| **Complexité** | Simple | Modulaire |

## 📝 DIFFÉRENCES PRINCIPALES

### Version RPS Original
```rust
// Structure spécifique RPS
pub struct RpsMatch {
    pub creator: Pubkey,
    pub opponent: Pubkey,
    pub bet_amount: u64,
    pub commitment_creator: [u8; 32],  // Hash du choix
    pub commitment_opponent: [u8; 32],
    pub revealed_creator: Option<u8>,   // Rock/Paper/Scissors
    pub revealed_opponent: Option<u8>,
    pub fee_bps: u16,  // FRAIS VARIABLES !
    // ...
}

// Instructions limitées à RPS
pub fn create_match(ctx, bet_amount, commitment_hash, fee_bps)
pub fn join_match(ctx, commitment_hash)
pub fn reveal_choice(ctx, choice, salt)
```

### Version Programme Universel
```rust
// Structure universelle pour TOUS les jeux
pub struct UniversalMatch {
    pub match_id: Pubkey,
    pub game_type: GameType,  // RPS, Dice, CoinFlip, etc.
    pub bet_amount: u64,
    pub total_pot: u64,  // 0% de frais = bet_amount × 2
    pub game_state: Vec<u8>,  // Flexible selon le jeu
    // Pas de fee_bps - TOUJOURS 0% !
    // ...
}

// Instructions universelles
pub fn create_universal_match(ctx, game_type, bet_amount)
pub fn join_universal_match(ctx)
pub fn submit_game_move(ctx, move_data)
pub fn register_game(ctx, game_type, name)  // NOUVEAU !
```

## 🎯 AVANTAGES DU PROGRAMME UNIVERSEL

### ✅ Pour les Joueurs
- **0% de frais** sur TOUS les matchs
- **100% des gains** au vainqueur
- **Plus de jeux** sans changer de plateforme

### ✅ Pour le Développement
- **Un seul déploiement** pour tous les jeux
- **Extensible** sans toucher au code principal
- **Maintenance simplifiée**

### ✅ Pour le Business
- **Économies** : 1 déploiement au lieu de N
- **Évolutivité** : Ajout rapide de nouveaux jeux
- **Innovation** : Modèle 0% frais unique

## 🚨 SITUATION ACTUELLE

### Problème
- ❌ **Aucun smart contract** dans la branche principale
- ❌ Le programme universel est **archivé** et non utilisé
- ❌ Impossible de déployer en l'état

### Solution Immédiate
```bash
# Récupérer le programme universel depuis les archives
cp -r .archive/old-projects/rps-game/programs/rps programs/universal_pvp

# OU si vous préférez le RPS simple pour commencer
cp .archive/old-projects/rps-game/programs/rps/src/lib_original_rps.rs programs/rps/src/lib.rs
```

## 📊 RECOMMANDATION

### 🏆 UTILISER LE PROGRAMME UNIVERSEL

**Pourquoi ?**
1. **Déjà développé** à 55%
2. **0% de frais** - avantage compétitif
3. **Extensible** - prêt pour l'avenir
4. **Un seul déploiement** - économique

**Comment ?**
1. Récupérer depuis `.archive/`
2. Finir les 45% restants
3. Tester sur devnet
4. Déployer sur mainnet (~2 SOL)

### Alternative : RPS Simple
Si vous voulez déployer rapidement :
- Utilisez `lib_original_rps.rs`
- Plus simple mais limité
- Devra être remplacé plus tard

## 🔑 DÉCISION CRITIQUE

**Option A** : Programme Universel (Recommandé) ✅
- Investissement initial plus important
- ROI à long terme excellent
- Prêt pour 50+ jeux

**Option B** : RPS Simple ⚠️
- Déploiement rapide
- Limité à un seul jeu
- Migration future nécessaire

---

📅 **Date d'analyse** : 2025-08-21
⚠️ **Action requise** : Choisir et récupérer un smart contract depuis les archives