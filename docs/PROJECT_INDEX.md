# 🎮 SolDuel Platform - Documentation Complète

## 📚 Vue d'Ensemble

**SolDuel** est une plateforme de jeu compétitif basée sur les compétences, construite sur la blockchain Solana. Actuellement avec Rock Paper Scissors (Pierre-Papier-Ciseaux) avec des paris en SOL réels.

### ✨ Caractéristiques Principales
- **Version**: 1.0.0
- **Blockchain**: Solana (Devnet/Mainnet ready)
- **Program ID**: `32tQhc2c4LurhdBwDzzV8f3PtdhKm1iVaPSumDTZWAvb`
- **Frais de plateforme**: 1%
- **Plage de mise**: 0.05 - 10 SOL
- **Architecture**: Moteur de jeu modulaire avec framework PvP universel
- **Organisation**: Structure propre avec seulement 7 dossiers principaux visibles

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Frontend Layer                     │
│  React + TypeScript + Vite + Tailwind + Wallet SDK  │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│              Integration Layer                       │
│     Anchor Client + RPC + Transaction Builder       │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│            Smart Contract Layer                      │
│    Rust + Anchor Framework + Solana Runtime         │
└─────────────────────────────────────────────────────┘
```

## 📁 Nouvelle Structure Organisée

### Structure Principale (7 dossiers visibles)
```
platform/
├── 📦 src/         # Code source de l'application
├── 🧪 tests/       # Suite de tests complète
├── 📚 docs/        # Documentation du projet
├── 🚀 programs/    # Smart contracts Solana
├── 🌐 public/      # Assets publics et statiques
├── 📜 scripts/     # Scripts d'automatisation
└── 🏗️ dist/       # Build de production
```

### Dossiers Cachés (Organisation)
```
├── .tools/         # 🛠️ Outils Claude et swarm
├── .archive/       # 📂 Anciens projets archivés
└── .config/        # ⚙️ Configurations système
```

### 📦 `/src` - Application Frontend
```
src/
├── features/       # Modules de fonctionnalités
│   ├── game-rps/   # Jeu Rock Paper Scissors
│   ├── auth/       # Authentification
│   ├── leaderboard/# Classement
│   └── profile/    # Profils utilisateurs
├── components/     # Composants réutilisables
│   ├── common/     # Composants communs
│   ├── layout/     # Composants de mise en page
│   └── ui/         # Composants UI de base
├── services/       # Services et API
│   ├── anchor/     # Client Anchor/Solana
│   └── solana/     # Intégration blockchain
├── hooks/          # Hooks React personnalisés
├── config/         # Configuration app
├── types/          # Types TypeScript
├── utils/          # Utilitaires
└── styles/         # Styles globaux
```

### 📚 `/docs` - Documentation Complète
```
docs/
├── 📋 Guides Principaux
│   ├── PROJECT_INDEX.md         # Ce fichier
│   ├── NAVIGATION.md            # Guide de navigation
│   ├── ORGANISATION_FINALE.md  # Structure finale
│   └── API_DOCUMENTATION.md    # Référence API
├── 🏗️ Architecture
│   ├── UNIVERSAL_PVP_ARCHITECTURE.md
│   ├── architecture/*.rs       # Specs Rust
│   └── analysis/               # Analyses techniques
├── 🚀 Déploiement
│   ├── MAINNET_DEPLOYMENT_GUIDE.md
│   ├── WALLET_FUNDING_GUIDE.md
│   └── deployment/             # Configs deployment
├── 🧪 Tests & Qualité
│   ├── testing/                # Rapports de tests
│   ├── CODE_QUALITY_ANALYSIS_REPORT.md
│   └── security-audit.md      # Audit de sécurité
└── 📖 Méthodologie
    └── sparc/                  # SPARC TDD

### `/config` - Configuration
- **`/deployment`** - Docker and Terraform configs
- **`/monitoring`** - Prometheus and Grafana setup
- **`/security`** - Security configurations
- **`/environments`** - Environment configs

### `/scripts` - Automation
- **`/deployment`** - Deployment scripts
- **`/monitoring`** - Monitoring setup

## 🎮 Game Components

### Rock Paper Scissors Module

#### Smart Contract Instructions
1. **`create_match`** - Initialize new match with bet
2. **`join_match`** - Join existing match
3. **`reveal`** - Reveal player choice
4. **`settle`** - Determine winner and distribute funds
5. **`cancel_match`** - Cancel uncompleted match
6. **`timeout_match`** - Handle timeout scenarios

#### Frontend Components
- **`MatchLobby`** - Browse and filter matches
- **`GameInterface`** - In-game UI and controls
- **`CreateMatchModal`** - Match creation dialog
- **`MatchCard`** - Individual match display

#### Game Flow
```
Create Match → Join Match → Make Choice → Reveal → Settlement
     ↓            ↓            ↓           ↓          ↓
  Escrow      Escrow      Commitment    Verify    Payout
```

## 🔧 Technical Stack

### Frontend Technologies
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **Styled Components** - CSS-in-JS

### Blockchain Technologies
- **Solana Web3.js** - Blockchain interaction
- **Anchor Framework** - Smart contract framework
- **Wallet Adapter** - Wallet integration
- **SPL Token** - Token support

### Development Tools
- **Claude Flow** - AI orchestration
- **SPARC Methodology** - TDD workflow
- **Docker** - Containerization
- **Terraform** - Infrastructure as code

## 🚀 Quick Start Guide

### Prerequisites
```bash
# Install dependencies
- Node.js v18+
- Rust & Cargo
- Solana CLI v1.18+
- Anchor Framework v0.31+
```

### Development Setup
```bash
# Clone repository
git clone <repository>
cd platform

# Install dependencies
npm install

# Start development server
npm run dev

# Deploy smart contract (devnet)
cd rps-game
anchor build
anchor deploy
```

### Production Deployment
```bash
# Build frontend
npm run build

# Deploy to mainnet
cd rps-game
anchor build --verifiable
anchor deploy --provider.cluster mainnet
```

## 📊 API Reference

### Smart Contract API

#### Account Structures
```rust
pub struct Match {
    pub creator: Pubkey,
    pub opponent: Pubkey,
    pub bet_amount: u64,
    pub status: MatchStatus,
    // ... more fields
}

pub struct PlayerState {
    pub commitment: [u8; 32],
    pub revealed_choice: Option<Choice>,
    pub nonce: u64,
}
```

#### Client Methods
```typescript
// Create new match
async createMatch(
  betAmount: number,
  choice: Choice,
  joinDeadline: number,
  revealDeadline: number
): Promise<Transaction>

// Join existing match
async joinMatch(
  matchPda: PublicKey,
  choice: Choice
): Promise<Transaction>

// Reveal choice
async reveal(
  matchPda: PublicKey,
  choice: Choice,
  salt: string
): Promise<Transaction>
```

## 🧪 Testing

### Test Coverage
- **Unit Tests** - Smart contract logic
- **Integration Tests** - Full game flow
- **E2E Tests** - User journeys
- **Performance Tests** - Load testing
- **Security Tests** - Vulnerability scanning

### Running Tests
```bash
# Smart contract tests
cd rps-game
anchor test

# Frontend tests
npm test

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

## 📈 Performance Metrics

### Target Metrics
- **Bundle Size**: < 500KB initial load
- **Load Time**: < 3s on 3G
- **Transaction Speed**: < 2s confirmation
- **Uptime**: 99.9% availability
- **Error Rate**: < 0.1%

### Monitoring
- Prometheus metrics collection
- Grafana dashboards
- Real-time alerting
- Performance tracking

## 🔐 Security

### Security Features
- **Commitment-Reveal Scheme** - Prevents cheating
- **PDA-based Escrow** - Secure fund management
- **Timeout Protection** - Prevents griefing
- **Input Validation** - Sanitization and checks
- **Transaction Safety** - Error handling

### Audit Status
- Smart contract security review completed
- Frontend security best practices implemented
- Regular dependency updates
- Continuous security monitoring

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request
5. Code review and merge

### Code Standards
- TypeScript strict mode
- Rust clippy linting
- Comprehensive documentation
- Test coverage > 80%
- Clean commit messages

## 📝 Documentation Links

### Technical Documentation
- [Architecture Overview](./UNIVERSAL_PVP_ARCHITECTURE.md)
- [Smart Contract Documentation](./SMART_CONTRACT_PROMPT.md)
- [Security Audit Report](./analysis/security-audit-report.md)
- [Performance Analysis](./OPTIMIZATION_RECOMMENDATIONS.md)

### Deployment Guides
- [Mainnet Deployment Guide](./MAINNET_DEPLOYMENT_GUIDE.md)
- [Keypair Setup Guide](./MAINNET_KEYPAIR_SETUP.md)
- [Wallet Funding Guide](./WALLET_FUNDING_GUIDE.md)

### Development Resources
- [SPARC Methodology](./sparc/01-specification.md)
- [Testing Strategy](./testing-strategy.md)
- [Code Quality Analysis](./CODE_QUALITY_ANALYSIS_REPORT.md)

## 📞 Support & Resources

### Links
- **Live Platform**: [solduel.app](https://solduel.app)
- **GitHub**: [Repository Link]
- **Documentation**: This index
- **Support**: [Contact/Discord]

### Community
- Discord server for players
- Developer documentation
- Bug reports and feature requests
- Contributing guidelines

---

*Last Updated: January 2025*
*Version: 1.0.0*
*Built with ❤️ for the Solana community*