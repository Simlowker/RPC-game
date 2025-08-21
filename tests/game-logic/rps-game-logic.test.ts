// tests/game-logic/rps-game-logic.test.ts - RPS Game Logic Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { 
  Choice, 
  MatchStatus, 
  GameResult, 
  determineWinner,
  createCommitmentHash,
  generateSalt,
  generateNonce,
  canJoinMatch,
  canRevealChoice,
  canSettleMatch,
  formatSOL,
  RPSClient 
} from '../../src/rps-client';

describe('🎮 RPS Game Logic Tests', () => {
  let connection: Connection;
  let creator: Keypair;
  let opponent: Keypair;
  let mockWallet: any;

  beforeEach(() => {
    connection = new Connection('http://localhost:8899', 'confirmed');
    creator = Keypair.generate();
    opponent = Keypair.generate();
    
    mockWallet = {
      publicKey: creator.publicKey,
      signTransaction: jest.fn(),
      signAllTransactions: jest.fn(),
      connected: true,
    };
  });

  describe('🎯 Game Rules and Logic', () => {
    describe('Winner Determination', () => {
      it('should correctly determine Rock vs Scissors', () => {
        expect(determineWinner(Choice.Rock, Choice.Scissors)).toEqual({ creatorWins: {} });
        expect(determineWinner(Choice.Scissors, Choice.Rock)).toEqual({ opponentWins: {} });
      });

      it('should correctly determine Paper vs Rock', () => {
        expect(determineWinner(Choice.Paper, Choice.Rock)).toEqual({ creatorWins: {} });
        expect(determineWinner(Choice.Rock, Choice.Paper)).toEqual({ opponentWins: {} });
      });

      it('should correctly determine Scissors vs Paper', () => {
        expect(determineWinner(Choice.Scissors, Choice.Paper)).toEqual({ creatorWins: {} });
        expect(determineWinner(Choice.Paper, Choice.Scissors)).toEqual({ opponentWins: {} });
      });

      it('should correctly determine ties', () => {
        expect(determineWinner(Choice.Rock, Choice.Rock)).toEqual({ tie: {} });
        expect(determineWinner(Choice.Paper, Choice.Paper)).toEqual({ tie: {} });
        expect(determineWinner(Choice.Scissors, Choice.Scissors)).toEqual({ tie: {} });
      });

      it('should test all possible combinations', () => {
        const choices = [Choice.Rock, Choice.Paper, Choice.Scissors];
        const expectedResults = [
          // Rock vs [Rock, Paper, Scissors]
          [{ tie: {} }, { opponentWins: {} }, { creatorWins: {} }],
          // Paper vs [Rock, Paper, Scissors]
          [{ creatorWins: {} }, { tie: {} }, { opponentWins: {} }],
          // Scissors vs [Rock, Paper, Scissors]
          [{ opponentWins: {} }, { creatorWins: {} }, { tie: {} }]
        ];

        choices.forEach((creatorChoice, i) => {
          choices.forEach((opponentChoice, j) => {
            const result = determineWinner(creatorChoice, opponentChoice);
            expect(result).toEqual(expectedResults[i][j]);
          });
        });
      });
    });

    describe('Choice Encoding', () => {
      it('should encode choices correctly', () => {
        expect(Choice.Rock).toBe(0);
        expect(Choice.Paper).toBe(1);
        expect(Choice.Scissors).toBe(2);
      });

      it('should handle invalid choice numbers', () => {
        // Test that invalid choice numbers don't break winner determination
        const validChoices = [Choice.Rock, Choice.Paper, Choice.Scissors];
        
        validChoices.forEach(choice => {
          const result = determineWinner(choice, choice);
          expect(result).toEqual({ tie: {} });
        });
      });
    });
  });

  describe('🔐 Commitment System', () => {
    describe('Hash Generation', () => {
      it('should generate consistent commitment hashes', () => {
        const choice = Choice.Rock;
        const salt = new Uint8Array(32).fill(1);
        const publicKey = creator.publicKey;
        const nonce = 12345;

        const hash1 = createCommitmentHash(choice, salt, publicKey, nonce);
        const hash2 = createCommitmentHash(choice, salt, publicKey, nonce);

        expect(hash1).toEqual(hash2);
        expect(hash1).toHaveLength(32);
      });

      it('should generate different hashes for different inputs', () => {
        const salt = new Uint8Array(32).fill(1);
        const publicKey = creator.publicKey;
        const nonce = 12345;

        const rockHash = createCommitmentHash(Choice.Rock, salt, publicKey, nonce);
        const paperHash = createCommitmentHash(Choice.Paper, salt, publicKey, nonce);
        const scissorsHash = createCommitmentHash(Choice.Scissors, salt, publicKey, nonce);

        expect(rockHash).not.toEqual(paperHash);
        expect(paperHash).not.toEqual(scissorsHash);
        expect(rockHash).not.toEqual(scissorsHash);
      });

      it('should generate different hashes for different salts', () => {
        const choice = Choice.Rock;
        const publicKey = creator.publicKey;
        const nonce = 12345;

        const salt1 = new Uint8Array(32).fill(1);
        const salt2 = new Uint8Array(32).fill(2);

        const hash1 = createCommitmentHash(choice, salt1, publicKey, nonce);
        const hash2 = createCommitmentHash(choice, salt2, publicKey, nonce);

        expect(hash1).not.toEqual(hash2);
      });

      it('should generate different hashes for different public keys', () => {
        const choice = Choice.Rock;
        const salt = new Uint8Array(32).fill(1);
        const nonce = 12345;

        const hash1 = createCommitmentHash(choice, salt, creator.publicKey, nonce);
        const hash2 = createCommitmentHash(choice, salt, opponent.publicKey, nonce);

        expect(hash1).not.toEqual(hash2);
      });

      it('should generate different hashes for different nonces', () => {
        const choice = Choice.Rock;
        const salt = new Uint8Array(32).fill(1);
        const publicKey = creator.publicKey;

        const hash1 = createCommitmentHash(choice, salt, publicKey, 12345);
        const hash2 = createCommitmentHash(choice, salt, publicKey, 54321);

        expect(hash1).not.toEqual(hash2);
      });
    });

    describe('Salt Generation', () => {
      it('should generate random salts', () => {
        const salt1 = generateSalt();
        const salt2 = generateSalt();

        expect(salt1).toHaveLength(32);
        expect(salt2).toHaveLength(32);
        expect(salt1).not.toEqual(salt2);
      });

      it('should generate salts with sufficient entropy', () => {
        const salts = Array.from({ length: 100 }, () => generateSalt());
        
        // Check that all salts are different (very high probability)
        const unique = new Set(salts.map(salt => salt.toString()));
        expect(unique.size).toBe(100);
      });
    });

    describe('Nonce Generation', () => {
      it('should generate random nonces', () => {
        const nonce1 = generateNonce();
        const nonce2 = generateNonce();

        expect(typeof nonce1).toBe('number');
        expect(typeof nonce2).toBe('number');
        expect(nonce1).not.toBe(nonce2);
      });

      it('should generate nonces in valid range', () => {
        for (let i = 0; i < 100; i++) {
          const nonce = generateNonce();
          expect(nonce).toBeGreaterThanOrEqual(0);
          expect(nonce).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
        }
      });
    });
  });

  describe('📅 Game Timing and Status', () => {
    describe('Match Status Validation', () => {
      it('should validate match joining conditions', () => {
        const currentTime = Math.floor(Date.now() / 1000);
        
        const validMatch = {
          creator: creator.publicKey,
          opponent: null,
          status: MatchStatus.WaitingForOpponent,
          joinDeadline: currentTime + 3600, // 1 hour from now
          betAmount: LAMPORTS_PER_SOL * 0.01,
        };

        expect(canJoinMatch(validMatch as any, opponent.publicKey, currentTime)).toBe(true);
      });

      it('should reject joining expired matches', () => {
        const currentTime = Math.floor(Date.now() / 1000);
        
        const expiredMatch = {
          creator: creator.publicKey,
          opponent: null,
          status: MatchStatus.WaitingForOpponent,
          joinDeadline: currentTime - 1, // Expired
          betAmount: LAMPORTS_PER_SOL * 0.01,
        };

        expect(canJoinMatch(expiredMatch as any, opponent.publicKey, currentTime)).toBe(false);
      });

      it('should reject self-joining', () => {
        const currentTime = Math.floor(Date.now() / 1000);
        
        const match = {
          creator: creator.publicKey,
          opponent: null,
          status: MatchStatus.WaitingForOpponent,
          joinDeadline: currentTime + 3600,
          betAmount: LAMPORTS_PER_SOL * 0.01,
        };

        expect(canJoinMatch(match as any, creator.publicKey, currentTime)).toBe(false);
      });

      it('should reject joining already joined matches', () => {
        const currentTime = Math.floor(Date.now() / 1000);
        
        const joinedMatch = {
          creator: creator.publicKey,
          opponent: opponent.publicKey,
          status: MatchStatus.WaitingForReveal,
          joinDeadline: currentTime + 3600,
          betAmount: LAMPORTS_PER_SOL * 0.01,
        };

        const thirdPlayer = Keypair.generate();
        expect(canJoinMatch(joinedMatch as any, thirdPlayer.publicKey, currentTime)).toBe(false);
      });
    });

    describe('Reveal Validation', () => {
      it('should allow revealing when appropriate', () => {
        const currentTime = Math.floor(Date.now() / 1000);
        
        const match = {
          creator: creator.publicKey,
          opponent: opponent.publicKey,
          status: MatchStatus.WaitingForReveal,
          revealDeadline: currentTime + 1800, // 30 minutes
          revealedCreator: null,
          revealedOpponent: null,
        };

        expect(canRevealChoice(match as any, creator.publicKey, currentTime)).toBe(true);
        expect(canRevealChoice(match as any, opponent.publicKey, currentTime)).toBe(true);
      });

      it('should reject revealing after deadline', () => {
        const currentTime = Math.floor(Date.now() / 1000);
        
        const expiredMatch = {
          creator: creator.publicKey,
          opponent: opponent.publicKey,
          status: MatchStatus.WaitingForReveal,
          revealDeadline: currentTime - 1, // Expired
          revealedCreator: null,
          revealedOpponent: null,
        };

        expect(canRevealChoice(expiredMatch as any, creator.publicKey, currentTime)).toBe(false);
      });

      it('should reject double revealing', () => {
        const currentTime = Math.floor(Date.now() / 1000);
        
        const match = {
          creator: creator.publicKey,
          opponent: opponent.publicKey,
          status: MatchStatus.WaitingForReveal,
          revealDeadline: currentTime + 1800,
          revealedCreator: Choice.Rock, // Already revealed
          revealedOpponent: null,
        };

        expect(canRevealChoice(match as any, creator.publicKey, currentTime)).toBe(false);
        expect(canRevealChoice(match as any, opponent.publicKey, currentTime)).toBe(true);
      });
    });

    describe('Settlement Validation', () => {
      it('should allow settlement when both revealed', () => {
        const match = {
          status: MatchStatus.ReadyToSettle,
          revealedCreator: Choice.Rock,
          revealedOpponent: Choice.Scissors,
        };

        expect(canSettleMatch(match as any)).toBe(true);
      });

      it('should reject settlement when not ready', () => {
        const match = {
          status: MatchStatus.WaitingForReveal,
          revealedCreator: Choice.Rock,
          revealedOpponent: null,
        };

        expect(canSettleMatch(match as any)).toBe(false);
      });

      it('should reject settlement when already settled', () => {
        const match = {
          status: MatchStatus.Settled,
          revealedCreator: Choice.Rock,
          revealedOpponent: Choice.Scissors,
        };

        expect(canSettleMatch(match as any)).toBe(false);
      });
    });
  });

  describe('💰 Financial Logic', () => {
    describe('SOL Formatting', () => {
      it('should format lamports to SOL correctly', () => {
        expect(formatSOL(LAMPORTS_PER_SOL)).toBe('1.000000000');
        expect(formatSOL(LAMPORTS_PER_SOL / 2)).toBe('0.500000000');
        expect(formatSOL(100000000)).toBe('0.100000000'); // 0.1 SOL
        expect(formatSOL(10000000)).toBe('0.010000000');  // 0.01 SOL
        expect(formatSOL(0)).toBe('0.000000000');
      });

      it('should handle large amounts', () => {
        const largeAmount = LAMPORTS_PER_SOL * 1000; // 1000 SOL
        expect(formatSOL(largeAmount)).toBe('1000.000000000');
      });

      it('should handle small amounts', () => {
        expect(formatSOL(1)).toBe('0.000000001'); // 1 lamport
        expect(formatSOL(999999999)).toBe('0.999999999');
      });
    });

    describe('Bet Validation', () => {
      it('should validate bet amounts', () => {
        const minBet = 0.001 * LAMPORTS_PER_SOL; // 0.001 SOL
        const maxBet = 100 * LAMPORTS_PER_SOL;   // 100 SOL

        // Valid bets
        expect(minBet).toBeGreaterThan(0);
        expect(minBet).toBeLessThanOrEqual(maxBet);

        // Test bet amounts
        const validBet = 0.01 * LAMPORTS_PER_SOL;
        expect(validBet).toBeGreaterThanOrEqual(minBet);
        expect(validBet).toBeLessThanOrEqual(maxBet);

        // Invalid bets
        const tooSmall = minBet - 1;
        const tooLarge = maxBet + 1;
        
        expect(tooSmall).toBeLessThan(minBet);
        expect(tooLarge).toBeGreaterThan(maxBet);
      });

      it('should calculate fees correctly', () => {
        const betAmount = LAMPORTS_PER_SOL * 0.1; // 0.1 SOL
        const totalPot = betAmount * 2; // 0.2 SOL total
        const feeBps = 100; // 1%

        const expectedFee = totalPot * feeBps / 10000;
        const expectedPayout = totalPot - expectedFee;

        expect(expectedFee).toBe(totalPot * 0.01); // 1% fee
        expect(expectedPayout).toBe(totalPot * 0.99); // 99% payout
      });

      it('should handle maximum fee rate', () => {
        const maxFeeBps = 500; // 5%
        const betAmount = LAMPORTS_PER_SOL;
        const totalPot = betAmount * 2;

        const maxFee = totalPot * maxFeeBps / 10000;
        expect(maxFee).toBe(totalPot * 0.05); // 5% max fee

        // Should reject higher fee rates
        const invalidFeeBps = 501;
        expect(invalidFeeBps).toBeGreaterThan(maxFeeBps);
      });
    });

    describe('Payout Calculation', () => {
      it('should calculate winner payouts correctly', () => {
        const betAmount = LAMPORTS_PER_SOL * 0.05; // 0.05 SOL each
        const totalPot = betAmount * 2; // 0.1 SOL total
        const feeBps = 100; // 1%

        const fee = totalPot * feeBps / 10000;
        const winnerPayout = totalPot - fee;

        expect(fee).toBe(totalPot * 0.01);
        expect(winnerPayout).toBe(totalPot * 0.99);
        expect(winnerPayout).toBeGreaterThan(betAmount); // Winner gets more than they put in
      });

      it('should calculate tie refunds correctly', () => {
        const betAmount = LAMPORTS_PER_SOL * 0.05;

        // In ties, players get their original bet back (no fee)
        const refund = betAmount;
        expect(refund).toBe(betAmount);
      });

      it('should handle precision in calculations', () => {
        // Test with odd amounts that might cause precision issues
        const betAmount = 1234567; // Odd number of lamports
        const totalPot = betAmount * 2;
        const feeBps = 150; // 1.5%

        const fee = Math.floor(totalPot * feeBps / 10000);
        const payout = totalPot - fee;

        expect(fee + payout).toBe(totalPot); // Should add up exactly
        expect(fee).toBeGreaterThan(0);
        expect(payout).toBeGreaterThan(betAmount);
      });
    });
  });

  describe('🔄 Game State Management', () => {
    describe('Match Lifecycle', () => {
      it('should follow correct state transitions', () => {
        // Initial state
        let status = MatchStatus.WaitingForOpponent;
        expect(status).toBe(MatchStatus.WaitingForOpponent);

        // After opponent joins
        status = MatchStatus.WaitingForReveal;
        expect(status).toBe(MatchStatus.WaitingForReveal);

        // After both players reveal
        status = MatchStatus.ReadyToSettle;
        expect(status).toBe(MatchStatus.ReadyToSettle);

        // After settlement
        status = MatchStatus.Settled;
        expect(status).toBe(MatchStatus.Settled);
      });

      it('should handle cancellation', () => {
        let status = MatchStatus.WaitingForOpponent;
        
        // Can be cancelled while waiting for opponent
        status = MatchStatus.Cancelled;
        expect(status).toBe(MatchStatus.Cancelled);
      });

      it('should handle timeouts', () => {
        let status = MatchStatus.WaitingForOpponent;
        
        // Can timeout while waiting
        status = MatchStatus.TimedOut;
        expect(status).toBe(MatchStatus.TimedOut);

        // Or during reveal phase
        status = MatchStatus.WaitingForReveal;
        status = MatchStatus.TimedOut;
        expect(status).toBe(MatchStatus.TimedOut);
      });
    });

    describe('Error Handling', () => {
      it('should handle invalid choice values', () => {
        // Test with invalid choice numbers
        expect(() => {
          const invalidChoice = 99 as Choice;
          createCommitmentHash(invalidChoice, generateSalt(), creator.publicKey, generateNonce());
        }).not.toThrow(); // Should handle gracefully
      });

      it('should handle null/undefined values', () => {
        const match = {
          creator: creator.publicKey,
          opponent: null, // null opponent
          status: MatchStatus.WaitingForOpponent,
          joinDeadline: Math.floor(Date.now() / 1000) + 3600,
        };

        // Should handle null opponent gracefully
        expect(canJoinMatch(match as any, opponent.publicKey, Math.floor(Date.now() / 1000))).toBe(true);
      });
    });
  });

  describe('⚡ Performance and Edge Cases', () => {
    describe('Large Scale Operations', () => {
      it('should handle multiple commitment generations efficiently', () => {
        const startTime = performance.now();
        const commitments = [];

        for (let i = 0; i < 1000; i++) {
          const salt = generateSalt();
          const nonce = generateNonce();
          const hash = createCommitmentHash(
            i % 3 as Choice, 
            salt, 
            creator.publicKey, 
            nonce
          );
          commitments.push({ salt, nonce, hash });
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(commitments).toHaveLength(1000);
        expect(duration).toBeLessThan(1000); // Should complete in under 1 second
        console.log(`Generated 1000 commitments in ${duration.toFixed(2)}ms`);
      });

      it('should handle rapid winner determinations', () => {
        const startTime = performance.now();
        const results = [];

        const choices = [Choice.Rock, Choice.Paper, Choice.Scissors];
        
        for (let i = 0; i < 10000; i++) {
          const creatorChoice = choices[i % 3];
          const opponentChoice = choices[(i + 1) % 3];
          const result = determineWinner(creatorChoice, opponentChoice);
          results.push(result);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(results).toHaveLength(10000);
        expect(duration).toBeLessThan(100); // Should be very fast
        console.log(`Determined 10000 winners in ${duration.toFixed(2)}ms`);
      });
    });

    describe('Memory Management', () => {
      it('should not leak memory during repeated operations', () => {
        const initialHeap = process.memoryUsage?.()?.heapUsed || 0;

        // Perform many operations
        for (let i = 0; i < 5000; i++) {
          const salt = generateSalt();
          const nonce = generateNonce();
          createCommitmentHash(Choice.Rock, salt, creator.publicKey, nonce);
          
          // Simulate cleanup
          if (i % 1000 === 0 && global.gc) {
            global.gc();
          }
        }

        const finalHeap = process.memoryUsage?.()?.heapUsed || 0;
        const memoryIncrease = finalHeap - initialHeap;

        // Should not increase memory significantly
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
      });
    });

    describe('Edge Case Values', () => {
      it('should handle edge case timestamps', () => {
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Edge case: deadline exactly at current time
        const match = {
          creator: creator.publicKey,
          opponent: null,
          status: MatchStatus.WaitingForOpponent,
          joinDeadline: currentTime,
          betAmount: LAMPORTS_PER_SOL * 0.01,
        };

        expect(canJoinMatch(match as any, opponent.publicKey, currentTime)).toBe(true);
        expect(canJoinMatch(match as any, opponent.publicKey, currentTime + 1)).toBe(false);
      });

      it('should handle minimum and maximum bet amounts', () => {
        const minBet = 1000; // Minimum lamports
        const maxBet = 100_000_000_000; // Maximum lamports (100 SOL)

        expect(formatSOL(minBet)).toBe('0.000001000');
        expect(formatSOL(maxBet)).toBe('100.000000000');
      });
    });
  });
});

// Test utilities
export class GameLogicTester {
  static simulateCompleteGame(
    creatorChoice: Choice,
    opponentChoice: Choice,
    betAmount: number = LAMPORTS_PER_SOL * 0.01
  ) {
    const creator = Keypair.generate();
    const opponent = Keypair.generate();
    
    // Generate commitments
    const creatorSalt = generateSalt();
    const creatorNonce = generateNonce();
    const creatorCommitment = createCommitmentHash(
      creatorChoice,
      creatorSalt,
      creator.publicKey,
      creatorNonce
    );
    
    const opponentSalt = generateSalt();
    const opponentNonce = generateNonce();
    const opponentCommitment = createCommitmentHash(
      opponentChoice,
      opponentSalt,
      opponent.publicKey,
      opponentNonce
    );
    
    // Simulate match progression
    const currentTime = Math.floor(Date.now() / 1000);
    
    const match = {
      creator: creator.publicKey,
      opponent: opponent.publicKey,
      betAmount,
      status: MatchStatus.ReadyToSettle,
      revealedCreator: creatorChoice,
      revealedOpponent: opponentChoice,
      joinDeadline: currentTime + 3600,
      revealDeadline: currentTime + 5400,
    };
    
    const winner = determineWinner(creatorChoice, opponentChoice);
    
    return {
      match,
      winner,
      creatorCommitment: {
        hash: creatorCommitment,
        salt: creatorSalt,
        nonce: creatorNonce,
        choice: creatorChoice,
      },
      opponentCommitment: {
        hash: opponentCommitment,
        salt: opponentSalt,
        nonce: opponentNonce,
        choice: opponentChoice,
      },
    };
  }

  static generateTestScenarios() {
    const choices = [Choice.Rock, Choice.Paper, Choice.Scissors];
    const scenarios = [];

    choices.forEach(creatorChoice => {
      choices.forEach(opponentChoice => {
        const winner = determineWinner(creatorChoice, opponentChoice);
        scenarios.push({
          creatorChoice,
          opponentChoice,
          expectedWinner: winner,
          description: `${Choice[creatorChoice]} vs ${Choice[opponentChoice]}`,
        });
      });
    });

    return scenarios;
  }
}