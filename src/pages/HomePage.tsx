import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { 
  Trophy, 
  Zap, 
  Shield, 
  Users, 
  TrendingUp, 
  Star,
  ArrowRight,
  Sparkles,
  Gamepad2,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, GameCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GamingAvatar } from '@/components/ui/avatar'
import { fadeInUp, scaleIn } from '@/lib/utils'

// Mock data for demonstration
const mockStats = {
  activeMatches: 42,
  volume24h: 1337.69,
  playersOnline: 256,
  biggestWin: 420.69,
}

const mockLeaderboard = [
  { rank: 1, address: '7xKX...4mZq', wins: 89, earnings: 2420.5, avatar: '7xKX4mZq' },
  { rank: 2, address: '9aBC...7def', wins: 76, earnings: 1890.3, avatar: '9aBC7def' },
  { rank: 3, address: '3xyz...1rst', wins: 65, earnings: 1567.2, avatar: '3xyz1rst' },
  { rank: 4, address: '5mno...9pqr', wins: 58, earnings: 1234.8, avatar: '5mno9pqr' },
  { rank: 5, address: '2ghi...6jkl', wins: 52, earnings: 987.6, avatar: '2ghi6jkl' },
]

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { connected } = useWallet()
  const [activeTab, setActiveTab] = useState('leaderboard')
  const [counters, setCounters] = useState({
    matches: 0,
    volume: 0,
    players: 0,
  })

  // Animate counters
  useEffect(() => {
    const interval = setInterval(() => {
      setCounters(prev => ({
        matches: Math.min(prev.matches + 2, mockStats.activeMatches),
        volume: Math.min(prev.volume + 50, mockStats.volume24h),
        players: Math.min(prev.players + 10, mockStats.playersOnline),
      }))
    }, 50)

    return () => clearInterval(interval)
  }, [])

  const handlePlayNow = () => {
    navigate('/rps')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-solduel-dark via-solduel-surface to-solduel-dark">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-50">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 bg-solduel-primary rounded-full"
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            className="text-center space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo and Title */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-6xl md:text-8xl font-orbitron font-bold mb-4">
                <span className="gradient-text">SolDuel</span>
              </h1>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Badge variant="neon" className="text-lg px-4 py-1">
                  <Zap className="w-4 h-4 mr-1" />
                  0% FEES
                </Badge>
                <Badge variant="success" className="text-lg px-4 py-1">
                  <Trophy className="w-4 h-4 mr-1" />
                  WINNER TAKES ALL
                </Badge>
              </div>
            </motion.div>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
              The Ultimate PvP Gaming Platform on Solana.
              Fair, Fast, and Completely Free.
            </p>

            {/* Live Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
                <GameCard className="text-center p-6">
                  <Gamepad2 className="w-8 h-8 text-solduel-primary mx-auto mb-2" />
                  <div className="text-3xl font-mono font-bold text-white">
                    {counters.matches}
                  </div>
                  <div className="text-sm text-gray-400">Active Matches</div>
                </GameCard>
              </motion.div>

              <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
                <GameCard className="text-center p-6">
                  <DollarSign className="w-8 h-8 text-solduel-accent mx-auto mb-2" />
                  <div className="text-3xl font-mono font-bold text-white">
                    {counters.volume.toFixed(0)} SOL
                  </div>
                  <div className="text-sm text-gray-400">24h Volume</div>
                </GameCard>
              </motion.div>

              <motion.div {...fadeInUp} transition={{ delay: 0.4 }}>
                <GameCard className="text-center p-6">
                  <Users className="w-8 h-8 text-solduel-secondary mx-auto mb-2" />
                  <div className="text-3xl font-mono font-bold text-white">
                    {counters.players}
                  </div>
                  <div className="text-sm text-gray-400">Players Online</div>
                </GameCard>
              </motion.div>
            </div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              {...fadeInUp}
              transition={{ delay: 0.5 }}
            >
              <Button
                size="xl"
                variant="game"
                onClick={handlePlayNow}
                className="text-lg font-bold"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Play Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              {!connected && (
                <Button
                  size="xl"
                  variant="outline"
                  className="text-lg border-solduel-primary/50 hover:bg-solduel-primary/10"
                >
                  Connect Wallet
                </Button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.h2 
            className="text-4xl font-orbitron font-bold text-center mb-12 text-white"
            {...fadeInUp}
          >
            Why Choose SolDuel?
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div {...scaleIn} transition={{ delay: 0.1 }}>
              <GameCard className="p-8 text-center hover:border-solduel-primary/50 transition-all">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-solduel-primary to-solduel-secondary flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">0% Fees</h3>
                <p className="text-gray-400">
                  No house edge. No hidden fees. 100% of the pot goes to the winner.
                </p>
              </GameCard>
            </motion.div>

            <motion.div {...scaleIn} transition={{ delay: 0.2 }}>
              <GameCard className="p-8 text-center hover:border-solduel-secondary/50 transition-all">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-solduel-secondary to-solduel-accent flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Instant Payouts</h3>
                <p className="text-gray-400">
                  Win and receive your SOL instantly. No waiting, no withdrawal process.
                </p>
              </GameCard>
            </motion.div>

            <motion.div {...scaleIn} transition={{ delay: 0.3 }}>
              <GameCard className="p-8 text-center hover:border-solduel-accent/50 transition-all">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-solduel-accent to-solduel-success flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Provably Fair</h3>
                <p className="text-gray-400">
                  Fully on-chain with commit-reveal system. Every game is verifiable.
                </p>
              </GameCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.h2 
            className="text-4xl font-orbitron font-bold text-center mb-12 text-white"
            {...fadeInUp}
          >
            Game Modes
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div {...scaleIn}>
              <GameCard className="p-6 relative overflow-hidden group">
                <Badge variant="success" className="absolute top-4 right-4">LIVE</Badge>
                <div className="text-5xl mb-4">✊</div>
                <h3 className="text-xl font-bold mb-2 text-white">Rock Paper Scissors</h3>
                <p className="text-gray-400 text-sm mb-4">Classic PvP strategy game</p>
                <Button 
                  variant="gradient" 
                  className="w-full"
                  onClick={handlePlayNow}
                >
                  Play Now
                </Button>
              </GameCard>
            </motion.div>

            <motion.div {...scaleIn} transition={{ delay: 0.1 }}>
              <GameCard className="p-6 relative overflow-hidden opacity-75">
                <Badge variant="warning" className="absolute top-4 right-4">SOON</Badge>
                <div className="text-5xl mb-4">🎲</div>
                <h3 className="text-xl font-bold mb-2 text-white">Dice Battle</h3>
                <p className="text-gray-400 text-sm mb-4">Roll higher to win</p>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </GameCard>
            </motion.div>

            <motion.div {...scaleIn} transition={{ delay: 0.2 }}>
              <GameCard className="p-6 relative overflow-hidden opacity-75">
                <Badge variant="warning" className="absolute top-4 right-4">SOON</Badge>
                <div className="text-5xl mb-4">🪙</div>
                <h3 className="text-xl font-bold mb-2 text-white">Coin Flip</h3>
                <p className="text-gray-400 text-sm mb-4">50/50 chance to double</p>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </GameCard>
            </motion.div>

            <motion.div {...scaleIn} transition={{ delay: 0.3 }}>
              <GameCard className="p-6 relative overflow-hidden opacity-75">
                <Badge variant="warning" className="absolute top-4 right-4">SOON</Badge>
                <div className="text-5xl mb-4">🃏</div>
                <h3 className="text-xl font-bold mb-2 text-white">High Card</h3>
                <p className="text-gray-400 text-sm mb-4">Draw the highest card</p>
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              </GameCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            className="text-center mb-12"
            {...fadeInUp}
          >
            <h2 className="text-4xl font-orbitron font-bold mb-4 text-white">
              Top Players
            </h2>
            <p className="text-gray-400">Compete for glory and massive rewards</p>
          </motion.div>

          <motion.div 
            className="max-w-4xl mx-auto"
            {...fadeInUp}
            transition={{ delay: 0.2 }}
          >
            <GameCard className="p-6">
              <div className="space-y-4">
                {mockLeaderboard.map((player, index) => (
                  <motion.div
                    key={player.rank}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-white w-8">
                        {player.rank === 1 && '🥇'}
                        {player.rank === 2 && '🥈'}
                        {player.rank === 3 && '🥉'}
                        {player.rank > 3 && player.rank}
                      </div>
                      <GamingAvatar
                        src={`https://api.dicebear.com/7.x/identicon/svg?seed=${player.avatar}`}
                        size="md"
                        glow={player.rank === 1}
                      />
                      <div>
                        <div className="font-mono text-white">{player.address}</div>
                        <div className="text-sm text-gray-400">{player.wins} wins</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-solduel-accent">
                        {player.earnings.toFixed(1)} SOL
                      </div>
                      <Badge variant="neon">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Top {((player.rank / 100) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/leaderboard')}
                  className="border-solduel-primary/50 hover:bg-solduel-primary/10"
                >
                  View Full Leaderboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </GameCard>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <motion.div 
          className="container mx-auto max-w-4xl text-center"
          {...fadeInUp}
        >
          <h2 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 text-white">
            Ready to Start Winning?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of players competing for real SOL with zero fees
          </p>
          <Button
            size="xl"
            variant="game"
            onClick={handlePlayNow}
            className="text-xl font-bold px-12"
          >
            <Sparkles className="w-6 h-6 mr-2" />
            Start Playing Now
            <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
        </motion.div>
      </section>
    </div>
  )
}

export default HomePage