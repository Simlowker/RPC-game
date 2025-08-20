import React, { useState, useEffect } from 'react';
import { Choice } from '../types/game';
import { getChoiceEmoji } from '../utils/animations';

interface ChoiceAnimationProps {
  choice: Choice | null;
  isRevealed: boolean;
  animationDelay: number;
  isWinner: boolean;
  phase: string;
}

export const ChoiceAnimation: React.FC<ChoiceAnimationProps> = ({
  choice,
  isRevealed,
  animationDelay,
  isWinner,
  phase
}) => {
  const [showChoice, setShowChoice] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isRevealed && !showChoice) {
      const timer = setTimeout(() => {
        setIsAnimating(true);
        setTimeout(() => {
          setShowChoice(true);
          setIsAnimating(false);
        }, 300);
      }, animationDelay);

      return () => clearTimeout(timer);
    }
  }, [isRevealed, showChoice, animationDelay]);

  const getAnimationClasses = () => {
    let classes = 'transition-all duration-500 transform relative ';
    
    if (!isRevealed) {
      // Suspense state - show question mark with pulse
      classes += 'animate-pulse scale-100 ';
    } else if (isAnimating) {
      // Revealing animation - dramatic flip
      classes += 'animate-spin scale-150 ';
    } else if (showChoice) {
      // Revealed state
      classes += 'animate-none ';
      
      if (phase === 'outcome' || phase === 'celebration') {
        if (isWinner) {
          classes += 'scale-125 animate-bounce ';
        } else {
          classes += 'scale-90 opacity-75 ';
        }
      } else {
        classes += 'scale-110 ';
      }
    }

    return classes;
  };

  const getContainerClasses = () => {
    let classes = 'relative w-20 h-20 flex items-center justify-center rounded-full border-4 transition-all duration-500 ';
    
    if (!isRevealed) {
      classes += 'border-gray-300 bg-gray-100 ';
    } else if (showChoice && (phase === 'outcome' || phase === 'celebration')) {
      if (isWinner) {
        classes += 'border-green-400 bg-green-50 shadow-lg shadow-green-200 ';
      } else {
        classes += 'border-gray-400 bg-gray-50 ';
      }
    } else {
      classes += 'border-blue-400 bg-blue-50 shadow-lg shadow-blue-200 ';
    }

    return classes;
  };

  const getDisplayEmoji = () => {
    if (!isRevealed || isAnimating) {
      return '❓';
    }
    return showChoice && choice ? getChoiceEmoji(choice) : '❓';
  };

  return (
    <div className={getContainerClasses()}>
      {/* Main Choice Display */}
      <div className={getAnimationClasses()}>
        <span className="text-4xl select-none">
          {getDisplayEmoji()}
        </span>
      </div>

      {/* Winner Glow Effect */}
      {showChoice && isWinner && (phase === 'outcome' || phase === 'celebration') && (
        <>
          <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 animate-ping" />
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 opacity-30 blur-sm" />
        </>
      )}

      {/* Anticipation Particles */}
      {!isRevealed && (
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full animate-ping"
              style={{
                top: `${20 + Math.sin((i * Math.PI) / 3) * 30}%`,
                left: `${50 + Math.cos((i * Math.PI) / 3) * 30}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}

      {/* Reveal Flash Effect */}
      {isAnimating && (
        <div className="absolute inset-0 rounded-full bg-white opacity-80 animate-ping" />
      )}

      {/* Victory Rays */}
      {showChoice && isWinner && phase === 'celebration' && (
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-8 bg-gradient-to-t from-yellow-400 to-transparent"
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                transformOrigin: 'bottom center',
                animation: `ray 1s ease-out ${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Pulsing Ring for Suspense */}
      {!isRevealed && (
        <div className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-50 animate-ping" />
      )}

      <style jsx>{`
        @keyframes ray {
          0% {
            height: 0;
            opacity: 0;
          }
          50% {
            height: 2rem;
            opacity: 1;
          }
          100% {
            height: 3rem;
            opacity: 0;
          }
        }
        
        @keyframes sparkle {
          0%, 100% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1) rotate(180deg);
            opacity: 1;
          }
        }
        
        .animate-sparkle {
          animation: sparkle 0.8s ease-in-out;
        }
      `}</style>
    </div>
  );
};