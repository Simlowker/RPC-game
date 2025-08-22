# 🎮 PROMPT 1: Implémentation Complète du Client RPS Solana

## Contexte
J'ai une plateforme de jeu Rock Paper Scissors (RPS) déployée sur Solana Devnet avec 0% de frais. Le smart contract est DÉJÀ déployé et fonctionnel, mais l'interface web nécessite l'implémentation complète du client pour interagir avec le programme on-chain.

## Informations Techniques

### Smart Contract (NE PAS MODIFIER)
- **Program ID**: `4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR`
- **Network**: Solana Devnet
- **Status**: ✅ Déployé et fonctionnel
- **Explorer**: https://explorer.solana.com/address/4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR?cluster=devnet

### Architecture du Programme
Le programme Universal PvP utilise:
- Mécanisme commit-reveal pour sécuriser les choix
- Système de vault PDA pour gérer les fonds
- Support multi-rounds (Best of 3/5/7)
- 0% de frais - le gagnant prend tout

### Instructions du Programme
1. `create_match` - Créer un nouveau match avec mise
2. `join_match` - Rejoindre un match existant
3. `reveal` - Révéler son choix après commit
4. `settle` - Régler le match et distribuer les gains
5. `claim_winnings` - Réclamer les gains (si applicable)

## Travail à Réaliser

### 1. Implémenter le Client Anchor Complet (`/src/services/anchor/`)

```typescript
// Créer/Mettre à jour anchor-client.ts avec:
- Connection Anchor Provider correcte
- Initialisation du programme avec IDL
- Gestion des comptes PDA (vault, match, player stats)
- Serialization/Deserialization des données
```

### 2. Implémenter les Fonctions de Jeu (`/src/features/game-rps/`)

#### A. Création de Match
```typescript
async function createMatch(betAmount: number, rounds: number) {
  // 1. Générer keypair pour le match
  // 2. Créer le commitment hash du choix initial
  // 3. Calculer les PDAs (vault, stats)
  // 4. Construire et envoyer la transaction
  // 5. Confirmer et retourner l'ID du match
}
```

#### B. Rejoindre un Match
```typescript
async function joinMatch(matchId: PublicKey, choice: Choice) {
  // 1. Récupérer les données du match
  // 2. Vérifier l'éligibilité (deadline, montant)
  // 3. Créer commitment pour le choix
  // 4. Envoyer transaction avec mise
  // 5. Confirmer la participation
}
```

#### C. Révéler le Choix
```typescript
async function revealChoice(matchId: PublicKey, choice: Choice, salt: Uint8Array) {
  // 1. Vérifier la période de reveal
  // 2. Construire la preuve (choice + salt + nonce)
  // 3. Envoyer la transaction reveal
  // 4. Mettre à jour l'état local
}
```

#### D. Régler le Match
```typescript
async function settleMatch(matchId: PublicKey) {
  // 1. Vérifier que les deux choix sont révélés
  // 2. Déterminer le gagnant
  // 3. Envoyer transaction settle
  // 4. Distribuer les fonds (0% fees)
}
```

### 3. Gestion d'État et Hooks React

#### useRPSGame.ts - Hook Principal
```typescript
- État du match actuel
- Liste des matchs ouverts
- Historique des matchs du joueur
- Gestion des commits/reveals
- Polling pour mises à jour temps réel
- Gestion des erreurs et retry logic
```

#### useWalletRPS.ts - Intégration Wallet
```typescript
- Connection/déconnection Phantom
- Signature des transactions
- Gestion du balance SOL
- Auto-refresh après transactions
```

### 4. Composants à Implémenter/Compléter

#### MatchLobby.tsx
- Liste en temps réel des matchs ouverts
- Filtrage par mise min/max
- Indicateur de temps restant pour join
- Bouton "Quick Join" pour match aléatoire

#### GameBoard.tsx
- Interface de jeu interactive
- Animation des choix (Rock/Paper/Scissors)
- Timer pour phase de reveal
- Affichage du résultat avec animations

#### TransactionHistory.tsx
- Historique des matchs joués
- Statistiques (W/L ratio, gains totaux)
- Export en CSV
- Liens vers explorer

### 5. Fonctionnalités Critiques

#### Sécurité Commit-Reveal
```typescript
// Générer et stocker localement:
- Salt aléatoire (32 bytes)
- Nonce unique
- Hash = sha256(choice + salt + player + nonce)
// Stocker en localStorage jusqu'au reveal
```

#### Gestion des Timeouts
```typescript
- Auto-claim si l'adversaire timeout
- Annulation si pas d'adversaire
- Remboursement automatique si erreur
```

#### Real-time Updates
```typescript
- WebSocket subscription aux matchs
- Polling toutes les 2 secondes en jeu
- Notifications push pour événements
```

### 6. Gestion des Erreurs

Implémenter une gestion robuste pour:
- Insufficient funds
- Transaction timeout
- Network errors
- Invalid match state
- Wallet disconnection
- RPC rate limits

### 7. Tests à Implémenter

```typescript
// Tests unitaires
- Génération commitment hash
- Calcul des PDAs
- Détermination du gagnant

// Tests d'intégration
- Création → Join → Reveal → Settle flow
- Gestion des timeouts
- Remboursements
```

## Structure des Fichiers

```
/src
├── services/
│   ├── anchor/
│   │   ├── anchor-client.ts       # Client Anchor principal
│   │   ├── idl.ts                 # IDL du programme
│   │   ├── types.ts               # Types TypeScript
│   │   └── utils.ts               # Helpers (PDA, hash, etc.)
│   └── solana/
│       ├── connection.ts          # Configuration RPC
│       └── wallet.ts              # Wallet adapter
├── features/
│   └── game-rps/
│       ├── hooks/
│       │   ├── useRPSGame.ts     # Hook principal du jeu
│       │   ├── useMatchList.ts   # Liste des matchs
│       │   └── useWalletRPS.ts   # Intégration wallet
│       ├── components/
│       │   ├── GameBoard.tsx     # Plateau de jeu
│       │   ├── MatchLobby.tsx    # Lobby des matchs
│       │   ├── MatchCard.tsx     # Carte de match
│       │   └── ResultModal.tsx   # Modal de résultat
│       └── utils/
│           ├── commitment.ts     # Logique commit-reveal
│           ├── gameLogic.ts      # Règles du jeu
│           └── storage.ts        # LocalStorage helper
```

## Contraintes Importantes

1. **NE PAS modifier le smart contract** - Il est déjà déployé
2. **Utiliser Anchor v0.29.0** pour compatibilité
3. **Gérer les montants en lamports** (1 SOL = 1e9 lamports)
4. **Stocker les secrets localement** jusqu'au reveal
5. **0% de frais** - Toujours afficher "Winner takes all"
6. **Devnet uniquement** pour l'instant

## Résultat Attendu

Une interface web complètement fonctionnelle où les utilisateurs peuvent:
1. ✅ Connecter leur wallet Phantom
2. ✅ Créer des matchs avec mise en SOL
3. ✅ Rejoindre des matchs existants
4. ✅ Jouer Rock, Paper ou Scissors
5. ✅ Révéler leur choix au bon moment
6. ✅ Réclamer leurs gains (100% de la mise totale)
7. ✅ Voir l'historique de leurs matchs

## Ressources

- **Programme déployé**: `4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR`
- **RPC Endpoint**: `https://api.devnet.solana.com`
- **Frontend actuel**: https://solduel-rps.vercel.app/
- **Chemin projet**: `/Users/simeonfluck/teste 3/platform/`

## Notes Finales

Le frontend HTML de demo fonctionne mais montre "This feature requires full client implementation" quand on essaie de créer/rejoindre un match. L'objectif est d'implémenter toutes les interactions on-chain pour que les utilisateurs puissent vraiment jouer et gagner des SOL (de test sur Devnet).

Priorité: Faire fonctionner le flow complet Create → Join → Play → Win → Claim avec de vraies transactions on-chain.