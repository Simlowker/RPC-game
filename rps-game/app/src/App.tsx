import React from 'react'
import { toast } from 'react-hot-toast'
import { usePerformanceTracking, debounce } from './utils/performance'
import { useSolanaOptimizer } from './utils/solana-optimization'
import PerformanceDashboard from './components/PerformanceDashboard'

// Memoized choice button component for better performance
const ChoiceButton = React.memo(({ 
  choice, 
  selectedChoice, 
  onChoice, 
  emoji, 
  colorClass 
}: {
  choice: string;
  selectedChoice: string | null;
  onChoice: (choice: string) => void;
  emoji: string;
  colorClass: string;
}) => {
  const isSelected = selectedChoice === choice;
  
  return (
    <button 
      onClick={() => onChoice(choice)}
      className={`${
        isSelected 
          ? `${colorClass}-600 ring-4 ring-${colorClass.split('-')[0]}-400` 
          : `${colorClass}-500 hover:${colorClass}-600`
      } text-white font-bold py-8 px-6 rounded-xl text-3xl transition-all transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${colorClass.split('-')[0]}-500`}
      aria-label={`Select ${choice}`}
      role="button"
      tabIndex={0}
    >
      <div className="text-6xl mb-2" role="img" aria-label={choice}>
        {emoji}
      </div>
      {choice}
    </button>
  );
});

ChoiceButton.displayName = 'ChoiceButton';

function App() {
  const [selectedChoice, setSelectedChoice] = React.useState<string | null>(null)
  const [isConnected, setIsConnected] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [connectionStats, setConnectionStats] = React.useState<any>(null)
  const [showPerformance, setShowPerformance] = React.useState(false)
  
  const { trackSolanaOperation, trackCustomMetric } = usePerformanceTracking()
  const { getConnection, getCacheStats } = useSolanaOptimizer()

  // Debounced choice handler to prevent rapid clicking
  const debouncedHandleChoice = React.useMemo(
    () => debounce((choice: string) => {
      const startTime = Date.now()
      setSelectedChoice(choice)
      toast.success(`${choice} selected!`, { 
        duration: 2000,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        }
      })
      
      // Track custom performance metric
      trackCustomMetric('Choice Selection', Date.now() - startTime, {
        choice,
        previousChoice: selectedChoice
      })
    }, 150),
    [selectedChoice, trackCustomMetric]
  )

  const handleConnect = async () => {
    setIsLoading(true)
    const startTime = Date.now()
    
    try {
      // Simulate wallet connection with Solana network check
      const connection = getConnection()
      
      // Test connection with a simple RPC call
      const version = await connection.getVersion()
      const blockHeight = await connection.getBlockHeight()
      
      // Track Solana performance
      trackSolanaOperation(
        'wallet_connect',
        connection.rpcEndpoint,
        startTime,
        Date.now(),
        true,
        { version, blockHeight }
      )
      
      setIsConnected(true)
      setConnectionStats({ version, blockHeight, rpcEndpoint: connection.rpcEndpoint })
      
      toast.success('Wallet connected!', { 
        icon: '🚀',
        duration: 3000,
        style: {
          borderRadius: '10px',
          background: '#10b981',
          color: '#fff',
        }
      })
    } catch (error) {
      // Track failed connection
      trackSolanaOperation(
        'wallet_connect',
        getConnection().rpcEndpoint,
        startTime,
        Date.now(),
        false,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      )
      
      toast.error('Failed to connect wallet', {
        duration: 4000,
        style: {
          borderRadius: '10px',
          background: '#ef4444',
          color: '#fff',
        }
      })
      console.error('Connection error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChoice = React.useCallback((choice: string) => {
    debouncedHandleChoice(choice)
  }, [debouncedHandleChoice])

  // Monitor cache performance
  React.useEffect(() => {
    const interval = setInterval(() => {
      const stats = getCacheStats()
      trackCustomMetric('Cache Hit Rate', stats.hitRate, stats)
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [getCacheStats, trackCustomMetric])

  // Preload critical resources
  React.useEffect(() => {
    // Preload choice emojis to prevent layout shifts
    const emojis = ['🪨', '📄', '✂️']
    emojis.forEach(emoji => {
      const img = new Image()
      img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><text y="50" font-size="48">${emoji}</text></svg>`)}`
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            🎮 Solana RPS Game
          </h1>
          <p className="text-white/80 text-xl">
            Play Rock Paper Scissors on Solana with on-chain betting!
          </p>
        </div>
        
        {/* Main Game Area */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
            
            {/* Wallet Status */}
            <div className="text-center mb-8">
              {!isConnected ? (
                <button 
                  onClick={handleConnect}
                  disabled={isLoading}
                  className={`bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                    isLoading ? 'animate-pulse' : ''
                  }`}
                  aria-label="Connect to Solana wallet"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    'Connect Solana Wallet'
                  )}
                </button>
              ) : (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                  <p className="text-green-400 font-semibold">✅ Wallet Connected</p>
                  <p className="text-white/60 text-sm">Ready to play!</p>
                  {connectionStats && (
                    <div className="mt-2 text-xs text-white/40">
                      <div>Block Height: {connectionStats.blockHeight}</div>
                      <div>Network: {connectionStats.rpcEndpoint?.includes('devnet') ? 'Devnet' : 'Mainnet'}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Game Choices */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white text-center mb-6">
                Choose Your Move
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="group" aria-label="Game choices">
                <ChoiceButton
                  choice="Rock"
                  selectedChoice={selectedChoice}
                  onChoice={handleChoice}
                  emoji="🪨"
                  colorClass="bg-red"
                />
                <ChoiceButton
                  choice="Paper"
                  selectedChoice={selectedChoice}
                  onChoice={handleChoice}
                  emoji="📄"
                  colorClass="bg-blue"
                />
                <ChoiceButton
                  choice="Scissors"
                  selectedChoice={selectedChoice}
                  onChoice={handleChoice}
                  emoji="✂️"
                  colorClass="bg-green"
                />
              </div>
            </div>

            {/* Enhanced Game Info */}
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Game Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/80">
                <div>
                  <span className="text-purple-400">Network:</span><br />
                  {connectionStats?.rpcEndpoint?.includes('devnet') ? 'Solana Devnet' : 'Solana Mainnet'}
                </div>
                <div>
                  <span className="text-blue-400">Selected:</span><br />
                  {selectedChoice || 'None'}
                </div>
                <div>
                  <span className="text-green-400">Status:</span><br />
                  {isLoading ? 'Connecting...' : isConnected ? 'Ready' : 'Connect Wallet'}
                </div>
              </div>
              
              {/* Performance indicator */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Performance: Optimized</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Real-time monitoring active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <button
              onClick={() => setShowPerformance(!showPerformance)}
              className="text-white/60 hover:text-white text-sm transition-colors flex items-center space-x-1"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Performance Monitor</span>
            </button>
          </div>
          <p className="text-white/60 text-sm">
            Built on Solana • Powered by Anchor • Optimized for Performance
          </p>
        </div>
      </div>
      
      {/* Performance Dashboard */}
      <PerformanceDashboard 
        isOpen={showPerformance} 
        onClose={() => setShowPerformance(false)} 
      />
    </div>
  )
}

export default App;