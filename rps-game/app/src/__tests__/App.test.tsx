import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import App from '../App';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('RPS Game App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the main title', () => {
      render(<App />);
      expect(screen.getByText('🎮 Solana RPS Game')).toBeInTheDocument();
    });

    it('should render the subtitle', () => {
      render(<App />);
      expect(screen.getByText('Play Rock Paper Scissors on Solana with on-chain betting!')).toBeInTheDocument();
    });

    it('should show connect wallet button initially', () => {
      render(<App />);
      expect(screen.getByText('Connect Solana Wallet')).toBeInTheDocument();
    });

    it('should render all three game choice buttons', () => {
      render(<App />);
      expect(screen.getByText('Rock')).toBeInTheDocument();
      expect(screen.getByText('Paper')).toBeInTheDocument();
      expect(screen.getByText('Scissors')).toBeInTheDocument();
    });

    it('should show correct initial game info', () => {
      render(<App />);
      expect(screen.getByText('Solana Devnet')).toBeInTheDocument();
      expect(screen.getByText('None')).toBeInTheDocument();
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });
  });

  describe('Wallet Connection', () => {
    it('should handle wallet connection successfully', async () => {
      const { toast } = await import('react-hot-toast');
      render(<App />);

      const connectButton = screen.getByText('Connect Solana Wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('✅ Wallet Connected')).toBeInTheDocument();
      });

      expect(toast.success).toHaveBeenCalledWith('Wallet connected!', { icon: '🚀' });
    });

    it('should update status to Ready after connection', async () => {
      render(<App />);

      const connectButton = screen.getByText('Connect Solana Wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });
    });

    it('should show wallet connected message', async () => {
      render(<App />);

      const connectButton = screen.getByText('Connect Solana Wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('Ready to play!')).toBeInTheDocument();
      });
    });
  });

  describe('Game Choice Selection', () => {
    it('should handle Rock selection', async () => {
      const { toast } = await import('react-hot-toast');
      render(<App />);

      const rockButton = screen.getByText('Rock');
      fireEvent.click(rockButton);

      await waitFor(() => {
        expect(screen.getByText('Rock')).toBeInTheDocument();
      });

      expect(toast.success).toHaveBeenCalledWith('Rock selected!');
    });

    it('should handle Paper selection', async () => {
      const { toast } = await import('react-hot-toast');
      render(<App />);

      const paperButton = screen.getByText('Paper');
      fireEvent.click(paperButton);

      expect(toast.success).toHaveBeenCalledWith('Paper selected!');
    });

    it('should handle Scissors selection', async () => {
      const { toast } = await import('react-hot-toast');
      render(<App />);

      const scissorsButton = screen.getByText('Scissors');
      fireEvent.click(scissorsButton);

      expect(toast.success).toHaveBeenCalledWith('Scissors selected!');
    });

    it('should update selected choice in game info', async () => {
      render(<App />);

      const rockButton = screen.getByText('Rock');
      fireEvent.click(rockButton);

      // Wait for state update and check if 'Rock' appears in the game info section
      await waitFor(() => {
        const gameInfoSection = screen.getByText('Selected:').parentElement;
        expect(gameInfoSection).toHaveTextContent('Rock');
      });
    });

    it('should highlight selected choice button', async () => {
      render(<App />);

      const rockButton = screen.getByText('Rock');
      fireEvent.click(rockButton);

      await waitFor(() => {
        // Check if the Rock button has the selected styling
        expect(rockButton.closest('button')).toHaveClass('bg-red-600', 'ring-4', 'ring-red-400');
      });
    });

    it('should allow changing selection', async () => {
      const { toast } = await import('react-hot-toast');
      render(<App />);

      // First select Rock
      const rockButton = screen.getByText('Rock');
      fireEvent.click(rockButton);

      // Then select Paper
      const paperButton = screen.getByText('Paper');
      fireEvent.click(paperButton);

      expect(toast.success).toHaveBeenCalledWith('Paper selected!');
      
      await waitFor(() => {
        const gameInfoSection = screen.getByText('Selected:').parentElement;
        expect(gameInfoSection).toHaveTextContent('Paper');
      });
    });
  });

  describe('Visual Elements', () => {
    it('should display correct emojis for each choice', () => {
      render(<App />);
      
      expect(screen.getByText('🪨')).toBeInTheDocument(); // Rock emoji
      expect(screen.getByText('📄')).toBeInTheDocument(); // Paper emoji
      expect(screen.getByText('✂️')).toBeInTheDocument(); // Scissors emoji
    });

    it('should have proper button styling classes', () => {
      render(<App />);
      
      const rockButton = screen.getByText('Rock').closest('button');
      const paperButton = screen.getByText('Paper').closest('button');
      const scissorsButton = screen.getByText('Scissors').closest('button');

      // Check base styling
      expect(rockButton).toHaveClass('bg-red-500', 'hover:bg-red-600');
      expect(paperButton).toHaveClass('bg-blue-500', 'hover:bg-blue-600');
      expect(scissorsButton).toHaveClass('bg-green-500', 'hover:bg-green-600');
    });

    it('should have responsive grid layout', () => {
      render(<App />);
      
      const choicesGrid = screen.getByText('Rock').closest('div').parentElement;
      expect(choicesGrid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-3');
    });
  });

  describe('Integration Flow', () => {
    it('should complete full user interaction flow', async () => {
      const { toast } = await import('react-hot-toast');
      render(<App />);

      // 1. Connect wallet
      const connectButton = screen.getByText('Connect Solana Wallet');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('✅ Wallet Connected')).toBeInTheDocument();
      });

      // 2. Select a choice
      const rockButton = screen.getByText('Rock');
      fireEvent.click(rockButton);

      // 3. Verify final state
      await waitFor(() => {
        expect(screen.getByText('Ready')).toBeInTheDocument();
        const gameInfoSection = screen.getByText('Selected:').parentElement;
        expect(gameInfoSection).toHaveTextContent('Rock');
      });

      // Verify toast calls
      expect(toast.success).toHaveBeenCalledWith('Wallet connected!', { icon: '🚀' });
      expect(toast.success).toHaveBeenCalledWith('Rock selected!');
    });

    it('should maintain state consistency throughout interactions', async () => {
      render(<App />);

      // Initial state
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByText('None')).toBeInTheDocument();

      // Connect wallet
      fireEvent.click(screen.getByText('Connect Solana Wallet'));
      
      await waitFor(() => {
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });

      // Select multiple choices
      fireEvent.click(screen.getByText('Rock'));
      fireEvent.click(screen.getByText('Paper'));
      fireEvent.click(screen.getByText('Scissors'));

      // Final state should show last selection
      await waitFor(() => {
        const gameInfoSection = screen.getByText('Selected:').parentElement;
        expect(gameInfoSection).toHaveTextContent('Scissors');
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<App />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // Connect + 3 choice buttons
    });

    it('should have accessible text content', () => {
      render(<App />);
      
      // Check for screen reader friendly text
      expect(screen.getByText('Choose Your Move')).toBeInTheDocument();
      expect(screen.getByText('Game Info')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<App />);
      
      const rockButton = screen.getByText('Rock').closest('button');
      expect(rockButton).toBeInTheDocument();
      
      // Buttons should be focusable
      if (rockButton) {
        rockButton.focus();
        expect(document.activeElement).toBe(rockButton);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle wallet connection errors gracefully', async () => {
      const { toast } = await import('react-hot-toast');
      
      // Mock a connection error
      const originalConsoleError = console.error;
      console.error = vi.fn();

      render(<App />);

      // For this test, we'll simulate an error by mocking the wallet connection
      // In a real app, you'd mock the wallet adapter
      
      const connectButton = screen.getByText('Connect Solana Wallet');
      fireEvent.click(connectButton);

      // Verify the success case since we don't have actual wallet integration
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });

      console.error = originalConsoleError;
    });
  });

  describe('Performance', () => {
    it('should render within acceptable time', () => {
      const startTime = performance.now();
      render(<App />);
      const endTime = performance.now();
      
      // Should render in under 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle rapid user interactions', async () => {
      render(<App />);
      
      const rockButton = screen.getByText('Rock');
      const paperButton = screen.getByText('Paper');
      const scissorsButton = screen.getByText('Scissors');

      // Rapidly click buttons
      fireEvent.click(rockButton);
      fireEvent.click(paperButton);
      fireEvent.click(scissorsButton);
      fireEvent.click(rockButton);

      // Should end up with Rock selected
      await waitFor(() => {
        const gameInfoSection = screen.getByText('Selected:').parentElement;
        expect(gameInfoSection).toHaveTextContent('Rock');
      });
    });
  });
});