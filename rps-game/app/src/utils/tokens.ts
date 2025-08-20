import { PublicKey } from '@solana/web3.js';

// Token interface for standardized token information
export interface Token {
  name: string;
  symbol: string;
  mint: string;
  decimals: number;
  logo?: string;
  isNative?: boolean;
  description?: string;
  coingeckoId?: string;
  extensions?: {
    website?: string;
    twitter?: string;
  };
}

// Popular devnet SPL tokens for testing
export const DEVNET_TOKENS: Token[] = [
  {
    name: 'USDC (Dev)',
    symbol: 'USDC',
    mint: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    description: 'USD Coin (devnet version)',
    coingeckoId: 'usd-coin',
  },
  {
    name: 'Bonk (Dev)',
    symbol: 'BONK',
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    logo: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
    description: 'Bonk (devnet version)',
    coingeckoId: 'bonk',
  },
  {
    name: 'Wrapped SOL',
    symbol: 'wSOL',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    description: 'Wrapped Solana',
    coingeckoId: 'wrapped-solana',
  },
  {
    name: 'Jupiter (Dev)',
    symbol: 'JUP',
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    decimals: 6,
    logo: 'https://static.jup.ag/jup/icon.png',
    description: 'Jupiter (devnet version)',
    coingeckoId: 'jupiter-exchange-solana',
  },
  {
    name: 'Pyth Network (Dev)',
    symbol: 'PYTH',
    mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3npM9gEX1VqMcM',
    decimals: 6,
    logo: 'https://pyth.network/token.svg',
    description: 'Pyth Network (devnet version)',
    coingeckoId: 'pyth-network',
  },
];

// Native SOL token
export const SOL_TOKEN: Token = {
  name: 'Solana',
  symbol: 'SOL',
  mint: 'native',
  decimals: 9,
  isNative: true,
  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  description: 'Native Solana token',
  coingeckoId: 'solana',
  extensions: {
    website: 'https://solana.com',
    twitter: 'https://twitter.com/solana',
  },
};

// Combined list of all available tokens (SOL + SPL tokens)
export const AVAILABLE_TOKENS: Token[] = [SOL_TOKEN, ...DEVNET_TOKENS];

// Popular tokens for quick selection
export const POPULAR_TOKENS = AVAILABLE_TOKENS.slice(0, 4); // SOL, USDC, BONK, wSOL

// Token utilities
export const TokenUtils = {
  /**
   * Find token by mint address
   */
  findByMint: (mint: string): Token | undefined => {
    return AVAILABLE_TOKENS.find(token => token.mint === mint);
  },

  /**
   * Find token by symbol
   */
  findBySymbol: (symbol: string): Token | undefined => {
    return AVAILABLE_TOKENS.find(token => token.symbol.toLowerCase() === symbol.toLowerCase());
  },

  /**
   * Check if a mint is native SOL
   */
  isNative: (mint: string): boolean => {
    return mint === 'native' || mint === SOL_TOKEN.mint;
  },

  /**
   * Get native SOL token
   */
  getNativeToken: (): Token => SOL_TOKEN,

  /**
   * Validate mint address
   */
  isValidMint: (mint: string): boolean => {
    if (mint === 'native') return true;
    try {
      new PublicKey(mint);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Format token amount for display
   */
  formatAmount: (amount: number, decimals: number, maxDecimals = 6): string => {
    const value = amount / Math.pow(10, decimals);
    const displayDecimals = Math.min(decimals, maxDecimals);
    return value.toFixed(displayDecimals);
  },

  /**
   * Parse token amount from string to raw units
   */
  parseAmount: (amount: string, decimals: number): number => {
    const value = parseFloat(amount);
    if (isNaN(value)) return 0;
    return Math.floor(value * Math.pow(10, decimals));
  },

  /**
   * Get minimum bet amount for a token
   */
  getMinBetAmount: (token: Token): number => {
    if (token.isNative) {
      return 0.001 * Math.pow(10, token.decimals); // 0.001 SOL
    }
    // For SPL tokens, minimum is 0.001 in token units
    return Math.pow(10, Math.max(0, token.decimals - 3));
  },

  /**
   * Get maximum bet amount for a token
   */
  getMaxBetAmount: (token: Token): number => {
    if (token.isNative) {
      return 100 * Math.pow(10, token.decimals); // 100 SOL
    }
    // For SPL tokens, no explicit maximum (will be limited by balance)
    return Number.MAX_SAFE_INTEGER;
  },

  /**
   * Validate bet amount
   */
  validateBetAmount: (amount: number, token: Token, balance: number): {
    isValid: boolean;
    error?: string;
  } => {
    if (isNaN(amount) || amount <= 0) {
      return { isValid: false, error: 'Amount must be a positive number' };
    }

    const minAmount = TokenUtils.getMinBetAmount(token);
    if (amount < minAmount) {
      return {
        isValid: false,
        error: `Minimum bet: ${TokenUtils.formatAmount(minAmount, token.decimals)} ${token.symbol}`,
      };
    }

    const maxAmount = TokenUtils.getMaxBetAmount(token);
    if (amount > maxAmount) {
      return {
        isValid: false,
        error: `Maximum bet: ${TokenUtils.formatAmount(maxAmount, token.decimals)} ${token.symbol}`,
      };
    }

    if (amount > balance) {
      return {
        isValid: false,
        error: `Insufficient balance. Available: ${TokenUtils.formatAmount(balance, token.decimals)} ${token.symbol}`,
      };
    }

    return { isValid: true };
  },

  /**
   * Get token display name
   */
  getDisplayName: (token: Token): string => {
    return `${token.name} (${token.symbol})`;
  },

  /**
   * Create a PublicKey from mint string (handles native)
   */
  createMintPublicKey: (mint: string): PublicKey | null => {
    if (mint === 'native') return null;
    try {
      return new PublicKey(mint);
    } catch {
      return null;
    }
  },

  /**
   * Get abbreviated mint address for display
   */
  getShortMint: (mint: string): string => {
    if (mint === 'native') return 'native';
    if (mint.length <= 8) return mint;
    return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
  },
};

// Export individual functions for convenience
export const {
  findByMint,
  findBySymbol,
  isNative,
  getNativeToken,
  isValidMint,
  formatAmount,
  parseAmount,
  getMinBetAmount,
  getMaxBetAmount,
  validateBetAmount,
  getDisplayName,
  createMintPublicKey,
  getShortMint,
} = TokenUtils;

// Type guards
export const isToken = (obj: any): obj is Token => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.name === 'string' &&
    typeof obj.symbol === 'string' &&
    typeof obj.mint === 'string' &&
    typeof obj.decimals === 'number'
  );
};

// Constants for validation
export const TOKEN_CONSTANTS = {
  MIN_DECIMALS: 0,
  MAX_DECIMALS: 18,
  MIN_BET_SOL: 0.001,
  MAX_BET_SOL: 100,
  MIN_BET_TOKEN_RATIO: 0.001, // 0.1% of token's decimals
  MAX_DISPLAY_DECIMALS: 6,
} as const;