import React, { useState, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  History, 
  Download, 
  Upload, 
  Trash2, 
  Filter, 
  SortAsc, 
  SortDesc,
  Calendar,
  Trophy,
  Target,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useMatchHistory } from '../hooks/useMatchHistory';
import { 
  MatchRecord, 
  SortableColumn, 
  SortOrder, 
  HistoryFilter,
  GameResult 
} from '../types/history';

const MatchHistory: React.FC = () => {
  const { publicKey } = useWallet();
  const { 
    matches, 
    stats, 
    clearHistory, 
    exportData, 
    importData, 
    getFilteredMatches,
    isLoading 
  } = useMatchHistory();

  const [sortColumn, setSortColumn] = useState<SortableColumn>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<HistoryFilter>({});
  const [showStats, setShowStats] = useState(true);

  const filteredAndSortedMatches = useMemo(() => {
    const filtered = getFilteredMatches(filter);
    
    return filtered.sort((a, b) => {
      let aValue: any = a[sortColumn];
      let bValue: any = b[sortColumn];
      
      // Special handling for different column types
      if (sortColumn === 'opponent') {
        aValue = a.opponentAddress;
        bValue = b.opponentAddress;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [getFilteredMatches, filter, sortColumn, sortOrder]);

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('desc');
    }
  };

  const handleExport = () => {
    try {
      const data = exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rps-history-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Match history exported!');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (importData(data)) {
          toast.success('Match history imported!');
        } else {
          toast.error('Failed to import data - invalid format');
        }
      } catch (error) {
        toast.error('Failed to parse import file');
      }
    };
    reader.readAsText(file);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all match history? This cannot be undone.')) {
      clearHistory();
      toast.success('Match history cleared');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResultColor = (result: GameResult) => {
    switch (result) {
      case 'win': return 'text-green-400';
      case 'loss': return 'text-red-400';
      case 'tie': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getChoiceEmoji = (choice: string) => {
    switch (choice) {
      case 'rock': return '🗿';
      case 'paper': return '📄';
      case 'scissors': return '✂️';
      default: return '❓';
    }
  };

  if (!publicKey) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <History className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-300 mb-2">Connect Wallet</h3>
        <p className="text-gray-500">Connect your wallet to view match history</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {showStats && stats && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Player Statistics
            </h2>
            <button
              onClick={() => setShowStats(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <EyeOff className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{stats.totalGames}</div>
              <div className="text-sm text-gray-400">Total Games</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{stats.winRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.currentStreak}</div>
              <div className="text-sm text-gray-400">Current Streak</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">
                {stats.netGains >= 0 ? '+' : ''}{stats.netGains.toFixed(4)} SOL
              </div>
              <div className="text-sm text-gray-400">Net Gains</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-lg font-semibold text-white">
                {getChoiceEmoji(stats.favoriteChoice)} {stats.favoriteChoice}
              </div>
              <div className="text-sm text-gray-400">Favorite Choice</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-lg font-semibold text-white">{stats.bestStreak}</div>
              <div className="text-sm text-gray-400">Best Streak</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-lg font-semibold text-white">{stats.averageBet.toFixed(4)} SOL</div>
              <div className="text-sm text-gray-400">Avg Bet</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-lg font-semibold text-white">{stats.wins}/{stats.losses}/{stats.ties}</div>
              <div className="text-sm text-gray-400">W/L/T</div>
            </div>
          </div>
        </div>
      )}

      {/* Show stats button when hidden */}
      {!showStats && (
        <button
          onClick={() => setShowStats(true)}
          className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg p-4 text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="w-5 h-5" />
          Show Statistics
        </button>
      )}

      {/* History Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-blue-500" />
            Match History ({filteredAndSortedMatches.length})
          </h2>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                showFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Filter className="w-4 h-4 inline mr-1" />
              Filters
            </button>
            
            <button
              onClick={handleExport}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4 inline mr-1" />
              Export
            </button>
            
            <label className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors">
              <Upload className="w-4 h-4 inline mr-1" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            
            <button
              onClick={handleClearHistory}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4 inline mr-1" />
              Clear
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Result
                </label>
                <select
                  value={filter.result || ''}
                  onChange={(e) => setFilter(prev => ({
                    ...prev,
                    result: e.target.value as GameResult || undefined
                  }))}
                  className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All Results</option>
                  <option value="win">Wins</option>
                  <option value="loss">Losses</option>
                  <option value="tie">Ties</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Bet (SOL)
                </label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={filter.minBet || ''}
                  onChange={(e) => setFilter(prev => ({
                    ...prev,
                    minBet: parseFloat(e.target.value) || undefined
                  }))}
                  className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Bet (SOL)
                </label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="1.000"
                  value={filter.maxBet || ''}
                  onChange={(e) => setFilter(prev => ({
                    ...prev,
                    maxBet: parseFloat(e.target.value) || undefined
                  }))}
                  className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            
            <button
              onClick={() => setFilter({})}
              className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Match Table */}
        {filteredAndSortedMatches.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Matches Found</h3>
            <p className="text-gray-500">
              {matches.length === 0 
                ? 'Start playing to build your match history!' 
                : 'Try adjusting your filters to see more matches.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th 
                    className="text-left py-3 px-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('timestamp')}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {sortColumn === 'timestamp' && (
                        sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('opponent')}
                  >
                    <div className="flex items-center gap-1">
                      Opponent
                      {sortColumn === 'opponent' && (
                        sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-2 text-gray-300">Moves</th>
                  <th 
                    className="text-left py-3 px-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('result')}
                  >
                    <div className="flex items-center gap-1">
                      Result
                      {sortColumn === 'result' && (
                        sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-2 text-gray-300 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('betAmount')}
                  >
                    <div className="flex items-center gap-1">
                      Bet
                      {sortColumn === 'betAmount' && (
                        sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedMatches.map((match) => (
                  <tr key={match.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                    <td className="py-3 px-2 text-gray-300">
                      {formatDate(match.timestamp)}
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-blue-400 font-mono">
                        {formatAddress(match.opponentAddress)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span>{getChoiceEmoji(match.playerChoice)}</span>
                        <span className="text-gray-500">vs</span>
                        <span>{getChoiceEmoji(match.opponentChoice)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`font-semibold capitalize ${getResultColor(match.result)}`}>
                        {match.result}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-300">
                      {match.betAmount.toFixed(4)} SOL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchHistory;