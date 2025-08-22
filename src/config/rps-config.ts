// RPS Game Configuration
export const RPS_CONFIG = {
  // Set to true to use real on-chain implementation
  // Set to false to use mock implementation for testing UI
  USE_REAL_IMPLEMENTATION: true,
  
  // Devnet RPC endpoint
  RPC_ENDPOINT: 'https://api.devnet.solana.com',
  
  // Program ID (Universal PvP deployed on Devnet)
  PROGRAM_ID: '4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR',
  
  // Polling interval for match updates (ms)
  POLL_INTERVAL: 2000,
  
  // Transaction confirmation
  CONFIRMATION: 'confirmed' as const,
  
  // Priority fees (in microLamports)
  COMPUTE_UNIT_PRICE: 50000,
  COMPUTE_UNIT_LIMIT: 300000,
  
  // Game defaults
  DEFAULT_BET_AMOUNT: 0.01, // SOL
  DEFAULT_ROUNDS: 1,
  DEFAULT_JOIN_DEADLINE_MINUTES: 60,
  DEFAULT_REVEAL_DEADLINE_MINUTES: 30,
  
  // Storage keys
  STORAGE_PREFIX: 'rps_commitment_',
  
  // UI Settings
  SHOW_DEVNET_WARNING: true,
  ENABLE_SOUND: true,
  ENABLE_ANIMATIONS: true,
};

// Export helper to check if using real implementation
export const isRealImplementation = () => RPS_CONFIG.USE_REAL_IMPLEMENTATION;