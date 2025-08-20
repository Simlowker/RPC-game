import { Choice } from '../types/game';

/**
 * Get the emoji representation for a choice
 */
export const getChoiceEmoji = (choice: Choice): string => {
  switch (choice) {
    case 'rock':
      return '🗿';
    case 'paper':
      return '📄';
    case 'scissors':
      return '✂️';
    default:
      return '❓';
  }
};

/**
 * Get the winner message based on the game result
 */
export const getWinnerMessage = (
  winner: 'player' | 'opponent' | 'tie' | null,
  playerName: string = 'You',
  opponentName: string = 'Opponent'
): string => {
  switch (winner) {
    case 'player':
      return `${playerName} Win!`;
    case 'opponent':
      return `${opponentName} Wins!`;
    case 'tie':
      return "It's a Tie!";
    default:
      return '';
  }
};

/**
 * Get victory celebration particles configuration
 */
export const getVictoryParticles = () => {
  return Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: ['#fbbf24', '#f59e0b', '#d97706', '#92400e'][Math.floor(Math.random() * 4)]
  }));
};

/**
 * Animation timing constants
 */
export const ANIMATION_TIMINGS = {
  SUSPENSE_DURATION: 1500,
  PLAYER_REVEAL_DELAY: 800,
  OPPONENT_REVEAL_DELAY: 800,
  OUTCOME_DELAY: 1000,
  CELEBRATION_DURATION: 1500,
  CHOICE_FLIP_DURATION: 300,
  PARTICLE_ANIMATION_DURATION: 3000,
} as const;

/**
 * Animation easing functions
 */
export const EASING = {
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  SMOOTH: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  ELASTIC: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  SHARP: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
} as const;

/**
 * Get CSS animation classes for different states
 */
export const getAnimationClasses = {
  suspense: 'animate-pulse',
  revealing: 'animate-spin',
  revealed: 'animate-none',
  winner: 'animate-bounce scale-125',
  loser: 'scale-90 opacity-75',
  celebration: 'animate-bounce',
} as const;

/**
 * Generate sparkle particle positions for victory animation
 */
export const generateSparklePositions = (count: number = 12) => {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI;
    const radius = 40 + Math.random() * 20;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      delay: i * 0.1,
      scale: 0.5 + Math.random() * 0.5,
    };
  });
};

/**
 * Generate confetti pieces for celebration
 */
export const generateConfetti = (count: number = 50) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDelay: Math.random() * 2,
    animationDuration: 2 + Math.random() * 2,
    backgroundColor: [
      '#fbbf24', // yellow-400
      '#f59e0b', // yellow-500
      '#d97706', // yellow-600
      '#f97316', // orange-500
      '#ea580c', // orange-600
      '#dc2626', // red-600
      '#e11d48', // rose-600
      '#be185d', // pink-700
    ][Math.floor(Math.random() * 8)],
  }));
};

/**
 * Get particle effects configuration for different outcomes
 */
export const getParticleConfig = (winner: 'player' | 'opponent' | 'tie' | null) => {
  switch (winner) {
    case 'player':
      return {
        type: 'confetti',
        count: 50,
        colors: ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b'],
        duration: 3000,
      };
    case 'opponent':
      return {
        type: 'dust',
        count: 20,
        colors: ['#6b7280', '#9ca3af', '#d1d5db'],
        duration: 1500,
      };
    case 'tie':
      return {
        type: 'sparkles',
        count: 30,
        colors: ['#fbbf24', '#f59e0b', '#d97706'],
        duration: 2000,
      };
    default:
      return null;
  }
};

/**
 * CSS keyframes for custom animations
 */
export const CSS_KEYFRAMES = {
  confetti: `
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
  `,
  
  sparkle: `
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
  `,
  
  ray: `
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
  `,
  
  glow: `
    @keyframes glow {
      0%, 100% {
        box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
      }
      50% {
        box-shadow: 0 0 40px rgba(34, 197, 94, 0.6);
      }
    }
  `,
  
  shake: `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
  `,
  
  bounce: `
    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0,0,0);
      }
      40%, 43% {
        transform: translate3d(0, -20px, 0);
      }
      70% {
        transform: translate3d(0, -10px, 0);
      }
      90% {
        transform: translate3d(0, -4px, 0);
      }
    }
  `,
  
  flipReveal: `
    @keyframes flipReveal {
      0% {
        transform: rotateY(0deg);
      }
      50% {
        transform: rotateY(90deg);
      }
      100% {
        transform: rotateY(0deg);
      }
    }
  `,
  
  pulseGlow: `
    @keyframes pulseGlow {
      0% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
      }
    }
  `,
} as const;

/**
 * Get animation duration based on phase
 */
export const getAnimationDuration = (phase: string): number => {
  switch (phase) {
    case 'suspense':
      return ANIMATION_TIMINGS.SUSPENSE_DURATION;
    case 'player':
      return ANIMATION_TIMINGS.PLAYER_REVEAL_DELAY;
    case 'opponent':
      return ANIMATION_TIMINGS.OPPONENT_REVEAL_DELAY;
    case 'outcome':
      return ANIMATION_TIMINGS.OUTCOME_DELAY;
    case 'celebration':
      return ANIMATION_TIMINGS.CELEBRATION_DURATION;
    default:
      return 500;
  }
};

/**
 * Get sound effect name for animation phase
 */
export const getSoundEffect = (phase: string, winner?: string): string | null => {
  switch (phase) {
    case 'suspense':
      return 'drumroll';
    case 'player':
    case 'opponent':
      return 'reveal';
    case 'outcome':
      if (winner === 'player') return 'victory';
      if (winner === 'opponent') return 'defeat';
      return 'tie';
    case 'celebration':
      return winner === 'player' ? 'celebration' : null;
    default:
      return null;
  }
};