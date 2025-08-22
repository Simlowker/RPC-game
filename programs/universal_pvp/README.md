# 🎮 Universal PvP Platform - SolDuel

**Programme Solana universel pour jeux PvP avec 0% de frais**

## 🚀 Caractéristiques

- ✅ **0% de frais** - 100% du pot va au gagnant
- ✅ **Architecture universelle** - Un seul programme pour tous les jeux
- ✅ **Extensible** - Ajoutez facilement de nouveaux jeux
- ✅ **Sécurisé** - PDAs et validation on-chain
- ✅ **Multi-tokens** - Support SOL et SPL tokens
- ✅ **Système de litiges** - Résolution des conflits

## 📦 Jeux Supportés

### 1. Rock Paper Scissors ✊✋✌️
- Jeu classique Pierre-Papier-Ciseaux
- Système commit-reveal pour sécurité
- Support des paris de 0.01 à 100 SOL

### 2. Dice Game 🎲
- Lancer de deux dés (2-12)
- Plus haut score gagne
- Support multi-rounds
- Génération aléatoire basée sur la blockchain

### Futurs Jeux (Extensible)
- CoinFlip (Pile ou Face)
- HighCard (Carte haute)
- Custom games via GameType::Custom(id)

## 🏗️ Architecture

```rust
UniversalMatch {
    match_id: Pubkey,
    game_type: GameType,
    creator: Pubkey,
    opponent: Option<Pubkey>,
    bet_amount: u64,
    total_pot: u64,  // 0% fees!
    status: MatchStatus,
    winner: Option<Pubkey>,
}
```

## 📋 Instructions

### Initialisation
- `initialize_registry` - Initialise le registre de jeux
- `register_game` - Enregistre un nouveau type de jeu

### Gameplay
- `create_universal_match` - Crée un nouveau match
- `join_match` - Rejoint un match existant
- `submit_move` - Soumet un mouvement
- `settle_match` - Détermine le gagnant
- `claim_winnings` - Réclame les gains (100% du pot!)

### Gestion
- `cancel_match` - Annule un match (timeout/pas d'opposant)
- `dispute_match` - Dispute un résultat
- `resolve_dispute` - Résout un litige (admin)

## 💻 Installation

```bash
# Clone le repository
git clone https://github.com/yourusername/solduel-platform

# Install dependencies
npm install

# Build le programme
anchor build

# Run tests
anchor test
```

## 🚀 Déploiement

### Localnet
```bash
anchor deploy
```

### Devnet
```bash
anchor deploy --provider.cluster devnet
```

### Mainnet
```bash
# Remplacez le Program ID dans lib.rs
anchor deploy --provider.cluster mainnet
```

## 💰 Économie

- **Coût de déploiement** : ~2 SOL (une fois)
- **Frais de transaction** : ~0.00025 SOL par opération
- **Commission plateforme** : **0%** (100% au gagnant!)
- **Paris minimum** : 0.005 SOL (configurable)
- **Paris maximum** : 1000 SOL (configurable)

## 🧪 Tests

```bash
# Run all tests
anchor test

# Run specific test
anchor test -- --grep "Rock Paper Scissors"

# Test sur devnet
anchor test --provider.cluster devnet
```

## 📊 Exemple d'Utilisation

```typescript
// Créer un match RPS
const betAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
await program.methods
  .createUniversalMatch(
    { rockPaperScissors: {} },
    betAmount,
    gameConfig
  )
  .accounts({...})
  .rpc();

// Joindre le match
await program.methods
  .joinMatch()
  .accounts({...})
  .rpc();

// Soumettre un mouvement
const move = Buffer.from([0]); // Rock
await program.methods
  .submitMove(move)
  .accounts({...})
  .rpc();

// Régler le match
await program.methods
  .settleMatch()
  .accounts({...})
  .rpc();

// Réclamer les gains (100% du pot!)
await program.methods
  .claimWinnings()
  .accounts({...})
  .rpc();
```

## 🔒 Sécurité

- ✅ PDAs pour sécuriser les fonds
- ✅ Validation on-chain des mouvements
- ✅ Système de timeout pour éviter les blocages
- ✅ Commit-reveal pour RPS
- ✅ Génération aléatoire basée sur la blockchain
- ✅ Système de litiges avec résolution admin

## 🛣️ Roadmap

- [x] Programme universel de base
- [x] Rock Paper Scissors
- [x] Dice Game
- [x] Système de litiges
- [x] Tests complets
- [ ] CoinFlip
- [ ] HighCard
- [ ] Tournois multi-joueurs
- [ ] Système de récompenses
- [ ] SDK TypeScript

## 📝 License

MIT

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md)

## 📧 Contact

- Twitter: [@SolDuel](https://twitter.com/solduel)
- Discord: [SolDuel Community](https://discord.gg/solduel)

---

**Built with ❤️ for the Solana community - 0% fees, 100% fun!**