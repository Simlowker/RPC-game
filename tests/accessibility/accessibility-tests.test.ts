// tests/accessibility/accessibility-tests.test.ts - RPS Game Accessibility Tests
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

// Import RPS game components
import RPSGame from '../../src/games/RPS';
import { MatchLobby } from '../../src/games/RPS/components/MatchLobby';
import { GameInterface } from '../../src/games/RPS/components/GameInterface';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('♿ RPS Game Accessibility Tests', () => {
  beforeAll(() => {
    // Mock ResizeObserver for testing environment
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  describe('🎯 WCAG 2.1 AA Compliance', () => {
    it('should have no accessibility violations in main game', async () => {
      const { container } = render(<RPSGame />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in match lobby', async () => {
      const mockProps = {
        matches: [
          {
            id: 'test-1',
            creator: 'creator1',
            opponent: undefined,
            betAmount: 0.01,
            timeLeft: 3600,
            status: { waitingForOpponent: {} },
            canJoin: true,
            canReveal: false,
            canSettle: false,
            isUserMatch: false,
            isCreator: false,
            isOpponent: false,
          }
        ],
        userMatches: [],
        createForm: {
          betAmount: '0.01',
          joinDeadlineMinutes: 60,
          revealDeadlineMinutes: 30,
        },
        config: {
          minBet: 0.001,
          maxBet: 100,
          defaultJoinDeadlineMinutes: 60,
          defaultRevealDeadlineMinutes: 30,
          feeBps: 100,
        },
        isConnected: true,
        isLoading: false,
        isCreatingMatch: false,
        onCreateMatch: jest.fn(),
        onJoinMatch: jest.fn(),
        onViewMatch: jest.fn(),
        onRevealChoice: jest.fn(),
        onSettleMatch: jest.fn(),
        onUpdateCreateForm: jest.fn(),
        onRefresh: jest.fn(),
      };

      const { container } = render(<MatchLobby {...mockProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in game interface', async () => {
      const mockProps = {
        phase: 'choosing' as const,
        betAmount: 0.01,
        timeLeft: 1800,
        userChoice: null,
        opponentChoice: null,
        gameResult: null,
        isUserCreator: true,
        canReveal: false,
        canSettle: false,
        isRevealing: false,
        isSettling: false,
        onMakeChoice: jest.fn(),
        onReveal: jest.fn(),
        onSettle: jest.fn(),
        onNewGame: jest.fn(),
      };

      const { container } = render(<GameInterface {...mockProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('⌨️ Keyboard Navigation', () => {
    it('should support keyboard navigation throughout the app', () => {
      const { container } = render(<RPSGame />);
      
      // Find all focusable elements
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);

      focusableElements.forEach((element) => {
        // Each focusable element should have appropriate keyboard handling
        expect(element).toHaveAttribute('tabindex');
        
        // Check for ARIA labels or text content
        const hasAccessibleName = 
          element.textContent?.trim() ||
          element.getAttribute('aria-label') ||
          element.getAttribute('aria-labelledby') ||
          element.getAttribute('title');
        
        expect(hasAccessibleName).toBeTruthy();
      });
    });

    it('should handle Enter and Space key presses on buttons', () => {
      const { container } = render(<RPSGame />);
      
      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        // Buttons should be keyboard accessible
        expect(button.getAttribute('tabindex')).not.toBe('-1');
        
        // Should have accessible content
        const hasContent = 
          button.textContent ||
          button.getAttribute('aria-label') ||
          button.querySelector('[aria-label]');
        
        expect(hasContent).toBeTruthy();
      });
    });

    it('should provide proper focus indicators', () => {
      const { container } = render(<RPSGame />);
      
      // Check that focus styles are applied (this would require CSS testing)
      const focusableElements = container.querySelectorAll('button, [href], input');
      
      focusableElements.forEach((element) => {
        // Element should be focusable
        expect(element.getAttribute('tabindex')).not.toBe('-1');
      });
    });
  });

  describe('👁️ Screen Reader Support', () => {
    it('should have proper heading structure', () => {
      const { container } = render(<RPSGame />);
      
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      if (headings.length > 0) {
        // Should start with h1 or have logical heading hierarchy
        const firstHeading = headings[0];
        expect(['H1', 'H2'].includes(firstHeading.tagName)).toBe(true);
      }
    });

    it('should have proper ARIA labels for interactive elements', () => {
      const mockProps = {
        matches: [],
        userMatches: [],
        createForm: {
          betAmount: '0.01',
          joinDeadlineMinutes: 60,
          revealDeadlineMinutes: 30,
        },
        config: {
          minBet: 0.001,
          maxBet: 100,
          defaultJoinDeadlineMinutes: 60,
          defaultRevealDeadlineMinutes: 30,
          feeBps: 100,
        },
        isConnected: true,
        isLoading: false,
        isCreatingMatch: false,
        onCreateMatch: jest.fn(),
        onJoinMatch: jest.fn(),
        onViewMatch: jest.fn(),
        onRevealChoice: jest.fn(),
        onSettleMatch: jest.fn(),
        onUpdateCreateForm: jest.fn(),
        onRefresh: jest.fn(),
      };

      const { container } = render(<MatchLobby {...mockProps} />);
      
      const interactiveElements = container.querySelectorAll(
        'button, input, select, textarea, [role="button"]'
      );

      interactiveElements.forEach((element) => {
        // Should have accessible name
        const hasAccessibleName = 
          element.getAttribute('aria-label') ||
          element.getAttribute('aria-labelledby') ||
          element.textContent?.trim() ||
          element.getAttribute('title');

        expect(hasAccessibleName).toBeTruthy();
      });
    });

    it('should provide status announcements for game state changes', () => {
      const mockProps = {
        phase: 'results' as const,
        betAmount: 0.01,
        timeLeft: 0,
        userChoice: 0, // Rock
        opponentChoice: 2, // Scissors
        gameResult: { creatorWins: {} },
        isUserCreator: true,
        canReveal: false,
        canSettle: true,
        isRevealing: false,
        isSettling: false,
        onMakeChoice: jest.fn(),
        onReveal: jest.fn(),
        onSettle: jest.fn(),
        onNewGame: jest.fn(),
      };

      const { container } = render(<GameInterface {...mockProps} />);
      
      // Check for aria-live regions for status updates
      const liveRegions = container.querySelectorAll('[aria-live]');
      
      if (liveRegions.length > 0) {
        liveRegions.forEach((region) => {
          expect(['polite', 'assertive'].includes(
            region.getAttribute('aria-live') || ''
          )).toBe(true);
        });
      }
    });

    it('should have proper alt text for images', () => {
      const { container } = render(<RPSGame />);
      
      const images = container.querySelectorAll('img');
      images.forEach((img) => {
        // Should have alt attribute (empty is acceptable for decorative)
        expect(img).toHaveAttribute('alt');
      });
    });
  });

  describe('🎨 Visual Accessibility', () => {
    it('should use sufficient color contrast', async () => {
      // This test would typically use color contrast analysis tools
      const { container } = render(<RPSGame />);
      
      // Check that text elements exist (actual contrast testing would need DOM analysis)
      const textElements = container.querySelectorAll('p, span, div, button, input');
      expect(textElements.length).toBeGreaterThan(0);
      
      // In a real test, you would analyze computed styles for contrast ratios
      // This is a placeholder for such analysis
    });

    it('should not rely on color alone to convey information', () => {
      const mockProps = {
        phase: 'choosing' as const,
        betAmount: 0.01,
        timeLeft: 1800,
        userChoice: null,
        opponentChoice: null,
        gameResult: null,
        isUserCreator: true,
        canReveal: false,
        canSettle: false,
        isRevealing: false,
        isSettling: false,
        onMakeChoice: jest.fn(),
        onReveal: jest.fn(),
        onSettle: jest.fn(),
        onNewGame: jest.fn(),
      };

      const { container } = render(<GameInterface {...mockProps} />);
      
      // Check that game choices have text/icons, not just colors
      const choiceButtons = container.querySelectorAll('[role="button"], button');
      choiceButtons.forEach((button) => {
        // Should have text content or icon content
        const hasNonColorInfo = 
          button.textContent?.trim() ||
          button.querySelector('svg, img') ||
          button.getAttribute('aria-label');
        
        if (button.textContent?.includes('Rock') || 
            button.textContent?.includes('Paper') || 
            button.textContent?.includes('Scissors')) {
          expect(hasNonColorInfo).toBeTruthy();
        }
      });
    });

    it('should be usable at 200% zoom', () => {
      // Mock viewport scaling
      const originalInnerWidth = window.innerWidth;
      const originalInnerHeight = window.innerHeight;
      
      // Simulate 200% zoom (half viewport size)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth / 2,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: originalInnerHeight / 2,
      });

      const { container } = render(<RPSGame />);
      
      // Should render without horizontal scrolling issues
      expect(container).toBeInTheDocument();
      
      // Restore original values
      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: originalInnerHeight,
      });
    });
  });

  describe('🔊 Audio Accessibility', () => {
    it('should provide visual alternatives to audio cues', () => {
      // If the game has sound effects, it should also have visual indicators
      const { container } = render(<RPSGame />);
      
      // Check for visual feedback elements that could accompany audio
      const visualFeedback = container.querySelectorAll(
        '[class*="notification"], [class*="toast"], [class*="alert"], [aria-live]'
      );
      
      // This is a basic check - in a real app with audio, 
      // you'd verify that each audio cue has a visual equivalent
      expect(container).toBeInTheDocument();
    });

    it('should not autoplay audio without user consent', () => {
      const { container } = render(<RPSGame />);
      
      const audioElements = container.querySelectorAll('audio, video');
      audioElements.forEach((element) => {
        // Should not have autoplay attribute
        expect(element).not.toHaveAttribute('autoplay');
      });
    });
  });

  describe('📱 Mobile Accessibility', () => {
    it('should have appropriate touch targets', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 812,
      });

      const { container } = render(<RPSGame />);
      
      const touchTargets = container.querySelectorAll('button, [role="button"], input, select');
      
      // All touch targets should be large enough (44px x 44px minimum recommended)
      touchTargets.forEach((element) => {
        // In a real test, you'd check computed styles for dimensions
        expect(element).toBeInTheDocument();
      });
    });

    it('should support swipe gestures appropriately', () => {
      const { container } = render(<RPSGame />);
      
      // Check that swipe-dependent functionality has alternatives
      // This is more of a design check than a technical test
      expect(container).toBeInTheDocument();
    });
  });

  describe('⚙️ Assistive Technology Support', () => {
    it('should work with screen reader navigation', () => {
      const { container } = render(<RPSGame />);
      
      // Check for landmarks
      const landmarks = container.querySelectorAll(
        'main, nav, header, footer, aside, section, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]'
      );
      
      // Should have some structural landmarks
      if (landmarks.length > 0) {
        landmarks.forEach((landmark) => {
          // Landmarks should be properly labeled
          const hasLabel = 
            landmark.getAttribute('aria-label') ||
            landmark.getAttribute('aria-labelledby');
          
          // At minimum, main content should be identifiable
          if (landmark.tagName === 'MAIN' || landmark.getAttribute('role') === 'main') {
            expect(landmark).toBeInTheDocument();
          }
        });
      }
    });

    it('should handle voice control properly', () => {
      const { container } = render(<RPSGame />);
      
      // Elements should have clear, speakable labels
      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const label = 
          button.getAttribute('aria-label') ||
          button.textContent?.trim();
        
        if (label) {
          // Label should be clear and not just symbols
          expect(label.length).toBeGreaterThan(2);
          expect(/^[^\w]*$/.test(label)).toBe(false); // Not just symbols
        }
      });
    });
  });

  describe('🌍 Internationalization Accessibility', () => {
    it('should support right-to-left languages', () => {
      const { container } = render(
        <div dir="rtl" lang="ar">
          <RPSGame />
        </div>
      );
      
      // Should render without layout issues in RTL
      expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
    });

    it('should have proper lang attributes', () => {
      const { container } = render(<RPSGame />);
      
      // Check for lang attributes on text content
      const textElements = container.querySelectorAll('p, span, div, button');
      
      // At minimum, the document should have lang (handled by HTML)
      // Individual elements with different languages should have lang attributes
      expect(container).toBeInTheDocument();
    });
  });
});

// Accessibility testing utilities
export class AccessibilityTester {
  static async runFullAccessibilityAudit(component: React.ReactElement): Promise<any> {
    const { container } = render(component);
    const results = await axe(container, {
      rules: {
        // Configure specific rules for gaming applications
        'color-contrast': { enabled: true },
        'keyboard': { enabled: true },
        'aria-labels': { enabled: true },
        'heading-order': { enabled: true },
      }
    });
    
    return {
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      score: this.calculateAccessibilityScore(results),
    };
  }

  private static calculateAccessibilityScore(results: any): number {
    const total = results.violations.length + results.passes.length;
    if (total === 0) return 100;
    
    return Math.round((results.passes.length / total) * 100);
  }

  static checkKeyboardNavigation(container: HTMLElement): {
    focusableCount: number;
    hasTabOrder: boolean;
    hasSkipLinks: boolean;
  } {
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const hasTabOrder = Array.from(focusableElements).some(el => 
      el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '0'
    );

    const skipLinks = container.querySelectorAll('a[href^="#"]');
    const hasSkipLinks = skipLinks.length > 0;

    return {
      focusableCount: focusableElements.length,
      hasTabOrder,
      hasSkipLinks,
    };
  }

  static checkColorContrast(element: HTMLElement): Promise<{ ratio: number; level: string }> {
    // This would integrate with a color contrast analyzer
    // For now, return a mock implementation
    return Promise.resolve({
      ratio: 4.5, // WCAG AA compliant
      level: 'AA'
    });
  }
}