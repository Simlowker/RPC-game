/**
 * SolDuel Social Media Assets & Content
 */

export const SOCIAL_ASSETS = {
  // Platform-specific content
  platforms: {
    twitter: {
      handle: '@SolDuel',
      bio: 'Skill-based Rock Paper Scissors on Solana 🪨📄✂️ | Fair • Transparent • Competitive | Built on blockchain ⚡',
      
      contentTypes: {
        announcements: {
          tone: 'Exciting, informative',
          hashtags: ['#SolDuel', '#Solana', '#SkillGaming', '#RPS', '#Blockchain'],
          examples: [
            'New tournament starting! 🏆 Test your RPS strategy against the best players on Solana',
            'Just launched: Transparent, skill-based Rock Paper Scissors on blockchain ⚡'
          ]
        },
        
        educational: {
          tone: 'Helpful, informative',
          hashtags: ['#LearnRPS', '#Strategy', '#SkillGaming'],
          examples: [
            '🧠 RPS Strategy Tip: Most beginners favor Rock. Advanced players know this. What do expert players do? 🤔',
            '⚡ Why blockchain for RPS? Complete transparency, instant settlements, no house edge!'
          ]
        },
        
        community: {
          tone: 'Engaging, celebratory',
          hashtags: ['#SolDuelCommunity', '#RPSChampion'],
          examples: [
            'Congratulations to @player123 for reaching Diamond rank! 💎',
            'Community highlight: Amazing 15-game winning streak by @strategist!'
          ]
        }
      }
    },

    discord: {
      invite: 'discord.gg/solduel',
      description: 'Join the SolDuel community! Discuss strategy, find opponents, and participate in tournaments.',
      
      channels: [
        { name: 'welcome', purpose: 'New member onboarding' },
        { name: 'general', purpose: 'Community discussion' },
        { name: 'strategy', purpose: 'RPS tactics and tips' },
        { name: 'matches', purpose: 'Find opponents and organize games' },
        { name: 'tournaments', purpose: 'Official tournament announcements' },
        { name: 'support', purpose: 'Technical help and questions' },
        { name: 'feedback', purpose: 'Platform suggestions and improvements' }
      ]
    },

    github: {
      handle: '@solduel',
      description: 'Open source skill-based gaming on Solana',
      topics: ['solana', 'blockchain', 'gaming', 'rock-paper-scissors', 'dapp', 'web3']
    }
  },

  // Content Calendar Templates
  contentTemplates: {
    daily: {
      tip_tuesday: '🧠 Strategy Tuesday: [RPS tip or psychological insight]',
      winner_wednesday: '🏆 Winner Wednesday: Celebrating our top performers',
      feature_friday: '⚡ Feature Friday: Highlighting platform capabilities'
    },

    weekly: {
      leaderboard_update: 'Weekly leaderboard update with top performers',
      community_highlight: 'Spotlight on community members and achievements',
      development_update: 'Progress updates on new features and improvements'
    },

    monthly: {
      tournament_announcement: 'Monthly tournament with special prizes',
      stats_recap: 'Platform statistics and growth metrics',
      roadmap_update: 'Development roadmap and upcoming features'
    }
  },

  // Hashtag Strategy
  hashtags: {
    primary: [
      '#SolDuel',
      '#Solana', 
      '#SkillGaming',
      '#RPS',
      '#BlockchainGaming'
    ],

    secondary: [
      '#Web3Gaming',
      '#CryptoGaming', 
      '#PvPGaming',
      '#StrategyGaming',
      '#DeFiGaming'
    ],

    trending: [
      '#SolanaGames',
      '#Web3',
      '#Blockchain',
      '#Gaming',
      '#Competition'
    ],

    avoid: [
      '#Gambling',
      '#Casino',
      '#Betting',
      '#Lottery',
      '#Crypto gambling terms'
    ]
  },

  // Visual Content Guidelines
  visual: {
    colors: {
      primary: '#9945FF', // Solana Purple
      secondary: '#14F195', // Solana Green
      background: '#FFFFFF',
      text: '#333333'
    },

    templates: {
      announcement: {
        format: '1200x675 (Twitter/LinkedIn)',
        elements: ['SolDuel logo', 'Key message', 'Call-to-action', 'Brand colors']
      },
      
      tutorial: {
        format: '1080x1080 (Instagram/Square)',
        elements: ['Step-by-step visuals', 'RPS icons', 'Clear instructions']
      },
      
      celebration: {
        format: '1200x675 (Landscape)',
        elements: ['Winner announcement', 'Achievement badges', 'Community celebration']
      }
    },

    assetLibrary: [
      'RPS gesture icons (rock.svg, paper.svg, scissors.svg)',
      'SolDuel logo variations',
      'Solana brand elements',
      'Trophy and achievement icons',
      'Loading animations',
      'Background patterns'
    ]
  },

  // Community Engagement
  engagement: {
    strategies: [
      'Host weekly strategy discussions',
      'Share interesting match statistics',
      'Highlight unique gameplay moments',
      'Educational content about blockchain gaming',
      'Community challenges and mini-tournaments'
    ],

    responseGuidelines: [
      'Always maintain professional, helpful tone',
      'Provide educational value in responses',
      'Direct users to appropriate help resources',
      'Celebrate community achievements',
      'Address concerns transparently'
    ]
  },

  // Crisis Communication
  crisis: {
    keyMessages: [
      'Player funds and security are our top priority',
      'All game results are transparently recorded on blockchain',
      'We maintain open communication with our community',
      'Technical issues are addressed promptly with full transparency'
    ],

    channels: [
      'Primary: Twitter for immediate updates',
      'Secondary: Discord for detailed explanations', 
      'Website banner for critical issues',
      'Email for direct user communications'
    ]
  }
}

export default SOCIAL_ASSETS