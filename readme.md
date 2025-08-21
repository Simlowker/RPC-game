# SolDuel - Skill-based Rock Paper Scissors on Solana

A competitive Rock Paper Scissors platform built on Solana blockchain, where players can challenge each other in fair, transparent matches with real SOL betting.

Experience the classic game with a modern twist - provably fair gameplay, instant settlements, and competitive rewards!

## 🎮 Features

* **Skill-based PvP Gameplay**: Challenge other players in fair Rock Paper Scissors matches
* **Real SOL Betting**: Wager real SOL tokens with customizable bet amounts (0.05 - 10 SOL)
* **Provably Fair**: Cryptographic commitment-reveal scheme ensures complete fairness
* **Instant Settlements**: Smart contract-based automatic payouts with 1% platform fee
* **Competitive Matching**: Create or join matches with players of your skill level
* **Transparent Results**: All game outcomes are verifiable on-chain
* **Responsive Design**: Play seamlessly on desktop and mobile devices

## 🚀 How It Works

1. **Connect Wallet**: Link your Solana wallet to start playing
2. **Choose Bet Amount**: Select from preset amounts or set a custom wager
3. **Create/Join Match**: Start a new game or join an existing match
4. **Make Your Move**: Submit your Rock, Paper, or Scissors choice
5. **Reveal & Win**: Both players reveal simultaneously, winner takes the pot!

## 🛠 Technical Stack

* **Blockchain**: Solana (Devnet/Mainnet)
* **Frontend**: React + TypeScript + Vite
* **Smart Contract**: Rust-based Anchor program
* **Wallet Integration**: Solana Wallet Adapter
* **Styling**: Tailwind CSS

## 📋 Quick Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Configure environment variables in `.env`
4. Update platform settings in `src/constants.ts`
5. Deploy: `npm run build`

## 🔧 Configuration

Edit `src/constants.ts` to customize:
- Platform creator address (for fee collection)
- Bet amount limits and presets
- Game timeouts and rules
- Platform branding and URLs

## 🎯 Game Rules

- **Rock** beats Scissors
- **Paper** beats Rock  
- **Scissors** beats Paper
- **Tie games** return bets to both players
- **Winners** receive opponent's bet minus 1% platform fee

## 🔐 Security

- Smart contract handles all game logic and funds
- Commitment-reveal scheme prevents cheating
- No custody of user funds - direct wallet-to-wallet
- Open source and auditable code

## 📱 Live Demo

Visit [SolDuel.app](https://solduel.app) to play now!

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests.

---

*Built with ❤️ for the Solana community*
