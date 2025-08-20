import { useState, useCallback, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { 
  getAccount, 
  getAssociatedTokenAddress, 
  AccountLayout,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID 
} from '@solana/spl-token';
import { POPULAR_TOKENS, AVAILABLE_TOKENS, SOL_TOKEN, TokenUtils, Token } from '../utils/tokens';

export interface TokenBalance extends Token {
  balance: number;
  uiAmount: number;
  associatedTokenAccount?: PublicKey;
}

export interface TokenBettingHookReturn {
  tokens: TokenBalance[];
  availableTokens: Token[];
  popularTokens: Token[];
  isLoading: boolean;
  error: string | null;
  refreshBalances: () => Promise<void>;
  getTokenBalance: (mint: string) => TokenBalance | null;
  getTokenInfo: (mint: string) => Token | null;
  validateBetAmount: (amount: number, tokenMint?: string) => {
    isValid: boolean;
    error?: string;
  };
  getAssociatedTokenAccount: (mint: string) => Promise<PublicKey | null>;
  formatTokenAmount: (amount: number, decimals: number) => string;
  parseTokenAmount: (amount: string, decimals: number) => number;
  hasTokenBalance: (mint: string) => boolean;
  getMinBetAmount: (mint: string) => number | null;
  getMaxBetAmount: (mint: string) => number | null;
}

export const useTokenBetting = (): TokenBettingHookReturn => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatTokenAmount = useCallback((amount: number, decimals: number): string => {
    return TokenUtils.formatAmount(amount, decimals);
  }, []);

  const parseTokenAmount = useCallback((amount: string, decimals: number): number => {
    return TokenUtils.parseAmount(amount, decimals);
  }, []);

  const getAssociatedTokenAccount = useCallback(async (mint: string): Promise<PublicKey | null> => {
    if (!publicKey) return null;
    
    try {
      const mintPubkey = new PublicKey(mint);
      return await getAssociatedTokenAddress(
        mintPubkey,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
    } catch (error) {
      console.error('Error getting associated token account:', error);
      return null;
    }
  }, [publicKey]);

  const fetchTokenBalances = useCallback(async () => {
    if (!publicKey || !connection) {
      setTokens([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tokenBalances: TokenBalance[] = [];

      // Add SOL balance
      const solBalance = await connection.getBalance(publicKey);
      tokenBalances.push({
        ...SOL_TOKEN,
        balance: solBalance,
        uiAmount: solBalance / 1e9,
      });

      // Fetch all token accounts for the wallet
      const tokenAccounts = await connection.getTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      // Process each token account
      for (const tokenAccount of tokenAccounts.value) {
        try {
          const accountData = AccountLayout.decode(tokenAccount.account.data);
          const mintAddress = accountData.mint.toString();
          const balance = Number(accountData.amount);

          if (balance > 0) {
            // Try to find token info in available tokens list
            const tokenInfo = TokenUtils.findByMint(mintAddress);
            
            if (tokenInfo) {
              tokenBalances.push({
                ...tokenInfo,
                balance,
                uiAmount: balance / Math.pow(10, tokenInfo.decimals),
                associatedTokenAccount: tokenAccount.pubkey,
              });
            } else {
              // For unknown tokens, try to fetch mint info
              try {
                const mintInfo = await connection.getParsedAccountInfo(new PublicKey(mintAddress));
                const mintData = mintInfo.value?.data;
                
                if (mintData && 'parsed' in mintData) {
                  const decimals = mintData.parsed.info.decimals || 9;
                  tokenBalances.push({
                    name: `Token ${TokenUtils.getShortMint(mintAddress)}`,
                    symbol: 'UNKNOWN',
                    mint: mintAddress,
                    decimals,
                    balance,
                    uiAmount: balance / Math.pow(10, decimals),
                    associatedTokenAccount: tokenAccount.pubkey,
                  });
                }
              } catch (mintError) {
                console.error(`Error fetching mint info for ${mintAddress}:`, mintError);
                // Skip this token if we can't get mint info
              }
            }
          }
        } catch (accountError) {
          console.error('Error processing token account:', accountError);
          // Skip this account if we can't decode it
        }
      }

      setTokens(tokenBalances);
    } catch (fetchError) {
      console.error('Error fetching token balances:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch token balances');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection]);

  const refreshBalances = useCallback(async () => {
    await fetchTokenBalances();
  }, [fetchTokenBalances]);

  const getTokenBalance = useCallback((mint: string): TokenBalance | null => {
    const searchMint = mint === 'native' ? 'native' : mint;
    return tokens.find(token => token.mint === searchMint) || null;
  }, [tokens]);

  const getTokenInfo = useCallback((mint: string): Token | null => {
    return TokenUtils.findByMint(mint) || null;
  }, []);

  const hasTokenBalance = useCallback((mint: string): boolean => {
    const tokenBalance = getTokenBalance(mint);
    return tokenBalance !== null && tokenBalance.balance > 0;
  }, [getTokenBalance]);

  const getMinBetAmount = useCallback((mint: string): number | null => {
    const tokenInfo = getTokenInfo(mint);
    if (!tokenInfo) return null;
    return TokenUtils.getMinBetAmount(tokenInfo);
  }, [getTokenInfo]);

  const getMaxBetAmount = useCallback((mint: string): number | null => {
    const tokenInfo = getTokenInfo(mint);
    if (!tokenInfo) return null;
    return TokenUtils.getMaxBetAmount(tokenInfo);
  }, [getTokenInfo]);

  const validateBetAmount = useCallback((amount: number, tokenMint?: string): {
    isValid: boolean;
    error?: string;
  } => {
    const mint = tokenMint || 'native';
    const tokenBalance = getTokenBalance(mint);
    const tokenInfo = getTokenInfo(mint);

    if (!tokenInfo) {
      return { isValid: false, error: 'Token not found' };
    }

    if (!tokenBalance) {
      return { isValid: false, error: 'Token not found in wallet' };
    }

    return TokenUtils.validateBetAmount(amount, tokenInfo, tokenBalance.balance);
  }, [getTokenBalance, getTokenInfo]);

  // Fetch balances when wallet connects
  useEffect(() => {
    fetchTokenBalances();
  }, [fetchTokenBalances]);

  return {
    tokens,
    availableTokens: AVAILABLE_TOKENS,
    popularTokens: POPULAR_TOKENS,
    isLoading,
    error,
    refreshBalances,
    getTokenBalance,
    getTokenInfo,
    validateBetAmount,
    getAssociatedTokenAccount,
    formatTokenAmount,
    parseTokenAmount,
    hasTokenBalance,
    getMinBetAmount,
    getMaxBetAmount,
  };
};