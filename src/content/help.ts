/**
 * SolDuel Help & Tutorial Content
 */

export const HELP_CONTENT = {
  // Game Rules & Strategy
  rules: {
    title: "How to Play Rock Paper Scissors",
    basics: {
      description: "Rock Paper Scissors is a simple game of strategy and psychology played between two players.",
      rules: [
        {
          rule: "Rock crushes Scissors",
          explanation: "Rock wins against Scissors by crushing it"
        },
        {
          rule: "Scissors cuts Paper", 
          explanation: "Scissors wins against Paper by cutting it"
        },
        {
          rule: "Paper covers Rock",
          explanation: "Paper wins against Rock by covering it"
        },
        {
          rule: "Same choice = Draw",
          explanation: "When both players choose the same gesture, it's a tie and the match continues"
        }
      ]
    },

    strategy: {
      title: "Winning Strategies",
      tips: [
        {
          category: "Psychology",
          tips: [
            "Watch for your opponent's patterns - most players have unconscious preferences",
            "Mix up your choices to stay unpredictable", 
            "Consider what your opponent expects you to play",
            "Use reverse psychology - sometimes the obvious choice is right"
          ]
        },
        {
          category: "Statistics", 
          tips: [
            "Rock is statistically the most popular choice for beginners",
            "Paper is often underplayed by new players",
            "Experienced players may try to exploit these tendencies"
          ]
        },
        {
          category: "Advanced",
          tips: [
            "Study opponent behavior during decision time",
            "Notice if they play differently under pressure",
            "Track their patterns across multiple rounds"
          ]
        }
      ]
    }
  },

  // SolDuel Platform Guide
  platform: {
    title: "Getting Started with SolDuel",
    
    walletSetup: {
      title: "Setting Up Your Wallet",
      steps: [
        {
          step: 1,
          title: "Install a Solana Wallet",
          description: "Download Phantom, Solflare, or another compatible Solana wallet",
          note: "We recommend Phantom for beginners - it's user-friendly and secure"
        },
        {
          step: 2,
          title: "Fund Your Wallet",
          description: "Add SOL to your wallet through an exchange or on-ramp service",
          note: "You'll need SOL for match stakes and small transaction fees"
        },
        {
          step: 3,
          title: "Connect to SolDuel",
          description: "Click 'Connect Wallet' and select your wallet from the list",
          note: "SolDuel never stores your private keys - your funds stay in your wallet"
        }
      ]
    },

    gameplayFlow: {
      title: "Playing Your First Match",
      steps: [
        {
          step: 1,
          title: "Create or Join a Match",
          description: "Set your stake amount and either create a new match or join an existing one",
          tips: [
            "Start with small stakes while learning",
            "Higher stakes attract more skilled players"
          ]
        },
        {
          step: 2,
          title: "Wait for Opponent",
          description: "If creating a match, wait for another player to join. If joining, the match starts immediately.",
          tips: [
            "Share match links with friends for private games",
            "Public matches usually fill quickly during peak hours"
          ]
        },
        {
          step: 3,
          title: "Make Your Choice",
          description: "Select Rock, Paper, or Scissors within the time limit",
          tips: [
            "Take time to think about your opponent's likely choice",
            "Don't always go with your first instinct"
          ]
        },
        {
          step: 4,
          title: "See Results",
          description: "Moves are revealed simultaneously and the winner is determined by smart contract",
          tips: [
            "Results are instant and automatically distributed",
            "All outcomes are verifiable on the Solana blockchain"
          ]
        }
      ]
    }
  },

  // FAQ Section
  faq: {
    title: "Frequently Asked Questions",
    categories: [
      {
        category: "Getting Started",
        questions: [
          {
            question: "Do I need experience with crypto to play?",
            answer: "No! While SolDuel uses blockchain technology, the interface is designed to be user-friendly. You just need a Solana wallet and some SOL to get started."
          },
          {
            question: "How much SOL do I need to start playing?",
            answer: "You can start playing with as little as 0.01 SOL. Plus small transaction fees (typically 0.000005 SOL per transaction). We recommend starting with 0.1 SOL for several matches."
          },
          {
            question: "Is SolDuel safe to use?",
            answer: "Yes! All game logic runs on audited smart contracts. Your funds never leave your wallet until you choose to stake them in a match, and winners are paid automatically."
          }
        ]
      },
      {
        category: "Gameplay",
        questions: [
          {
            question: "How are winners determined?",
            answer: "Winners are determined by immutable smart contract logic following standard Rock Paper Scissors rules. The process is completely transparent and verifiable on-chain."
          },
          {
            question: "What happens if there's a draw?",
            answer: "In case of a draw (both players choose the same gesture), the match continues with another round until there's a winner."
          },
          {
            question: "Can I play against specific opponents?",
            answer: "Yes! You can create private matches and share the link with friends, or join public matches to play against random opponents."
          }
        ]
      },
      {
        category: "Technical",
        questions: [
          {
            question: "Why use blockchain for Rock Paper Scissors?",
            answer: "Blockchain ensures complete fairness and transparency. Every move is recorded on-chain, preventing cheating and ensuring automatic, instant payouts to winners."
          },
          {
            question: "What wallets are supported?",
            answer: "SolDuel supports all major Solana wallets including Phantom, Solflare, Backpack, and more. Any wallet that supports Solana dApps will work."
          },
          {
            question: "Are there any fees?",
            answer: "SolDuel doesn't charge platform fees - it's pure player vs player. You only pay small Solana network transaction fees (typically ~0.000005 SOL)."
          }
        ]
      }
    ]
  },

  // Troubleshooting
  troubleshooting: {
    title: "Troubleshooting Common Issues",
    issues: [
      {
        problem: "Wallet won't connect",
        solutions: [
          "Make sure your wallet browser extension is unlocked",
          "Try refreshing the page",
          "Check if your wallet supports Solana dApps",
          "Try using a different browser or incognito mode"
        ]
      },
      {
        problem: "Transaction failed",
        solutions: [
          "Check that you have enough SOL for the stake + transaction fees",
          "Make sure your wallet is connected to Solana Mainnet",
          "Try increasing your transaction priority fee in wallet settings",
          "Wait a moment and try again - network may be congested"
        ]
      },
      {
        problem: "Match not loading",
        solutions: [
          "Check your internet connection",
          "Try refreshing the page",
          "The match may have expired - try creating a new one",
          "Clear your browser cache and cookies"
        ]
      }
    ]
  }
}

export default HELP_CONTENT