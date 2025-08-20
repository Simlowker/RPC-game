import React from 'react'
import { toast } from 'react-hot-toast'

function App() {
  const [selectedChoice, setSelectedChoice] = React.useState<string | null>(null)
  const [isConnected, setIsConnected] = React.useState(false)

  const handleConnect = async () => {
    try {
      // Simulate wallet connection
      setIsConnected(true)
      toast.success('Wallet connected!', { icon: '🚀' })
    } catch (error) {
      toast.error('Failed to connect wallet')
    }
  }

  const handleChoice = (choice: string) => {
    setSelectedChoice(choice)
    toast.success(`${choice} selected!`)
  }

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
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  Connect Solana Wallet
                </button>
              ) : (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                  <p className="text-green-400 font-semibold">✅ Wallet Connected</p>
                  <p className="text-white/60 text-sm">Ready to play!</p>
                </div>
              )}
            </div>

            {/* Game Choices */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white text-center mb-6">
                Choose Your Move
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => handleChoice('Rock')}
                  className={`${
                    selectedChoice === 'Rock' 
                      ? 'bg-red-600 ring-4 ring-red-400' 
                      : 'bg-red-500 hover:bg-red-600'
                  } text-white font-bold py-8 px-6 rounded-xl text-3xl transition-all transform hover:scale-105 shadow-lg`}
                >
                  <div className="text-6xl mb-2">🪨</div>
                  Rock
                </button>
                
                <button 
                  onClick={() => handleChoice('Paper')}
                  className={`${
                    selectedChoice === 'Paper' 
                      ? 'bg-blue-600 ring-4 ring-blue-400' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white font-bold py-8 px-6 rounded-xl text-3xl transition-all transform hover:scale-105 shadow-lg`}
                >
                  <div className="text-6xl mb-2">📄</div>
                  Paper
                </button>
                
                <button 
                  onClick={() => handleChoice('Scissors')}
                  className={`${
                    selectedChoice === 'Scissors' 
                      ? 'bg-green-600 ring-4 ring-green-400' 
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white font-bold py-8 px-6 rounded-xl text-3xl transition-all transform hover:scale-105 shadow-lg`}
                >
                  <div className="text-6xl mb-2">✂️</div>
                  Scissors
                </button>
              </div>
            </div>

            {/* Game Info */}
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Game Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/80">
                <div>
                  <span className="text-purple-400">Network:</span><br />
                  Solana Devnet
                </div>
                <div>
                  <span className="text-blue-400">Selected:</span><br />
                  {selectedChoice || 'None'}
                </div>
                <div>
                  <span className="text-green-400">Status:</span><br />
                  {isConnected ? 'Ready' : 'Connect Wallet'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">
            Built on Solana • Powered by Anchor
          </p>
        </div>
      </div>
    </div>
  )
}

export default App;