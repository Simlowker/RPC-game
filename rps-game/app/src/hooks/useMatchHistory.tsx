import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  MatchRecord, 
  PlayerStats, 
  GameChoice, 
  GameResult, 
  HistoryFilter, 
  ExportData,
  HistoryHookReturn 
} from '../types/history';

const STORAGE_KEY = 'rps-match-history';
const STATS_KEY = 'rps-player-stats';
const VERSION = '1.0.0';

export const useMatchHistory = (): HistoryHookReturn => {
  const { publicKey } = useWallet();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from localStorage
  useEffect(() => {
    try {
      setIsLoading(true);
      const storedMatches = localStorage.getItem(STORAGE_KEY);
      if (storedMatches) {
        const parsedMatches = JSON.parse(storedMatches) as MatchRecord[];
        setMatches(parsedMatches);
      }
    } catch (err) {
      setError('Failed to load match history');
      console.error('Error loading match history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save matches to localStorage
  const saveMatches = useCallback((matchList: MatchRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(matchList));
    } catch (err) {
      console.error('Error saving matches:', err);
      setError('Failed to save match history');
    }
  }, []);

  // Calculate player statistics
  const stats = useMemo((): PlayerStats | null => {
    if (!publicKey) return null;

    const playerAddress = publicKey.toString();
    const playerMatches = matches.filter(match => 
      match.playerAddress === playerAddress
    );

    if (playerMatches.length === 0) {
      return {
        totalGames: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        winRate: 0,
        totalWagered: 0,
        totalWinnings: 0,
        netGains: 0,
        currentStreak: 0,
        bestStreak: 0,
        averageBet: 0,
        favoriteChoice: 'rock'
      };
    }

    // Basic counts
    const wins = playerMatches.filter(match => match.result === 'win').length;
    const losses = playerMatches.filter(match => match.result === 'loss').length;
    const ties = playerMatches.filter(match => match.result === 'tie').length;
    const totalGames = playerMatches.length;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    // Financial calculations
    const totalWagered = playerMatches.reduce((sum, match) => sum + match.betAmount, 0);
    const totalWinnings = playerMatches
      .filter(match => match.result === 'win')
      .reduce((sum, match) => sum + match.betAmount * 2, 0);
    const netGains = totalWinnings - totalWagered;
    const averageBet = totalGames > 0 ? totalWagered / totalGames : 0;

    // Streak calculations
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    // Calculate current streak (from most recent)
    for (let i = playerMatches.length - 1; i >= 0; i--) {
      if (playerMatches[i].result === 'win') {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate best streak
    for (const match of playerMatches) {
      if (match.result === 'win') {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Favorite choice
    const choiceCounts = playerMatches.reduce(
      (acc, match) => {
        acc[match.playerChoice]++;
        return acc;
      },
      { rock: 0, paper: 0, scissors: 0 }
    );

    const favoriteChoice = Object.entries(choiceCounts).reduce((a, b) => 
      choiceCounts[a[0] as GameChoice] > choiceCounts[b[0] as GameChoice] ? a : b
    )[0] as GameChoice;

    return {
      totalGames,
      wins,
      losses,
      ties,
      winRate,
      totalWagered,
      totalWinnings,
      netGains,
      currentStreak,
      bestStreak,
      averageBet,
      favoriteChoice
    };
  }, [matches, publicKey]);

  // Add a new match
  const addMatch = useCallback((matchData: Omit<MatchRecord, 'id' | 'timestamp'>) => {
    const newMatch: MatchRecord = {
      ...matchData,
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setMatches(prevMatches => {
      const updatedMatches = [...prevMatches, newMatch];
      saveMatches(updatedMatches);
      return updatedMatches;
    });
  }, [saveMatches]);

  // Clear all history
  const clearHistory = useCallback(() => {
    setMatches([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STATS_KEY);
  }, []);

  // Export data
  const exportData = useCallback((): ExportData => {
    return {
      version: VERSION,
      exportDate: Date.now(),
      matches: matches,
      stats: stats ? { [publicKey?.toString() || '']: stats } : {}
    };
  }, [matches, stats, publicKey]);

  // Import data
  const importData = useCallback((data: ExportData): boolean => {
    try {
      // Validate data structure
      if (!data.version || !Array.isArray(data.matches)) {
        throw new Error('Invalid data format');
      }

      // Validate each match record
      data.matches.forEach(match => {
        if (!match.id || !match.playerAddress || !match.opponentAddress) {
          throw new Error('Invalid match data');
        }
      });

      // Merge with existing data (avoid duplicates)
      const existingIds = new Set(matches.map(match => match.id));
      const newMatches = data.matches.filter(match => !existingIds.has(match.id));
      
      const mergedMatches = [...matches, ...newMatches];
      setMatches(mergedMatches);
      saveMatches(mergedMatches);

      return true;
    } catch (err) {
      console.error('Error importing data:', err);
      setError('Failed to import data');
      return false;
    }
  }, [matches, saveMatches]);

  // Filter matches
  const getFilteredMatches = useCallback((filter: HistoryFilter): MatchRecord[] => {
    if (!publicKey) return [];

    const playerAddress = publicKey.toString();
    
    return matches
      .filter(match => match.playerAddress === playerAddress)
      .filter(match => {
        // Result filter
        if (filter.result && match.result !== filter.result) return false;
        
        // Opponent filter
        if (filter.opponent && !match.opponentAddress.includes(filter.opponent)) return false;
        
        // Date filters
        if (filter.dateFrom && match.timestamp < filter.dateFrom.getTime()) return false;
        if (filter.dateTo && match.timestamp > filter.dateTo.getTime()) return false;
        
        // Bet amount filters
        if (filter.minBet && match.betAmount < filter.minBet) return false;
        if (filter.maxBet && match.betAmount > filter.maxBet) return false;
        
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  }, [matches, publicKey]);

  return {
    matches: publicKey ? matches.filter(match => 
      match.playerAddress === publicKey.toString()
    ).sort((a, b) => b.timestamp - a.timestamp) : [],
    stats,
    addMatch,
    clearHistory,
    exportData,
    importData,
    getFilteredMatches,
    isLoading,
    error
  };
};