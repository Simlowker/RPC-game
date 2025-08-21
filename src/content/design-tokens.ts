/**
 * SolDuel Design System & Tokens
 */

export const DESIGN_TOKENS = {
  // Brand Colors
  colors: {
    // Primary Brand Colors
    primary: {
      500: '#9945FF',     // Solana Purple - primary brand color
      400: '#B166FF',     // Lighter purple
      600: '#7A2BE8',     // Darker purple
      50: '#F5F0FF',      // Very light purple tint
      100: '#E6D5FF',     // Light purple tint
      900: '#4A0E7A',     // Very dark purple
    },
    
    secondary: {
      500: '#14F195',     // Solana Green - secondary brand color  
      400: '#47F4AB',     // Lighter green
      600: '#0FD182',     // Darker green
      50: '#F0FFFE',      // Very light green tint
      100: '#C7FFF0',     // Light green tint
      900: '#064E3B',     // Very dark green
    },

    // Game State Colors
    game: {
      rock: '#8B7355',        // Earthy brown for rock
      paper: '#E5E7EB',       // Light gray for paper
      scissors: '#DC2626',    // Red for scissors
      win: '#10B981',         // Green for wins
      lose: '#EF4444',        // Red for losses
      draw: '#F59E0B',        // Orange for draws
    },

    // UI Colors
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5', 
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },

    // Semantic Colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Typography
  typography: {
    fontFamily: {
      primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", "Consolas", "Monaco", monospace',
    },

    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px  
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
    },

    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    }
  },

  // Spacing
  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },

  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    glow: '0 0 20px rgb(153 69 255 / 0.3)',
  },

  // Animation Durations
  animation: {
    fast: '150ms',
    normal: '300ms', 
    slow: '500ms',
    slower: '750ms',
  },

  // Z-Index Scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
}

// Component-specific design tokens
export const COMPONENT_TOKENS = {
  button: {
    height: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px  
      lg: '3rem',      // 48px
    },
    padding: {
      sm: '0.5rem 0.75rem',
      md: '0.75rem 1rem',
      lg: '1rem 1.5rem',
    }
  },

  card: {
    padding: '1.5rem',
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    shadow: DESIGN_TOKENS.boxShadow.base,
  },

  rpsIcons: {
    size: {
      sm: '2rem',     // 32px
      md: '3rem',     // 48px
      lg: '4rem',     // 64px
      xl: '6rem',     // 96px
    }
  },

  gameBoard: {
    maxWidth: '600px',
    padding: '2rem',
    borderRadius: DESIGN_TOKENS.borderRadius['2xl'],
  }
}

export default DESIGN_TOKENS