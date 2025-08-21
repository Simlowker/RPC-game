// src/games/RPS/animations/GameTransitions.tsx
import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import styled from 'styled-components';

const TransitionContainer = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
`;

const CountdownNumber = styled(motion.div)`
  font-size: 8rem;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
`;

const PhaseTitle = styled(motion.h2)`
  font-size: 3rem;
  color: white;
  text-align: center;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const LoadingSpinner = styled(motion.div)`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid #8b5cf6;
  border-radius: 50%;
  margin: 2rem auto;
`;

const ResultContainer = styled(motion.div)`
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

// Animation variants
const countdownVariants: Variants = {
  initial: { 
    scale: 0, 
    rotate: -180,
    opacity: 0 
  },
  animate: { 
    scale: [0, 1.2, 1],
    rotate: 0,
    opacity: 1,
    transition: { 
      duration: 0.8,
      ease: 'backOut',
      scale: { times: [0, 0.7, 1] }
    }
  },
  exit: { 
    scale: 0,
    rotate: 180,
    opacity: 0,
    transition: { duration: 0.3 }
  },
};

const phaseVariants: Variants = {
  initial: { 
    y: -50, 
    opacity: 0,
    scale: 0.8
  },
  animate: { 
    y: 0, 
    opacity: 1,
    scale: 1,
    transition: { 
      duration: 0.6,
      ease: 'easeOut'
    }
  },
  exit: { 
    y: 50, 
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.3 }
  },
};

const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

const resultVariants: Variants = {
  initial: { 
    scale: 0, 
    opacity: 0,
    y: 100
  },
  animate: { 
    scale: 1, 
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.8,
      ease: 'backOut',
      delay: 0.2
    }
  },
  exit: { 
    scale: 0.8,
    opacity: 0,
    y: -50,
    transition: { duration: 0.4 }
  },
};

// Countdown Component
interface CountdownProps {
  seconds: number;
  onComplete: () => void;
}

export const CountdownTransition: React.FC<CountdownProps> = ({
  seconds,
  onComplete,
}) => {
  const [currentSecond, setCurrentSecond] = React.useState(seconds);

  React.useEffect(() => {
    if (currentSecond > 0) {
      const timer = setTimeout(() => {
        setCurrentSecond(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [currentSecond, onComplete]);

  return (
    <AnimatePresence>
      {currentSecond > 0 && (
        <TransitionContainer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <CountdownNumber
            key={currentSecond}
            variants={countdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {currentSecond}
          </CountdownNumber>
        </TransitionContainer>
      )}
    </AnimatePresence>
  );
};

// Phase Transition Component
interface PhaseTransitionProps {
  title: string;
  description?: string;
  duration?: number;
  showSpinner?: boolean;
  onComplete?: () => void;
}

export const PhaseTransition: React.FC<PhaseTransitionProps> = ({
  title,
  description,
  duration = 2000,
  showSpinner = false,
  onComplete,
}) => {
  React.useEffect(() => {
    if (onComplete && duration > 0) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onComplete]);

  return (
    <TransitionContainer>
      <ResultContainer
        variants={phaseVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <PhaseTitle>{title}</PhaseTitle>
        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: '1.2rem',
              marginBottom: showSpinner ? '2rem' : '0'
            }}
          >
            {description}
          </motion.p>
        )}
        {showSpinner && (
          <LoadingSpinner
            variants={spinnerVariants}
            animate="animate"
          />
        )}
      </ResultContainer>
    </TransitionContainer>
  );
};

// Match Found Animation
export const MatchFoundTransition: React.FC<{
  opponentId: string;
  betAmount: number;
  onComplete: () => void;
}> = ({ opponentId, betAmount, onComplete }) => {
  React.useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <PhaseTransition
      title="🎯 Match Found!"
      description={`Opponent: ${opponentId.slice(0, 8)}... | Bet: ${betAmount} SOL`}
      duration={3000}
    />
  );
};

// Waiting Animation
export const WaitingTransition: React.FC<{
  message: string;
  timeout?: number;
  onTimeout?: () => void;
}> = ({ message, timeout, onTimeout }) => {
  React.useEffect(() => {
    if (timeout && onTimeout) {
      const timer = setTimeout(onTimeout, timeout);
      return () => clearTimeout(timer);
    }
  }, [timeout, onTimeout]);

  return (
    <PhaseTransition
      title="⏳ Waiting..."
      description={message}
      duration={0}
      showSpinner
    />
  );
};

// Results Animation
interface ResultsTransitionProps {
  isWinner: boolean;
  isTie: boolean;
  winnings?: number;
  duration?: number;
  onComplete?: () => void;
}

export const ResultsTransition: React.FC<ResultsTransitionProps> = ({
  isWinner,
  isTie,
  winnings,
  duration = 4000,
  onComplete,
}) => {
  const getTitle = () => {
    if (isTie) return '🤝 It\'s a Tie!';
    return isWinner ? '🏆 Victory!' : '😔 Defeat';
  };

  const getDescription = () => {
    if (isTie) return 'Your bets will be refunded';
    if (isWinner && winnings) return `You won ${winnings} SOL!`;
    return 'Better luck next time!';
  };

  React.useEffect(() => {
    if (onComplete && duration > 0) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onComplete]);

  return (
    <TransitionContainer>
      <ResultContainer
        variants={resultVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ 
            scale: [0, 1.3, 1],
            rotate: isWinner ? [0, -5, 5, 0] : 0
          }}
          transition={{ 
            duration: 1,
            times: [0, 0.6, 1],
            repeat: isWinner ? 2 : 0
          }}
          style={{ fontSize: '4rem', marginBottom: '1rem' }}
        >
          {isTie ? '🤝' : isWinner ? '🏆' : '😔'}
        </motion.div>
        
        <PhaseTitle>{getTitle()}</PhaseTitle>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            fontSize: '1.3rem',
            marginBottom: '2rem'
          }}
        >
          {getDescription()}
        </motion.p>

        {/* Confetti effect for winners */}
        {isWinner && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0,
                  scale: 0,
                  x: '50%',
                  y: '50%'
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                  x: `${50 + Math.cos(i * 0.4) * 40}%`,
                  y: `${50 + Math.sin(i * 0.4) * 40}%`,
                  rotate: i * 40,
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.1,
                  ease: 'easeOut',
                }}
                style={{
                  position: 'absolute',
                  width: '10px',
                  height: '10px',
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][i % 5],
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }}
              />
            ))}
          </div>
        )}
      </ResultContainer>
    </TransitionContainer>
  );
};