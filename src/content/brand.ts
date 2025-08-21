/**
 * SolDuel Brand Identity & Content
 * Skill-Based Gaming on Solana
 */

export const BRAND = {
  name: 'SolDuel',
  tagline: 'Skill-Based Gaming on Solana',
  description: 'The premier destination for competitive Rock Paper Scissors gaming on the Solana blockchain.',
  
  // SEO & Meta
  meta: {
    title: 'SolDuel - Skill-Based Rock Paper Scissors on Solana',
    description: 'Experience competitive Rock Paper Scissors gaming on Solana. Fair play, transparent blockchain, instant settlements. Join the skill-based gaming revolution.',
    keywords: ['Rock Paper Scissors Solana', 'Blockchain RPS game', 'Crypto PvP gaming', 'Solana games', 'Skill-based gaming', 'Competitive RPS'],
  },

  // Colors
  colors: {
    primary: '#9945FF',      // Solana Purple
    secondary: '#14F195',    // Solana Green
    accent: '#000000',       // Black
    background: '#FFFFFF',   // White
    text: '#333333',         // Dark Gray
    muted: '#666666',        // Medium Gray
  },

  // Social & Sharing
  social: {
    twitter: '@SolDuel',
    discord: 'discord.gg/solduel',
    github: 'github.com/solduel',
  }
} as const

// Homepage Content
export const HOMEPAGE_CONTENT = {
  hero: {
    title: 'Master the Art of Strategy',
    subtitle: 'Experience Rock Paper Scissors like never before on the Solana blockchain',
    cta: 'Start Dueling',
    description: 'Fair play, transparent outcomes, instant settlements. Every match is recorded on-chain for complete transparency and trust.'
  },
  
  features: [
    {
      title: 'Instant Matches',
      description: 'Challenge players worldwide with lightning-fast Solana transactions',
      icon: '⚡'
    },
    {
      title: 'Transparent & Fair',
      description: 'Every match result is verifiable on-chain - no hidden algorithms or house edges',
      icon: '🔍'
    },
    {
      title: 'Skill-Based Gaming',
      description: 'Pure strategy and psychology - no luck, no randomness, just skill vs skill',
      icon: '🎯'
    },
    {
      title: 'Secure & Trustless',
      description: 'Smart contracts handle all game logic - your funds and results are protected',
      icon: '🛡️'
    }
  ],

  howItWorks: {
    title: 'How SolDuel Works',
    steps: [
      {
        step: '1',
        title: 'Connect Wallet',
        description: 'Link your Solana wallet to get started'
      },
      {
        step: '2',
        title: 'Create or Join Match',
        description: 'Set your stake and challenge another player'
      },
      {
        step: '3',
        title: 'Make Your Move',
        description: 'Choose Rock, Paper, or Scissors strategically'
      },
      {
        step: '4',
        title: 'Instant Results',
        description: 'Smart contract determines winner and distributes rewards'
      }
    ]
  }
}

// Game Interface Content
export const GAME_CONTENT = {
  tutorial: {
    title: 'How to Play',
    rules: [
      'Rock crushes Scissors',
      'Scissors cuts Paper', 
      'Paper covers Rock',
      'Same choice = Draw (rematch)'
    ],
    tips: [
      'Study your opponent\'s patterns',
      'Mix up your strategy to stay unpredictable',
      'Psychology is as important as strategy'
    ]
  },

  interface: {
    waiting: 'Waiting for opponent...',
    choosing: 'Make your choice',
    revealing: 'Revealing moves...',
    won: '🎉 Victory!',
    lost: '💪 Better luck next time',
    draw: '🤝 It\'s a draw!',
    rematch: 'Play Again',
    newMatch: 'New Match'
  },

  errors: {
    walletNotConnected: 'Please connect your Solana wallet to play',
    insufficientFunds: 'Insufficient SOL balance for this match stake',
    matchNotFound: 'Match not found or has expired',
    networkError: 'Network connection error. Please try again.',
    transactionFailed: 'Transaction failed. Please try again.'
  }
}

// User Interface Labels
export const UI_LABELS = {
  navigation: {
    home: 'Home',
    play: 'Play',
    leaderboard: 'Leaderboard',
    profile: 'Profile',
    help: 'Help'
  },

  actions: {
    connectWallet: 'Connect Wallet',
    createMatch: 'Create Match',
    joinMatch: 'Join Match',
    playAgain: 'Play Again',
    viewMatch: 'View Match',
    copyLink: 'Copy Match Link'
  },

  stats: {
    wins: 'Wins',
    losses: 'Losses',
    draws: 'Draws',
    winRate: 'Win Rate',
    totalMatches: 'Total Matches',
    earnings: 'Total Earnings'
  }
}

export default BRAND