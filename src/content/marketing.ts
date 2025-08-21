/**
 * SolDuel Marketing Content & Copy
 */

export const MARKETING_COPY = {
  // Landing Page Sections
  hero: {
    headlines: [
      "Master the Art of Strategy",
      "Skill Meets Blockchain",
      "The Future of Competitive Gaming",
      "Where Strategy Pays"
    ],
    subheadlines: [
      "Experience Rock Paper Scissors like never before on Solana",
      "Fair, transparent, skill-based gaming on the blockchain",
      "Every move matters. Every win counts. Every game is provably fair."
    ]
  },

  valuePropositions: [
    {
      title: "Zero House Edge",
      description: "Pure player vs player competition - no hidden algorithms or unfair advantages"
    },
    {
      title: "Instant Settlements",
      description: "Solana's speed means your winnings are available immediately after each match"
    },
    {
      title: "Provably Fair",
      description: "Every game result is verifiable on-chain - complete transparency guaranteed"
    },
    {
      title: "Global Competition", 
      description: "Challenge players from around the world 24/7 in ranked matches"
    }
  ],

  // User Journey Copy
  onboarding: {
    welcome: {
      title: "Welcome to SolDuel",
      message: "The premier destination for skill-based Rock Paper Scissors competition on Solana. Ready to test your strategy against the world?"
    },
    
    walletConnection: {
      title: "Connect Your Wallet",
      message: "Link your Solana wallet to start competing. We support all major Solana wallets including Phantom, Solflare, and more.",
      benefits: [
        "Secure blockchain-based gaming",
        "Instant win payouts",
        "Complete ownership of your funds"
      ]
    },

    firstMatch: {
      title: "Ready for Your First Duel?",
      message: "Choose your stake amount and get matched with an opponent of similar skill level.",
      tips: [
        "Start with small stakes to learn the meta",
        "Watch for opponent patterns", 
        "Psychology is half the game"
      ]
    }
  },

  // Social Proof & Community
  socialProof: {
    stats: {
      prefix: "Join thousands of players who have already discovered",
      metrics: [
        "10,000+ Matches Played",
        "500+ Daily Active Players", 
        "99.9% Uptime",
        "$50K+ in Winnings Distributed"
      ]
    },

    testimonials: [
      {
        text: "Finally, a crypto game that's pure skill. No luck, no house edge, just strategy vs strategy.",
        author: "CryptoGamer_2024",
        title: "Diamond Rank Player"
      },
      {
        text: "The transparency is incredible. Every move is on-chain and verifiable.",
        author: "SolanaBuilder",
        title: "Developer & Player"
      },
      {
        text: "Fast, fair, and addictive. This is how competitive gaming should work.",
        author: "BlockchainBattler",
        title: "Tournament Winner"
      }
    ]
  },

  // Call-to-Action Variations
  ctas: {
    primary: [
      "Start Dueling Now",
      "Challenge the World", 
      "Begin Your Journey",
      "Enter the Arena"
    ],
    secondary: [
      "Learn How to Play",
      "Watch a Match",
      "See Live Matches",
      "View Leaderboard"
    ]
  },

  // SEO-focused content
  seo: {
    pageDescriptions: {
      home: "Play competitive Rock Paper Scissors on Solana blockchain. Fair, transparent, skill-based gaming with instant payouts. Join thousands of players worldwide.",
      leaderboard: "View top SolDuel players and their stats. Track wins, losses, earnings, and climb the competitive Rock Paper Scissors rankings.",
      howToPlay: "Learn Rock Paper Scissors strategy and SolDuel gameplay. Master the art of competitive RPS gaming on Solana blockchain."
    },

    keywords: {
      primary: ["Rock Paper Scissors Solana", "Blockchain RPS game", "Crypto PvP gaming"],
      secondary: ["Solana games", "Skill-based gaming", "Competitive RPS", "Provably fair gaming"],
      long_tail: ["How to play Rock Paper Scissors for money", "Best Solana gaming dApps", "Cryptocurrency skill games"]
    }
  }
}

// Error Messages & User Feedback
export const USER_FEEDBACK = {
  errors: {
    network: {
      title: "Connection Issue",
      message: "Unable to connect to Solana network. Please check your connection and try again.",
      action: "Retry Connection"
    },
    wallet: {
      title: "Wallet Required", 
      message: "Please connect a Solana wallet to start playing SolDuel.",
      action: "Connect Wallet"
    },
    funds: {
      title: "Insufficient Balance",
      message: "You need more SOL to create this match. Please add funds to your wallet.",
      action: "Add Funds"
    },
    match: {
      title: "Match Unavailable",
      message: "This match is no longer available. It may have expired or been completed.",
      action: "Find New Match"
    }
  },

  success: {
    victory: {
      title: "Victory! 🎉",
      message: "Congratulations on your win! Your earnings have been sent to your wallet.",
      action: "Play Again"
    },
    matchCreated: {
      title: "Match Created",
      message: "Your match is live! Share the link or wait for an opponent to join.",
      action: "Copy Link"
    },
    walletConnected: {
      title: "Wallet Connected",
      message: "Successfully connected to your Solana wallet. Ready to start playing!",
      action: "Create Match"
    }
  },

  loading: {
    connecting: "Connecting to Solana network...",
    creatingMatch: "Creating your match...",
    waitingOpponent: "Waiting for opponent...", 
    processing: "Processing your move...",
    revealing: "Revealing results..."
  }
}

export default MARKETING_COPY