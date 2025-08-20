import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Trophy,
  X,
  RefreshCw
} from 'lucide-react';
import { 
  Match, 
  Choice, 
  MatchStatus,
  GameResult,
  getChoiceEmoji, 
  getStatusMessage,
  formatSOL,
  createCommitmentHash,
  generateSalt,
  generateNonce,
  determineWinner
} from '../utils/game';
import ErrorBoundary from './ErrorBoundary';

interface MatchRoomProps {
  matchId: PublicKey;
  isCreator: boolean;
  match: Match | null;
  onBack: () => void;
  onCommitChoice: (choice: Choice, commitment: Uint8Array) => Promise<void>;
  onRevealChoice: (choice: Choice, salt: Uint8Array, nonce: number) => Promise<void>;
  onSettleMatch: () => Promise<void>;
  onCancelMatch: () => Promise<void>;
  loading: boolean;
}

interface PendingCommitment {
  choice: Choice;
  salt: Uint8Array;
  nonce: number;
  commitment: Uint8Array;
}

const MatchRoom: React.FC<MatchRoomProps> = ({
  matchId,
  isCreator,
  match,
  onBack,
  onCommitChoice,
  onRevealChoice,
  onSettleMatch,
  onCancelMatch,
  loading
}) => {
  const { publicKey } = useWallet();
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [pendingCommitment, setPendingCommitment] = useState<PendingCommitment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Calculate time remaining for current phase
  useEffect(() => {
    if (!match) return;

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      let deadline = 0;

      if (match.status === MatchStatus.WaitingForOpponent) {
        deadline = match.joinDeadline;
      } else if (match.status === MatchStatus.WaitingForReveal) {
        deadline = match.revealDeadline;
      }

      const remaining = Math.max(0, deadline - now);
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [match]);

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Expired';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Check if current player has committed
  const hasCommitted = useMemo(() => {
    if (!match || !publicKey) return false;
    
    if (isCreator) {
      return match.commitmentCreator.some(b => b !== 0);
    } else {
      return match.commitmentOpponent.some(b => b !== 0);
    }
  }, [match, publicKey, isCreator]);

  // Check if current player has revealed
  const hasRevealed = useMemo(() => {
    if (!match) return false;
    
    if (isCreator) {
      return match.revealedCreator !== undefined;
    } else {
      return match.revealedOpponent !== undefined;
    }
  }, [match, isCreator]);

  // Get opponent's public key
  const opponentKey = useMemo(() => {
    if (!match) return null;
    return isCreator ? match.opponent : match.creator;
  }, [match, isCreator]);

  // Check if both players have revealed
  const bothRevealed = useMemo(() => {
    return match?.revealedCreator !== undefined && match?.revealedOpponent !== undefined;
  }, [match]);

  // Calculate game result
  const gameResult = useMemo(() => {
    if (!bothRevealed || !match?.revealedCreator || !match?.revealedOpponent) {
      return null;
    }
    return determineWinner(match.revealedCreator, match.revealedOpponent);
  }, [bothRevealed, match]);

  // Check if current player won
  const playerWon = useMemo(() => {
    if (!gameResult) return null;
    
    if (gameResult === GameResult.Tie) return false;
    
    return (isCreator && gameResult === GameResult.CreatorWins) ||
           (!isCreator && gameResult === GameResult.OpponentWins);
  }, [gameResult, isCreator]);

  const handleChoiceSelect = (choice: Choice) => {
    setSelectedChoice(choice);
  };

  const handleCommitChoice = async () => {
    if (!selectedChoice || !publicKey) return;

    setActionLoading(true);
    try {
      // Generate salt and nonce
      const salt = generateSalt();
      const nonce = generateNonce();
      
      // Create commitment hash
      const commitment = createCommitmentHash(selectedChoice, salt, publicKey, nonce);
      
      // Store pending commitment for later reveal
      setPendingCommitment({
        choice: selectedChoice,
        salt,
        nonce,
        commitment
      });

      await onCommitChoice(selectedChoice, commitment);
      toast.success('Choice committed successfully!');
      setSelectedChoice(null);
    } catch (error) {
      console.error('Error committing choice:', error);
      toast.error('Failed to commit choice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevealChoice = async () => {
    if (!pendingCommitment) {
      toast.error('No pending commitment found');
      return;
    }

    setActionLoading(true);
    try {
      await onRevealChoice(
        pendingCommitment.choice, 
        pendingCommitment.salt, 
        pendingCommitment.nonce
      );
      toast.success('Choice revealed successfully!');
      setShowReveal(false);
    } catch (error) {
      console.error('Error revealing choice:', error);
      toast.error('Failed to reveal choice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSettleMatch = async () => {
    setActionLoading(true);
    try {
      await onSettleMatch();
      toast.success('Match settled successfully!');
    } catch (error) {
      console.error('Error settling match:', error);
      toast.error('Failed to settle match');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelMatch = async () => {
    if (!confirm('Are you sure you want to cancel this match?')) return;

    setActionLoading(true);
    try {
      await onCancelMatch();
      toast.success('Match cancelled successfully!');
      onBack();
    } catch (error) {
      console.error('Error cancelling match:', error);
      toast.error('Failed to cancel match');
    } finally {
      setActionLoading(false);
    }
  };

  if (!match) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-300">Loading match data...</p>
        </div>
      </div>
    );
  }

  const choices = [
    { value: Choice.Rock, emoji: '🗿', label: 'Rock' },
    { value: Choice.Paper, emoji: '📄', label: 'Paper' },
    { value: Choice.Scissors, emoji: '✂️', label: 'Scissors' }
  ];

  const canCancel = isCreator && match.status === MatchStatus.WaitingForOpponent;
  const canSettle = match.status === MatchStatus.ReadyToSettle;

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white transition-colors"
            disabled={loading || actionLoading}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Lobby</span>
          </button>

          <div className="flex items-center space-x-4">
            {canCancel && (
              <button
                onClick={handleCancelMatch}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Cancel Match</span>
              </button>
            )}
          </div>
        </div>

        {/* Match Info Card */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              🗿📄✂️ Rock Paper Scissors
            </h1>
            <p className="text-gray-300">
              Match ID: {matchId.toString().substring(0, 8)}...
            </p>
          </div>

          {/* Status and Timer */}
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                match.status === MatchStatus.WaitingForOpponent ? 'bg-yellow-500 animate-pulse' :
                match.status === MatchStatus.WaitingForReveal ? 'bg-blue-500 animate-pulse' :
                match.status === MatchStatus.ReadyToSettle ? 'bg-green-500' :
                match.status === MatchStatus.Settled ? 'bg-gray-500' : 'bg-red-500'
              }`} />
              <span className="text-white font-medium">
                {getStatusMessage(match.status)}
              </span>
            </div>

            {timeLeft > 0 && (
              <div className="flex items-center space-x-2 text-yellow-400">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTimeRemaining(timeLeft)}</span>
              </div>
            )}
          </div>

          {/* Bet Amount */}
          <div className="text-center bg-gray-700 rounded-lg p-4">
            <p className="text-gray-300 text-sm mb-1">Bet Amount</p>
            <p className="text-2xl font-bold text-yellow-400">
              {formatSOL(match.betAmount)} SOL
            </p>
          </div>
        </div>

        {/* Players */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Creator */}
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="text-center space-y-3">
              <h3 className="text-lg font-semibold text-white">
                Creator {isCreator && '(You)'}
              </h3>
              <p className="text-xs text-gray-400 break-all">
                {match.creator.toString()}
              </p>
              
              {/* Creator Choice Display */}
              <div className="mt-4">
                {match.revealedCreator ? (
                  <div className="text-4xl">{getChoiceEmoji(match.revealedCreator)}</div>
                ) : match.commitmentCreator.some(b => b !== 0) ? (
                  <div className="text-2xl text-yellow-500">🤔</div>
                ) : (
                  <div className="text-2xl text-gray-500">⏳</div>
                )}
                
                <p className="text-sm text-gray-400 mt-2">
                  {match.revealedCreator ? match.revealedCreator :
                   match.commitmentCreator.some(b => b !== 0) ? 'Choice committed' : 'Waiting...'}
                </p>
              </div>
            </div>
          </div>

          {/* Opponent */}
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="text-center space-y-3">
              <h3 className="text-lg font-semibold text-white">
                Opponent {!isCreator && '(You)'}
              </h3>
              <p className="text-xs text-gray-400 break-all">
                {opponentKey?.toString() || 'Waiting for player...'}
              </p>
              
              {/* Opponent Choice Display */}
              <div className="mt-4">
                {match.revealedOpponent ? (
                  <div className="text-4xl">{getChoiceEmoji(match.revealedOpponent)}</div>
                ) : match.commitmentOpponent.some(b => b !== 0) ? (
                  <div className="text-2xl text-yellow-500">🤔</div>
                ) : (
                  <div className="text-2xl text-gray-500">⏳</div>
                )}
                
                <p className="text-sm text-gray-400 mt-2">
                  {match.revealedOpponent ? match.revealedOpponent :
                   match.commitmentOpponent.some(b => b !== 0) ? 'Choice committed' : 'Waiting...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Actions */}
        {match.status === MatchStatus.WaitingForOpponent && isCreator && (
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Waiting for Opponent
            </h3>
            <p className="text-gray-300 mb-4">
              Share your match ID with another player to start the game
            </p>
            <div className="bg-gray-700 rounded-lg p-3 text-sm font-mono break-all">
              {matchId.toString()}
            </div>
          </div>
        )}

        {match.status === MatchStatus.WaitingForOpponent && !isCreator && !hasCommitted && (
          <div className="bg-gray-800 rounded-xl p-6 space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                Make Your Choice
              </h3>
              <p className="text-gray-300">
                Select your move and commit it to the blockchain
              </p>
            </div>

            {/* Choice Selection */}
            <div className="grid grid-cols-3 gap-4">
              {choices.map((choice) => (
                <button
                  key={choice.value}
                  onClick={() => handleChoiceSelect(choice.value)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    selectedChoice === choice.value
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-4xl mb-2">{choice.emoji}</div>
                  <div className="text-white font-medium">{choice.label}</div>
                </button>
              ))}
            </div>

            {selectedChoice && (
              <button
                onClick={handleCommitChoice}
                disabled={actionLoading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Committing...' : `Commit ${selectedChoice}`}
              </button>
            )}
          </div>
        )}

        {(match.status === MatchStatus.WaitingForOpponent || match.status === MatchStatus.WaitingForReveal) && 
         opponentKey && !hasCommitted && (
          <div className="bg-gray-800 rounded-xl p-6 space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                Make Your Choice
              </h3>
              <p className="text-gray-300">
                Select your move and commit it to the blockchain
              </p>
            </div>

            {/* Choice Selection */}
            <div className="grid grid-cols-3 gap-4">
              {choices.map((choice) => (
                <button
                  key={choice.value}
                  onClick={() => handleChoiceSelect(choice.value)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    selectedChoice === choice.value
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-4xl mb-2">{choice.emoji}</div>
                  <div className="text-white font-medium">{choice.label}</div>
                </button>
              ))}
            </div>

            {selectedChoice && (
              <button
                onClick={handleCommitChoice}
                disabled={actionLoading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Committing...' : `Commit ${selectedChoice}`}
              </button>
            )}
          </div>
        )}

        {/* Reveal Phase */}
        {match.status === MatchStatus.WaitingForReveal && hasCommitted && !hasRevealed && pendingCommitment && (
          <div className="bg-gray-800 rounded-xl p-6 space-y-6">
            <div className="text-center">
              <Eye className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Reveal Your Choice
              </h3>
              <p className="text-gray-300 mb-4">
                Both players have committed. Now reveal your choice!
              </p>
              
              {!showReveal ? (
                <button
                  onClick={() => setShowReveal(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Reveal Choice
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-300 mb-2">Your committed choice:</p>
                    <div className="text-3xl">{getChoiceEmoji(pendingCommitment.choice)}</div>
                    <p className="text-white font-medium">{pendingCommitment.choice}</p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleRevealChoice}
                      disabled={actionLoading}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Revealing...' : 'Confirm Reveal'}
                    </button>
                    <button
                      onClick={() => setShowReveal(false)}
                      disabled={actionLoading}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Waiting for Reveals */}
        {match.status === MatchStatus.WaitingForReveal && hasRevealed && !bothRevealed && (
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <EyeOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Waiting for Opponent
            </h3>
            <p className="text-gray-300">
              Waiting for the other player to reveal their choice...
            </p>
          </div>
        )}

        {/* Game Results */}
        {bothRevealed && gameResult && (
          <div className="bg-gray-800 rounded-xl p-6 space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {gameResult === GameResult.Tie ? '🤝' : playerWon ? '🎉' : '😔'}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {gameResult === GameResult.Tie ? 'It\'s a Tie!' :
                 playerWon ? 'You Won!' : 'You Lost!'}
              </h3>
              <p className="text-gray-300 text-lg">
                {match.revealedCreator} vs {match.revealedOpponent}
              </p>
            </div>

            {canSettle && (
              <button
                onClick={handleSettleMatch}
                disabled={actionLoading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Trophy className="w-5 h-5" />
                <span>{actionLoading ? 'Settling...' : 'Settle Match'}</span>
              </button>
            )}
          </div>
        )}

        {/* Match Settled */}
        {match.status === MatchStatus.Settled && (
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Match Settled
            </h3>
            <p className="text-gray-300">
              This match has been completed and rewards have been distributed.
            </p>
          </div>
        )}

        {/* Match Cancelled/Timed Out */}
        {(match.status === MatchStatus.Cancelled || match.status === MatchStatus.TimedOut) && (
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {match.status === MatchStatus.Cancelled ? 'Match Cancelled' : 'Match Timed Out'}
            </h3>
            <p className="text-gray-300">
              {match.status === MatchStatus.Cancelled 
                ? 'This match was cancelled by the creator.'
                : 'This match has expired due to inactivity.'}
            </p>
          </div>
        )}

        {/* Debug Info (Development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-900 rounded-xl p-4 text-xs">
            <h4 className="text-white font-medium mb-2">Debug Info</h4>
            <pre className="text-gray-400 overflow-auto">
              {JSON.stringify({
                status: match.status,
                hasCommitted,
                hasRevealed,
                bothRevealed,
                gameResult,
                playerWon,
                pendingCommitment: !!pendingCommitment
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default MatchRoom;