import { PublicKey } from '@solana/web3.js';
import { Choice, GameResult } from '../utils/game';

export interface MatchHistoryEntry {
  id: string;
  timestamp: number;
  opponent: string; // wallet address as string
  playerChoice: Choice;
  opponentChoice: Choice;
  result: GameResult;
  betAmount: number;
  tokenSymbol: string;
  matchId: string; // PublicKey as string
  playerWallet: string; // wallet address as string
  duration?: number; // match duration in seconds
  netGain: number; // positive for wins, negative for losses, 0 for ties
}

export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
  totalWagered: number;
  totalWon: number;
  netProfit: number;
  averageBet: number;
  longestWinStreak: number;
  currentStreak: number;
  streakType: 'win' | 'loss' | 'tie' | 'none';
  favoriteChoice: Choice;
  choiceStats: Record<Choice, {
    played: number;
    won: number;
    winRate: number;
  }>;
  recentForm: GameResult[]; // last 10 results
}

export interface LeaderboardEntry {
  wallet: string;
  stats: PlayerStats;
  rank: number;
  displayName?: string;
}

export interface MatchHistoryState {
  matches: MatchHistoryEntry[];
  stats: PlayerStats;
  isLoading: boolean;
  error: string | null;
}

export interface ExportData {
  matches: MatchHistoryEntry[];
  exportedAt: number;
  version: string;
  playerWallet: string;
}

export type SortField = 
  | 'timestamp' 
  | 'opponent' 
  | 'result' 
  | 'betAmount' 
  | 'netGain' 
  | 'playerChoice'
  | 'opponentChoice';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface FilterConfig {
  result?: GameResult;
  choice?: Choice;
  dateRange?: {
    start: number;
    end: number;
  };
  minBet?: number;
  maxBet?: number;
  opponent?: string;
}