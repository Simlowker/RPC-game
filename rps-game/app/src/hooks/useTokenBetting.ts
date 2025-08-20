import { useState, useCallback, useMemo } from 'react';
import { PublicKey, Connection } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Popular SPL tokens on Solana
export const POPULAR_TOKENS = [
  {
    name: 'USDC',
    symbol: 'USDC',
    mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet USDC
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU/logo.png'
  },
  {
    name: 'USDT',
    symbol: 'USDT',
    mint: '3vxLXJqLqF3JG5TCbYycbKWRBbCJQLxQmBGCkyqLjgQc', // Devnet USDT
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/3vxLXJqLqF3JG5TCbYycbKWRBbCJQLxQmBGCkyqLjgQc/logo.png'
  },
  {
    name: 'SOL',
    symbol: 'SOL',
    mint: 'So11111111111111111111111111111111111111112', // Wrapped SOL
    decimals: 9,
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
  }
];

export interface TokenInfo {
  name: string;
  symbol: string;
  mint: string;
  decimals: number;
  logo?: string;
  balance?: number;
}

export interface UseTokenBettingReturn {
  tokens: TokenInfo[];
  loading: boolean;
  error: string | null;
  refreshBalances: () => Promise<void>;
  getTokenBalance: (mint: string) => number | undefined;
  formatTokenAmount: (amount: number, decimals: number) => string;
  parseTokenAmount: (amount: string, decimals: number) => number;
}

export const useTokenBetting = (): UseTokenBettingReturn => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [tokens, setTokens] = useState<TokenInfo[]>(POPULAR_TOKENS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalances = useCallback(async () => {
    if (!publicKey || !connection) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedTokens = await Promise.all(
        POPULAR_TOKENS.map(async (token) => {
          try {
            let balance = 0;

            if (token.symbol === 'SOL') {
              // Get SOL balance
              const solBalance = await connection.getBalance(publicKey);
              balance = solBalance / Math.pow(10, token.decimals);
            } else {
              // Get SPL token balance
              const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                publicKey,
                {
                  mint: new PublicKey(token.mint),
                }
              );

              if (tokenAccounts.value.length > 0) {
                const tokenAccount = tokenAccounts.value[0];
                const tokenAmount = tokenAccount.account.data.parsed.info.tokenAmount;
                balance = parseFloat(tokenAmount.uiAmount || '0');
              }
            }

            return {
              ...token,
              balance,
            };
          } catch (tokenError) {
            console.error(`Error fetching balance for ${token.symbol}:`, tokenError);
            return {
              ...token,
              balance: 0,
            };
          }
        })
      );

      setTokens(updatedTokens);
    } catch (err) {
      console.error('Error refreshing token balances:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch token balances');
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection]);

  const getTokenBalance = useCallback((mint: string): number | undefined => {
    const token = tokens.find(t => t.mint === mint);
    return token?.balance;
  }, [tokens]);

  const formatTokenAmount = useCallback((amount: number, decimals: number): string => {
    return (amount / Math.pow(10, decimals)).toFixed(decimals === 9 ? 4 : 2);
  }, []);

  const parseTokenAmount = useCallback((amount: string, decimals: number): number => {
    return Math.floor(parseFloat(amount) * Math.pow(10, decimals));
  }, []);

  // Auto-refresh balances when wallet connects
  useState(() => {
    if (publicKey) {
      refreshBalances();
    }
  });

  return {
    tokens,
    loading,
    error,
    refreshBalances,
    getTokenBalance,
    formatTokenAmount,
    parseTokenAmount,
  };
};