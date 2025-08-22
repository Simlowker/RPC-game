// Real RPS Game Hook with On-Chain Integration
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { 
  RPSAnchorClient,
  RPSChoice,
  MatchStatus,
  GameResult,
  UniversalMatch,
  CommitmentData
} from '../../../services/anchor/rps-anchor-client';
import { GameConfig, CreateMatchForm, GamePhase, MatchDisplayData } from '../types';
import { useToast } from '../../../hooks/useToast';

const DEFAULT_CONFIG: GameConfig = {
  minBet: 0.001,
  maxBet: 100,
  defaultJoinDeadlineMinutes: 60,
  defaultRevealDeadlineMinutes: 30,
  feeBps: 0, // 0% fees - Winner takes all!
};

// Poll interval for match updates
const POLL_INTERVAL = 2000; // 2 seconds

export const useRPSGameReal = () => {
  const { wallet, publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const toast = useToast();

  // RPS Client
  const [rpsClient, setRpsClient] = useState<RPSAnchorClient | null>(null);
  
  // Match state
  const [openMatches, setOpenMatches] = useState<UniversalMatch[]>([]);
  const [userMatches, setUserMatches] = useState<UniversalMatch[]>([]);
  const [currentMatch, setCurrentMatch] = useState<UniversalMatch | null>(null);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  
  // Game state
  const [gamePhase, setGamePhase] = useState<GamePhase>({ phase: 'lobby', canTransition: true });
  const [userChoice, setUserChoice] = useState<RPSChoice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<RPSChoice | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [commitmentData, setCommitmentData] = useState<CommitmentData | null>(null);
  
  // Form state
  const [createForm, setCreateForm] = useState<CreateMatchForm>({
    betAmount: '0.01',
    joinDeadlineMinutes: DEFAULT_CONFIG.defaultJoinDeadlineMinutes,
    revealDeadlineMinutes: DEFAULT_CONFIG.defaultRevealDeadlineMinutes,
  });

  // Loading states
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [isJoiningMatch, setIsJoiningMatch] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Polling refs
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<number | null>(null);

  // Initialize RPS client
  useEffect(() => {
    if (wallet && connection && connected && publicKey) {
      try {
        const client = new RPSAnchorClient(connection, wallet as any);
        setRpsClient(client);
        console.log('RPS Anchor Client initialized');
      } catch (error) {
        console.error('Failed to create RPS client:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to initialize game client. Please refresh and try again.',
        });
      }
    } else {
      setRpsClient(null);
    }
  }, [wallet, connection, connected, publicKey, toast]);

  // Load matches
  const loadMatches = useCallback(async () => {
    if (!rpsClient || !publicKey) return;

    try {
      const [open, user] = await Promise.all([
        rpsClient.getOpenMatches(),
        rpsClient.getUserMatches(publicKey)
      ]);

      setOpenMatches(open);
      setUserMatches(user);

      // Update current match if it exists
      if (currentMatchId) {
        const updatedMatch = [...open, ...user].find(
          m => m.matchId.toString() === currentMatchId
        );
        if (updatedMatch) {
          setCurrentMatch(updatedMatch);
          updateGamePhase(updatedMatch);
        }
      }
    } catch (error) {
      console.error('Failed to load matches:', error);
    }
  }, [rpsClient, publicKey, currentMatchId]);

  // Start polling
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(() => {
      loadMatches();
    }, POLL_INTERVAL);
  }, [loadMatches]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Load matches on client change
  useEffect(() => {
    if (rpsClient) {
      loadMatches();
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [rpsClient, loadMatches, startPolling, stopPolling]);

  // Subscribe to match updates
  const subscribeToMatch = useCallback(async (matchId: string) => {
    if (!rpsClient) return;

    try {
      // Unsubscribe from previous match
      if (subscriptionRef.current !== null) {
        await rpsClient.unsubscribe(subscriptionRef.current);
      }

      // Subscribe to new match
      const matchPubkey = new PublicKey(matchId);
      subscriptionRef.current = rpsClient.subscribeToMatchEvents(
        matchPubkey,
        (match) => {
          setCurrentMatch(match);
          updateGamePhase(match);
        }
      );
    } catch (error) {
      console.error('Failed to subscribe to match:', error);
    }
  }, [rpsClient]);

  // Update game phase based on match status
  const updateGamePhase = useCallback((match: UniversalMatch) => {
    if (!match || !publicKey) return;

    const isCreator = match.creator.equals(publicKey);
    const isOpponent = match.opponent?.equals(publicKey);
    const isParticipant = isCreator || isOpponent;

    switch (match.status) {
      case MatchStatus.WaitingForOpponent:
        setGamePhase({ 
          phase: isCreator ? 'waiting' : 'lobby', 
          canTransition: true 
        });
        break;
      
      case MatchStatus.WaitingForCommit:
      case MatchStatus.WaitingForReveal:
        if (isParticipant) {
          // Check if we need to reveal
          const needsReveal = checkNeedsReveal(match, publicKey);
          setGamePhase({ 
            phase: needsReveal ? 'reveal' : 'playing', 
            canTransition: true 
          });
        }
        break;
      
      case MatchStatus.ReadyToSettle:
        setGamePhase({ 
          phase: 'settling', 
          canTransition: true 
        });
        // Auto-settle if we're a participant
        if (isParticipant) {
          handleSettle(match.matchId.toString());
        }
        break;
      
      case MatchStatus.Settled:
        // Determine winner and show result
        const result = rpsClient?.determineWinner(match);
        setGameResult(result || GameResult.Pending);
        setGamePhase({ 
          phase: 'result', 
          canTransition: true 
        });
        break;
      
      case MatchStatus.Cancelled:
      case MatchStatus.TimedOut:
        setGamePhase({ 
          phase: 'lobby', 
          canTransition: true 
        });
        break;
    }
  }, [publicKey, rpsClient]);

  // Check if player needs to reveal
  const checkNeedsReveal = (match: UniversalMatch, userPubkey: PublicKey): boolean => {
    // This would need to parse the game state to check if the user has revealed
    // For now, return false
    return false;
  };

  // Create a new match
  const createMatch = useCallback(async (
    betAmount: number,
    choice: RPSChoice,
    rounds: number = 1
  ) => {
    if (!rpsClient || !publicKey) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to create a match',
      });
      return;
    }

    setIsCreatingMatch(true);
    try {
      const { signature, matchId, commitmentData } = await rpsClient.createMatch(
        betAmount,
        choice,
        rounds
      );

      setCurrentMatchId(matchId);
      setCommitmentData(commitmentData);
      setUserChoice(choice);
      
      // Subscribe to match updates
      await subscribeToMatch(matchId);

      toast({
        title: 'Match Created!',
        description: `Match ID: ${matchId.slice(0, 8)}... | TX: ${signature.slice(0, 8)}...`,
      });

      setGamePhase({ phase: 'waiting', canTransition: true });
      
      // Reload matches
      await loadMatches();
    } catch (error: any) {
      console.error('Failed to create match:', error);
      toast({
        title: 'Failed to Create Match',
        description: error.message || 'Please try again',
      });
    } finally {
      setIsCreatingMatch(false);
    }
  }, [rpsClient, publicKey, toast, loadMatches, subscribeToMatch]);

  // Join a match
  const joinMatch = useCallback(async (
    matchId: string,
    choice: RPSChoice
  ) => {
    if (!rpsClient || !publicKey) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to join a match',
      });
      return;
    }

    setIsJoiningMatch(true);
    try {
      const { signature, commitmentData } = await rpsClient.joinMatch(
        matchId,
        choice
      );

      setCurrentMatchId(matchId);
      setCommitmentData(commitmentData);
      setUserChoice(choice);
      
      // Subscribe to match updates
      await subscribeToMatch(matchId);

      toast({
        title: 'Joined Match!',
        description: `TX: ${signature.slice(0, 8)}...`,
      });

      setGamePhase({ phase: 'playing', canTransition: true });
      
      // Reload matches
      await loadMatches();
    } catch (error: any) {
      console.error('Failed to join match:', error);
      toast({
        title: 'Failed to Join Match',
        description: error.message || 'Please try again',
      });
    } finally {
      setIsJoiningMatch(false);
    }
  }, [rpsClient, publicKey, toast, loadMatches, subscribeToMatch]);

  // Reveal choice
  const revealChoice = useCallback(async () => {
    if (!rpsClient || !currentMatchId) return;

    setIsRevealing(true);
    try {
      const signature = await rpsClient.revealChoice(currentMatchId);

      toast({
        title: 'Choice Revealed!',
        description: `TX: ${signature.slice(0, 8)}...`,
      });

      setGamePhase({ phase: 'playing', canTransition: true });
      
      // Reload matches
      await loadMatches();
    } catch (error: any) {
      console.error('Failed to reveal choice:', error);
      toast({
        title: 'Failed to Reveal Choice',
        description: error.message || 'Please try again',
      });
    } finally {
      setIsRevealing(false);
    }
  }, [rpsClient, currentMatchId, toast, loadMatches]);

  // Settle match
  const handleSettle = useCallback(async (matchId: string) => {
    if (!rpsClient) return;

    setIsSettling(true);
    try {
      const signature = await rpsClient.settleMatch(matchId);

      toast({
        title: 'Match Settled!',
        description: `TX: ${signature.slice(0, 8)}...`,
      });

      setGamePhase({ phase: 'result', canTransition: true });
      
      // Reload matches
      await loadMatches();
    } catch (error: any) {
      console.error('Failed to settle match:', error);
      // Don't show error toast as this might be called automatically
    } finally {
      setIsSettling(false);
    }
  }, [rpsClient, toast, loadMatches]);

  // Claim timeout
  const claimTimeout = useCallback(async (matchId: string) => {
    if (!rpsClient) return;

    setIsClaiming(true);
    try {
      const signature = await rpsClient.claimTimeout(matchId);

      toast({
        title: 'Timeout Claimed!',
        description: `You won by timeout! TX: ${signature.slice(0, 8)}...`,
      });

      setGamePhase({ phase: 'result', canTransition: true });
      
      // Reload matches
      await loadMatches();
    } catch (error: any) {
      console.error('Failed to claim timeout:', error);
      toast({
        title: 'Failed to Claim Timeout',
        description: error.message || 'Please try again',
      });
    } finally {
      setIsClaiming(false);
    }
  }, [rpsClient, toast, loadMatches]);

  // Process matches for display
  const matchesDisplay = useMemo((): MatchDisplayData[] => {
    if (!publicKey) return [];

    const currentTime = Math.floor(Date.now() / 1000);
    
    return openMatches.map(match => ({
      id: match.matchId.toString(),
      creator: match.creator.toString(),
      opponent: match.opponent?.toString(),
      betAmount: match.betAmount.toNumber() / 1e9, // Convert from lamports
      timeLeft: Math.max(0, match.createdAt.toNumber() + match.timeoutSeconds - currentTime),
      status: match.status,
      canJoin: match.status === MatchStatus.WaitingForOpponent && !match.creator.equals(publicKey),
      canReveal: false, // Would need to check game state
      canSettle: match.status === MatchStatus.ReadyToSettle,
      isUserMatch: match.creator.equals(publicKey) || match.opponent?.equals(publicKey),
      isCreator: match.creator.equals(publicKey),
      isOpponent: match.opponent?.equals(publicKey),
    }));
  }, [openMatches, publicKey]);

  // Reset game
  const resetGame = useCallback(() => {
    setCurrentMatch(null);
    setCurrentMatchId(null);
    setUserChoice(null);
    setOpponentChoice(null);
    setGameResult(null);
    setCommitmentData(null);
    setGamePhase({ phase: 'lobby', canTransition: true });
    
    // Unsubscribe from match events
    if (subscriptionRef.current !== null && rpsClient) {
      rpsClient.unsubscribe(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  }, [rpsClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      if (subscriptionRef.current !== null && rpsClient) {
        rpsClient.unsubscribe(subscriptionRef.current);
      }
    };
  }, [rpsClient, stopPolling]);

  return {
    // State
    connected,
    publicKey,
    matches: matchesDisplay,
    userMatches,
    currentMatch,
    gamePhase,
    userChoice,
    opponentChoice,
    gameResult,
    createForm,
    
    // Actions
    createMatch,
    joinMatch,
    revealChoice,
    settleMatch: handleSettle,
    claimTimeout,
    resetGame,
    setCreateForm,
    setUserChoice,
    
    // Loading states
    isCreatingMatch,
    isJoiningMatch,
    isRevealing,
    isSettling,
    isClaiming,
    isLoading,
    
    // Utils
    loadMatches,
  };
};