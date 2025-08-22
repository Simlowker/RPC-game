import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@solana/wallet-adapter-react'
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Trophy,
  Zap,
  ChevronRight,
  Sparkles,
  TrendingUp,
  DollarSign,
  Gamepad2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, GameCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GamingAvatar } from '@/components/ui/avatar'
import { fadeInUp, scaleIn, formatSOL, truncateAddress, timeAgo } from '@/lib/utils'

// Mock data for matches
const mockMatches = [
  {
    id: '1',
    creator: '7xKX...4mZq',
    creatorAvatar: '7xKX4mZq',
    betAmount: 0.5,
    rounds: 3,
    status: 'waiting',
    createdAt: Date.now() - 60000,
    isPrivate: false,
  },
  {
    id: '2',
    creator: '9aBC...7def',
    creatorAvatar: '9aBC7def',
    betAmount: 1.0,
    rounds: 5,
    status: 'waiting',
    createdAt: Date.now() - 120000,
    isPrivate: false,
  },
  {
    id: '3',
    creator: '3xyz...1rst',
    creatorAvatar: '3xyz1rst',
    betAmount: 2.5,
    rounds: 1,
    status: 'waiting',
    createdAt: Date.now() - 180000,
    isPrivate: true,
  },
  {
    id: '4',
    creator: '5mno...9pqr',
    creatorAvatar: '5mno9pqr',
    betAmount: 0.1,
    rounds: 3,
    status: 'waiting',
    createdAt: Date.now() - 240000,
    isPrivate: false,
  },
]

interface GameLobbyProps {
  onCreateMatch: () => void
  onJoinMatch: (matchId: string) => void
}

const GameLobby: React.FC<GameLobbyProps> = ({ onCreateMatch, onJoinMatch }) => {
  const { connected, publicKey } = useWallet()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'rounds'>('newest')
  const [matches, setMatches] = useState(mockMatches)
  const [hoveredMatch, setHoveredMatch] = useState<string | null>(null)

  // Filter and sort matches
  const filteredMatches = matches
    .filter(match => {
      if (filterBy === 'low' && match.betAmount > 0.5) return false
      if (filterBy === 'medium' && (match.betAmount <= 0.5 || match.betAmount > 2)) return false
      if (filterBy === 'high' && match.betAmount <= 2) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt
      if (sortBy === 'highest') return b.betAmount - a.betAmount
      if (sortBy === 'rounds') return b.rounds - a.rounds
      return 0
    })

  // Quick stats
  const totalVolume = matches.reduce((sum, match) => sum + match.betAmount * 2, 0)
  const averageBet = totalVolume / (matches.length * 2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-solduel-dark via-solduel-surface to-solduel-dark p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-orbitron font-bold text-white mb-2">
            Game Lobby
          </h1>
          <p className="text-gray-400">Join a match or create your own</p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <GameCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Matches</p>
                <p className="text-2xl font-bold text-white">{matches.length}</p>
              </div>
              <Gamepad2 className="w-8 h-8 text-solduel-primary" />
            </div>
          </GameCard>

          <GameCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Volume</p>
                <p className="text-2xl font-bold text-white">{totalVolume.toFixed(1)} SOL</p>
              </div>
              <DollarSign className="w-8 h-8 text-solduel-accent" />
            </div>
          </GameCard>

          <GameCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Average Bet</p>
                <p className="text-2xl font-bold text-white">{averageBet.toFixed(2)} SOL</p>
              </div>
              <TrendingUp className="w-8 h-8 text-solduel-secondary" />
            </div>
          </GameCard>

          <GameCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Your Balance</p>
                <p className="text-2xl font-bold text-white">
                  {connected ? '10.5 SOL' : 'Connect Wallet'}
                </p>
              </div>
              <Zap className="w-8 h-8 text-solduel-success" />
            </div>
          </GameCard>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Create Match */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GameCard className="p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-solduel-primary/20 to-transparent rounded-full blur-3xl" />
              
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Plus className="w-6 h-6 mr-2 text-solduel-primary" />
                Create Match
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Bet Amount</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">0.1 SOL</Button>
                    <Button variant="outline" size="sm" className="flex-1">0.5 SOL</Button>
                    <Button variant="outline" size="sm" className="flex-1">1 SOL</Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Rounds</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">1</Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-solduel-primary/20">3</Button>
                    <Button variant="outline" size="sm" className="flex-1">5</Button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    variant="game" 
                    className="w-full text-lg"
                    onClick={onCreateMatch}
                    disabled={!connected}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create Match
                  </Button>
                  {!connected && (
                    <p className="text-xs text-center text-gray-400 mt-2">
                      Connect wallet to create a match
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 bg-white/5 rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-2">Quick Tips</h3>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• 0% fees - winner takes all</li>
                  <li>• Instant payouts on victory</li>
                  <li>• Best of 3/5 rounds available</li>
                  <li>• Private matches coming soon</li>
                </ul>
              </div>
            </GameCard>
          </motion.div>

          {/* Right Column - Active Matches */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Active Matches</h2>
                
                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                  <select 
                    className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as any)}
                  >
                    <option value="all">All Stakes</option>
                    <option value="low">Low (≤0.5 SOL)</option>
                    <option value="medium">Medium (0.5-2 SOL)</option>
                    <option value="high">High (&gt;2 SOL)</option>
                  </select>
                  
                  <select 
                    className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="highest">Highest Stake</option>
                    <option value="rounds">Most Rounds</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Matches Grid */}
            <div className="space-y-3">
              <AnimatePresence>
                {filteredMatches.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <GameCard className="p-12 text-center">
                      <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No matches found</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Be the first to create a match!
                      </p>
                    </GameCard>
                  </motion.div>
                ) : (
                  filteredMatches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      onMouseEnter={() => setHoveredMatch(match.id)}
                      onMouseLeave={() => setHoveredMatch(null)}
                    >
                      <GameCard 
                        className={`p-4 transition-all ${
                          hoveredMatch === match.id ? 'border-solduel-primary/50 shadow-[0_0_20px_rgba(124,58,237,0.3)]' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <GamingAvatar
                              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${match.creatorAvatar}`}
                              size="lg"
                              glow={hoveredMatch === match.id}
                            />
                            
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-white">{match.creator}</span>
                                {match.isPrivate && (
                                  <Badge variant="outline" className="text-xs">Private</Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-400 flex items-center">
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  <span className="text-white font-semibold">{match.betAmount} SOL</span>
                                </span>
                                <span className="text-gray-400 flex items-center">
                                  <Trophy className="w-4 h-4 mr-1" />
                                  Best of {match.rounds}
                                </span>
                                <span className="text-gray-400 flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {timeAgo(match.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-xs text-gray-400">Prize Pool</div>
                              <div className="text-lg font-bold text-solduel-accent">
                                {(match.betAmount * 2).toFixed(1)} SOL
                              </div>
                            </div>
                            
                            <Button
                              variant="gradient"
                              size="sm"
                              onClick={() => onJoinMatch(match.id)}
                              disabled={!connected}
                              className="min-w-[100px]"
                            >
                              Join Match
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </GameCard>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Load More */}
            {filteredMatches.length > 0 && (
              <motion.div 
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button variant="outline" className="border-solduel-primary/50 hover:bg-solduel-primary/10">
                  Load More Matches
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default GameLobby