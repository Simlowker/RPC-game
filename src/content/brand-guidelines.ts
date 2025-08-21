/**
 * SolDuel Brand Guidelines & Usage Rules
 */

export const BRAND_GUIDELINES = {
  // Brand Identity
  identity: {
    name: 'SolDuel',
    tagline: 'Skill-Based Gaming on Solana',
    personality: [
      'Professional',
      'Trustworthy', 
      'Competitive',
      'Innovative',
      'Fair',
      'Transparent'
    ],
    values: [
      'Fairness above all',
      'Transparency in every transaction', 
      'Skill over luck',
      'Community-driven',
      'Blockchain-native'
    ]
  },

  // Logo Usage
  logo: {
    primary: '/logo.svg',
    favicon: '/favicon.svg',
    guidelines: [
      'Always maintain clear space around logo equal to the height of the "S" in SolDuel',
      'Never stretch or distort the logo proportions',
      'Minimum size: 120px width for digital, 1 inch for print',
      'Use on light backgrounds primarily',
      'Dark version available for light text on dark backgrounds'
    ],
    
    clearSpace: {
      minimum: '0.5x logo height',
      preferred: '1x logo height'
    },

    minimumSizes: {
      digital: '120px width',
      print: '1 inch width'
    }
  },

  // Color Palette
  colors: {
    primary: {
      solana_purple: '#9945FF',
      usage: 'Primary brand color, CTAs, highlights',
      accessibility: 'AAA compliant on white background'
    },
    
    secondary: {
      solana_green: '#14F195',
      usage: 'Success states, winning, positive actions',
      accessibility: 'AAA compliant on dark backgrounds'
    },

    neutral: {
      black: '#000000',
      dark_gray: '#333333', 
      medium_gray: '#666666',
      light_gray: '#F5F5F5',
      white: '#FFFFFF'
    },

    semantic: {
      success: '#10B981',
      warning: '#F59E0B', 
      error: '#EF4444',
      info: '#3B82F6'
    },

    doNot: [
      'Never use casino red (#DC2626) as primary brand color',
      'Avoid neon or flashy colors that suggest gambling',
      'Don\'t use gold colors that imply wealth/money focus'
    ]
  },

  // Typography
  typography: {
    primary: {
      family: 'Inter',
      usage: 'All body text, UI elements, general content',
      weights: [400, 500, 600, 700],
      fallbacks: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    },

    headings: {
      family: 'Inter',
      usage: 'Headers, titles, emphasis text',
      weights: [600, 700],
      characteristics: 'Clean, modern, highly readable'
    },

    code: {
      family: 'JetBrains Mono',
      usage: 'Code snippets, wallet addresses, technical content',
      fallbacks: 'Consolas, Monaco, monospace'
    },

    guidelines: [
      'Maintain consistent hierarchy with size and weight',
      'Use sufficient contrast ratios for accessibility',
      'Keep line length between 45-75 characters',
      'Ensure readability at all screen sizes'
    ]
  },

  // Voice & Tone
  voice: {
    characteristics: [
      'Confident without being arrogant',
      'Professional but approachable', 
      'Educational and helpful',
      'Transparent about processes',
      'Competitive but fair-spirited',
      'Tech-savvy but not exclusionary'
    ],

    doSay: [
      'Skill-based gaming',
      'Fair and transparent',
      'Competitive strategy',
      'Blockchain-powered',
      'Provably fair',
      'Instant settlements',
      'Player vs player',
      'Strategic competition'
    ],

    dontSay: [
      'Gambling',
      'Casino',
      'Betting', 
      'House edge',
      'Jackpot',
      'Lucky',
      'Chance',
      'Risk',
      'Wager'
    ],

    toneByContext: {
      onboarding: 'Welcoming, educational, reassuring',
      gameplay: 'Exciting, competitive, encouraging', 
      errors: 'Helpful, clear, solution-focused',
      marketing: 'Confident, value-focused, compelling'
    }
  },

  // Visual Style
  visualStyle: {
    aesthetic: 'Modern, clean, professional gaming interface',
    
    principles: [
      'Clarity over complexity',
      'Function drives form',
      'Consistent spacing and alignment',
      'Purposeful color usage',
      'Accessible by default'
    ],

    imagery: [
      'Clean geometric RPS symbols',
      'Modern interface elements',
      'Blockchain/tech aesthetic elements',
      'Abstract strategy concepts',
      'Community/social elements'
    ],

    avoid: [
      'Casino-style imagery (chips, dice, cards)',
      'Money/wealth focused imagery',
      'Flashy animations or effects',
      'Overly complex illustrations',
      'Generic gaming stereotypes'
    ]
  },

  // Application Guidelines
  application: {
    website: {
      layout: 'Clean, spacious, intuitive navigation',
      interactions: 'Smooth, responsive, purposeful',
      content: 'Scannable, action-oriented, educational'
    },

    social: {
      profile_consistent: 'Use consistent branding across all platforms',
      content_tone: 'Educational, community-focused, achievement-oriented',
      hashtags: '#SolDuel #Solana #SkillGaming #BlockchainGaming'
    },

    marketing: {
      focus: 'Skill, strategy, fairness, transparency',
      messaging: 'Competitive advantage, blockchain benefits',
      target: 'Crypto gamers, Solana enthusiasts, strategy game players'
    }
  },

  // Legal & Compliance
  compliance: {
    positioning: 'Skill-based gaming platform, not gambling',
    emphasis: [
      'Player vs player competition',
      'No house edge or casino elements',
      'Pure strategy and skill',
      'Transparent blockchain operations'
    ],
    
    disclaimers: [
      'Results based on skill and strategy',
      'Smart contract handles all game logic',
      'Players compete against each other, not the platform'
    ]
  }
}

export default BRAND_GUIDELINES