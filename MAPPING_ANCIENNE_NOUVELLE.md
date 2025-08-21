# 🔄 MAPPING : ANCIENNE → NOUVELLE STRUCTURE

## 📍 TABLEAU DE CORRESPONDANCE

| 🔴 ANCIENNE LOCATION | 🟢 NOUVELLE LOCATION | 📝 DESCRIPTION |
|----------------------|---------------------|----------------|
| `/src/games/RPS/` | `/src/features/game-rps/` | Jeu Rock Paper Scissors |
| `/src/games/RPS/components/` | `/src/features/game-rps/components/` | Composants du jeu |
| `/src/games/RPS/hooks/` | `/src/features/game-rps/hooks/` | Hooks du jeu |
| `/src/games/RPS/sounds/` | `/src/features/game-rps/sounds/` | Effets sonores |
| `/src/games/RPS/animations/` | `/src/features/game-rps/animations/` | Animations |
| `/src/rps-client/` | `/src/services/anchor/` | Client Anchor |
| `/src/sections/Header.tsx` | `/src/components/layout/Header.tsx` | En-tête |
| `/src/sections/UserButton.tsx` | `/src/components/layout/UserButton.tsx` | Bouton utilisateur |
| `/src/sections/TokenSelect.tsx` | `/src/components/layout/TokenSelect.tsx` | Sélecteur tokens |
| `/src/sections/Toasts.tsx` | `/src/components/layout/Toasts.tsx` | Notifications |
| `/src/sections/LeaderBoard/` | `/src/features/leaderboard/` | Classements |
| `/src/sections/Game/` | `/src/components/layout/Game/` | Composants jeu génériques |
| `/src/pages/ProfilePage.tsx` | `/src/features/profile/ProfilePage.tsx` | Page profil |
| `/src/pages/HomePage.tsx` | `/src/features/home/HomePage.tsx` | Page accueil |
| `/src/pages/HelpPage.tsx` | `/src/features/help/HelpPage.tsx` | Page aide |
| `/src/components/UI.tsx` | `/src/components/ui/UI.tsx` | Composants UI |
| `/src/hooks/` | `/src/hooks/` | Hooks (pas de changement) |
| `/src/utils.ts` | `/src/utils/utils.ts` | Utilitaires |
| `/src/styles.ts` | `/src/styles/styles.ts` | Styles globaux |
| `/src/constants.ts` | `/src/config/constants.ts` | Constantes |

## 🔄 MISE À JOUR DES IMPORTS

### Avant (❌)
```typescript
import { RPSGame } from '../../../games/RPS';
import { useRPSGame } from '../../../games/RPS/hooks/useRPSGame';
import { anchorClient } from '../../rps-client/anchor-client';
import { Header } from '../../sections/Header';
```

### Après (✅)
```typescript
import { RPSGame } from '@/features/game-rps';
import { useRPSGame } from '@/features/game-rps/hooks/useRPSGame';
import { anchorClient } from '@/services/anchor/anchor-client';
import { Header } from '@/components/layout/Header';
```

## 📂 DOSSIERS SUPPRIMÉS

Ces dossiers n'existent plus :
- ❌ `/src/games/`
- ❌ `/src/sections/`
- ❌ `/src/rps-client/`
- ❌ `/src/pages/`

## 📂 NOUVEAUX DOSSIERS

Ces dossiers ont été créés :
- ✅ `/src/features/` - Toutes les fonctionnalités
- ✅ `/src/services/` - Services externes
- ✅ `/src/components/common/` - Composants génériques
- ✅ `/src/components/ui/` - Composants d'interface
- ✅ `/src/components/layout/` - Composants de mise en page

## 💡 CONSEILS POUR LA MIGRATION

1. **Rechercher et remplacer** les anciens chemins d'import
2. **Vérifier** que tous les fichiers sont bien déplacés
3. **Tester** l'application après chaque modification
4. **Utiliser** les alias TypeScript (@/) pour des imports plus courts

## 🔍 COMMANDES UTILES

```bash
# Trouver les anciens imports à mettre à jour
grep -r "from.*games/RPS" src/
grep -r "from.*rps-client" src/
grep -r "from.*sections" src/

# Vérifier la nouvelle structure
ls -la src/features/
ls -la src/components/
ls -la src/services/
```

---

📅 Migration effectuée le : 2025-08-21
✅ Structure complètement réorganisée et opérationnelle