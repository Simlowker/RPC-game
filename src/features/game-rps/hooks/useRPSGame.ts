// src/games/RPS/hooks/useRPSGame.ts - Main RPS Game Hook
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { 
  RPSClient, 
  Choice, 
  MatchStatus, 
  GameResult,
  RPSMatch,
  generateSalt,
  generateNonce,
  createCommitmentHash,
  formatSOL,
  canJoinMatch,
  canRevealChoice,
  canSettleMatch,
  determineWinner
} from '../../../rps-client';
import { GameConfig, CreateMatchForm, GamePhase, MatchDisplayData } from '../types';
import { useToast } from '../../../hooks/useToast';

const DEFAULT_CONFIG: GameConfig = {
  minBet: 0.001,
  maxBet: 100,
  defaultJoinDeadlineMinutes: 60,
  defaultRevealDeadlineMinutes: 30,
  feeBps: 0, // 0% fees - Winner takes all!
};

export const useRPSGame = () => {
  const { wallet, publicKey } = useWallet();
  const { connection } = useConnection();
  const toast = useToast();

  // Game state
  const [rpsClient, setRpsClient] = useState<RPSClient | null>(null);
  const [matches, setMatches] = useState<RPSMatch[]>([]);
  const [userMatches, setUserMatches] = useState<RPSMatch[]>([]);
  const [currentMatch, setCurrentMatch] = useState<RPSMatch | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>({ phase: 'lobby', canTransition: true });
  
  // Form state
  const [createForm, setCreateForm] = useState<CreateMatchForm>({
    betAmount: '0.01',
    joinDeadlineMinutes: DEFAULT_CONFIG.defaultJoinDeadlineMinutes,
    revealDeadlineMinutes: DEFAULT_CONFIG.defaultRevealDeadlineMinutes,
  });

  // Game state
  const [userChoice, setUserChoice] = useState<Choice | null>(null);
  const [commitmentSalt, setCommitmentSalt] = useState<Uint8Array | null>(null);
  const [commitmentNonce, setCommitmentNonce] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  // Loading states
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [isJoiningMatch, setIsJoiningMatch] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize RPS client
  useEffect(() => {
    console.log('RPS Client initialization:', { 
      wallet: !!wallet, 
      connection: !!connection, 
      publicKey: publicKey?.toString(),
      walletPublicKey: wallet?.publicKey?.toString(),
      connected: wallet?.connected,
      connecting: wallet?.connecting,
      disconnecting: wallet?.disconnecting
    });
    
    if (wallet && connection && publicKey) {
      try {
        // Pass the wallet object directly, not wallet.adapter
        const client = new RPSClient(connection, wallet as any);
        setRpsClient(client);
        console.log('RPS Client created successfully');
      } catch (error) {
        console.error('Failed to create RPS client:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to initialize game client',
        });
      }
    } else {
      setRpsClient(null);
      console.log('RPS Client reset - wallet not ready', {
        wallet: !!wallet,
        connection: !!connection,
        publicKey: !!publicKey
      });
    }
  }, [wallet, connection, publicKey, toast]);

  // Load matches
  const loadMatches = useCallback(async () => {
    if (!rpsClient) return;

    try {
      setIsLoading(true);
      const [openMatches, userMatchesData] = await Promise.all([
        rpsClient.getOpenMatches(),
        publicKey ? rpsClient.getUserMatches(publicKey) : Promise.resolve([])
      ]);

      setMatches(openMatches);
      setUserMatches(userMatchesData);
    } catch (error) {
      console.error('Failed to load matches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load matches',
      });
    } finally {
      setIsLoading(false);
    }
  }, [rpsClient, publicKey, toast]);

  // Load matches on client change
  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Process matches for display
  const matchesDisplay = useMemo((): MatchDisplayData[] => {
    if (!publicKey) return [];

    const currentTime = Math.floor(Date.now() / 1000);
    
    return matches.map(match => ({
      id: match.creator.toString(), // Use a proper match ID in production
      creator: match.creator.toString(),
      opponent: match.opponent?.toString(),
      betAmount: match.betAmount / 1e9, // Convert from lamports
      timeLeft: Math.max(0, match.joinDeadline - currentTime),
      status: match.status,
      canJoin: canJoinMatch(match, publicKey, currentTime),
      canReveal: canRevealChoice(match, publicKey, currentTime),
      canSettle: canSettleMatch(match),
      isUserMatch: match.creator.equals(publicKey) || match.opponent?.equals(publicKey),
      isCreator: match.creator.equals(publicKey),
      isOpponent: match.opponent?.equals(publicKey),
    }));
  }, [matches, publicKey]);

  // Create new match
  const createMatch = useCallback(async () => {
    console.log('Creating match...', { 
      rpsClient: !!rpsClient, 
      publicKey: publicKey?.toString(),
      wallet: !!wallet,
      walletPublicKey: wallet?.publicKey?.toString(),
      connected: wallet?.connected,
      createForm 
    });

    if (!rpsClient || !publicKey) {
      console.error('Cannot create match: missing client or publicKey', {
        rpsClient: !!rpsClient,
        publicKey: !!publicKey,
        wallet: !!wallet,
        walletConnected: wallet?.connected
      });
      toast({ title: 'Error', description: 'Wallet not connected' });
      return;
    }

    try {
      setIsCreatingMatch(true);
      console.log('Starting match creation process...');
      
      const betAmount = parseFloat(createForm.betAmount) * 1e9; // Convert to lamports
      const now = Math.floor(Date.now() / 1000);
      const joinDeadline = now + (createForm.joinDeadlineMinutes * 60);
      const revealDeadline = joinDeadline + (createForm.revealDeadlineMinutes * 60);

      console.log('Match parameters:', {
        betAmount,
        joinDeadline,
        revealDeadline,
        now
      });

      // Generate commitment for creator's choice (will be set later)
      const salt = generateSalt();
      const nonce = generateNonce();
      const dummyChoice = Choice.Rock; // Placeholder
      const commitmentHash = createCommitmentHash(dummyChoice, salt, publicKey, nonce);

      console.log('Generated commitment data, calling rpsClient.createMatch...');

      const txId = await rpsClient.createMatch({
        betAmount,
        commitmentHash: Array.from(commitmentHash),
        joinDeadline,
        revealDeadline,
        feeBps: DEFAULT_CONFIG.feeBps,
        tokenMint: createForm.tokenMint,
      });

      console.log('Match created successfully!', txId);

      toast({
        title: 'Success',
        description: `Match created! Transaction: ${txId.slice(0, 8)}...`,
      });

      // Refresh matches
      await loadMatches();
      
    } catch (error) {
      console.error('Failed to create match:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      toast({
        title: 'Error', 
        description: `Failed to create match: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsCreatingMatch(false);
    }
  }, [rpsClient, publicKey, createForm, toast, loadMatches]);

  // Join existing match
  const joinMatch = useCallback(async (matchPubkey: PublicKey) => {
    if (!rpsClient || !publicKey) {
      toast({ title: 'Error', description: 'Wallet not connected' });
      return;
    }

    try {
      setIsJoiningMatch(true);

      // Generate commitment for opponent's choice (will be set later)
      const salt = generateSalt();
      const nonce = generateNonce();
      const dummyChoice = Choice.Rock; // Placeholder
      const commitmentHash = createCommitmentHash(dummyChoice, salt, publicKey, nonce);

      const txId = await rpsClient.joinMatch({
        matchAccount: matchPubkey,
        commitmentHash: Array.from(commitmentHash),
      });

      toast({
        title: 'Success',
        description: `Joined match! Transaction: ${txId.slice(0, 8)}...`,
      });

      // Load the match and transition to choice phase
      const match = await rpsClient.getMatch(matchPubkey);
      setCurrentMatch(match);
      setGamePhase({ phase: 'choosing', canTransition: true });
      
      await loadMatches();
      
    } catch (error) {
      console.error('Failed to join match:', error);
      toast({
        title: 'Error',
        description: 'Failed to join match'
      });
    } finally {
      setIsJoiningMatch(false);
    }
  }, [rpsClient, publicKey, toast, loadMatches]);

  // Make choice and generate commitment
  const makeChoice = useCallback((choice: Choice) => {
    if (!publicKey || !currentMatch) return;

    try {
      const salt = generateSalt();
      const nonce = generateNonce();
      
      setUserChoice(choice);
      setCommitmentSalt(salt);
      setCommitmentNonce(nonce);
      setGamePhase({ phase: 'revealing', canTransition: true });

      toast({
        title: 'Choice Made',
        description: `You chose ${Choice[choice]}. Waiting for opponent...`,
      });
    } catch (error) {
      console.error('Failed to make choice:', error);
      toast({
        title: 'Error',
        description: 'Failed to make choice'
      });
    }
  }, [publicKey, currentMatch, toast]);

  // Reveal choice
  const revealChoice = useCallback(async (matchPubkey: PublicKey) => {
    if (!rpsClient || !userChoice || !commitmentSalt || commitmentNonce === null) {
      toast({ title: 'Error', description: 'Invalid game state' });
      return;
    }

    try {
      setIsRevealing(true);

      const txId = await rpsClient.reveal({
        matchAccount: matchPubkey,
        choice: userChoice,
        salt: Array.from(commitmentSalt),
        nonce: commitmentNonce,
      });

      setIsRevealed(true);
      toast({
        title: 'Choice Revealed',
        description: `Transaction: ${txId.slice(0, 8)}...`,
      });

      // Check if both players have revealed
      const match = await rpsClient.getMatch(matchPubkey);
      if (match.revealedCreator !== null && match.revealedOpponent !== null) {
        const result = determineWinner(match.revealedCreator, match.revealedOpponent);
        setGameResult(result);
        setGamePhase({ phase: 'results', canTransition: true });
      }
      
    } catch (error) {
      console.error('Failed to reveal choice:', error);
      toast({
        title: 'Error',
        description: 'Failed to reveal choice'
      });
    } finally {
      setIsRevealing(false);
    }
  }, [rpsClient, userChoice, commitmentSalt, commitmentNonce, toast]);

  // Settle match
  const settleMatch = useCallback(async (matchPubkey: PublicKey) => {
    if (!rpsClient) {
      toast({ title: 'Error', description: 'Client not initialized' });
      return;
    }

    try {
      setIsSettling(true);

      const txId = await rpsClient.settle(matchPubkey);
      
      toast({
        title: 'Match Settled',
        description: `Transaction: ${txId.slice(0, 8)}...`,
      });

      setGamePhase({ phase: 'settled', canTransition: false });
      await loadMatches();
      
    } catch (error) {
      console.error('Failed to settle match:', error);
      toast({
        title: 'Error',
        description: 'Failed to settle match'
      });
    } finally {
      setIsSettling(false);
    }
  }, [rpsClient, toast, loadMatches]);

  // Reset game state
  const resetGame = useCallback(() => {
    setCurrentMatch(null);
    setUserChoice(null);
    setCommitmentSalt(null);
    setCommitmentNonce(null);
    setIsRevealed(false);
    setGameResult(null);
    setGamePhase({ phase: 'lobby', canTransition: true });
  }, []);

  return {
    // State
    matches: matchesDisplay,
    userMatches,
    currentMatch,
    gamePhase,
    createForm,
    userChoice,
    isRevealed,
    gameResult,

    // Loading states
    isCreatingMatch,
    isJoiningMatch,
    isRevealing,
    isSettling,
    isLoading,

    // Actions
    setCreateForm,
    createMatch,
    joinMatch,
    makeChoice,
    revealChoice,
    settleMatch,
    resetGame,
    loadMatches,

    // Utils
    config: DEFAULT_CONFIG,
    isConnected: !!publicKey,
  };
};