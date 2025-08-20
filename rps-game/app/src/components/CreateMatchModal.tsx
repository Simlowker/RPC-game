import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { X, Loader2, AlertCircle, Info, RefreshCw, ChevronDown, Coins, Search, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { parseSOL } from '../utils/game';
import { useTokenBetting, TokenBalance } from '../hooks/useTokenBetting';
import { TokenUtils, Token, createMintPublicKey } from '../utils/tokens';
import { useGameSounds, SoundEffect } from '../hooks/useGameSounds';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMatch: (betAmount: number, tokenMint?: PublicKey) => Promise<void>;
}

const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  onCreateMatch,
}) => {
  const { publicKey } = useWallet();
  const { playSound } = useGameSounds();
  const {
    tokens,
    popularTokens,
    isLoading: tokensLoading,
    error: tokensError,
    refreshBalances,
    getTokenBalance,
    validateBetAmount,
    formatTokenAmount,
    parseTokenAmount,
  } = useTokenBetting();

  const [betAmount, setBetAmount] = useState('0.1');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [customTokenMint, setCustomTokenMint] = useState('');
  const [useCustomToken, setUseCustomToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  const modalRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize with native SOL
  useEffect(() => {
    if (!selectedToken && tokens.length > 0) {
      const solToken = tokens.find(t => t.mint === 'native');
      if (solToken) {
        setSelectedToken(solToken);
      }
    }
  }, [tokens, selectedToken]);

  // Filter tokens for search
  const filteredTokens = tokens.filter(token => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      token.name.toLowerCase().includes(query) ||
      token.symbol.toLowerCase().includes(query) ||
      token.mint.toLowerCase().includes(query)
    );
  });

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate bet amount
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.betAmount = 'Bet amount must be a positive number';
    } else {
      // Use selected token for validation
      const tokenMint = selectedToken?.mint || 'native';
      let rawAmount: number;
      
      if (selectedToken) {
        rawAmount = parseTokenAmount(betAmount, selectedToken.decimals);
      } else {
        rawAmount = parseSOL(betAmount);
      }

      const validation = validateBetAmount(rawAmount, tokenMint);
      if (!validation.isValid) {
        newErrors.betAmount = validation.error || 'Invalid bet amount';
      }
    }

    // Validate custom token mint if using custom token
    if (useCustomToken && customTokenMint.trim()) {
      try {
        new PublicKey(customTokenMint.trim());
      } catch {
        newErrors.customTokenMint = 'Invalid token mint address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      playSound(SoundEffect.NOTIFICATION_ERROR);
      return;
    }

    if (!validateForm()) {
      playSound(SoundEffect.NOTIFICATION_ERROR);
      return;
    }

    setIsLoading(true);
    try {
      let amount: number;
      let tokenMint: PublicKey | undefined;

      // Handle custom token
      if (useCustomToken && customTokenMint.trim()) {
        tokenMint = new PublicKey(customTokenMint.trim());
        // For custom tokens, assume 9 decimals if not found
        amount = parseTokenAmount(betAmount, 9);
      } else if (selectedToken && selectedToken.mint !== 'native') {
        // Handle selected SPL token
        tokenMint = createMintPublicKey(selectedToken.mint) || undefined;
        amount = parseTokenAmount(betAmount, selectedToken.decimals);
      } else {
        // Handle native SOL
        amount = parseSOL(betAmount);
        tokenMint = undefined;
      }

      await onCreateMatch(amount, tokenMint);
      
      // Reset form and close modal
      setBetAmount('0.1');
      setCustomTokenMint('');
      setUseCustomToken(false);
      setErrors({});
      playSound(SoundEffect.MODAL_CLOSE);
      onClose();
      
      playSound(SoundEffect.NOTIFICATION_SUCCESS);
      toast.success('Match created successfully!');
    } catch (error) {
      console.error('Error creating match:', error);
      playSound(SoundEffect.NOTIFICATION_ERROR);
      toast.error(error instanceof Error ? error.message : 'Failed to create match');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBetAmount(value);
      if (errors.betAmount) {
        setErrors({ ...errors, betAmount: '' });
      }
    }
  };

  const selectToken = (token: TokenBalance) => {
    setSelectedToken(token);
    setShowTokenSelector(false);
    setUseCustomToken(false);
    setSearchQuery('');
    
    // Update bet amount limits based on token
    const tokenBalance = getTokenBalance(token.mint);
    if (tokenBalance && parseFloat(betAmount) > tokenBalance.uiAmount) {
      setBetAmount(Math.min(tokenBalance.uiAmount / 2, 1).toString());
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTokenSelector(false);
        setSearchQuery('');
      }
    };

    if (showTokenSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTokenSelector]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create New Match</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Token Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Token
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowTokenSelector(!showTokenSelector)}
                disabled={isLoading || useCustomToken}
                className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white flex items-center justify-between hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  useCustomToken ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center space-x-2">
                  {selectedToken?.logo ? (
                    <img src={selectedToken.logo} alt={selectedToken.symbol} className="w-5 h-5 rounded-full" />
                  ) : (
                    <Coins className="w-5 h-5 text-gray-400" />
                  )}
                  <span>{selectedToken ? `${selectedToken.symbol} (${selectedToken.name})` : 'Select Token'}</span>
                </div>
                <ChevronDown size={16} className={`transition-transform ${showTokenSelector ? 'rotate-180' : ''}`} />
              </button>

              {/* Token Dropdown */}
              {showTokenSelector && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-50 max-h-64 overflow-hidden">
                  {/* Search */}
                  <div className="p-2 border-b border-gray-600">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search tokens..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Token List */}
                  <div className="max-h-48 overflow-y-auto">
                    {tokensLoading ? (
                      <div className="p-4 text-center text-gray-400">
                        <Loader2 size={16} className="animate-spin mx-auto mb-2" />
                        Loading tokens...
                      </div>
                    ) : filteredTokens.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        No tokens found
                      </div>
                    ) : (
                      filteredTokens.map((token) => (
                        <button
                          key={token.mint}
                          type="button"
                          onClick={() => selectToken(token)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-600 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            {token.logo ? (
                              <img src={token.logo} alt={token.symbol} className="w-5 h-5 rounded-full" />
                            ) : (
                              <Coins className="w-5 h-5 text-gray-400" />
                            )}
                            <div>
                              <div className="text-white text-sm">{token.symbol}</div>
                              <div className="text-gray-400 text-xs">{token.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white text-sm">
                              {formatTokenAmount(token.balance, token.decimals)}
                            </div>
                            <div className="text-gray-400 text-xs">
                              Balance
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Refresh Button */}
                  <div className="p-2 border-t border-gray-600">
                    <button
                      type="button"
                      onClick={() => {
                        refreshBalances();
                        setShowTokenSelector(false);
                      }}
                      disabled={tokensLoading}
                      className="w-full px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                    >
                      <RefreshCw size={14} className={tokensLoading ? 'animate-spin' : ''} />
                      <span>Refresh Balances</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {selectedToken && (
              <div className="text-xs text-gray-400">
                Balance: {formatTokenAmount(getTokenBalance(selectedToken.mint)?.balance || 0, selectedToken.decimals)} {selectedToken.symbol}
              </div>
            )}
          </div>

          {/* Bet Amount */}
          <div className="space-y-2">
            <label htmlFor="betAmount" className="block text-sm font-medium text-gray-300">
              Bet Amount {selectedToken && `(${selectedToken.symbol})`}
            </label>
            <div className="relative">
              <input
                id="betAmount"
                type="text"
                value={betAmount}
                onChange={handleBetAmountChange}
                placeholder={selectedToken?.mint === 'native' ? '0.1' : '1.0'}
                disabled={isLoading}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${
                  errors.betAmount ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {errors.betAmount && (
                <div className="absolute right-3 top-2.5">
                  <AlertCircle size={16} className="text-red-500" />
                </div>
              )}
            </div>
            {errors.betAmount && (
              <p className="text-red-400 text-sm">{errors.betAmount}</p>
            )}
            {selectedToken && (
              <p className="text-gray-400 text-xs">
                Min: {formatTokenAmount(TokenUtils.getMinBetAmount(selectedToken), selectedToken.decimals)} {selectedToken.symbol}
                {selectedToken.mint === 'native' && ` • Max: ${formatTokenAmount(TokenUtils.getMaxBetAmount(selectedToken), selectedToken.decimals)} ${selectedToken.symbol}`}
              </p>
            )}
          </div>

          {/* Custom Token Option */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                id="useCustomToken"
                type="checkbox"
                checked={useCustomToken}
                onChange={(e) => {
                  setUseCustomToken(e.target.checked);
                  if (e.target.checked) {
                    setShowTokenSelector(false);
                  }
                }}
                disabled={isLoading}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
              />
              <label htmlFor="useCustomToken" className="text-sm text-gray-300">
                Use custom token (optional)
              </label>
            </div>

            {useCustomToken && (
              <div className="space-y-2">
                <label htmlFor="customTokenMint" className="block text-sm font-medium text-gray-300">
                  Token Mint Address
                </label>
                <div className="relative">
                  <input
                    id="customTokenMint"
                    type="text"
                    value={customTokenMint}
                    onChange={(e) => {
                      setCustomTokenMint(e.target.value);
                      if (errors.customTokenMint) {
                        setErrors({ ...errors, customTokenMint: '' });
                      }
                    }}
                    placeholder="Enter token mint public key..."
                    disabled={isLoading}
                    className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${
                      errors.customTokenMint ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {errors.customTokenMint && (
                    <div className="absolute right-3 top-2.5">
                      <AlertCircle size={16} className="text-red-500" />
                    </div>
                  )}
                </div>
                {errors.customTokenMint && (
                  <p className="text-red-400 text-sm">{errors.customTokenMint}</p>
                )}
                <div className="flex items-start space-x-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <Info size={16} className="text-blue-400 mt-0.5" />
                  <p className="text-blue-400 text-xs">
                    Custom tokens must be SPL tokens that both players hold. Ensure you have sufficient balance.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Token Loading/Error States */}
          {tokensError && (
            <div className="flex items-start space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle size={16} className="text-red-400 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm font-medium">Failed to load tokens</p>
                <p className="text-red-400 text-xs">{tokensError}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Match</span>
              )}
            </button>
          </div>
        </form>

        {/* Game Rules */}
        <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Game Rules</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Both players commit their choice secretly</li>
            <li>• After both commit, players reveal their choices</li>
            <li>• Winner takes the pot minus platform fees</li>
            <li>• Rock beats Scissors, Scissors beats Paper, Paper beats Rock</li>
            <li>• Ties result in bet refund</li>
            <li>• SPL tokens require associated token accounts for both players</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateMatchModal;