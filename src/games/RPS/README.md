# Rock Paper Scissors Game

A professional, production-ready Rock Paper Scissors game built on Solana with real SOL betting.

## Features

### 🎮 Core Gameplay
- **1v1 Player vs Player**: Challenge other players worldwide
- **Real SOL Betting**: Bet real SOL tokens with secure escrow
- **Fair Play**: Commitment-reveal scheme ensures no cheating
- **Instant Results**: Lightning-fast games with immediate payouts

### 🛡️ Security & Fairness
- **Commitment-Reveal Scheme**: Cryptographically secure choice hiding
- **Smart Contract Escrow**: Automated and secure fund management
- **Timeout Protection**: Automatic resolution for abandoned games
- **Transparent Results**: All moves verifiable on-chain

### 💰 Economics
- **Flexible Betting**: Set your own bet amounts (0.001 - 100 SOL)
- **Low Fees**: Only 1% platform fee
- **Winner Takes All**: 99% of prize pool goes to winner
- **Tie Refunds**: Full refunds for tied games

### 📱 User Experience
- **Mobile-First Design**: Optimized for all devices
- **Responsive Interface**: Smooth animations and transitions
- **Real-Time Updates**: Live match status and notifications
- **Intuitive UI**: Clear game flow and visual feedback

## Game Flow

1. **Create Match**: Set bet amount and time limits
2. **Join Match**: Browse and join open matches
3. **Make Choice**: Select Rock, Paper, or Scissors
4. **Reveal**: Both players reveal choices simultaneously
5. **Settle**: Automatic payout to winner

## Technical Architecture

### Smart Contract Integration
- **Anchor Framework**: Type-safe Solana program integration
- **Program ID**: `32tQhc2c4LurhdBwDzzV8f3PtdhKm1iVaPSumDTZWAvb`
- **Escrow System**: Secure fund management with PDAs
- **Event Logs**: Complete audit trail for all matches

### Frontend Stack
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety throughout
- **Styled Components**: CSS-in-JS with theme support
- **Gamba UI**: Professional gaming UI components
- **Wallet Integration**: Full Solana wallet adapter support

### State Management
- **Custom Hooks**: Encapsulated game logic
- **Real-Time Updates**: Live match status synchronization
- **Error Handling**: Comprehensive error recovery
- **Local Storage**: Persistent user preferences

## Components

### Core Components
- `MatchLobby`: Main lobby with match browsing and filtering
- `GameInterface`: In-game UI for choice selection and results
- `CreateMatchModal`: Match creation with betting configuration
- `MatchCard`: Individual match display with actions

### Hooks
- `useRPSGame`: Main game state management
- Built on Gamba hooks for wallet and transaction handling

### Utils
- `anchor-client.ts`: Smart contract interaction layer
- `utils.ts`: Game logic and helper functions
- `types.ts`: TypeScript type definitions

## Performance

### Bundle Optimization
- **Code Splitting**: Lazy loading for optimal performance
- **Tree Shaking**: Removed unused dependencies
- **Bundle Size**: < 500KB initial load
- **Minimal Dependencies**: Only essential packages

### Mobile Performance
- **60fps Animations**: Smooth transitions and feedback
- **Touch Optimized**: Large touch targets and gestures
- **Progressive Enhancement**: Works on all devices
- **Offline Resilience**: Graceful degradation

## Accessibility

### WCAG Compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user motion preferences

### Mobile Accessibility
- **Touch Targets**: Minimum 44px touch targets
- **Font Scaling**: Respects user font size preferences
- **Safe Areas**: iOS safe area support
- **Orientation**: Works in all orientations

## Development

### File Structure
```
src/games/RPS/
├── components/          # React components
│   ├── MatchLobby.tsx
│   ├── GameInterface.tsx
│   ├── CreateMatchModal.tsx
│   └── MatchCard.tsx
├── hooks/              # Custom hooks
│   └── useRPSGame.ts
├── styles/             # CSS and styling
│   └── mobile.css
├── types.ts            # TypeScript types
└── index.tsx           # Main game component
```

### Integration Points
- **Gamba Platform**: Seamless integration with existing infrastructure
- **Wallet Adapters**: Works with all Solana wallets
- **Route Handling**: Integrated with React Router
- **Toast System**: Unified notification system

## Production Readiness

### Security
- ✅ Input validation and sanitization
- ✅ Transaction error handling
- ✅ Secure random number generation
- ✅ Protected API endpoints

### Performance
- ✅ Bundle size optimization
- ✅ Lazy loading implementation
- ✅ Mobile performance optimization
- ✅ Memory leak prevention

### Monitoring
- ✅ Error boundary implementation
- ✅ Transaction tracking
- ✅ Performance metrics
- ✅ User analytics ready

### Deployment
- ✅ Production build optimization
- ✅ Environment configuration
- ✅ CDN optimization ready
- ✅ SEO optimization

## Usage

The game is automatically available at `/rps` route and featured on the main dashboard. Players can:

1. Connect their Solana wallet
2. Browse open matches or create new ones
3. Join matches with matching bet amounts
4. Play games with secure, fair outcomes
5. Receive automatic payouts

No additional setup required - fully integrated with the Gamba platform infrastructure.