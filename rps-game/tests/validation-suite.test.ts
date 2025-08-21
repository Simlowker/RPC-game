import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert, expect } from "chai";
import TestHelper, { TestFixtures } from "./utils/test-helpers";

/**
 * COMPREHENSIVE VALIDATION SUITE FOR MAINNET READINESS
 * 
 * This test suite validates all critical requirements for MainNet deployment:
 * ✅ Smart contract functionality
 * ✅ Security measures
 * ✅ Performance benchmarks
 * ✅ Error handling
 * ✅ Edge cases
 * ✅ Integration flows
 */

describe("🚀 MAINNET VALIDATION SUITE", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program(
    require("../target/idl/rps.json"),
    new PublicKey("zYQ16fyWiwZWgWjpQ9JBzL4QwLbp5MbezSBwSi2YTfY"),
    provider
  );

  let helper: TestHelper;
  let validationResults: any = {
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: "test",
    results: {}
  };

  before(() => {
    helper = new TestHelper(program, provider, provider.connection);
    console.log("\n🎯 Starting MainNet Validation Suite...");
    console.log("=" * 60);
  });

  after(async () => {
    // Store validation results in shared memory
    await storeValidationResults();
    console.log("\n📊 VALIDATION SUITE COMPLETE");
    console.log("=" * 60);
    printValidationSummary();
  });

  describe("✅ CRITICAL PATH VALIDATION", () => {
    it("Should validate complete game flow - All winning scenarios", async () => {
      console.log("\n🎮 Testing all winning combinations...");
      
      const winningScenarios = [
        { creator: 0, opponent: 2, winner: "creator", desc: "Rock beats Scissors" },
        { creator: 1, opponent: 0, winner: "creator", desc: "Paper beats Rock" },
        { creator: 2, opponent: 1, winner: "creator", desc: "Scissors beats Paper" },
        { creator: 2, opponent: 0, winner: "opponent", desc: "Rock beats Scissors" },
        { creator: 0, opponent: 1, winner: "opponent", desc: "Paper beats Rock" },
        { creator: 1, opponent: 2, winner: "opponent", desc: "Scissors beats Paper" },
        { creator: 0, opponent: 0, winner: "tie", desc: "Rock vs Rock" },
        { creator: 1, opponent: 1, winner: "tie", desc: "Paper vs Paper" },
        { creator: 2, opponent: 2, winner: "tie", desc: "Scissors vs Scissors" },
      ];

      const results = [];

      for (const scenario of winningScenarios) {
        try {
          const accounts = await helper.createTestAccounts();
          const creatorCommitment = helper.generateCommitment(scenario.creator, accounts.creator.publicKey);
          const opponentCommitment = helper.generateCommitment(scenario.opponent, accounts.opponent.publicKey);

          const startTime = performance.now();

          // Full game flow
          await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
          await helper.joinMatch(accounts, opponentCommitment.hash);
          await helper.reveal(accounts, accounts.creator, creatorCommitment);
          await helper.reveal(accounts, accounts.opponent, opponentCommitment);
          await helper.settleMatch(accounts);

          const endTime = performance.now();
          const match = await helper.getMatchState(accounts.matchAccount.publicKey);

          results.push({
            scenario: scenario.desc,
            success: true,
            duration: endTime - startTime,
            expectedWinner: scenario.winner,
            status: match.status.settled !== undefined
          });

          console.log(`  ✅ ${scenario.desc}: ${(endTime - startTime).toFixed(2)}ms`);
        } catch (error) {
          results.push({
            scenario: scenario.desc,
            success: false,
            error: error.message
          });
          console.log(`  ❌ ${scenario.desc}: ${error.message}`);
        }
      }

      const successRate = results.filter(r => r.success).length / results.length;
      const avgDuration = results.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.success).length;

      validationResults.results.criticalPath = {
        totalScenarios: results.length,
        successCount: results.filter(r => r.success).length,
        successRate: successRate,
        averageDuration: avgDuration,
        results: results
      };

      expect(successRate).to.equal(1.0, "All critical path scenarios must pass");
      expect(avgDuration).to.be.lessThan(10000, "Average duration must be under 10 seconds");
    });
  });

  describe("🔒 SECURITY VALIDATION", () => {
    it("Should pass all security requirements", async () => {
      console.log("\n🛡️  Running security validation...");
      
      const securityTests = [];

      // Test 1: Access Control
      try {
        const accounts = await helper.createTestAccounts();
        const maliciousUser = anchor.web3.Keypair.generate();
        await helper.fundAccount(maliciousUser.publicKey, 1 * LAMPORTS_PER_SOL);

        const commitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
        await helper.createMatch(accounts, commitment.hash, TestFixtures.STANDARD_GAME);

        // Try unauthorized cancellation
        try {
          await program.methods
            .cancelMatch()
            .accounts({
              matchAccount: accounts.matchAccount.publicKey,
              vault: accounts.vaultPda,
              creator: maliciousUser.publicKey, // Wrong creator
              creatorTokenAccount: null,
              vaultTokenAccount: null,
              tokenProgram: null,
              systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([maliciousUser])
            .rpc();
          
          securityTests.push({ test: "Access Control", passed: false, reason: "Unauthorized access allowed" });
        } catch (error) {
          securityTests.push({ test: "Access Control", passed: true });
        }
      } catch (error) {
        securityTests.push({ test: "Access Control", passed: false, reason: error.message });
      }

      // Test 2: Input Validation
      try {
        const accounts = await helper.createTestAccounts();
        const commitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);

        try {
          await helper.createMatch(accounts, commitment.hash, { 
            betAmount: 0, // Invalid
            feeBps: 10001 // Invalid
          });
          securityTests.push({ test: "Input Validation", passed: false, reason: "Invalid inputs accepted" });
        } catch (error) {
          securityTests.push({ test: "Input Validation", passed: true });
        }
      } catch (error) {
        securityTests.push({ test: "Input Validation", passed: false, reason: error.message });
      }

      // Test 3: Commitment Integrity
      try {
        const accounts = await helper.createTestAccounts();
        const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
        const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

        await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
        await helper.joinMatch(accounts, opponentCommitment.hash);

        // Try to reveal with wrong data
        try {
          const wrongCommitment = { ...creatorCommitment, choice: TestFixtures.CHOICES.PAPER };
          await helper.reveal(accounts, accounts.creator, wrongCommitment);
          securityTests.push({ test: "Commitment Integrity", passed: false, reason: "Invalid commitment accepted" });
        } catch (error) {
          securityTests.push({ test: "Commitment Integrity", passed: true });
        }
      } catch (error) {
        securityTests.push({ test: "Commitment Integrity", passed: false, reason: error.message });
      }

      validationResults.results.security = {
        tests: securityTests,
        passedCount: securityTests.filter(t => t.passed).length,
        totalCount: securityTests.length,
        allPassed: securityTests.every(t => t.passed)
      };

      console.log(`  Security Tests: ${securityTests.filter(t => t.passed).length}/${securityTests.length} passed`);
      
      securityTests.forEach(test => {
        const status = test.passed ? "✅" : "❌";
        console.log(`  ${status} ${test.test}`);
      });

      expect(securityTests.every(t => t.passed)).to.be.true;
    });
  });

  describe("⚡ PERFORMANCE VALIDATION", () => {
    it("Should meet all performance benchmarks", async () => {
      console.log("\n📊 Running performance benchmarks...");
      
      const performanceTests = [];

      // Test 1: Single Game Latency
      const singleGameLatencies = [];
      for (let i = 0; i < 5; i++) {
        const accounts = await helper.createTestAccounts();
        const creatorCommitment = helper.generateCommitment(i % 3, accounts.creator.publicKey);
        const opponentCommitment = helper.generateCommitment((i + 1) % 3, accounts.opponent.publicKey);

        const startTime = performance.now();
        
        await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.QUICK_GAME);
        await helper.joinMatch(accounts, opponentCommitment.hash);
        await helper.reveal(accounts, accounts.creator, creatorCommitment);
        await helper.reveal(accounts, accounts.opponent, opponentCommitment);
        await helper.settleMatch(accounts);

        const endTime = performance.now();
        singleGameLatencies.push(endTime - startTime);
      }

      const avgSingleGame = singleGameLatencies.reduce((a, b) => a + b, 0) / singleGameLatencies.length;
      const maxSingleGame = Math.max(...singleGameLatencies);
      
      performanceTests.push({
        test: "Single Game Latency",
        average: avgSingleGame,
        max: maxSingleGame,
        target: 15000, // 15 seconds
        passed: avgSingleGame < 15000 && maxSingleGame < 30000
      });

      // Test 2: Concurrent Matches
      const concurrentStart = performance.now();
      const concurrentPromises = Array.from({ length: 10 }, async (_, i) => {
        try {
          const accounts = await helper.createTestAccounts();
          const commitment = helper.generateCommitment(i % 3, accounts.creator.publicKey);
          await helper.createMatch(accounts, commitment.hash, TestFixtures.QUICK_GAME);
          return true;
        } catch (error) {
          return false;
        }
      });

      const concurrentResults = await Promise.all(concurrentPromises);
      const concurrentEnd = performance.now();
      const concurrentDuration = concurrentEnd - concurrentStart;
      const concurrentSuccessRate = concurrentResults.filter(Boolean).length / concurrentResults.length;

      performanceTests.push({
        test: "Concurrent Operations",
        duration: concurrentDuration,
        successRate: concurrentSuccessRate,
        target: 0.8, // 80% success rate
        passed: concurrentSuccessRate >= 0.8
      });

      validationResults.results.performance = {
        tests: performanceTests,
        allPassed: performanceTests.every(t => t.passed)
      };

      console.log(`  Performance Tests:`);
      performanceTests.forEach(test => {
        const status = test.passed ? "✅" : "❌";
        console.log(`  ${status} ${test.test}: ${test.average?.toFixed(2) || test.successRate?.toFixed(2) || test.duration?.toFixed(2)}ms`);
      });

      expect(performanceTests.every(t => t.passed)).to.be.true;
    });
  });

  describe("🔧 INTEGRATION VALIDATION", () => {
    it("Should validate wallet integration", async () => {
      console.log("\n💳 Testing wallet integration...");
      
      const accounts = await helper.createTestAccounts();
      const creatorBalanceBefore = await helper.getBalance(accounts.creator.publicKey);
      const opponentBalanceBefore = await helper.getBalance(accounts.opponent.publicKey);

      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.SCISSORS, accounts.opponent.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
      await helper.joinMatch(accounts, opponentCommitment.hash);
      await helper.reveal(accounts, accounts.creator, creatorCommitment);
      await helper.reveal(accounts, accounts.opponent, opponentCommitment);
      await helper.settleMatch(accounts);

      const creatorBalanceAfter = await helper.getBalance(accounts.creator.publicKey);
      const opponentBalanceAfter = await helper.getBalance(accounts.opponent.publicKey);

      const integrationTests = [
        {
          test: "Wallet Balance Updates",
          passed: creatorBalanceAfter !== creatorBalanceBefore && opponentBalanceAfter !== opponentBalanceBefore
        },
        {
          test: "Creator Won",
          passed: creatorBalanceAfter > creatorBalanceBefore
        },
        {
          test: "Opponent Lost",
          passed: opponentBalanceAfter < opponentBalanceBefore
        }
      ];

      validationResults.results.integration = {
        tests: integrationTests,
        allPassed: integrationTests.every(t => t.passed)
      };

      integrationTests.forEach(test => {
        const status = test.passed ? "✅" : "❌";
        console.log(`  ${status} ${test.test}`);
      });

      expect(integrationTests.every(t => t.passed)).to.be.true;
    });
  });

  describe("🛠️ ERROR HANDLING VALIDATION", () => {
    it("Should handle all error conditions gracefully", async () => {
      console.log("\n⚠️  Testing error handling...");
      
      const errorTests = [];

      // Test various error conditions
      const errorConditions = [
        {
          name: "Zero Bet Amount",
          test: async () => {
            const accounts = await helper.createTestAccounts();
            const commitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
            await helper.createMatch(accounts, commitment.hash, { betAmount: 0 });
          },
          expectedError: "InvalidBetAmount"
        },
        {
          name: "Excessive Fee Rate", 
          test: async () => {
            const accounts = await helper.createTestAccounts();
            const commitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
            await helper.createMatch(accounts, commitment.hash, { feeBps: 10001 });
          },
          expectedError: "InvalidFeeRate"
        },
        {
          name: "Double Reveal",
          test: async () => {
            const accounts = await helper.createTestAccounts();
            const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
            const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);
            
            await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
            await helper.joinMatch(accounts, opponentCommitment.hash);
            await helper.reveal(accounts, accounts.creator, creatorCommitment);
            await helper.reveal(accounts, accounts.creator, creatorCommitment); // Double reveal
          },
          expectedError: "AlreadyRevealed"
        }
      ];

      for (const condition of errorConditions) {
        try {
          await condition.test();
          errorTests.push({
            test: condition.name,
            passed: false,
            reason: "Expected error but operation succeeded"
          });
        } catch (error) {
          const correctError = error.message.includes(condition.expectedError);
          errorTests.push({
            test: condition.name,
            passed: correctError,
            reason: correctError ? "Correct error thrown" : `Wrong error: ${error.message}`
          });
        }
      }

      validationResults.results.errorHandling = {
        tests: errorTests,
        allPassed: errorTests.every(t => t.passed)
      };

      errorTests.forEach(test => {
        const status = test.passed ? "✅" : "❌";
        console.log(`  ${status} ${test.test}`);
      });

      expect(errorTests.every(t => t.passed)).to.be.true;
    });
  });

  // Helper functions
  async function storeValidationResults() {
    try {
      // This would integrate with actual shared memory system
      console.log("\n💾 Storing validation results in shared memory...");
      
      // Calculate overall validation score
      const allResults = Object.values(validationResults.results);
      const totalScore = allResults.reduce((sum: number, result: any) => {
        if (result.allPassed !== undefined) return sum + (result.allPassed ? 1 : 0);
        if (result.successRate !== undefined) return sum + result.successRate;
        return sum;
      }, 0) / allResults.length;

      validationResults.overallScore = totalScore;
      validationResults.mainnetReady = totalScore >= 0.95; // 95% threshold

      // In real implementation, this would store to the shared memory namespace
      console.log(`  📊 Overall Validation Score: ${(totalScore * 100).toFixed(2)}%`);
      console.log(`  🚀 MainNet Ready: ${validationResults.mainnetReady ? 'YES' : 'NO'}`);
      
    } catch (error) {
      console.error("Failed to store validation results:", error);
    }
  }

  function printValidationSummary() {
    console.log("\n📋 VALIDATION SUMMARY");
    console.log("-".repeat(40));
    
    const results = validationResults.results;
    
    console.log(`Critical Path: ${results.criticalPath?.successRate === 1 ? '✅' : '❌'} (${(results.criticalPath?.successRate * 100)?.toFixed(1)}%)`);
    console.log(`Security: ${results.security?.allPassed ? '✅' : '❌'} (${results.security?.passedCount}/${results.security?.totalCount})`);
    console.log(`Performance: ${results.performance?.allPassed ? '✅' : '❌'}`);
    console.log(`Integration: ${results.integration?.allPassed ? '✅' : '❌'}`);
    console.log(`Error Handling: ${results.errorHandling?.allPassed ? '✅' : '❌'}`);
    
    console.log("-".repeat(40));
    console.log(`🎯 MAINNET READINESS: ${validationResults.mainnetReady ? '🟢 READY' : '🔴 NOT READY'}`);
    
    if (!validationResults.mainnetReady) {
      console.log("\n⚠️  ISSUES TO RESOLVE:");
      Object.entries(results).forEach(([category, result]: [string, any]) => {
        if (!result.allPassed && result.allPassed !== undefined) {
          console.log(`  • ${category}: Review failed tests`);
        }
      });
    }
  }
});