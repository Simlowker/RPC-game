import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@solana/wallet-adapter-react'
import { 
  Timer, 
  Trophy, 
  Users, 
  Zap,
  Hash,
  Copy,
  Check,
  AlertCircle,
  Volume2,
  VolumeX,
  MessageCircle,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, GameCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GamingAvatar } from '@/components/ui/avatar'
import { cn, playSound, determineWinner } from '@/lib/utils'
import confetti from 'canvas-confetti'

type Choice = 'rock' | 'paper' | 'scissors' | null
type GamePhase = 'waiting' | 'choosing' | 'revealing' | 'results'

interface GameInterfaceProps {
  matchId: string
  betAmount: number
  rounds: number
  onLeaveMatch: () => void
}

const GameInterface: React.FC<GameInterfaceProps> = ({ 
  matchId, 
  betAmount, 
  rounds,
  onLeaveMatch 
}) => {
  const { publicKey } = useWallet()
  const [phase, setPhase] = useState<GamePhase>('choosing')
  const [currentRound, setCurrentRound] = useState(1)
  const [timer, setTimer] = useState(30)
  const [playerChoice, setPlayerChoice] = useState<Choice>(null)
  const [opponentChoice, setOpponentChoice] = useState<Choice>(null)
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [hoveredChoice, setHoveredChoice] = useState<Choice>(null)
  const [isChoiceLocked, setIsChoiceLocked] = useState(false)
  const [copied, setCopied] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [spectators, setSpectators] = useState(12)

  // Countdown timer
  useEffect(() => {
    if (phase === 'choosing' && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 6 && soundEnabled) {
            playSound('countdown', 0.3)
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    } else if (timer === 0 && phase === 'choosing') {
      handleReveal()
    }
  }, [timer, phase, soundEnabled])

  const copyMatchId = () => {
    navigator.clipboard.writeText(matchId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleChoice = (choice: Choice) => {
    if (isChoiceLocked || phase !== 'choosing') return
    
    setPlayerChoice(choice)
    if (soundEnabled) playSound('click')
    
    // Auto-lock after selection
    setTimeout(() => {
      setIsChoiceLocked(true)
      if (soundEnabled) playSound('lock')
    }, 500)
  }

  const handleReveal = () => {
    setPhase('revealing')
    
    // Simulate opponent choice
    const choices: Choice[] = ['rock', 'paper', 'scissors']
    const randomChoice = choices[Math.floor(Math.random() * 3)]
    setOpponentChoice(randomChoice)
    
    setTimeout(() => {
      evaluateRound()
    }, 2000)
  }

  const evaluateRound = () => {
    if (!playerChoice || !opponentChoice) return
    
    const result = determineWinner(playerChoice, opponentChoice)
    
    if (result === 'player1') {
      setPlayerScore(prev => prev + 1)
      if (soundEnabled) playSound('win')
      triggerWinAnimation()
    } else if (result === 'player2') {
      setOpponentScore(prev => prev + 1)
      if (soundEnabled) playSound('lose')
    } else {
      if (soundEnabled) playSound('draw')
    }
    
    setPhase('results')
    
    // Check if game is over
    const maxScore = Math.ceil(rounds / 2)
    if (playerScore + 1 >= maxScore || opponentScore + 1 >= maxScore) {
      setTimeout(() => endGame(), 3000)
    } else {
      setTimeout(() => nextRound(), 3000)
    }
  }

  const nextRound = () => {
    setCurrentRound(prev => prev + 1)
    setPhase('choosing')
    setPlayerChoice(null)
    setOpponentChoice(null)
    setIsChoiceLocked(false)
    setTimer(30)
  }

  const endGame = () => {
    // Game over logic
    const won = playerScore > opponentScore
    if (won) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }
  }

  const triggerWinAnimation = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    })
  }

  const getChoiceEmoji = (choice: Choice) => {
    if (!choice) return '❓'
    return {
      rock: '✊',
      paper: '✋',
      scissors: '✌️'
    }[choice]
  }

  const getTimerColor = () => {
    if (timer > 20) return 'text-green-400'
    if (timer > 10) return 'text-yellow-400'
    if (timer > 5) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-solduel-dark via-solduel-surface to-solduel-dark p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Game Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GameCard className="p-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span className="font-mono text-sm text-gray-400">Match ID:</span>
                    <span className="font-mono text-white">{matchId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyMatchId}
                      className="h-6 w-6 p-0"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="neon">
                      <Trophy className="w-3 h-3 mr-1" />
                      Best of {rounds}
                    </Badge>
                    <Badge variant="warning">
                      Round {currentRound}/{rounds}
                    </Badge>
                    <Badge variant="success">
                      <Eye className="w-3 h-3 mr-1" />
                      {spectators} watching
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-solduel-accent">
                    {(betAmount * 2).toFixed(2)} SOL
                  </div>
                  <div className="text-xs text-gray-400">Prize Pool</div>
                </div>

                <div className={cn("text-center", getTimerColor())}>
                  <div className="text-4xl font-mono font-bold">
                    {timer}
                  </div>
                  <div className="text-xs text-gray-400">Seconds</div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </GameCard>
        </motion.div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Round History */}
          <motion.div
            className="lg:col-span-1 order-2 lg:order-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GameCard className="p-4">
              <h3 className="text-lg font-bold text-white mb-4">Round History</h3>
              <div className="space-y-2">
                {[...Array(rounds)].map((_, i) => {
                  const roundNum = i + 1
                  const isCompleted = roundNum < currentRound
                  const isCurrent = roundNum === currentRound
                  
                  return (
                    <div 
                      key={i}
                      className={cn(
                        "p-3 rounded-lg transition-all",
                        isCurrent && "bg-solduel-primary/20 border border-solduel-primary/50",
                        isCompleted && "bg-white/5",
                        !isCompleted && !isCurrent && "opacity-50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Round {roundNum}</span>
                        {isCompleted && (
                          <Badge variant="success" className="text-xs">
                            WIN
                          </Badge>
                        )}
                        {isCurrent && (
                          <Badge variant="neon" className="text-xs">
                            LIVE
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 p-4 bg-white/5 rounded-lg">
                <h4 className="text-sm font-semibold text-white mb-2">Score</h4>
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-solduel-success">{playerScore}</div>
                    <div className="text-xs text-gray-400">You</div>
                  </div>
                  <div className="text-gray-500">vs</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-solduel-danger">{opponentScore}</div>
                    <div className="text-xs text-gray-400">Opponent</div>
                  </div>
                </div>
              </div>
            </GameCard>
          </motion.div>

          {/* Center - Game Board */}
          <motion.div
            className="lg:col-span-2 order-1 lg:order-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <GameCard className="p-8 relative overflow-hidden">
              {/* Background Effects */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-solduel-primary to-solduel-secondary rounded-full blur-3xl animate-pulse" />
              </div>

              {/* Opponent Area */}
              <div className="relative mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <GamingAvatar
                      src={`https://api.dicebear.com/7.x/identicon/svg?seed=opponent`}
                      size="lg"
                      glow={phase === 'revealing'}
                    />
                    <div>
                      <div className="font-mono text-white">Opponent</div>
                      <div className="text-sm text-gray-400">
                        {phase === 'choosing' && 'Choosing...'}
                        {phase === 'revealing' && 'Revealing...'}
                        {phase === 'results' && 'Ready'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[...Array(Math.ceil(rounds / 2))].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-3 h-3 rounded-full",
                          i < opponentScore ? "bg-solduel-danger" : "bg-gray-600"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Opponent Choice Display */}
                <motion.div 
                  className="flex justify-center"
                  animate={{ scale: phase === 'revealing' ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-6xl shadow-2xl">
                    {phase === 'results' || phase === 'revealing' ? (
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        {getChoiceEmoji(opponentChoice)}
                      </motion.span>
                    ) : (
                      <span className="animate-pulse">❓</span>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* VS Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-solduel-surface text-2xl font-bold text-white">
                    VS
                  </span>
                </div>
              </div>

              {/* Player Area */}
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <GamingAvatar
                      src={`https://api.dicebear.com/7.x/identicon/svg?seed=${publicKey}`}
                      size="lg"
                      glow={isChoiceLocked}
                    />
                    <div>
                      <div className="font-mono text-white">You</div>
                      <div className="text-sm text-gray-400">
                        {!isChoiceLocked && phase === 'choosing' && 'Choose your move'}
                        {isChoiceLocked && 'Choice locked'}
                        {phase === 'results' && 'Ready'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[...Array(Math.ceil(rounds / 2))].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-3 h-3 rounded-full",
                          i < playerScore ? "bg-solduel-success" : "bg-gray-600"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Player Choice Selection */}
                <div className="flex justify-center gap-4">
                  {(['rock', 'paper', 'scissors'] as Choice[]).map((choice) => (
                    <motion.button
                      key={choice}
                      className={cn(
                        "w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center text-5xl md:text-6xl transition-all",
                        "backdrop-blur-md border",
                        playerChoice === choice
                          ? "bg-gradient-to-br from-solduel-primary to-solduel-secondary border-solduel-primary shadow-[0_0_30px_rgba(124,58,237,0.8)]"
                          : hoveredChoice === choice
                          ? "bg-white/10 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                          : "bg-black/30 border-white/10 hover:bg-white/5",
                        isChoiceLocked && "cursor-not-allowed opacity-75"
                      )}
                      whileHover={{ scale: isChoiceLocked ? 1 : 1.05 }}
                      whileTap={{ scale: isChoiceLocked ? 1 : 0.95 }}
                      onMouseEnter={() => !isChoiceLocked && setHoveredChoice(choice)}
                      onMouseLeave={() => setHoveredChoice(null)}
                      onClick={() => handleChoice(choice)}
                      disabled={isChoiceLocked || phase !== 'choosing'}
                    >
                      {getChoiceEmoji(choice)}
                    </motion.button>
                  ))}
                </div>

                {/* Confirm Button */}
                {playerChoice && !isChoiceLocked && (
                  <motion.div 
                    className="mt-6 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Button
                      variant="game"
                      size="lg"
                      onClick={() => setIsChoiceLocked(true)}
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Lock Choice
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Result Overlay */}
              <AnimatePresence>
                {phase === 'results' && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="text-center"
                    >
                      {playerScore > opponentScore && (
                        <div>
                          <Trophy className="w-20 h-20 text-solduel-accent mx-auto mb-4" />
                          <h2 className="text-4xl font-bold text-white">You Win!</h2>
                        </div>
                      )}
                      {opponentScore > playerScore && (
                        <div>
                          <AlertCircle className="w-20 h-20 text-solduel-danger mx-auto mb-4" />
                          <h2 className="text-4xl font-bold text-white">You Lose</h2>
                        </div>
                      )}
                      {playerScore === opponentScore && playerChoice === opponentChoice && (
                        <div>
                          <Users className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                          <h2 className="text-4xl font-bold text-white">Draw!</h2>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GameCard>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default GameInterface