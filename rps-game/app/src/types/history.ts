export type GameChoice = 'rock' | 'paper' | 'scissors';

export type GameResult = 'win' | 'loss' | 'tie';

export interface MatchRecord {
  id: string;
  timestamp: number;
  playerAddress: string;
  opponentAddress: string;
  playerChoice: GameChoice;
  opponentChoice: GameChoice;
  result: GameResult;
  betAmount: number;
  tokenMint: string;
}

export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
  totalWagered: number;
  totalWinnings: number;
  netGains: number;
  currentStreak: number;
  bestStreak: number;
  averageBet: number;
  favoriteChoice: GameChoice;
}

export interface LeaderboardEntry {
  playerAddress: string;
  stats: PlayerStats;
  rank: number;
  displayName?: string;
}

export type SortableColumn = 
  | 'timestamp' 
  | 'opponent' 
  | 'result' 
  | 'betAmount' 
  | 'playerChoice' 
  | 'opponentChoice';

export type SortOrder = 'asc' | 'desc';

export interface HistoryFilter {
  result?: GameResult;
  opponent?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minBet?: number;
  maxBet?: number;
}

export interface ExportData {
  version: string;
  exportDate: number;
  matches: MatchRecord[];
  stats: Record<string, PlayerStats>;
}

export interface HistoryHookReturn {
  matches: MatchRecord[];
  stats: PlayerStats | null;
  addMatch: (match: Omit<MatchRecord, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  exportData: () => ExportData;
  importData: (data: ExportData) => boolean;
  getFilteredMatches: (filter: HistoryFilter) => MatchRecord[];
  isLoading: boolean;
  error: string | null;
}

export interface LeaderboardHookReturn {
  leaderboard: LeaderboardEntry[];
  playerRank: number | null;
  totalPlayers: number;
  isLoading: boolean;
  refreshLeaderboard: () => void;
}