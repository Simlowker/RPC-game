import React, { useState, useEffect } from 'react';
import { Choice } from '../types/game';
import { ChoiceAnimation } from './ChoiceAnimation';
import { getChoiceEmoji, getWinnerMessage } from '../utils/animations';

interface ChoiceRevealProps {
  playerChoice: Choice | null;
  opponentChoice: Choice | null;
  winner: 'player' | 'opponent' | 'tie' | null;
  isRevealing: boolean;
  onRevealComplete: () => void;
  playerName?: string;
  opponentName?: string;
}

type RevealPhase = 'suspense' | 'player' | 'opponent' | 'outcome' | 'celebration' | 'complete';

export const ChoiceReveal: React.FC<ChoiceRevealProps> = ({
  playerChoice,
  opponentChoice,
  winner,
  isRevealing,
  onRevealComplete,
  playerName = 'You',
  opponentName = 'Opponent'
}) => {
  const [phase, setPhase] = useState<RevealPhase>('suspense');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!isRevealing) {
      setPhase('suspense');
      setShowConfetti(false);
      return;
    }

    const sequence = [
      { phase: 'suspense', duration: 1500 },
      { phase: 'player', duration: 800 },
      { phase: 'opponent', duration: 800 },
      { phase: 'outcome', duration: 1000 },
      { phase: 'celebration', duration: 1500 },
      { phase: 'complete', duration: 0 }
    ];

    let timeoutId: NodeJS.Timeout;
    let currentIndex = 0;

    const runSequence = () => {
      if (currentIndex < sequence.length) {
        const { phase: nextPhase, duration } = sequence[currentIndex];
        setPhase(nextPhase as RevealPhase);
        
        if (nextPhase === 'celebration' && winner === 'player') {
          setShowConfetti(true);
        }
        
        if (nextPhase === 'complete') {
          onRevealComplete();
          return;
        }
        
        timeoutId = setTimeout(() => {
          currentIndex++;
          runSequence();
        }, duration);
      }
    };

    runSequence();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isRevealing, winner, onRevealComplete]);

  if (!isRevealing) return null;

  const getPhaseMessage = () => {
    switch (phase) {
      case 'suspense':
        return 'Rock... Paper... Scissors!';
      case 'player':
        return `${playerName} chose...`;
      case 'opponent':
        return `${opponentName} chose...`;
      case 'outcome':
      case 'celebration':
        return getWinnerMessage(winner, playerName, opponentName);
      default:
        return '';
    }
  };

  const getOutcomeClass = () => {
    if (phase !== 'outcome' && phase !== 'celebration') return '';
    switch (winner) {
      case 'player':
        return 'text-green-500';
      case 'opponent':
        return 'text-red-500';
      case 'tie':
        return 'text-yellow-500';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 text-center shadow-2xl">
        {/* Phase Message */}
        <div className="mb-8">
          <h2 className={`text-2xl font-bold transition-all duration-500 ${getOutcomeClass()}`}>
            {getPhaseMessage()}
          </h2>
          
          {/* Suspense Animation */}
          {phase === 'suspense' && (
            <div className="flex justify-center items-center mt-4 space-x-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Choice Animations Container */}
        <div className="flex justify-around items-center mb-8">
          {/* Player Choice */}
          <div className="flex flex-col items-center space-y-3">
            <span className="text-sm font-medium text-gray-600">{playerName}</span>
            <ChoiceAnimation
              choice={playerChoice}
              isRevealed={phase !== 'suspense'}
              animationDelay={phase === 'player' ? 0 : phase === 'opponent' ? 800 : 1600}
              isWinner={winner === 'player'}
              phase={phase}
            />
          </div>

          {/* VS Indicator */}
          <div className="flex flex-col items-center">
            <div className={`text-2xl font-bold transition-all duration-500 ${
              phase === 'outcome' || phase === 'celebration' ? 'text-purple-600 scale-125' : 'text-gray-400'
            }`}>
              VS
            </div>
            
            {/* Battle Effect */}
            {(phase === 'outcome' || phase === 'celebration') && (
              <div className="absolute">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-8 bg-gradient-to-t from-purple-400 to-transparent"
                    style={{
                      transform: `rotate(${i * 45}deg)`,
                      transformOrigin: 'bottom center'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Opponent Choice */}
          <div className="flex flex-col items-center space-y-3">
            <span className="text-sm font-medium text-gray-600">{opponentName}</span>
            <ChoiceAnimation
              choice={opponentChoice}
              isRevealed={phase === 'opponent' || phase === 'outcome' || phase === 'celebration'}
              animationDelay={phase === 'opponent' ? 0 : phase === 'outcome' ? 800 : 1600}
              isWinner={winner === 'opponent'}
              phase={phase}
            />
          </div>
        </div>

        {/* Outcome Effects */}
        {(phase === 'outcome' || phase === 'celebration') && winner && (
          <div className="space-y-4">
            {/* Winner Highlight */}
            <div className={`text-4xl font-bold animate-bounce ${getOutcomeClass()}`}>
              {winner === 'tie' ? '🤝' : winner === 'player' ? '🎉' : '😔'}
            </div>

            {/* Score Effect */}
            {winner !== 'tie' && (
              <div className={`text-lg font-semibold transition-all duration-500 ${
                winner === 'player' ? 'text-green-600' : 'text-red-600'
              }`}>
                {winner === 'player' ? '+1 Point!' : 'Better luck next time!'}
              </div>
            )}
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mt-6 w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 rounded-full transition-all duration-500"
            style={{
              width: `${
                phase === 'suspense' ? '20%' :
                phase === 'player' ? '40%' :
                phase === 'opponent' ? '60%' :
                phase === 'outcome' ? '80%' :
                '100%'
              }`
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .confetti {
          animation: confetti linear infinite;
        }
      `}</style>
    </div>
  );
};