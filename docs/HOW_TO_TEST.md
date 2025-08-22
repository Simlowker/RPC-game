# 🎮 Comment Tester la Plateforme Universal PvP

## 📍 Programme Déployé
- **Program ID**: `4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR`
- **Réseau**: Devnet
- **Status**: ✅ Déployé et actif

## 🚀 Options pour Tester

### Option 1: Tests via Scripts Anchor (Recommandé)

```bash
# 1. Assurez-vous d'être sur devnet
solana config set --url devnet

# 2. Vérifiez votre wallet
solana balance

# 3. Lancez les tests interactifs
npm test

# Ou exécutez le script de test spécifique
npx ts-node scripts/test-contract.ts
```

### Option 2: Interaction Directe via CLI

```bash
# Initialiser le registre (une seule fois)
anchor run initialize

# Enregistrer les jeux
anchor run register-rps
anchor run register-dice

# Créer un match
anchor run create-match
```

### Option 3: Tests Unitaires Complets

```bash
# Exécuter tous les tests
npm run test:devnet

# Tests spécifiques
npm run test:rps     # Test Rock-Paper-Scissors
npm run test:dice    # Test Dice game
npm run test:multi   # Test multi-rounds
```

## 🎯 Flux de Test Manuel

### 1️⃣ Initialisation (Premier déploiement uniquement)
```typescript
// Le registre doit être initialisé une seule fois
// Ceci créé le compte principal qui gère tous les jeux
await program.methods.initializeRegistry()
```

### 2️⃣ Enregistrer les Types de Jeux
```typescript
// Enregistrer Rock-Paper-Scissors
await program.methods.registerGame(
    { rockPaperScissors: {} },
    "Rock Paper Scissors"
)

// Enregistrer Dice
await program.methods.registerGame(
    { dice: {} },
    "Dice Game"
)
```

### 3️⃣ Créer un Match
```typescript
// Créer un match RPS avec mise de 0.1 SOL
const matchId = Keypair.generate();
await program.methods.createMatch(
    { rockPaperScissors: {} },
    new BN(0.1 * LAMPORTS_PER_SOL),
    5, // Best of 5 rounds
    null // Pas de token SPL
)
```

### 4️⃣ Rejoindre un Match
```typescript
// Un autre joueur rejoint le match
await program.methods.joinMatch()
    .accounts({
        match: matchPDA,
        player2: player2Wallet.publicKey,
    })
```

### 5️⃣ Jouer une Partie

**Phase 1: Commit (Engagement secret)**
```typescript
// Player 1 commit son choix (hashé)
const move = "rock";
const salt = "random123";
const commitment = hash(move + salt);
await program.methods.playMove(commitment, null)

// Player 2 fait de même
await program.methods.playMove(commitment2, null)
```

**Phase 2: Reveal (Révélation)**
```typescript
// Les deux joueurs révèlent leurs choix
await program.methods.revealMove(move, salt)
```

**Phase 3: Résultat**
```typescript
// Le round est automatiquement complété
// Le gagnant du match peut réclamer les gains
await program.methods.claimVictory()
```

## 🛠️ Commandes Utiles

### Vérifier l'État du Programme
```bash
# Voir les détails du programme
solana program show 4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR

# Voir vos transactions récentes
solana transaction-history

# Voir le solde de votre wallet
solana balance
```

### Explorer les Transactions
- **Solana Explorer**: https://explorer.solana.com/address/4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR?cluster=devnet
- Toutes les transactions sont visibles publiquement

## 🎮 Interface Web (À venir)

Pour l'instant, il n'y a pas d'interface web. Vous pouvez:

1. **Utiliser les scripts de test** (recommandé)
2. **Créer votre propre frontend** avec React/Next.js
3. **Utiliser le SDK TypeScript** pour intégrer dans votre app

### Exemple d'Intégration Frontend
```typescript
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { UniversalPvp } from "./idl/universal_pvp";

// Configuration
const PROGRAM_ID = "4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR";

// Connexion wallet (Phantom, Solflare, etc.)
const provider = new AnchorProvider(connection, wallet, {});
const program = new Program(IDL, PROGRAM_ID, provider);

// Créer un match
const createMatch = async () => {
    const matchId = Keypair.generate();
    await program.methods.createMatch(
        { rockPaperScissors: {} },
        new BN(100000000), // 0.1 SOL
        3, // Best of 3
        null
    ).rpc();
};
```

## 📊 Monitoring

### Vérifier l'État du Registre
```bash
# Le script de test affiche automatiquement:
# - Nombre de jeux enregistrés
# - Matchs actifs
# - Statistiques globales
```

### Logs en Temps Réel
```bash
# Suivre les logs du programme
solana logs 4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR
```

## ⚠️ Points Importants

1. **Devnet SOL**: Assurez-vous d'avoir des SOL devnet (gratuits via `solana airdrop 2`)
2. **Wallet**: Votre wallet doit être configuré pour devnet
3. **Frais**: Chaque transaction coûte ~0.001 SOL en frais
4. **Délais**: Les transactions prennent 1-2 secondes sur devnet

## 🆘 Problèmes Courants

### "Insufficient funds"
```bash
solana airdrop 2  # Obtenir 2 SOL gratuits sur devnet
```

### "Program not found"
Vérifiez que vous êtes sur devnet:
```bash
solana config get
# RPC URL doit être: https://api.devnet.solana.com
```

### "Transaction simulation failed"
- Vérifiez que le registre est initialisé
- Vérifiez que les jeux sont enregistrés
- Assurez-vous d'avoir assez de SOL

## 📝 Prochaines Étapes

1. **Tester les fonctionnalités de base** via les scripts
2. **Explorer les différents types de jeux** (RPS, Dice)
3. **Tester le système multi-rounds**
4. **Créer une interface web** pour une expérience utilisateur complète

---

**Besoin d'aide?** Consultez les logs avec `solana logs` ou vérifiez les transactions sur l'explorer!