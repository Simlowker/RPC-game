# 🗿📄✂️ Rock Paper Scissors PvP Game

A decentralized Rock Paper Scissors game built on Solana with on-chain betting, fair play mechanics, and a modern React frontend.

## 🎯 Features

### On-Chain Program (Rust + Anchor)
- **Complete Game Instructions**: `create_match`, `join_match`, `reveal`, `settle`, `cancel_match`, `timeout_match`
- **Fair Play Mechanism**: Commit-reveal scheme using SHA-256 hashing with salt, player pubkey, and nonce
- **Escrow System**: Secure PDA-based vault for SOL and optional SPL token betting
- **Timeout Protection**: Deadlines for joining and revealing to prevent griefing
- **Fee System**: Configurable fee collection (default: 2.5%)

### Frontend (React + TypeScript)
- **Modern Stack**: Vite + React + TypeScript + Tailwind CSS
- **Wallet Integration**: Solana wallet-adapter with Phantom support
- **Real-time UI**: Live match status updates and notifications
- **Responsive Design**: Mobile-friendly interface
- **Toast Notifications**: User-friendly error and success messages

### Data Schema
```rust
pub struct Match {
    pub creator: Pubkey,
    pub opponent: Pubkey,
    pub bet_amount: u64,
    pub token_mint: Option<Pubkey>,
    pub commitment_creator: [u8; 32],
    pub commitment_opponent: [u8; 32],
    pub revealed_creator: Option<Choice>,
    pub revealed_opponent: Option<Choice>,
    pub join_deadline: i64,
    pub reveal_deadline: i64,
    pub status: MatchStatus,
    pub fee_bps: u16,
    pub vault_pda_bump: u8,
}
```

## 🚀 Quick Start

### Prerequisites
- [Rust](https://rustup.rs/) and Cargo
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) v1.18+
- [Anchor Framework](https://www.anchor-lang.com/docs/installation) v0.31+
- [Node.js](https://nodejs.org/) v18+
- [Phantom Wallet](https://phantom.app/) or compatible Solana wallet

### 1. Setup Development Environment
```bash
# Clone and setup
git clone <repository>
cd rps-game
./scripts/setup-dev.sh
```

### 2. Run Tests
```bash
# Run comprehensive test suite
anchor test
```

### 3. Deploy to Devnet
```bash
# Deploy program to Solana devnet
npm run deploy
```

### 4. Start Frontend
```bash
# Start React development server
npm run app:dev
```

## 📋 Available Scripts

### Root Package Scripts
```bash
npm run build          # Build the Anchor program
npm run test           # Run Anchor tests
npm run deploy         # Deploy to devnet
npm run app:dev        # Start frontend development server
npm run app:build      # Build frontend for production
npm run app:preview    # Preview production build
```

### Development Scripts
```bash
./scripts/setup-dev.sh  # Setup development environment
./scripts/deploy.sh     # Deploy with configuration
```

## 🎮 How to Play

### 1. Create a Match
- Connect your Solana wallet
- Click "Create Match" in the lobby
- Choose your bet amount (SOL)
- Select your move (Rock/Paper/Scissors)
- Set join and reveal deadlines
- Confirm transaction

### 2. Join a Match
- Browse available matches in the lobby
- Click "Join" on a match
- Select your move
- Confirm transaction with matching bet amount

### 3. Reveal Phase
- After both players join, reveal your move
- You have until the reveal deadline
- Both players must reveal to settle the match

### 4. Settlement
- Once both moves are revealed, anyone can settle
- Winner takes the pot (minus fees)
- Ties result in refunds to both players

## 🧪 Testing

The project includes comprehensive tests covering:

### Happy Path Tests
- Complete game flow (creator wins)
- Complete game flow (tie/refund)
- SPL token betting (if implemented)

### Error Handling Tests  
- Mismatched bet amount rejection
- Double reveal prevention
- Invalid commitment hash rejection
- Deadline enforcement

### Timeout Scenarios
- Join deadline timeout
- Reveal deadline timeout
- Partial reveal handling

### Edge Cases
- Match cancellation
- Invalid player actions
- Insufficient funds

Run tests with:
```bash
anchor test --detach  # Run local validator
anchor test          # Run all tests
```

## 🔧 Architecture

### Smart Contract (Rust)
```
programs/rps/src/
├── lib.rs              # Main program with all instructions
└── Cargo.toml         # Dependencies (anchor-lang, anchor-spl, sha2)
```

### Frontend (TypeScript)
```
app/src/
├── components/        # React components
│   ├── GameApp.tsx   # Main app container
│   ├── Header.tsx    # Wallet connection
│   ├── Lobby.tsx     # Match creation/listing
│   └── MatchRoom.tsx # Game interface
├── utils/            # Utilities
│   ├── anchor.ts     # Program interaction
│   └── game.ts       # Game logic helpers
└── App.tsx          # App root with providers
```

### Key Concepts

#### Commit-Reveal Mechanism
```typescript
// Client-side commitment creation
function createCommitmentHash(
  choice: Choice,
  salt: Uint8Array,
  player: PublicKey,
  nonce: number
): Uint8Array {
  const hasher = new Sha256();
  hasher.update([choice as u8]);
  hasher.update(salt);
  hasher.update(player.toBytes());
  hasher.update(nonce.toLeBytes());
  return hasher.digest();
}
```

#### PDA-Based Escrow
```rust
// Vault PDA derivation
let (vault_pda, bump) = Pubkey::find_program_address(
    &[b"vault", match_account.key().as_ref()],
    ctx.program_id
);
```

## 🔐 Security Features

### Fair Play Guarantees
- **Commit-Reveal**: Prevents front-running and choice manipulation
- **Cryptographic Hashing**: SHA-256 with salt and nonce for unpredictability
- **Deadline Enforcement**: Automatic timeout handling for griefing prevention

### Financial Security
- **Escrow Vaults**: PDA-controlled funds with no private key exposure
- **Atomic Operations**: All-or-nothing transaction processing
- **Fee Transparency**: Clear fee structure and collection

### Access Controls
- **Signer Verification**: All operations require proper signatures
- **State Validation**: Comprehensive status and permission checking
- **Deadline Compliance**: Time-based access restrictions

## 🚨 Known Limitations

1. **Single Token Support**: Currently supports SOL, SPL token support is scaffolded but not fully implemented
2. **No Persistent Storage**: Match history is not stored long-term
3. **Limited Wallet Support**: Primarily tested with Phantom wallet
4. **Devnet Only**: Not audited for mainnet deployment

## 🛣️ Roadmap

- [ ] SPL token betting implementation
- [ ] Match history and statistics
- [ ] Tournaments and leaderboards
- [ ] Multi-wallet support
- [ ] Mobile app development
- [ ] Security audit for mainnet

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Anchor Framework](https://www.anchor-lang.com/) for Solana development
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter) for wallet integration
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) for frontend tooling

---

Built with ❤️ on Solana