import { PublicKey } from '@solana/web3.js'

// SolDuel Platform Constants
export const PLATFORM_NAME = "SolDuel"
export const PLATFORM_TAGLINE = "Skill-based Rock Paper Scissors on Solana"

// Get RPC from the .env file or default to devnet for development
export const RPC_ENDPOINT = import.meta.env.VITE_RPC_ENDPOINT ?? 'https://api.devnet.solana.com'

// RPS Smart Contract Program ID
export const RPS_PROGRAM_ID = new PublicKey(
  '32tQhc2c4LurhdBwDzzV8f3PtdhKm1iVaPSumDTZWAvb'
)

// Platform creator address for fees
export const PLATFORM_CREATOR_ADDRESS = new PublicKey(
  'V2grJiwjs25iJYqumbHyKo5MTK7SFqZSdmoRaj8QWb9'
)

// Platform configuration
export const PLATFORM_FEE = 0.01 // 1% platform fee
export const DEFAULT_BET_AMOUNTS = [0.05, 0.1, 0.25, 0.5, 1.0] // SOL amounts
export const MIN_BET_AMOUNT = 0.05 // Minimum bet in SOL
export const MAX_BET_AMOUNT = 10.0 // Maximum bet in SOL

// SOL Token Configuration (we only use native SOL)
export const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112')
export const SOL_DECIMALS = 9

// Platform URLs
export const PLATFORM_URL = 'https://solduel.app'
export const EXPLORER_URL = 'https://explorer.solana.com'

/** Terms of Service HTML */
export const TOS_HTML = `
  <p><b>1. Age Requirement:</b> Must be at least 18 years old.</p>
  <p><b>2. Legal Compliance:</b> Follow local laws responsibly.</p>
  <p><b>3. Fair Play:</b> All matches use cryptographic commitment schemes for fairness.</p>
  <p><b>4. Risk Acknowledgement:</b> Competitive gaming involves financial risk.</p>
  <p><b>5. Smart Contract:</b> All transactions are handled by audited Solana smart contracts.</p>
  <p><b>6. Data Privacy:</b> Your privacy and security are our priority.</p>
  <p><b>7. Responsible Gaming:</b> Play responsibly within your means.</p>
`

// Game Configuration
export const GAME_TIMEOUT = 300 // 5 minutes per game
export const REVEAL_TIMEOUT = 120 // 2 minutes to reveal

// UI Configuration - Simplified for RPS-only platform
export const FEATURED_GAME_ID = 'rps'