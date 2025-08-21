import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export const useWalletBalance = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!publicKey || !connection) {
      setBalance(null);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching balance for:', publicKey.toString());
      
      const lamports = await connection.getBalance(publicKey);
      const sol = lamports / LAMPORTS_PER_SOL;
      
      console.log('Balance fetched:', { lamports, sol });
      setBalance(sol);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [publicKey, connection]);

  // Refresh balance every 30 seconds
  useEffect(() => {
    if (!publicKey || !connection) return;

    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  return {
    balance,
    isLoading,
    error,
    refetch: fetchBalance,
  };
};