# 🎨 PROMPT 2: Amélioration Complète UI/UX SolDuel RPS

## Contexte
J'ai une plateforme de jeu Rock Paper Scissors sur Solana avec 0% de frais. L'interface actuelle est fonctionnelle mais basique (HTML simple). Je veux une refonte complète pour créer une expérience moderne, engageante et professionnelle qui rivalise avec les meilleures plateformes de gaming Web3.

## Vision du Produit

### Identité de Marque
- **Nom**: SolDuel
- **Tagline**: "0% Fees - Winner Takes All"
- **Valeurs**: Fair play, Transparence, Innovation, Communauté
- **Public cible**: Gamers Web3, Degen traders, Solana community

### Inspiration Design
- **Style visuel**: Modern, Dark mode, Néon/Cyberpunk avec touches purple/blue
- **Références**: 
  - Gamba.so (animations fluides)
  - Polymarket (données claires)
  - Blur.io (interface pro)
  - CS:GO gambling sites (engagement)

## Travail de Design à Réaliser

### 1. Design System Complet

#### Palette de Couleurs
```css
/* Mode Sombre (par défaut) */
--primary: #7C3AED (Purple vibrant)
--secondary: #06B6D4 (Cyan électrique)
--accent: #F59E0B (Orange doré)
--success: #10B981 (Vert victoire)
--danger: #EF4444 (Rouge défaite)
--background: #0F0F23 (Noir profond)
--surface: #1A1A2E (Gris foncé)
--text-primary: #FFFFFF
--text-secondary: #9CA3AF

/* Mode Clair (optionnel) */
--light-variations...
```

#### Typographie
```css
/* Titres: Font gaming moderne */
font-family: 'Orbitron', 'Bebas Neue', sans-serif;

/* Corps: Lisibilité optimale */
font-family: 'Inter', 'Roboto', sans-serif;

/* Chiffres/Stats: Monospace */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

#### Composants UI
- Boutons avec effets hover néon
- Cards avec glassmorphism
- Modals avec backdrop blur
- Tooltips informatifs
- Badges animés
- Loading states créatifs

### 2. Pages à Designer

#### A. Landing Page (/)
```
HERO SECTION
- Logo animé SolDuel
- Tagline "0% FEES" en gros avec effet glow
- Stats en temps réel (matchs actifs, volume 24h, joueurs en ligne)
- CTA: "Play Now" et "Connect Wallet"
- Animation de fond (particules, gradients animés)

FEATURES SECTION
- 3 cards illustrées:
  * 0% Fees (icône money)
  * Instant Payouts (icône lightning)
  * Provably Fair (icône shield)

GAME MODES
- RPS (actif)
- Coming Soon: Dice, Coin Flip, High Card
- Roadmap timeline

LEADERBOARD PREVIEW
- Top 5 joueurs
- Biggest wins today
- Link vers page complète

FOOTER
- Social links
- Documentation
- Audit reports
```

#### B. Game Lobby (/play)
```
HEADER FIXE
- Logo SolDuel (retour home)
- Balance wallet avec refresh animation
- Network indicator (Devnet/Mainnet)
- Profile dropdown
- Settings (son, notifications)

SIDEBAR GAUCHE
- Game selector (RPS selected)
- Quick stats du joueur
- Match history (5 derniers)
- Friends online

ZONE PRINCIPALE
- Create Match card (prominent)
  * Bet amount slider (0.01 - 100 SOL)
  * Rounds selector (1, 3, 5, 7)
  * Private/Public toggle
  * Create button avec loading state

- Active Matches grid
  * Cards avec:
    - Créateur avatar + username
    - Mise et rounds
    - Timer countdown
    - Join button animé
  * Filtres: By stake, By rounds, Friends only
  * Sorting: Newest, Highest stake, Ending soon

SIDEBAR DROITE
- Chat global (collapsible)
- Notifications feed
- Promotional banner
```

#### C. Game Interface (/game/:matchId)
```
GAME HEADER
- Match ID avec copy button
- Prize pool display (animated counter)
- Round indicator (Round 2/5)
- Timer prominent (30s countdown)

ZONE DE JEU CENTRALE
- Adversaire en haut
  * Avatar + username
  * Status (Choosing.../Revealed)
  * Wins indicator (●●○)

- Zone de combat au centre
  * Animations 3D des mains
  * VS divider animé
  * Effects particules sur action

- Joueur en bas
  * 3 choix interactifs (Rock/Paper/Scissors)
  * Hover effects avec preview
  * Confirmation modal
  * Wins indicator

SIDEBAR
- Round history
- Chat de match
- Spectateurs count
- Share match button

RESULT MODAL
- Animation victoire/défaite
- Gains affichés en gros
- Replay button
- Share result
- Return to lobby
```

#### D. Profile Page (/profile/:address)
```
HEADER PROFILE
- Avatar NFT ou Identicon
- Username/ENS
- Wallet address (truncated)
- Join date
- Badges earned

STATS OVERVIEW
- Cards avec graphs:
  * Total games
  * Win rate %
  * Total earnings
  * Favorite game
  * Best streak
  * Biggest win

MATCH HISTORY
- Table/List view toggle
- Colonnes: Date, Game, Opponent, Result, Earnings
- Filters: Game type, Date range, Result
- Export CSV
- Pagination

ACHIEVEMENTS
- Grid de badges
- Progress bars
- Locked/Unlocked states
- Rarity indicators

SETTINGS (si own profile)
- Change username
- Avatar upload
- Notification preferences
- Privacy settings
```

#### E. Leaderboard (/leaderboard)
```
FILTERS TABS
- Daily | Weekly | Monthly | All-time
- By Game: All | RPS | Dice | etc.

LEADERBOARD TABLE
- Rank (with medal icons for top 3)
- Player (avatar + name)
- Games played
- Win rate
- Total earnings
- Profit graph sparkline
- View profile link

SIDEBAR STATS
- Total volume card
- Active players card
- Games today card
- Biggest win card
```

### 3. Composants Interactifs

#### Animations & Micro-interactions
```javascript
// Exemples d'animations à implémenter:

1. Button Hover
- Scale 1.05
- Glow effect
- Sound effect (optional)

2. Card Hover
- Lift shadow
- Border glow
- Content reveal

3. Win Animation
- Confetti explosion
- Coin rain
- Screen shake
- Victory sound

4. Choice Selection (RPS)
- Hand emerge animation
- Particle trail
- Pulse effect
- Lock-in sound

5. Countdown Timer
- Color change (green → yellow → red)
- Pulse intensification
- Warning sound at 5s

6. Balance Update
- Counter animation
- +/- indicator float
- Glow on change

7. Match Creation
- Card flip animation
- Progress steps
- Success checkmark

8. Network Indicator
- Pulse animation
- Color by latency
- Reconnection spinner
```

#### Sound Design
```
- Ambient: Subtle electronic background
- Button clicks: Soft mechanical
- Game start: Energetic chime
- Choice lock: Satisfying click
- Countdown: Ticking intensifies
- Win: Victory fanfare
- Loss: Subtle defeat sound
- Transaction: Coin sound
- Notification: Gentle ping
```

### 4. Responsive Design

#### Breakpoints
```css
/* Mobile First Approach */
- Mobile: 320px - 767px
- Tablet: 768px - 1023px  
- Desktop: 1024px - 1439px
- Wide: 1440px+
```

#### Mobile Specific
- Bottom navigation bar
- Swipe gestures for game choices
- Fullscreen game mode
- Simplified lobby view
- Touch-optimized buttons (min 44px)
- Drawer menus
- PWA capabilities

### 5. États et Feedback

#### Loading States
- Skeleton screens
- Shimmer effects
- Progress bars
- Spinning loaders with context
- Optimistic UI updates

#### Error States
- Inline error messages
- Toast notifications
- Modal alerts for critical
- Retry mechanisms
- Fallback UI

#### Empty States
- Illustrated placeholders
- Clear CTAs
- Helpful messages
- Onboarding hints

### 6. Fonctionnalités UX Avancées

#### Onboarding Flow
1. Welcome modal avec video intro
2. Wallet connection guide
3. Free play mode tutorial
4. First match assistance
5. Achievement unlock celebration

#### Social Features
- Friends list
- Private matches
- Spectator mode
- Match replay
- Share on Twitter
- Tournament brackets

#### Gamification
- XP system
- Level progression
- Daily quests
- Achievement badges
- Leaderboard seasons
- Reward chests

#### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode
- Reduced motion option
- Font size controls

### 7. Technologies à Utiliser

#### Frontend Stack
```json
{
  "framework": "React 18 + TypeScript",
  "styling": "TailwindCSS + Framer Motion",
  "state": "Zustand + React Query",
  "routing": "React Router v6",
  "ui-library": "Shadcn/ui + Radix UI",
  "animations": "Framer Motion + Lottie",
  "charts": "Recharts + Visx",
  "web3": "@solana/wallet-adapter-react",
  "icons": "Lucide + Phosphor Icons",
  "sounds": "Howler.js",
  "notifications": "React Hot Toast"
}
```

#### Performance
- Code splitting par route
- Lazy loading des images
- WebP avec fallback
- Service Worker pour cache
- Optimistic UI updates
- Virtual scrolling pour listes

### 8. Métriques UX à Implémenter

#### Analytics Events
```javascript
// Track user journey
- Wallet connected
- Match created
- Match joined
- Game completed
- Earnings claimed
- Profile viewed
- Achievement unlocked
- Share clicked
```

#### Performance Monitoring
- Core Web Vitals
- Time to Interactive
- First Contentful Paint
- API response times
- Transaction success rate

## Livrables Attendus

1. **Design System Documentation**
   - Figma/Sketch file avec tous les composants
   - Storybook avec composants interactifs
   - Guide de style complet

2. **Maquettes Haute Fidélité**
   - Toutes les pages en desktop/mobile
   - Prototypes interactifs
   - Design specs pour développeurs

3. **Code Frontend**
   - Composants React réutilisables
   - Animations implementées
   - Responsive sur tous devices
   - Dark/Light mode

4. **Assets**
   - Logo variations (SVG)
   - Illustrations custom
   - Icônes de jeu
   - Sons et musiques
   - Animations Lottie

## Inspiration Visuelle

Références à étudier:
- **Gamba.so**: Animations fluides et fun
- **Polymarket**: Data visualization claire
- **Magic Eden**: NFT marketplace UX
- **Tensor**: Trading interface pro
- **Aurory**: Gaming aesthetics
- **Star Atlas**: Sci-fi UI elements

## Contraintes

- Performance: Lighthouse score > 90
- Accessibility: WCAG 2.1 AA
- SEO: Meta tags, Open Graph
- Browser support: Chrome, Firefox, Safari, Edge
- Mobile first approach
- Max bundle size: 500KB initial

## Résultat Final

Une interface qui:
1. **Impressionne** dès la landing page
2. **Engage** avec des animations et sons
3. **Retient** avec gamification et social
4. **Convertit** avec UX optimisée
5. **Fidélise** avec progression et rewards

L'objectif est de créer THE référence UI/UX pour les jeux PvP sur Solana, où les joueurs reviennent non seulement pour les 0% de frais, mais aussi pour l'expérience exceptionnelle.