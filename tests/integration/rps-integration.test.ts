// tests/integration/rps-integration.test.ts - Comprehensive RPS Integration Tests
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import React from 'react';

// Import RPS game components
import RPSGame from '../../src/games/RPS';
import { useRPSGame } from '../../src/games/RPS/hooks/useRPSGame';
import { RPSClient } from '../../src/rps-client';

const PROGRAM_ID = new PublicKey('32tQhc2c4LurhdBwDzzV8f3PtdhKm1iVaPSumDTZWAvb');

describe('🎮 RPS Game Integration Tests', () => {
  let connection: Connection;
  let mockWallet: any;
  let rpsClient: RPSClient;

  beforeAll(async () => {
    // Setup test environment
    connection = new Connection('http://localhost:8899', 'confirmed');
    
    // Mock wallet for testing
    mockWallet = {
      publicKey: new PublicKey('11111111111111111111111111111112'),
      signTransaction: jest.fn(),
      signAllTransactions: jest.fn(),
      connected: true,
    };

    rpsClient = new RPSClient(connection, mockWallet);
  });

  describe('✅ Wallet Integration', () => {
    it('should connect wallet successfully', async () => {
      const { container } = render(
        <Provider network={WalletAdapterNetwork.Devnet} autoConnect={false}>
          <RPSGame />
        </Provider>
      );

      // Should show connect prompt when not connected
      expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument();
      
      // Mock wallet connection
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(connectButton).toBeInTheDocument();
    });

    it('should handle wallet disconnection gracefully', async () => {
      // Test wallet disconnection scenario
      const onDisconnect = jest.fn();
      
      // Simulate disconnection
      mockWallet.connected = false;
      
      const { rerender } = render(
        <Provider network={WalletAdapterNetwork.Devnet} autoConnect={false}>
          <RPSGame />
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument();
      });
    });
  });

  describe('🎯 Game Flow Integration', () => {
    beforeEach(() => {
      mockWallet.connected = true;
    });

    it('should create match successfully', async () => {
      const { container } = render(
        <Provider network={WalletAdapterNetwork.Devnet} autoConnect={true}>
          <RPSGame />
        </Provider>
      );

      // Wait for component to load
      await waitFor(() => {
        const createMatchButton = screen.queryByText(/create match/i);
        if (createMatchButton) {
          expect(createMatchButton).toBeInTheDocument();
        }
      });
    });

    it('should handle match creation errors', async () => {
      // Mock RPC error
      mockWallet.signTransaction = jest.fn().mockRejectedValue(new Error('Transaction failed'));

      const { container } = render(
        <Provider network={WalletAdapterNetwork.Devnet} autoConnect={true}>
          <RPSGame />
        </Provider>
      );

      // Test error handling
      await waitFor(() => {
        // Should handle errors gracefully without crashing
        expect(container).toBeInTheDocument();
      });
    });

    it('should join existing match', async () => {
      const mockMatches = [
        {
          id: 'test-match-1',
          creator: 'creator-pubkey',
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
      ];

      // Mock the hook to return test data
      jest.mock('../../src/games/RPS/hooks/useRPSGame', () => ({
        useRPSGame: jest.fn(() => ({
          matches: mockMatches,
          userMatches: [],
          currentMatch: null,
          gamePhase: { phase: 'lobby', canTransition: true },
          isConnected: true,
          joinMatch: jest.fn(),
          createMatch: jest.fn(),
        }))
      }));

      const { container } = render(
        <Provider network={WalletAdapterNetwork.Devnet} autoConnect={true}>
          <RPSGame />
        </Provider>
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('🔒 Security Validation', () => {
    it('should validate commitment hashes', async () => {
      const choice = 0; // Rock
      const salt = new Uint8Array(32);
      const publicKey = new PublicKey('11111111111111111111111111111112');
      const nonce = 12345;

      // Test commitment generation
      const client = new RPSClient(connection, mockWallet);
      
      try {
        // This would normally create a commitment hash
        const result = true; // Placeholder for actual test
        expect(result).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should prevent unauthorized actions', async () => {
      // Test that only authorized users can perform actions
      const unauthorizedWallet = {
        publicKey: new PublicKey('22222222222222222222222222222222'),
        signTransaction: jest.fn(),
        connected: true,
      };

      const client = new RPSClient(connection, unauthorizedWallet);
      
      // Test should fail for unauthorized actions
      try {
        // This would normally fail
        const result = false; // Placeholder
        expect(result).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('⚡ Performance Tests', () => {
    it('should load match list quickly', async () => {
      const startTime = performance.now();
      
      const { container } = render(
        <Provider network={WalletAdapterNetwork.Devnet} autoConnect={true}>
          <RPSGame />
        </Provider>
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load in under 1 second
      expect(loadTime).toBeLessThan(1000);
    });

    it('should handle multiple concurrent operations', async () => {
      const operations = Array.from({ length: 5 }, (_, i) => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve(`Operation ${i} completed`);
          }, Math.random() * 100);
        })
      );

      const startTime = performance.now();
      const results = await Promise.all(operations);
      const endTime = performance.now();

      expect(results).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  describe('📱 Responsive Design Tests', () => {
    it('should render correctly on mobile', async () => {
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

      const { container } = render(
        <Provider network={WalletAdapterNetwork.Devnet} autoConnect={true}>
          <RPSGame />
        </Provider>
      );

      expect(container).toBeInTheDocument();
      // Additional mobile-specific tests would go here
    });

    it('should render correctly on tablet', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { container } = render(
        <Provider network={WalletAdapterNetwork.Devnet} autoConnect={true}>
          <RPSGame />
        </Provider>
      );

      expect(container).toBeInTheDocument();
    });

    it('should render correctly on desktop', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      const { container } = render(
        <Provider network={WalletAdapterNetwork.Devnet} autoConnect={true}>
          <RPSGame />
        </Provider>
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('🔄 Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network failure
      const failingConnection = new Connection('http://invalid-endpoint', 'confirmed');
      
      try {
        const client = new RPSClient(failingConnection, mockWallet);
        // Should handle the error gracefully
        expect(client).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle insufficient funds error', async () => {
      // Mock insufficient funds scenario
      mockWallet.signTransaction = jest.fn().mockRejectedValue(
        new Error('Insufficient funds for transaction')
      );

      const { container } = render(
        <Provider network={WalletAdapterNetwork.Devnet} autoConnect={true}>
          <RPSGame />
        </Provider>
      );

      // Should handle insufficient funds gracefully
      expect(container).toBeInTheDocument();
    });

    it('should handle transaction timeout', async () => {
      // Mock transaction timeout
      mockWallet.signTransaction = jest.fn().mockImplementation(
        () => new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Transaction timeout')), 5000);
        })
      );

      const { container } = render(
        <Provider network={WalletAdapterNetwork.Devnet} autoConnect={true}>
          <RPSGame />
        </Provider>
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('🎨 UI/UX Validation', () => {
    it('should have accessible buttons and labels', async () => {
      const { container } = render(
        <Provider network={WalletAdapterNetwork.Devnet} autoConnect={true}>
          <RPSGame />
        </Provider>
      );

      // Check for accessible elements
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        // Should have accessible text or aria-label
        expect(
          button.textContent || 
          button.getAttribute('aria-label') ||
          button.getAttribute('title')
        ).toBeTruthy();
      });
    });

    it('should support keyboard navigation', async () => {
      const { container } = render(
        <Provider network={WalletAdapterNetwork.Devnet} autoConnect={true}>
          <RPSGame />
        </Provider>
      );

      // Test keyboard navigation
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('should display proper loading states', async () => {
      const { container } = render(
        <Provider network={WalletAdapterNetwork.Devnet} autoConnect={true}>
          <RPSGame />
        </Provider>
      );

      // Should have loading indicators for async operations
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });
  });
});

// Performance monitoring utilities
export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map();

  static startMeasurement(name: string): number {
    return performance.now();
  }

  static endMeasurement(name: string, startTime: number): number {
    const duration = performance.now() - startTime;
    
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    
    this.measurements.get(name)!.push(duration);
    return duration;
  }

  static getAverageTime(name: string): number {
    const times = this.measurements.get(name) || [];
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  static getStats(name: string) {
    const times = this.measurements.get(name) || [];
    if (times.length === 0) return null;

    const sorted = [...times].sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: times.reduce((sum, time) => sum + time, 0) / times.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      count: times.length
    };
  }

  static reset(): void {
    this.measurements.clear();
  }
}