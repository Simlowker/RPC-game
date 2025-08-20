import React, { useState, useMemo, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown, 
  TrendingUp, 
  Flame, 
  Target, 
  RefreshCw,
  Filter,
  Star,
  Users
} from 'lucide-react';
import { LeaderboardEntry, PlayerStats, GameResult } from '../types/history';

interface LeaderboardProps {
  allMatches?: any[]; // This would be passed from a global context or prop
  className?: string;
}

type LeaderboardSortBy = 'winRate' | 'totalGames' | 'netGains' | 'currentStreak' | 'bestStreak';

const Leaderboard: React.FC<LeaderboardProps> = ({ allMatches = [], className = '' }) => {
  const { publicKey } = useWallet();
  const [sortBy, setSortBy] = useState<LeaderboardSortBy>('winRate');
  const [minGames, setMinGames] = useState(3);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate leaderboard from match data
  const leaderboardData = useMemo((): LeaderboardEntry[] => {
    // For demo purposes, we'll generate some sample data
    // In a real app, this would come from a global state or API
    const samplePlayers = [
      {
        address: publicKey?.toString() || 'You',
        stats: {
          totalGames: 15,
          wins: 10,
          losses: 4,
          ties: 1,
          winRate: 66.7,
          totalWagered: 1.5,
          totalWinnings: 2.0,
          netGains: 0.5,
          currentStreak: 3,
          bestStreak: 5,
          averageBet: 0.1,
          favoriteChoice: 'rock' as const
        }
      },
      {
        address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        stats: {
          totalGames: 25,
          wins: 18,
          losses: 6,
          ties: 1,
          winRate: 72.0,
          totalWagered: 2.5,
          totalWinnings: 3.6,
          netGains: 1.1,
          currentStreak: 7,
          bestStreak: 10,
          averageBet: 0.1,
          favoriteChoice: 'paper' as const
        }
      },
      {
        address: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC7Twb8kHBqBHE',
        stats: {
          totalGames: 30,
          wins: 19,
          losses: 9,
          ties: 2,
          winRate: 63.3,
          totalWagered: 3.0,
          totalWinnings: 3.8,
          netGains: 0.8,
          currentStreak: 2,
          bestStreak: 8,
          averageBet: 0.1,
          favoriteChoice: 'scissors' as const
        }
      },
      {
        address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        stats: {
          totalGames: 20,
          wins: 14,
          losses: 5,
          ties: 1,
          winRate: 70.0,
          totalWagered: 2.0,
          totalWinnings: 2.8,
          netGains: 0.8,
          currentStreak: 4,
          bestStreak: 6,
          averageBet: 0.1,
          favoriteChoice: 'rock' as const
        }
      },
      {
        address: 'BQi7rwuaZ8V5dxJYFQDhpwvRhMZtJ3qm9mGRPEakrYWP',
        stats: {
          totalGames: 12,
          wins: 8,
          losses: 3,
          ties: 1,
          winRate: 66.7,
          totalWagered: 1.2,
          totalWinnings: 1.6,
          netGains: 0.4,
          currentStreak: 1,
          bestStreak: 4,
          averageBet: 0.1,
          favoriteChoice: 'paper' as const
        }
      }
    ];

    // Filter by minimum games and sort
    return samplePlayers
      .filter(player => player.stats.totalGames >= minGames)
      .sort((a, b) => {
        const aValue = a.stats[sortBy];
        const bValue = b.stats[sortBy];
        return bValue - aValue;
      })
      .map((player, index) => ({
        playerAddress: player.address,
        stats: player.stats,
        rank: index + 1,
        displayName: player.address === publicKey?.toString() ? 'You' : undefined
      }));
  }, [sortBy, minGames, publicKey, allMatches]);

  const playerRank = leaderboardData.findIndex(entry => 
    entry.playerAddress === publicKey?.toString()
  ) + 1;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-orange-500" />;
      default: return <span className="text-gray-500 font-bold">{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
    if (rank <= 10) return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
    return 'bg-gray-700 text-gray-300';
  };

  const formatAddress = (address: string) => {
    if (address === 'You') return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getSortLabel = (sortType: LeaderboardSortBy) => {
    switch (sortType) {
      case 'winRate': return 'Win Rate';
      case 'totalGames': return 'Games Played';
      case 'netGains': return 'Net Gains';
      case 'currentStreak': return 'Current Streak';
      case 'bestStreak': return 'Best Streak';
      default: return sortType;
    }
  };

  const getSortValue = (stats: PlayerStats, sortType: LeaderboardSortBy) => {
    const value = stats[sortType];
    switch (sortType) {
      case 'winRate': return `${value.toFixed(1)}%`;
      case 'netGains': return `${value >= 0 ? '+' : ''}${value.toFixed(4)} SOL`;
      case 'totalGames':
      case 'currentStreak':
      case 'bestStreak': 
        return value.toString();
      default: return value.toString();
    }
  };

  if (!publicKey) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 text-center ${className}`}>
        <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-300 mb-2">Connect Wallet</h3>
        <p className="text-gray-500">Connect your wallet to view the leaderboard</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Player Rank Card */}
      {playerRank > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Your Rank</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getRankIcon(playerRank)}
                  <span className="text-2xl font-bold text-white">#{playerRank}</span>
                </div>
                <div className="text-white/80 text-sm">
                  out of {leaderboardData.length} players
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {getSortValue(leaderboardData[playerRank - 1]?.stats, sortBy)}
              </div>
              <div className="text-white/80 text-sm">
                {getSortLabel(sortBy)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Leaderboard
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as LeaderboardSortBy)}
                className="bg-gray-700 text-white rounded-lg px-3 py-1 text-sm"
              >
                <option value="winRate">Win Rate</option>
                <option value="totalGames">Games Played</option>
                <option value="netGains">Net Gains</option>
                <option value="currentStreak">Current Streak</option>
                <option value="bestStreak">Best Streak</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-300">Min games:</label>
              <select
                value={minGames}
                onChange={(e) => setMinGames(parseInt(e.target.value))}
                className="bg-gray-700 text-white rounded-lg px-3 py-1 text-sm"
              >
                <option value="1">1+</option>
                <option value="3">3+</option>
                <option value="5">5+</option>
                <option value="10">10+</option>
              </select>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Leaderboard List */}
        {leaderboardData.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Players Found</h3>
            <p className="text-gray-500">
              No players meet the minimum games requirement of {minGames}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboardData.map((entry) => (
              <div
                key={entry.playerAddress}
                className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                  entry.playerAddress === publicKey?.toString()
                    ? 'bg-blue-900/50 border border-blue-600/50'
                    : 'bg-gray-700 hover:bg-gray-650'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${getRankBadge(entry.rank)}`}>
                    {entry.rank <= 3 ? (
                      <div className="flex items-center gap-1">
                        {getRankIcon(entry.rank)}
                        <span>{entry.rank}</span>
                      </div>
                    ) : (
                      entry.rank
                    )}
                  </div>

                  {/* Player Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {entry.displayName || formatAddress(entry.playerAddress)}
                      </span>
                      {entry.playerAddress === publicKey?.toString() && (
                        <Star className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {entry.stats.wins}W-{entry.stats.losses}L-{entry.stats.ties}T
                      ({entry.stats.totalGames} games)
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {getSortValue(entry.stats, sortBy)}
                  </div>
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    {entry.stats.currentStreak > 0 && (
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {entry.stats.currentStreak}
                      </span>
                    )}
                    <span className="text-gray-500">
                      {entry.stats.netGains >= 0 ? '+' : ''}{entry.stats.netGains.toFixed(4)} SOL
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{leaderboardData.length}</div>
              <div className="text-sm text-gray-400">Total Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {leaderboardData.reduce((sum, entry) => sum + entry.stats.totalGames, 0)}
              </div>
              <div className="text-sm text-gray-400">Total Games</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {Math.max(...leaderboardData.map(entry => entry.stats.bestStreak))}
              </div>
              <div className="text-sm text-gray-400">Best Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {(leaderboardData.reduce((sum, entry) => sum + entry.stats.winRate, 0) / leaderboardData.length).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Avg Win Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;