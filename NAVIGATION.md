# 🗺️ GUIDE DE NAVIGATION - SolDuel Platform

## 📁 OÙ TROUVER QUOI ?

### 🎮 JEU RPS (Rock Paper Scissors)
📍 **Location:** `src/features/game-rps/`
- `index.tsx` - Composant principal du jeu
- `components/` - Tous les composants du jeu (MatchLobby, GameInterface, etc.)
- `hooks/` - Logique du jeu (useRPSGame)
- `sounds/` - Effets sonores
- `animations/` - Animations du jeu
- `types.ts` - Types TypeScript

### 🔐 AUTHENTIFICATION WALLET
📍 **Location:** `src/features/auth/`
- Connexion wallet Solana
- Gestion des sessions

### 🏆 CLASSEMENTS (LEADERBOARD)
📍 **Location:** `src/features/leaderboard/`
- `LeaderboardsModal.tsx` - Modal des classements
- `LeaderboardsModal.styles.ts` - Styles

### 👤 PROFIL UTILISATEUR
📍 **Location:** `src/features/profile/`
- `ProfilePage.tsx` - Page de profil

### 🎨 COMPOSANTS UI
📍 **Location:** `src/components/`
- `ui/` - Composants d'interface (boutons, modals, etc.)
  - `UI.tsx` - Composants UI principaux
- `layout/` - Mise en page
  - `Header.tsx` - En-tête de l'application
  - `Toasts.tsx` - Notifications
  - `TokenSelect.tsx` - Sélecteur de tokens
  - `UserButton.tsx` - Bouton utilisateur
  - `Game/` - Composants de jeu génériques
- `common/` - Composants réutilisables

### ⚡ SERVICES BLOCKCHAIN
📍 **Location:** `src/services/`
- `anchor/` - Client Anchor pour smart contracts
  - `anchor-client.ts` - Client principal
  - `types.ts` - Types Anchor
  - `utils.ts` - Utilitaires
- `solana/` - Intégration Solana

### 🔧 UTILITAIRES
📍 **Location:** `src/`
- `hooks/` - React hooks personnalisés
  - `useWalletBalance.ts` - Hook balance wallet
- `utils/` - Fonctions utilitaires
- `styles/` - Styles globaux
- `config/` - Configuration
  - `constants.ts` - Constantes de l'app

### 🧪 TESTS
📍 **Location:** `tests/`
- `unit/` - Tests unitaires
- `integration/` - Tests d'intégration
- `e2e/` - Tests end-to-end
- `performance/` - Tests de performance

### 📚 DOCUMENTATION
📍 **Location:** `docs/`
- `architecture/` - Décisions d'architecture
- `deployment/` - Guides de déploiement
- `testing/` - Documentation des tests
- `analysis/` - Analyses du code

### 🚀 SMART CONTRACTS
📍 **Location:** `programs/rps/`
- Programme Solana RPS

### ⚙️ CONFIGURATION
📍 **Location:** Racine du projet
- `vite.config.ts` - Configuration Vite
- `package.json` - Dépendances
- `tsconfig.json` - Configuration TypeScript

## 🎯 POINTS D'ENTRÉE PRINCIPAUX

1. **Application:** `src/App.tsx`
2. **Index:** `src/index.tsx`
3. **Jeu RPS:** `src/features/game-rps/index.tsx`
4. **Client Anchor:** `src/services/anchor/anchor-client.ts`

## 💡 RACCOURCIS UTILES

### Pour développer une nouvelle feature:
1. Créer un dossier dans `src/features/[ma-feature]/`
2. Ajouter `components/`, `hooks/`, `utils/` si nécessaire
3. Créer `index.tsx` et `types.ts`

### Pour ajouter un composant UI:
- Générique → `src/components/common/`
- Interface → `src/components/ui/`
- Layout → `src/components/layout/`

### Pour travailler sur le smart contract:
→ `programs/rps/src/lib.rs`

### Pour les tests:
- Unitaire → `tests/unit/[feature].test.ts`
- Intégration → `tests/integration/`
- E2E → `tests/e2e/`

## 🔍 RECHERCHE RAPIDE

```bash
# Trouver un composant
find src/components -name "*.tsx"

# Trouver une feature
ls src/features/

# Trouver un test
find tests -name "*.test.ts"

# Trouver un hook
ls src/hooks/
```

## ✨ STRUCTURE SIMPLIFIÉE

```
platform/
├── src/
│   ├── features/       # 🎮 Fonctionnalités (jeu, auth, profil...)
│   ├── components/     # 🎨 Composants UI
│   ├── services/       # ⚡ Services (Anchor, Solana)
│   ├── hooks/          # 🔗 React hooks
│   └── utils/          # 🔧 Utilitaires
├── tests/              # 🧪 Tous les tests
├── docs/               # 📚 Documentation
└── programs/           # 🚀 Smart contracts
```

---

📅 Dernière mise à jour: 2025-08-21
🎯 Objectif: Navigation facile et claire dans le projet