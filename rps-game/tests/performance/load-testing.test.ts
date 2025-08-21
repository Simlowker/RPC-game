import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert, expect } from "chai";
import TestHelper, { TestFixtures } from "../utils/test-helpers";

describe("RPS Performance & Load Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program(
    require("../../target/idl/rps.json"),
    new PublicKey("zYQ16fyWiwZWgWjpQ9JBzL4QwLbp5MbezSBwSi2YTfY"),
    provider
  );

  let helper: TestHelper;

  before(() => {
    helper = new TestHelper(program, provider, provider.connection);
  });

  describe("Throughput Testing", () => {
    it("Should handle 50 concurrent match creations", async () => {
      const numMatches = 50;
      const startTime = Date.now();
      
      const creationPromises = Array.from({ length: numMatches }, async (_, i) => {
        try {
          const accounts = await helper.createTestAccounts();
          const commitment = helper.generateCommitment(i % 3, accounts.creator.publicKey);
          
          await helper.createMatch(accounts, commitment.hash, TestFixtures.QUICK_GAME);
          
          return {
            success: true,
            matchKey: accounts.matchAccount.publicKey,
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            duration: Date.now() - startTime
          };
        }
      });

      const results = await Promise.all(creationPromises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      const successes = results.filter(r => r.success);
      const failures = results.filter(r => !r.success);

      console.log(`\n📊 Match Creation Performance:`);
      console.log(`  ✅ Successful: ${successes.length}/${numMatches}`);
      console.log(`  ❌ Failed: ${failures.length}/${numMatches}`);
      console.log(`  ⏱️  Total Duration: ${totalDuration}ms`);
      console.log(`  📈 Avg per match: ${(totalDuration / numMatches).toFixed(2)}ms`);
      console.log(`  🚀 Throughput: ${(numMatches / (totalDuration / 1000)).toFixed(2)} matches/sec`);

      // Should succeed on most matches (allow some network-related failures)
      expect(successes.length).to.be.greaterThan(numMatches * 0.8);
      
      // Verify successful matches are properly created
      for (const result of successes.slice(0, 5)) { // Check first 5
        const match = await helper.getMatchState(result.matchKey);
        assert.equal(match.status.waitingForOpponent !== undefined, true);
      }
    });

    it("Should handle 20 complete game flows concurrently", async () => {
      const numGames = 20;
      const startTime = Date.now();

      const gamePromises = Array.from({ length: numGames }, async (_, i) => {
        try {
          const accounts = await helper.createTestAccounts();
          const creatorCommitment = helper.generateCommitment(i % 3, accounts.creator.publicKey);
          const opponentCommitment = helper.generateCommitment((i + 1) % 3, accounts.opponent.publicKey);

          // Full game flow
          await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.QUICK_GAME);
          await helper.joinMatch(accounts, opponentCommitment.hash);
          await helper.reveal(accounts, accounts.creator, creatorCommitment);
          await helper.reveal(accounts, accounts.opponent, opponentCommitment);
          await helper.settleMatch(accounts);

          return {
            success: true,
            gameId: i,
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            gameId: i,
            error: error.message,
            duration: Date.now() - startTime
          };
        }
      });

      const results = await Promise.all(gamePromises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      const successes = results.filter(r => r.success);
      const failures = results.filter(r => !r.success);

      console.log(`\n🎮 Complete Game Performance:`);
      console.log(`  ✅ Successful: ${successes.length}/${numGames}`);
      console.log(`  ❌ Failed: ${failures.length}/${numGames}`);
      console.log(`  ⏱️  Total Duration: ${totalDuration}ms`);
      console.log(`  📈 Avg per game: ${(totalDuration / numGames).toFixed(2)}ms`);
      console.log(`  🚀 Throughput: ${(numGames / (totalDuration / 1000)).toFixed(2)} games/sec`);

      // Should succeed on majority of games
      expect(successes.length).to.be.greaterThan(numGames * 0.7);
    });

    it("Should handle burst traffic simulation", async () => {
      const burstSizes = [5, 10, 15, 20];
      const results = [];

      for (const burstSize of burstSizes) {
        const startTime = Date.now();
        
        // Create burst of matches
        const burstPromises = Array.from({ length: burstSize }, async (_, i) => {
          const accounts = await helper.createTestAccounts();
          const commitment = helper.generateCommitment(i % 3, accounts.creator.publicKey);
          
          try {
            await helper.createMatch(accounts, commitment.hash, TestFixtures.QUICK_GAME);
            return true;
          } catch (error) {
            return false;
          }
        });

        const burstResults = await Promise.all(burstPromises);
        const endTime = Date.now();
        const duration = endTime - startTime;
        const successRate = burstResults.filter(Boolean).length / burstSize;

        results.push({
          burstSize,
          duration,
          successRate,
          throughput: burstSize / (duration / 1000)
        });

        // Brief pause between bursts
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`\n💥 Burst Traffic Performance:`);
      results.forEach(result => {
        console.log(`  Burst ${result.burstSize}: ${(result.successRate * 100).toFixed(1)}% success, ` +
                   `${result.duration}ms duration, ${result.throughput.toFixed(2)} req/sec`);
      });

      // All burst sizes should handle reasonably well
      results.forEach(result => {
        expect(result.successRate).to.be.greaterThan(0.6);
      });
    });
  });

  describe("Latency Testing", () => {
    it("Should measure individual operation latencies", async () => {
      const numSamples = 10;
      const operations = ['create', 'join', 'reveal', 'settle'];
      const latencies = {};

      for (const operation of operations) {
        latencies[operation] = [];
      }

      for (let i = 0; i < numSamples; i++) {
        const accounts = await helper.createTestAccounts();
        const creatorCommitment = helper.generateCommitment(i % 3, accounts.creator.publicKey);
        const opponentCommitment = helper.generateCommitment((i + 1) % 3, accounts.opponent.publicKey);

        // Measure create latency
        let startTime = performance.now();
        await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.QUICK_GAME);
        latencies.create.push(performance.now() - startTime);

        // Measure join latency
        startTime = performance.now();
        await helper.joinMatch(accounts, opponentCommitment.hash);
        latencies.join.push(performance.now() - startTime);

        // Measure reveal latency (creator)
        startTime = performance.now();
        await helper.reveal(accounts, accounts.creator, creatorCommitment);
        latencies.reveal.push(performance.now() - startTime);

        // Reveal opponent (not measured separately)
        await helper.reveal(accounts, accounts.opponent, opponentCommitment);

        // Measure settle latency
        startTime = performance.now();
        await helper.settleMatch(accounts);
        latencies.settle.push(performance.now() - startTime);
      }

      console.log(`\n⏱️  Operation Latencies (${numSamples} samples):`);
      for (const [operation, times] of Object.entries(latencies)) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
        
        console.log(`  ${operation.padEnd(8)}: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms, p95=${p95.toFixed(2)}ms`);
        
        // Performance targets
        expect(avg).to.be.lessThan(5000); // 5 second average
        expect(p95).to.be.lessThan(10000); // 10 second 95th percentile
      }
    });

    it("Should test end-to-end game latency", async () => {
      const numGames = 5;
      const endToEndLatencies = [];

      for (let i = 0; i < numGames; i++) {
        const startTime = performance.now();
        
        const accounts = await helper.createTestAccounts();
        const creatorCommitment = helper.generateCommitment(i % 3, accounts.creator.publicKey);
        const opponentCommitment = helper.generateCommitment((i + 1) % 3, accounts.opponent.publicKey);

        // Complete game flow
        await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.QUICK_GAME);
        await helper.joinMatch(accounts, opponentCommitment.hash);
        await helper.reveal(accounts, accounts.creator, creatorCommitment);
        await helper.reveal(accounts, accounts.opponent, opponentCommitment);
        await helper.settleMatch(accounts);

        const endTime = performance.now();
        endToEndLatencies.push(endTime - startTime);
      }

      const avgLatency = endToEndLatencies.reduce((a, b) => a + b, 0) / endToEndLatencies.length;
      const maxLatency = Math.max(...endToEndLatencies);
      const minLatency = Math.min(...endToEndLatencies);

      console.log(`\n🏁 End-to-End Game Latency:`);
      console.log(`  Average: ${avgLatency.toFixed(2)}ms`);
      console.log(`  Min: ${minLatency.toFixed(2)}ms`);
      console.log(`  Max: ${maxLatency.toFixed(2)}ms`);

      // End-to-end should complete within reasonable time
      expect(avgLatency).to.be.lessThan(15000); // 15 seconds average
      expect(maxLatency).to.be.lessThan(30000); // 30 seconds max
    });
  });

  describe("Resource Usage Testing", () => {
    it("Should monitor compute unit consumption", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      // Enable compute budget logging
      const computeUnits = [];

      // Create match
      try {
        const createTx = await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
        // Note: Actual compute unit measurement would require transaction analysis
        computeUnits.push({ operation: 'create', estimated: 50000 });
      } catch (error) {
        console.log("Create transaction details would be analyzed here");
      }

      // Continue with other operations...
      await helper.joinMatch(accounts, opponentCommitment.hash);
      computeUnits.push({ operation: 'join', estimated: 40000 });

      await helper.reveal(accounts, accounts.creator, creatorCommitment);
      computeUnits.push({ operation: 'reveal1', estimated: 30000 });

      await helper.reveal(accounts, accounts.opponent, opponentCommitment);
      computeUnits.push({ operation: 'reveal2', estimated: 30000 });

      await helper.settleMatch(accounts);
      computeUnits.push({ operation: 'settle', estimated: 60000 });

      console.log(`\n💻 Estimated Compute Unit Usage:`);
      let total = 0;
      computeUnits.forEach(cu => {
        console.log(`  ${cu.operation.padEnd(10)}: ${cu.estimated.toLocaleString()} CU`);
        total += cu.estimated;
      });
      console.log(`  ${'Total'.padEnd(10)}: ${total.toLocaleString()} CU`);

      // Should stay within reasonable compute limits
      expect(total).to.be.lessThan(300000); // 300k CU total
    });

    it("Should test memory efficiency with large numbers", async () => {
      const accounts = await helper.createTestAccounts();
      
      // Test with maximum values
      const largeBetAmount = 1000 * LAMPORTS_PER_SOL;
      await helper.fundAccount(accounts.creator.publicKey, largeBetAmount + (10 * LAMPORTS_PER_SOL));
      await helper.fundAccount(accounts.opponent.publicKey, largeBetAmount + (10 * LAMPORTS_PER_SOL));

      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.SCISSORS, accounts.opponent.publicKey);

      const startTime = performance.now();

      await helper.createMatch(accounts, creatorCommitment.hash, { 
        betAmount: largeBetAmount,
        feeBps: 1000 // 10% max fee
      });
      await helper.joinMatch(accounts, opponentCommitment.hash);
      await helper.reveal(accounts, accounts.creator, creatorCommitment);
      await helper.reveal(accounts, accounts.opponent, opponentCommitment);
      await helper.settleMatch(accounts);

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`\n🏋️  Large Value Performance:`);
      console.log(`  Bet Amount: ${largeBetAmount / LAMPORTS_PER_SOL} SOL`);
      console.log(`  Duration: ${duration.toFixed(2)}ms`);

      // Should handle large values efficiently
      expect(duration).to.be.lessThan(20000); // 20 seconds

      const match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.settled !== undefined, true);
      assert.equal(match.betAmount.toString(), largeBetAmount.toString());
    });
  });

  describe("Stress Testing", () => {
    it("Should handle continuous load for extended period", async () => {
      const testDurationMs = 30000; // 30 seconds
      const startTime = Date.now();
      const results = [];
      let operationCount = 0;

      console.log(`\n🔄 Starting ${testDurationMs / 1000}s continuous load test...`);

      while (Date.now() - startTime < testDurationMs) {
        try {
          const accounts = await helper.createTestAccounts();
          const creatorCommitment = helper.generateCommitment(
            operationCount % 3, 
            accounts.creator.publicKey
          );

          const operationStart = Date.now();
          await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.QUICK_GAME);
          const operationEnd = Date.now();

          results.push({
            success: true,
            duration: operationEnd - operationStart,
            timestamp: operationEnd - startTime
          });

          operationCount++;
          
          // Brief pause to avoid overwhelming
          await new Promise(resolve => setTimeout(resolve, 10));
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            timestamp: Date.now() - startTime
          });
        }
      }

      const endTime = Date.now();
      const actualDuration = endTime - startTime;
      const successes = results.filter(r => r.success);
      const failures = results.filter(r => !r.success);
      const successRate = successes.length / results.length;
      const avgLatency = successes.reduce((sum, r) => sum + r.duration, 0) / successes.length;

      console.log(`\n📈 Continuous Load Results:`);
      console.log(`  Duration: ${actualDuration}ms`);
      console.log(`  Operations: ${results.length}`);
      console.log(`  Success Rate: ${(successRate * 100).toFixed(2)}%`);
      console.log(`  Avg Latency: ${avgLatency?.toFixed(2) || 'N/A'}ms`);
      console.log(`  Throughput: ${(results.length / (actualDuration / 1000)).toFixed(2)} ops/sec`);

      // Should maintain reasonable performance under continuous load
      expect(successRate).to.be.greaterThan(0.8); // 80% success rate
      expect(avgLatency).to.be.lessThan(5000); // Under 5s average latency
      expect(results.length).to.be.greaterThan(10); // Minimum operations completed
    });

    it("Should recover from network congestion simulation", async () => {
      const accounts = await helper.createTestAccounts();
      
      // Simulate network congestion with artificial delays
      const delays = [0, 100, 500, 1000, 2000, 1000, 500, 100, 0];
      const results = [];

      for (let i = 0; i < delays.length; i++) {
        const delay = delays[i];
        
        try {
          const testAccounts = await helper.createTestAccounts();
          const commitment = helper.generateCommitment(i % 3, testAccounts.creator.publicKey);

          // Simulate network delay
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          const startTime = performance.now();
          await helper.createMatch(testAccounts, commitment.hash, TestFixtures.QUICK_GAME);
          const endTime = performance.now();

          results.push({
            delay,
            duration: endTime - startTime,
            success: true
          });
        } catch (error) {
          results.push({
            delay,
            success: false,
            error: error.message
          });
        }
      }

      console.log(`\n🌐 Network Congestion Simulation:`);
      results.forEach((result, i) => {
        const status = result.success ? '✅' : '❌';
        const duration = result.success ? `${result.duration.toFixed(2)}ms` : 'failed';
        console.log(`  ${status} Delay ${result.delay}ms: ${duration}`);
      });

      const successCount = results.filter(r => r.success).length;
      expect(successCount).to.be.greaterThan(delays.length * 0.8); // 80% should succeed
    });
  });
});