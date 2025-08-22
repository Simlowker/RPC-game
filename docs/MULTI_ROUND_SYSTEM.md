# 🎮 Système de Manches Multiples avec Rejeu Automatique

## Vue d'ensemble

Le système de manches multiples permet aux joueurs de s'affronter dans des matchs en plusieurs rounds (Best of 3, 5, 7, etc.) avec une gestion intelligente des égalités et un rejeu automatique immédiat.

## 🌟 Caractéristiques Principales

### 1. **Matchs Multi-Rounds**
- Support pour Best of N (3, 5, 7, 9, etc.)
- Score en temps réel
- Historique complet de chaque round
- Détection automatique du vainqueur

### 2. **Gestion Intelligente des Égalités**
- **Rejeu Immédiat**: En cas d'égalité, le round est rejoué automatiquement
- **Compteur d'Égalités**: Suivi des égalités consécutives
- **Résolution Forcée**: Après N égalités (configurable), résolution pseudo-aléatoire
- **Minimum de Délai**: Les joueurs peuvent rejouer immédiatement

### 3. **Système de Score Dynamique**
- Calcul automatique des rounds nécessaires pour gagner
- Détection de "match point"
- Suivi du leader actuel
- Rounds restants minimum

## 📋 Architecture Technique

### Structure RoundManager

```rust
pub struct RoundManager {
    pub total_rounds: u8,          // Ex: 3 pour Best of 3
    pub rounds_played: u8,          // Rounds effectifs (sans égalités)
    pub player1_score: u8,          // Score joueur 1
    pub player2_score: u8,          // Score joueur 2
    pub round_history: Vec<RoundResult>, // Historique complet
    pub rounds_to_win: u8,          // (total_rounds / 2) + 1
    pub consecutive_draws: u8,      // Égalités consécutives
    pub max_consecutive_draws: u8,  // Limite avant résolution forcée
}
```

### Types de Résultats

```rust
pub enum RoundOutcome {
    ContinueMatch,         // Le match continue normalement
    MatchWon(GameResult),  // Un joueur a gagné le match
    DrawRequiresReplay,    // Égalité, rejeu immédiat requis
    ForcedResolution,      // Trop d'égalités, tirage forcé
}
```

## 🎯 Scénarios d'Utilisation

### Scénario 1: Match Best of 3 Classique
```
Round 1: P1 (Rock) vs P2 (Scissors) → P1 gagne (1-0)
Round 2: P1 (Paper) vs P2 (Rock) → P1 gagne (2-0)
Résultat: P1 remporte le match 2-0
```

### Scénario 2: Match avec Égalités
```
Round 1: P1 (Rock) vs P2 (Rock) → Égalité (rejeu)
Round 1b: P1 (Paper) vs P2 (Scissors) → P2 gagne (0-1)
Round 2: P1 (Scissors) vs P2 (Rock) → P2 gagne (0-2)
Résultat: P2 remporte le match 2-0
```

### Scénario 3: Résolution Forcée
```
Round 1: P1 (Rock) vs P2 (Rock) → Égalité 1
Round 1b: P1 (Paper) vs P2 (Paper) → Égalité 2
Round 1c: P1 (Scissors) vs P2 (Scissors) → Égalité 3
Résultat: Résolution forcée basée sur timestamp
```

## 🔧 Configuration

### Paramètres de Match

| Paramètre | Description | Valeur par défaut | Range |
|-----------|-------------|-------------------|-------|
| `best_of` | Nombre de rounds total | 3 | 1-99 |
| `max_draws` | Égalités max avant résolution | 3 | 1-10 |
| `timeout` | Temps max par round | 60s | 10s-300s |

### Configuration dans GameConfig

```rust
GameConfig {
    rounds: 3,  // Best of 3
    custom_params: [
        3,      // max_consecutive_draws
        60,     // timeout_seconds
        ...
    ]
}
```

## 🚀 Implémentation

### Création d'un Match Multi-Rounds

```typescript
// Créer un match Best of 5
const tx = await program.methods
  .createMatch(
    matchId,
    { rockPaperScissors: {} },
    betAmount,
    5  // Best of 5
  )
  .accounts({...})
  .rpc();
```

### Jouer un Round

```typescript
// Joueur 1 fait son choix
await program.methods
  .playRound(choice)
  .accounts({
    matchAccount: matchPda,
    player: player1.publicKey,
  })
  .rpc();
```

### Vérifier le Progrès

```typescript
const progress = await program.methods
  .getMatchProgress(matchPda)
  .view();

console.log(`Score: P1(${progress.player1Score}) - P2(${progress.player2Score})`);
console.log(`Rounds restants: ${progress.roundsRemaining}`);
console.log(`Match point: ${progress.isMatchPoint}`);
```

## 📊 Statistiques et Métriques

### Métriques Suivies
- Nombre total de rounds joués
- Nombre d'égalités
- Temps moyen par round
- Historique des choix
- Patterns de jeu

### Events Émis

```rust
RoundCompleted {
    match_id: Pubkey,
    round_result: GameResult,
    is_final: bool,
    timestamp: i64,
}

DrawDetected {
    match_id: Pubkey,
    replay_required: bool,
    timestamp: i64,
}
```

## 🎮 Jeux Supportés

### Actuellement Implémentés
- ✅ Rock Paper Scissors (Multi-Round)
- 🔜 Dice (en développement)
- 🔜 Coin Flip (planifié)
- 🔜 High Card (planifié)

### Ajout de Nouveaux Jeux

Pour ajouter le support multi-rounds à un jeu :

1. Implémenter le trait `GameLogic`
2. Intégrer `RoundManager` dans la logique
3. Gérer les `RoundOutcome`
4. Émettre les events appropriés

## 🛡️ Sécurité

### Protections Implémentées
- ✅ Vérification des joueurs autorisés
- ✅ Protection contre la manipulation du score
- ✅ Timeout automatique pour joueurs inactifs
- ✅ Résolution déterministe des égalités
- ✅ Audit trail complet via events

### Considérations
- Les choix sont stockés de manière sécurisée
- Impossible de modifier l'historique des rounds
- Résolution forcée basée sur données on-chain

## 📈 Avantages du Système

### Pour les Joueurs
- 🎯 **Équité Maximale**: Plus de rounds = moins de chance
- ⚡ **Rejeu Rapide**: Pas d'attente en cas d'égalité
- 📊 **Transparence**: Score et historique visibles
- 🏆 **Tension**: Système de "match point"

### Pour la Plateforme
- 💰 **0% de Frais**: 100% des gains au vainqueur
- 🔄 **Engagement**: Matchs plus longs et engageants
- 📈 **Scalabilité**: Support de multiples formats
- 🎮 **Flexibilité**: Configuration par jeu

## 🚦 Statuts de Match

| Statut | Description |
|--------|-------------|
| `WaitingForOpponent` | En attente d'un adversaire |
| `InProgress` | Match en cours |
| `WaitingForMove` | En attente du choix d'un joueur |
| `ProcessingRound` | Traitement du round en cours |
| `DrawReplay` | Égalité détectée, rejeu requis |
| `Completed` | Match terminé |

## 🔮 Évolutions Futures

### Court Terme
- [ ] Support des tournois (brackets)
- [ ] Système de ranking ELO
- [ ] Modes de jeu personnalisés
- [ ] Statistiques détaillées par joueur

### Long Terme
- [ ] Intelligence artificielle pour détecter les patterns
- [ ] Système de paris sur les matchs en cours
- [ ] Replay et spectateur mode
- [ ] Cross-chain matches

## 📝 Exemple Complet

```typescript
// 1. Créer un match Best of 3
const matchId = Keypair.generate().publicKey;
await createMatch(matchId, "RPS", betAmount, 3);

// 2. Joueur 2 rejoint
await joinMatch(matchId, player2);

// 3. Jouer les rounds
for (let round = 1; round <= 3; round++) {
  // Choix des joueurs
  await playRound(matchId, player1, choice1);
  await playRound(matchId, player2, choice2);
  
  // Vérifier le résultat
  const outcome = await getRoundOutcome(matchId);
  
  if (outcome === "DrawRequiresReplay") {
    console.log("Égalité! Rejouez immédiatement.");
    round--; // Ne pas compter ce round
  } else if (outcome === "MatchWon") {
    console.log("Match terminé!");
    break;
  }
}

// 4. Réclamer les gains
await claimWinnings(matchId, winner);
```

## 💡 Tips pour les Développeurs

1. **Gestion d'État**: Toujours vérifier `round_state` avant `game_state`
2. **Events**: Écouter les events pour les mises à jour en temps réel
3. **Validation**: Valider les choix côté client avant envoi
4. **UX**: Afficher clairement le score et les rounds restants
5. **Performance**: Batch les transactions quand possible

---

*Ce système de manches multiples transforme les jeux simples en expériences compétitives engageantes, tout en maintenant l'équité et la transparence qui font la force de SolDuel.*