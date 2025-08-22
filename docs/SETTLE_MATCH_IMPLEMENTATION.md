# Implémentation complète de settle_match avec système de rounds multiples

## 🎯 Vue d'ensemble

Cette implémentation refactorie complètement la fonction `settle_match` pour intégrer le système de rounds multiples via `RoundManager`, gérer les cas d'égalité avec rejeu automatique, et séparer clairement la détermination du gagnant de la distribution des fonds.

## 📋 Fonctionnalités implémentées

### 1. Intégration du système RoundManager

```rust
// Restaurer le gestionnaire de rounds depuis round_state
let mut round_manager = RoundManager::from_bytes(&match_account.round_state)?;

// Traiter le résultat du round actuel
let round_outcome = round_manager.process_round_result(
    round_result,
    clock.unix_timestamp,
    match_account.game_state.clone(),
);

// Sauvegarder l'état mis à jour
match_account.round_state = round_manager.to_bytes();
```

### 2. Gestion de tous les RoundOutcome

#### ContinueMatch
- Le match continue au round suivant
- Réinitialise les `game_state` selon le type de jeu
- Affiche le score actuel et continue

#### DrawRequiresReplay  
- Égalité détectée, rejeu immédiat nécessaire
- Réinitialise les `game_state` pour le rejeu
- Incrémente le compteur d'égalités consécutives

#### MatchWon
- Un joueur a gagné le match complet
- Finalise le match avec le gagnant
- Émet l'événement `MatchCompleted`

#### ForcedResolution
- Trop d'égalités consécutives (>5)
- Utilise l'algorithme de résolution forcée
- Basé sur score + hash des timestamps pour fairness

### 3. Support de tous les types de jeux

```rust
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
        // Logique CoinFlip avec pseudo-aléatoire basé sur timestamp
        // Format: [choice_p1, choice_p2] où 0=heads, 1=tails
        // ...
    },
    GameType::HighCard => {
        // Logique HighCard - compare les valeurs des cartes
        // Format: [card_p1, card_p2]
        // ...
    },
    GameType::Custom(_) => {
        // Logique générique pour jeux custom
        // Format: [value_p1, value_p2]
        // ...
    },
};
```

### 4. Réinitialisation intelligente des états

Pour chaque type de jeu, la fonction réinitialise correctement le `game_state` entre les rounds :

```rust
match match_account.game_type {
    GameType::RockPaperScissors => {
        // Réinitialise RPSGameState avec nouveaux commitments
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
    // ... autres jeux
}
```

## 🔧 Structure SettleMatch corrigée

**Avant (avec comptes inutiles) :**
```rust
#[derive(Accounts)]
pub struct SettleMatch<'info> {
    #[account(mut)]
    pub match_account: Account<'info, UniversalMatch>,
    #[account(mut, seeds = [b"vault", match_account.key().as_ref()], bump)]
    pub vault: UncheckedAccount<'info>,
    pub creator: UncheckedAccount<'info>,
    pub opponent: Option<UncheckedAccount<'info>>,
    pub system_program: Program<'info, System>,
}
```

**Après (simplifié) :**
```rust
#[derive(Accounts)]
pub struct SettleMatch<'info> {
    #[account(mut)]
    pub match_account: Account<'info, UniversalMatch>,
}
```

**Justification :** `settle_match` ne distribue plus les fonds (déplacé vers `claim_winnings`), donc seul le compte de match est nécessaire.

## 🎮 Flux de fonctionnement détaillé

### 1. Détermination du résultat du round
```
settle_match() appelé
     ↓
Détermine result selon game_type
     ↓
Vérifie si multi-rounds (rounds > 1)
```

### 2. Traitement multi-rounds
```
RoundManager.from_bytes(round_state)
     ↓
process_round_result(result, timestamp, game_data)
     ↓
Évalue RoundOutcome
```

### 3. Actions selon RoundOutcome

#### ContinueMatch
```
RoundOutcome::ContinueMatch
     ↓
Réinitialise game_state pour le type de jeu
     ↓
Affiche score : "Round X completed. Score: Y - Z"
     ↓
return Ok() (match continue)
```

#### DrawRequiresReplay
```
RoundOutcome::DrawRequiresReplay
     ↓
Réinitialise game_state
     ↓
Affiche "Round draw! Consecutive draws: N"
     ↓
return Ok() (rejeu immédiat)
```

#### MatchWon
```
RoundOutcome::MatchWon(final_result)
     ↓
Détermine winner selon final_result
     ↓
match_account.status = Completed
     ↓
emit!(MatchCompleted)
     ↓
Affiche "Match completed! Final score: X - Y"
```

#### ForcedResolution
```
RoundOutcome::ForcedResolution
     ↓
forced_result = round_manager.forced_resolution()
     ↓
Applique algorithme de résolution forcée
     ↓
match_account.status = Completed
     ↓
emit!(MatchCompleted)
     ↓
Affiche "Match resolved by forced resolution"
```

### 4. Traitement single-round
```
rounds == 1 OU round_state vide
     ↓
winner = déterminé directement depuis round_result
     ↓
match_account.status = Completed
     ↓
emit!(MatchCompleted)
     ↓
"Single-round match settled"
```

## 🔬 Algorithme de résolution forcée

Le `RoundManager.forced_resolution()` utilise un algorithme équitable :

1. **Comparaison de score :** Si un joueur a plus de victoires, il gagne
2. **Hash équitable :** En cas d'égalité parfaite, utilise la somme des timestamps des rounds
3. **Pseudo-aléatoire :** `hash_sum % 2` détermine le gagnant de manière reproductible

```rust
pub fn forced_resolution(&self) -> GameResult {
    // 1. Vérifier le score
    if self.player1_score > self.player2_score {
        return GameResult::Player1Wins;
    } else if self.player2_score > self.player1_score {
        return GameResult::Player2Wins;
    }
    
    // 2. Égalité parfaite - utiliser hash équitable
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
```

## 📊 Métriques et logging

### Messages informatifs
- **Round terminé :** `"🎯 Round X completed. Score: Y - Z. Match continues..."`
- **Égalité :** `"⚖️ Round draw! Replay required. Consecutive draws: N"`
- **Victoire :** `"🏆 Match completed! Final score: X - Y. Winner: [pubkey]"`
- **Résolution forcée :** `"⚖️ Match resolved by forced resolution after N draws"`
- **Single-round :** `"✅ Single-round match settled! Result: [result]"`

### Événements émis
- `MatchCompleted` : Seulement en fin de match (jamais entre rounds)
- Contient : winner, total_pot, game_result, timestamp

## 🧪 Tests et validation

### Scénarios de test couverts
1. **Best of 3 avec victoire directe** (2-0)
2. **Égalités avec rejeu automatique**
3. **Résolution forcée après 5+ égalités**
4. **Compatibilité avec tous les types de jeux**
5. **Single-round vs multi-rounds**

### Points de validation
- ✅ État des rounds correctement persisté
- ✅ Réinitialisation appropriée des game_state
- ✅ Événements émis au bon moment
- ✅ Messages de debugging informatifs
- ✅ Gestion d'erreurs robuste

## 🔐 Sécurité et robustesse

### Validations ajoutées
- Vérification `match_account.status == InProgress`
- Validation `game_state.len() >= 2` pour chaque type de jeu
- Gestion d'erreurs avec `require!()` macros
- Désérialisation sécurisée du `RoundManager`

### Prévention des attaques
- Pas de distribution de fonds dans `settle_match`
- Séparation claire des responsabilités
- État des rounds tamper-resistant via sérialisation

## 🚀 Avantages de l'implémentation

1. **Modularité :** Séparation claire settle vs claim
2. **Extensibilité :** Support facile de nouveaux types de jeux
3. **Robustesse :** Gestion complète des cas d'égalité
4. **Performance :** Réinitialisation optimisée des états
5. **Observabilité :** Logging détaillé pour debugging
6. **Équité :** Algorithme de résolution forcée transparent
7. **Compatibilité :** Fonctionne avec single et multi-rounds

Cette implémentation transforme `settle_match` en une fonction robuste et complète qui gère intelligemment tous les aspects des matches PvP avec rounds multiples, tout en maintenant la compatibilité avec les matches simples existants.