// src/games/RPS/animations/ChoiceAnimations.tsx
import React from 'react';
import { motion, Variants } from 'framer-motion';
import styled from 'styled-components';
import { Choice } from '../../../rps-client';

const AnimationContainer = styled(motion.div)`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 4rem;
`;

const ParticleContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
`;

const Particle = styled(motion.div)<{ $color: string }>`
  position: absolute;
  width: 4px;
  height: 4px;
  background: ${props => props.$color};
  border-radius: 50%;
`;

const MetallicShine = styled(motion.div)`
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.6) 50%,
    transparent 100%
  );
  z-index: 1;
`;

// Animation variants for different choices
const rockVariants: Variants = {
  idle: {
    scale: 1,
    rotate: 0,
    y: 0,
  },
  hover: {
    scale: 1.1,
    y: -5,
    transition: { duration: 0.2 },
  },
  selected: {
    scale: 1.2,
    y: -10,
    rotate: [0, -5, 5, 0],
    transition: { 
      scale: { duration: 0.3 },
      y: { duration: 0.3 },
      rotate: { duration: 0.6, repeat: Infinity, repeatType: 'reverse' }
    },
  },
  crush: {
    scale: [1.2, 1.5, 1.2],
    y: [-10, -20, 10],
    rotate: [0, -10, 0],
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

const paperVariants: Variants = {
  idle: {
    scale: 1,
    rotate: 0,
    y: 0,
  },
  hover: {
    scale: 1.1,
    y: -5,
    transition: { duration: 0.2 },
  },
  selected: {
    scale: 1.2,
    y: -10,
    rotate: [0, 2, -2, 0],
    transition: { 
      scale: { duration: 0.3 },
      y: { duration: 0.3 },
      rotate: { duration: 1, repeat: Infinity, repeatType: 'reverse' }
    },
  },
  flow: {
    scale: [1.2, 1.3, 1.4],
    rotate: [0, 5, -5, 0],
    x: [0, -10, 10, 0],
    transition: { duration: 1, ease: 'easeInOut' },
  },
};

const scissorsVariants: Variants = {
  idle: {
    scale: 1,
    rotate: 0,
    y: 0,
  },
  hover: {
    scale: 1.1,
    y: -5,
    transition: { duration: 0.2 },
  },
  selected: {
    scale: 1.2,
    y: -10,
    rotate: [0, 5, -5, 0],
    transition: { 
      scale: { duration: 0.3 },
      y: { duration: 0.3 },
      rotate: { duration: 0.4, repeat: Infinity, repeatType: 'reverse' }
    },
  },
  cut: {
    scale: [1.2, 1.4, 1.2],
    rotate: [0, 15, -15, 0],
    transition: { duration: 0.6, ease: 'backOut' },
  },
};

// Particle animation variants
const particleVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: (i: number) => ({
    opacity: [0, 1, 0],
    scale: [0, 1, 0.5],
    x: [0, Math.cos(i * 0.5) * 50],
    y: [0, Math.sin(i * 0.5) * 50],
    transition: {
      duration: 1,
      delay: i * 0.1,
      ease: 'easeOut',
    },
  }),
};

const shineVariants: Variants = {
  shine: {
    left: ['100%', '100%'],
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    },
  },
};

interface ChoiceAnimationProps {
  choice: Choice;
  state: 'idle' | 'hover' | 'selected' | 'action';
  onAnimationComplete?: () => void;
}

export const ChoiceAnimation: React.FC<ChoiceAnimationProps> = ({
  choice,
  state,
  onAnimationComplete,
}) => {
  const getEmoji = (choice: Choice) => {
    switch (choice) {
      case Choice.Rock: return '✊';
      case Choice.Paper: return '✋';
      case Choice.Scissors: return '✌️';
      default: return '❓';
    }
  };

  const getVariants = (choice: Choice) => {
    switch (choice) {
      case Choice.Rock: return rockVariants;
      case Choice.Paper: return paperVariants;
      case Choice.Scissors: return scissorsVariants;
      default: return rockVariants;
    }
  };

  const getActionState = (choice: Choice) => {
    switch (choice) {
      case Choice.Rock: return 'crush';
      case Choice.Paper: return 'flow';
      case Choice.Scissors: return 'cut';
      default: return 'idle';
    }
  };

  const getParticleColor = (choice: Choice) => {
    switch (choice) {
      case Choice.Rock: return '#8B4513';
      case Choice.Paper: return '#FFFFFF';
      case Choice.Scissors: return '#C0C0C0';
      default: return '#FFFFFF';
    }
  };

  const currentState = state === 'action' ? getActionState(choice) : state;
  const variants = getVariants(choice);

  return (
    <AnimationContainer
      variants={variants}
      initial="idle"
      animate={currentState}
      onAnimationComplete={onAnimationComplete}
    >
      {getEmoji(choice)}
      
      {/* Particles for action state */}
      {state === 'action' && (
        <ParticleContainer>
          {Array.from({ length: 8 }).map((_, i) => (
            <Particle
              key={i}
              custom={i}
              $color={getParticleColor(choice)}
              variants={particleVariants}
              initial="hidden"
              animate="visible"
            />
          ))}
        </ParticleContainer>
      )}
      
      {/* Metallic shine effect for scissors */}
      {choice === Choice.Scissors && (state === 'selected' || state === 'action') && (
        <MetallicShine
          variants={shineVariants}
          animate="shine"
        />
      )}
    </AnimationContainer>
  );
};

// Victory celebration animation
const celebrationVariants: Variants = {
  celebrate: {
    scale: [1, 1.3, 1.1, 1.4, 1.2],
    rotate: [0, -10, 10, -5, 0],
    y: [0, -20, -10, -25, -15],
    transition: {
      duration: 2,
      times: [0, 0.2, 0.4, 0.6, 1],
      ease: 'easeOut',
    },
  },
};

const confettiVariants: Variants = {
  burst: (i: number) => ({
    opacity: [0, 1, 1, 0],
    scale: [0, 1, 1, 0.8],
    x: [0, Math.cos(i * 0.8) * 100],
    y: [0, Math.sin(i * 0.8) * -50, Math.sin(i * 0.8) * -30, 50],
    rotate: [0, i * 90, i * 180],
    transition: {
      duration: 2.5,
      delay: i * 0.05,
      ease: 'easeOut',
    },
  }),
};

interface CelebrationAnimationProps {
  choice: Choice;
  isWinner: boolean;
}

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  choice,
  isWinner,
}) => {
  const getEmoji = (choice: Choice) => {
    switch (choice) {
      case Choice.Rock: return '✊';
      case Choice.Paper: return '✋';
      case Choice.Scissors: return '✌️';
      default: return '❓';
    }
  };

  if (!isWinner) return null;

  return (
    <AnimationContainer>
      <motion.div
        variants={celebrationVariants}
        initial="idle"
        animate="celebrate"
        style={{ fontSize: '4rem', zIndex: 2 }}
      >
        {getEmoji(choice)}
      </motion.div>
      
      {/* Confetti burst */}
      <ParticleContainer>
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={confettiVariants}
            initial={{ opacity: 0 }}
            animate="burst"
            style={{
              position: 'absolute',
              width: '8px',
              height: '8px',
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][i % 5],
              borderRadius: '50%',
            }}
          />
        ))}
      </ParticleContainer>
    </AnimationContainer>
  );
};