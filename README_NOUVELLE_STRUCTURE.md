# 🎮 SolDuel Platform - NOUVELLE STRUCTURE

## ✅ RÉORGANISATION COMPLÈTE TERMINÉE !

La structure du projet a été complètement réorganisée pour être plus claire et facile à naviguer.

## 📁 NOUVELLE ORGANISATION

```
platform/
│
├── 🎯 src/                     # CODE SOURCE PRINCIPAL
│   │
│   ├── 🎮 features/            # FONCTIONNALITÉS DE L'APPLICATION
│   │   ├── game-rps/           # → Jeu Rock Paper Scissors
│   │   ├── auth/               # → Authentification wallet
│   │   ├── leaderboard/        # → Classements
│   │   └── profile/            # → Profil utilisateur
│   │
│   ├── 🎨 components/          # COMPOSANTS RÉUTILISABLES
│   │   ├── common/             # → Composants génériques
│   │   ├── ui/                 # → Composants d'interface
│   │   └── layout/             # → Header, Footer, etc.
│   │
│   ├── ⚡ services/            # SERVICES EXTERNES
│   │   ├── anchor/             # → Client pour smart contracts
│   │   └── solana/             # → Intégration blockchain
│   │
│   ├── 🔧 hooks/               # React hooks personnalisés
│   ├── 📦 utils/               # Fonctions utilitaires
│   ├── 🎨 styles/              # Styles globaux
│   ├── 📝 types/               # Types TypeScript
│   └── ⚙️ config/              # Configuration
│
├── 🧪 tests/                    # TOUS LES TESTS
│   ├── unit/                   # → Tests unitaires
│   ├── integration/            # → Tests d'intégration
│   ├── e2e/                    # → Tests end-to-end
│   └── performance/            # → Tests de performance
│
├── 📚 docs/                     # DOCUMENTATION
│   ├── architecture/           # → Décisions techniques
│   ├── deployment/             # → Guides de déploiement
│   └── testing/                # → Documentation des tests
│
└── 🚀 programs/                 # SMART CONTRACTS SOLANA
    └── rps/                    # → Programme RPS
```

## 🎯 OÙ SE TROUVE CHAQUE CHOSE ?

### Le Jeu RPS
👉 `src/features/game-rps/`
- Tous les composants du jeu
- La logique du jeu (hooks)
- Les animations et sons

### L'Interface Utilisateur
👉 `src/components/`
- `layout/` → Header, Navigation, etc.
- `ui/` → Boutons, Modals, etc.
- `common/` → Composants partagés

### La Connexion Blockchain
👉 `src/services/`
- `anchor/` → Communication avec les smart contracts
- `solana/` → Gestion du wallet

### Les Tests
👉 `tests/`
- Organisés par type (unit, integration, e2e)

## 🚀 COMMANDES RAPIDES

```bash
# Développement
npm run dev

# Build
npm run build

# Tests
npm test
```

## 📍 FICHIERS IMPORTANTS

- **Application principale:** `src/App.tsx`
- **Point d'entrée:** `src/index.tsx`
- **Jeu RPS:** `src/features/game-rps/index.tsx`
- **Configuration:** `vite.config.ts`

## 💡 POUR S'Y RETROUVER

### Si vous cherchez...

- **🎮 Le code du jeu** → `src/features/game-rps/`
- **🎨 Un composant UI** → `src/components/`
- **⚡ La logique blockchain** → `src/services/anchor/`
- **🧪 Les tests** → `tests/`
- **📚 La documentation** → `docs/`
- **🚀 Le smart contract** → `programs/rps/`

## ✨ AVANTAGES DE LA NOUVELLE STRUCTURE

1. **Plus claire** - Chaque chose à sa place
2. **Plus modulaire** - Features indépendantes
3. **Plus maintenable** - Facile à modifier
4. **Plus scalable** - Prêt pour grandir

## 📝 FICHIERS DE NAVIGATION

- 📍 **NAVIGATION.md** - Guide détaillé de navigation
- 📋 **docs/PROJECT_STRUCTURE.md** - Architecture complète
- 📊 **docs/REORGANIZATION_SUMMARY.md** - Résumé des changements

---

🎉 **La nouvelle structure est maintenant en place et opérationnelle !**

Pour toute question, consultez `NAVIGATION.md` pour un guide détaillé.