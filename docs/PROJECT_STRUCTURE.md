# 📁 Structure du Projet SolDuel Platform

## 🎯 Organisation Proposée

```
platform/
├── 📱 src/                      # Code source principal
│   ├── components/              # Composants réutilisables
│   │   ├── common/             # Composants génériques
│   │   ├── ui/                # Composants UI (boutons, modals, etc.)
│   │   └── layout/             # Composants de mise en page
│   ├── features/               # Fonctionnalités par domaine
│   │   ├── auth/              # Authentification wallet
│   │   ├── game-rps/          # Jeu Rock Paper Scissors
│   │   ├── leaderboard/       # Classements
│   │   └── profile/           # Profil utilisateur
│   ├── hooks/                  # React hooks personnalisés
│   ├── services/               # Services et API clients
│   │   ├── solana/            # Intégration Solana
│   │   └── anchor/            # Client Anchor
│   ├── utils/                  # Utilitaires et helpers
│   ├── styles/                 # Styles globaux et thème
│   ├── types/                  # Types TypeScript
│   └── config/                 # Configuration application
│
├── 📦 programs/                 # Smart contracts Solana
│   └── rps/                    # Programme RPS
│       ├── src/               
│       └── tests/             
│
├── 🧪 tests/                    # Tests
│   ├── unit/                   # Tests unitaires
│   ├── integration/            # Tests d'intégration
│   ├── e2e/                    # Tests end-to-end
│   └── performance/            # Tests de performance
│
├── 📚 docs/                     # Documentation
│   ├── api/                    # Documentation API
│   ├── architecture/           # Architecture technique
│   ├── deployment/             # Guides de déploiement
│   └── user-guides/            # Guides utilisateur
│
├── 🔧 scripts/                  # Scripts utilitaires
│   ├── build/                  # Scripts de build
│   ├── deploy/                 # Scripts de déploiement
│   └── dev/                    # Scripts de développement
│
├── 🎨 public/                   # Assets publics
│   ├── images/                 
│   ├── sounds/                 
│   └── fonts/                  
│
├── ⚙️ config/                   # Configuration projet
│   ├── vite/                   # Config Vite
│   ├── typescript/             # Config TypeScript
│   └── solana/                 # Config Solana
│
└── 🤖 .claude/                  # Configuration Claude Code
    ├── commands/               
    └── agents/                 
```

## 🚀 Structure Actuelle vs Proposée

### Problèmes Actuels
- ❌ Fichiers éparpillés à la racine
- ❌ Dossiers dupliqués (rps-game, anchor-escrow-2025)
- ❌ Organisation peu claire des composants
- ❌ Tests mélangés avec le code source

### Améliorations Proposées
- ✅ Organisation par fonctionnalités (features)
- ✅ Séparation claire code/tests/docs
- ✅ Structure modulaire et scalable
- ✅ Conventions de nommage cohérentes

## 📋 Plan de Réorganisation

### Phase 1: Préparation
1. Sauvegarder l'état actuel
2. Créer la nouvelle structure de dossiers
3. Identifier les dépendances

### Phase 2: Migration Code Source
1. Déplacer les composants vers `src/components/`
2. Organiser par features dans `src/features/`
3. Centraliser les services dans `src/services/`
4. Regrouper les hooks dans `src/hooks/`

### Phase 3: Migration Tests
1. Séparer tests unitaires et intégration
2. Déplacer vers structure `tests/`
3. Mettre à jour les chemins d'import

### Phase 4: Configuration
1. Consolider les fichiers de config
2. Mettre à jour les scripts
3. Nettoyer les dossiers obsolètes

### Phase 5: Documentation
1. Mettre à jour les README
2. Créer guide de contribution
3. Documenter la nouvelle structure

## 🔄 Mapping des Déplacements

| Ancien Chemin | Nouveau Chemin | Raison |
|--------------|----------------|---------|
| `/src/games/RPS/` | `/src/features/game-rps/` | Organisation par feature |
| `/src/sections/` | `/src/components/layout/` | Clarification du rôle |
| `/src/rps-client/` | `/src/services/anchor/` | Centralisation services |
| `/rps-game/programs/` | `/programs/rps/` | Simplification structure |
| `/tests/*.test.ts` | `/tests/[type]/` | Organisation par type de test |

## ⚡ Commandes de Migration

```bash
# Créer nouvelle structure
mkdir -p src/features/{auth,game-rps,leaderboard,profile}
mkdir -p src/components/{common,ui,layout}
mkdir -p src/services/{solana,anchor}
mkdir -p tests/{unit,integration,e2e,performance}

# Déplacer les fichiers (exemples)
mv src/games/RPS/* src/features/game-rps/
mv src/sections/* src/components/layout/
mv src/rps-client/* src/services/anchor/
```

## 🎯 Bénéfices Attendus

1. **Maintenabilité** - Code plus facile à naviguer et maintenir
2. **Scalabilité** - Structure prête pour l'ajout de nouvelles features
3. **Clarté** - Rôle de chaque dossier immédiatement compréhensible
4. **Performance** - Build optimisé avec structure modulaire
5. **Collaboration** - Plus facile pour nouveaux développeurs

## 📝 Notes

- La réorganisation sera faite progressivement
- Tous les imports seront mis à jour automatiquement
- Les tests seront exécutés après chaque phase
- Un backup complet sera créé avant de commencer