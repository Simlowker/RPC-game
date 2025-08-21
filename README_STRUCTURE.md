# 🏗️ Guide de Structure - SolDuel Platform

## 📁 Organisation du Projet

Le projet est organisé selon une architecture modulaire pour faciliter la maintenance et l'évolution.

### 🎯 Structure Principale

```
src/
├── features/       # Fonctionnalités métier (game-rps, auth, profile, etc.)
├── components/     # Composants réutilisables
├── services/       # Services et intégrations externes
├── hooks/          # React hooks personnalisés
├── utils/          # Fonctions utilitaires
├── styles/         # Styles et thèmes globaux
├── types/          # Types TypeScript partagés
└── config/         # Configuration application
```

## 📦 Dossiers Principaux

### `/src/features/`
Chaque feature est autonome avec ses propres composants, hooks et logique.

**Exemple : game-rps/**
- `components/` - Composants spécifiques au jeu RPS
- `hooks/` - Logique métier du jeu
- `types.ts` - Types TypeScript du jeu
- `index.tsx` - Point d'entrée de la feature

### `/src/components/`
Composants réutilisables dans toute l'application.

- `common/` - Composants génériques (Button, Card, etc.)
- `ui/` - Composants d'interface (Modal, Tooltip, etc.)
- `layout/` - Composants de mise en page (Header, Footer, etc.)

### `/src/services/`
Services pour les intégrations externes.

- `anchor/` - Client Anchor pour interagir avec les smart contracts
- `solana/` - Utilitaires Solana (wallet, transactions, etc.)

## 🚀 Import Guidelines

### Imports de Features
```typescript
import { RPSGame } from '@/features/game-rps';
import { ProfilePage } from '@/features/profile';
```

### Imports de Composants
```typescript
import { Button, Card } from '@/components/common';
import { Modal } from '@/components/ui';
import { Header } from '@/components/layout';
```

### Imports de Services
```typescript
import { anchorClient } from '@/services/anchor';
import { walletUtils } from '@/services/solana';
```

## 📝 Conventions

### Nommage des Fichiers
- Composants : `PascalCase.tsx` (ex: `GameCard.tsx`)
- Hooks : `camelCase.ts` (ex: `useGameState.ts`)
- Utils : `camelCase.ts` (ex: `formatters.ts`)
- Types : `types.ts` ou `[feature].types.ts`

### Structure d'une Feature
```
feature-name/
├── components/          # Composants de la feature
├── hooks/              # Hooks spécifiques
├── utils/              # Utilitaires locaux
├── types.ts            # Types TypeScript
├── constants.ts        # Constantes
├── index.tsx           # Point d'entrée
└── README.md          # Documentation
```

## 🔄 Migration depuis l'Ancienne Structure

| Ancien | Nouveau |
|--------|---------|
| `/src/games/RPS/` | `/src/features/game-rps/` |
| `/src/sections/` | `/src/components/layout/` |
| `/src/rps-client/` | `/src/services/anchor/` |
| `/src/components/UI.tsx` | `/src/components/ui/` |

## 🧪 Tests

Les tests suivent la même structure que le code source :

```
tests/
├── unit/           # Tests unitaires par feature
├── integration/    # Tests d'intégration
├── e2e/           # Tests end-to-end
└── performance/   # Tests de performance
```

## 📚 Documentation

```
docs/
├── api/           # Documentation API
├── architecture/  # Décisions architecturales
├── deployment/    # Guides de déploiement
└── user-guides/   # Guides utilisateur
```

## ⚡ Scripts Utiles

```bash
# Développement
npm run dev          # Lance le serveur de développement

# Build
npm run build        # Build de production

# Tests
npm run test         # Lance tous les tests
npm run test:unit    # Tests unitaires uniquement
npm run test:e2e     # Tests end-to-end

# Linting
npm run lint         # Vérifie le code
npm run lint:fix     # Corrige automatiquement
```

## 🎯 Avantages de cette Structure

1. **Modularité** - Chaque feature est indépendante
2. **Réutilisabilité** - Composants partagés centralisés
3. **Maintenabilité** - Code organisé et facile à naviguer
4. **Scalabilité** - Facile d'ajouter de nouvelles features
5. **Testabilité** - Structure claire pour les tests

## 📈 Prochaines Étapes

1. ✅ Migration progressive des fichiers
2. ⏳ Mise à jour des imports
3. ⏳ Tests de régression
4. ⏳ Documentation des features
5. ⏳ Optimisation des bundles

---

Pour toute question sur la structure, consultez `/docs/architecture/` ou créez une issue.