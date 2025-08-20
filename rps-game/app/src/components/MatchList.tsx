import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Clock, Users, Trophy, AlertTriangle, Refresh, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Match, MatchStatus, formatSOL, getStatusMessage } from '../utils/game';
import { ActiveMatch } from './GameApp';

interface MatchListProps {
  matches: Match[];
  onJoinMatch: (matchId: PublicKey) => Promise<void>;
  onSelectMatch: (match: ActiveMatch) => void;
  onRefresh: () => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

interface MatchWithId extends Match {
  id: PublicKey;
  timeRemaining?: number;
}

const MatchList: React.FC<MatchListProps> = ({
  matches,
  onJoinMatch,
  onSelectMatch,
  onRefresh,
  loading = false,
  error = null,
}) => {
  const { publicKey } = useWallet();
  const [matchesWithTimers, setMatchesWithTimers] = useState<MatchWithId[]>([]);
  const [joiningMatchId, setJoiningMatchId] = useState<PublicKey | null>(null);
  const [showMyMatches, setShowMyMatches] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Update matches with time calculations
  useEffect(() => {
    const now = Date.now() / 1000;
    const updated = matches.map((match, index) => {
      const matchWithId = {
        ...match,
        id: new PublicKey(`match_${index}_${match.creator.toString().slice(0, 8)}`), // Temporary ID generation
        timeRemaining: undefined as number | undefined,
      };

      // Calculate time remaining based on match status
      if (match.status === MatchStatus.WaitingForOpponent) {
        matchWithId.timeRemaining = Math.max(0, match.joinDeadline - now);
      } else if (match.status === MatchStatus.WaitingForReveal) {
        matchWithId.timeRemaining = Math.max(0, match.revealDeadline - now);
      }

      return matchWithId;
    });
    
    setMatchesWithTimers(updated);
  }, [matches]);

  // Auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      setMatchesWithTimers(prev => 
        prev.map(match => {
          if (match.timeRemaining && match.timeRemaining > 0) {
            return {
              ...match,
              timeRemaining: Math.max(0, match.timeRemaining - 1)
            };
          }
          return match;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleJoinMatch = async (matchId: PublicKey) => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    setJoiningMatchId(matchId);
    try {
      await onJoinMatch(matchId);
      toast.success('Successfully joined match!');
    } catch (error) {
      console.error('Error joining match:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join match');
    } finally {
      setJoiningMatchId(null);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      toast.error('Failed to refresh matches');
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Expired';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = (status: MatchStatus, timeRemaining?: number): string => {
    if (timeRemaining !== undefined && timeRemaining <= 60) {
      return 'text-red-400';
    }
    
    switch (status) {
      case MatchStatus.WaitingForOpponent:
        return 'text-green-400';
      case MatchStatus.WaitingForReveal:
        return 'text-yellow-400';
      case MatchStatus.ReadyToSettle:
        return 'text-blue-400';
      case MatchStatus.Settled:
        return 'text-gray-400';
      case MatchStatus.Cancelled:
      case MatchStatus.TimedOut:
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const isMyMatch = (match: MatchWithId): boolean => {
    return publicKey ? (
      match.creator.equals(publicKey) || 
      (match.opponent && match.opponent.equals(publicKey))
    ) : false;
  };

  const canJoinMatch = (match: MatchWithId): boolean => {
    return (
      publicKey &&
      match.status === MatchStatus.WaitingForOpponent &&
      !match.creator.equals(publicKey) &&
      (match.timeRemaining === undefined || match.timeRemaining > 0)
    ) || false;
  };

  const canViewMatch = (match: MatchWithId): boolean => {
    return isMyMatch(match) && match.status !== MatchStatus.WaitingForOpponent;
  };

  const filteredMatches = matchesWithTimers.filter(match => 
    showMyMatches ? isMyMatch(match) : !isMyMatch(match)
  );

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="text-red-400" size={20} />
          <div>
            <h3 className="text-red-400 font-medium">Error loading matches</h3>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-white">
            {showMyMatches ? 'My Matches' : 'Available Matches'}
          </h2>
          <button
            onClick={() => setShowMyMatches(!showMyMatches)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
          >
            {showMyMatches ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{showMyMatches ? 'Show All' : 'Show Mine'}</span>
          </button>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Refresh size={16} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="animate-pulse space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-600 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-600 rounded w-1/4"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-600 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Match list */}
      {!loading && filteredMatches.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto text-gray-600 mb-4" size={48} />
          <h3 className="text-gray-400 text-lg font-medium">
            {showMyMatches ? 'No matches found' : 'No available matches'}
          </h3>
          <p className="text-gray-500 mt-1">
            {showMyMatches 
              ? 'Create a match to get started!' 
              : 'Be the first to create a match!'
            }
          </p>
        </div>
      )}

      {!loading && filteredMatches.map((match) => (
        <div
          key={match.id.toString()}
          className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                match.status === MatchStatus.WaitingForOpponent ? 'bg-green-400' :
                match.status === MatchStatus.WaitingForReveal ? 'bg-yellow-400' :
                match.status === MatchStatus.ReadyToSettle ? 'bg-blue-400' :
                'bg-gray-400'
              }`} />
              <span className={`font-medium ${getStatusColor(match.status, match.timeRemaining)}`}>
                {getStatusMessage(match.status)}
              </span>
            </div>
            
            <div className="text-right">
              <div className="text-white font-bold">
                {formatSOL(match.betAmount)} SOL
              </div>
              {match.tokenMint && (
                <div className="text-xs text-gray-400">
                  Custom Token
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
            <div>
              Creator: {match.creator.toString().slice(0, 8)}...
              {match.creator.toString().slice(-4)}
            </div>
            {match.opponent && (
              <div>
                Opponent: {match.opponent.toString().slice(0, 8)}...
                {match.opponent.toString().slice(-4)}
              </div>
            )}
          </div>

          {match.timeRemaining !== undefined && (
            <div className="flex items-center space-x-2 mb-4">
              <Clock size={14} className="text-gray-400" />
              <span className={`text-sm ${
                match.timeRemaining <= 60 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {formatTimeRemaining(match.timeRemaining)}
              </span>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            {canJoinMatch(match) && (
              <button
                onClick={() => handleJoinMatch(match.id)}
                disabled={joiningMatchId?.equals(match.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {joiningMatchId?.equals(match.id) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <Trophy size={16} />
                    <span>Join Match</span>
                  </>
                )}
              </button>
            )}

            {canViewMatch(match) && (
              <button
                onClick={() => onSelectMatch({
                  matchId: match.id,
                  isCreator: match.creator.equals(publicKey!)
                })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Eye size={16} />
                <span>View Match</span>
              </button>
            )}

            {isMyMatch(match) && match.status === MatchStatus.WaitingForOpponent && (
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                disabled
              >
                Waiting...
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchList;