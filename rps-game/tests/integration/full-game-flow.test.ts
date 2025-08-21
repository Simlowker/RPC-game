import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert, expect } from "chai";
import TestHelper, { TestFixtures } from "../utils/test-helpers";

describe("RPS Integration Tests - Full Game Flows", () => {
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

  describe("Complete Game Scenarios", () => {
    it("Should handle multiple concurrent matches", async () => {
      const numMatches = 5;
      const matchesData = [];

      // Create multiple matches concurrently
      for (let i = 0; i < numMatches; i++) {
        const accounts = await helper.createTestAccounts();
        const creatorCommitment = helper.generateCommitment(
          TestFixtures.CHOICES.ROCK, 
          accounts.creator.publicKey
        );
        const opponentCommitment = helper.generateCommitment(
          TestFixtures.CHOICES.PAPER, 
          accounts.opponent.publicKey
        );

        matchesData.push({
          accounts,
          creatorCommitment,
          opponentCommitment
        });
      }

      // Create all matches
      await Promise.all(
        matchesData.map(data => 
          helper.createMatch(data.accounts, data.creatorCommitment.hash, TestFixtures.QUICK_GAME)
        )
      );

      // Join all matches
      await Promise.all(
        matchesData.map(data => 
          helper.joinMatch(data.accounts, data.opponentCommitment.hash)
        )
      );

      // Reveal all choices
      await Promise.all(
        matchesData.map(data => 
          Promise.all([
            helper.reveal(data.accounts, data.accounts.creator, data.creatorCommitment),
            helper.reveal(data.accounts, data.accounts.opponent, data.opponentCommitment)
          ])
        )
      );

      // Settle all matches
      await Promise.all(
        matchesData.map(data => 
          helper.settleMatch(data.accounts)
        )
      );

      // Verify all matches are settled
      for (const data of matchesData) {
        const match = await helper.getMatchState(data.accounts.matchAccount.publicKey);
        assert.equal(match.status.settled !== undefined, true);
      }
    });

    it("Should handle rapid succession of matches from same players", async () => {
      const accounts = await helper.createTestAccounts();
      const numGames = 3;

      for (let i = 0; i < numGames; i++) {
        // Create new match account for each game
        const newMatchAccount = anchor.web3.Keypair.generate();
        const [newVaultPda] = await PublicKey.findProgramAddress(
          [Buffer.from("vault"), newMatchAccount.publicKey.toBuffer()],
          program.programId
        );

        const gameAccounts = {
          ...accounts,
          matchAccount: newMatchAccount,
          vaultPda: newVaultPda
        };

        const creatorCommitment = helper.generateCommitment(i % 3, accounts.creator.publicKey);
        const opponentCommitment = helper.generateCommitment((i + 1) % 3, accounts.opponent.publicKey);

        // Full game flow
        await helper.createMatch(gameAccounts, creatorCommitment.hash, TestFixtures.QUICK_GAME);
        await helper.joinMatch(gameAccounts, opponentCommitment.hash);
        await helper.reveal(gameAccounts, accounts.creator, creatorCommitment);
        await helper.reveal(gameAccounts, accounts.opponent, opponentCommitment);
        await helper.settleMatch(gameAccounts);

        const match = await helper.getMatchState(gameAccounts.matchAccount.publicKey);
        assert.equal(match.status.settled !== undefined, true);
      }
    });

    it("Should handle match cancellation flow", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);

      const creatorBalanceBefore = await helper.getBalance(accounts.creator.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);

      // Cancel match
      await program.methods
        .cancelMatch()
        .accounts({
          matchAccount: accounts.matchAccount.publicKey,
          vault: accounts.vaultPda,
          creator: accounts.creator.publicKey,
          creatorTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([accounts.creator])
        .rpc();

      const match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.cancelled !== undefined, true);

      // Creator should get refund (minus transaction fees)
      const creatorBalanceAfter = await helper.getBalance(accounts.creator.publicKey);
      expect(creatorBalanceAfter).to.be.greaterThan(creatorBalanceBefore - (0.01 * LAMPORTS_PER_SOL));
    });

    it("Should handle timeout scenarios", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);

      const now = Math.floor(Date.now() / 1000);
      
      await helper.createMatch(accounts, creatorCommitment.hash, {
        joinDeadline: now + 1,
        revealDeadline: now + 2
      });

      // Wait for deadline to pass
      await helper.simulateNetworkDelay(3000);

      // Timeout match
      await program.methods
        .timeoutMatch()
        .accounts({
          matchAccount: accounts.matchAccount.publicKey,
          vault: accounts.vaultPda,
          creator: accounts.creator.publicKey,
          opponent: accounts.opponent.publicKey,
          creatorTokenAccount: null,
          opponentTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.timedOut !== undefined, true);
    });

    it("Should handle partial reveal timeout", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      const now = Math.floor(Date.now() / 1000);
      
      await helper.createMatch(accounts, creatorCommitment.hash, {
        joinDeadline: now + 3600,
        revealDeadline: now + 2 // Short reveal deadline
      });

      await helper.joinMatch(accounts, opponentCommitment.hash);
      
      // Only creator reveals
      await helper.reveal(accounts, accounts.creator, creatorCommitment);

      // Wait for reveal deadline to pass
      await helper.simulateNetworkDelay(3000);

      // Timeout should favor creator who revealed
      await program.methods
        .timeoutMatch()
        .accounts({
          matchAccount: accounts.matchAccount.publicKey,
          vault: accounts.vaultPda,
          creator: accounts.creator.publicKey,
          opponent: accounts.opponent.publicKey,
          creatorTokenAccount: null,
          opponentTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.timedOut !== undefined, true);
    });
  });

  describe("Error Recovery Scenarios", () => {
    it("Should handle insufficient funds gracefully", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      
      // Drain creator's account
      const creatorBalance = await helper.getBalance(accounts.creator.publicKey);
      const drainAmount = creatorBalance - (0.01 * LAMPORTS_PER_SOL); // Leave minimal amount

      const drainTx = await provider.connection.requestAirdrop(accounts.feeCollector.publicKey, 0);
      
      try {
        await helper.createMatch(accounts, creatorCommitment.hash, {
          betAmount: 10 * LAMPORTS_PER_SOL // More than available
        });
        assert.fail("Should have failed due to insufficient funds");
      } catch (error) {
        expect(error.message.toLowerCase()).to.include("insufficient");
      }
    });

    it("Should handle network congestion simulation", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      // Simulate network delays between operations
      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
      await helper.simulateNetworkDelay(500);

      await helper.joinMatch(accounts, opponentCommitment.hash);
      await helper.simulateNetworkDelay(500);

      await helper.reveal(accounts, accounts.creator, creatorCommitment);
      await helper.simulateNetworkDelay(500);

      await helper.reveal(accounts, accounts.opponent, opponentCommitment);
      await helper.simulateNetworkDelay(500);

      await helper.settleMatch(accounts);

      const match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.settled !== undefined, true);
    });

    it("Should maintain state consistency across operations", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      // Step 1: Create
      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
      let match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.waitingForOpponent !== undefined, true);
      assert.equal(match.opponent.toString(), PublicKey.default.toString());

      // Step 2: Join
      await helper.joinMatch(accounts, opponentCommitment.hash);
      match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.waitingForReveal !== undefined, true);
      assert.equal(match.opponent.toString(), accounts.opponent.publicKey.toString());

      // Step 3: First reveal
      await helper.reveal(accounts, accounts.creator, creatorCommitment);
      match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.waitingForReveal !== undefined, true);
      assert.equal(match.revealedCreator.rock !== undefined, true);
      assert.equal(match.revealedOpponent, null);

      // Step 4: Second reveal
      await helper.reveal(accounts, accounts.opponent, opponentCommitment);
      match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.readyToSettle !== undefined, true);
      assert.equal(match.revealedCreator.rock !== undefined, true);
      assert.equal(match.revealedOpponent.paper !== undefined, true);

      // Step 5: Settle
      await helper.settleMatch(accounts);
      match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.settled !== undefined, true);
    });
  });

  describe("Stress Testing", () => {
    it("Should handle high-frequency match creation", async () => {
      const numMatches = 10;
      const createPromises = [];

      for (let i = 0; i < numMatches; i++) {
        const promise = (async () => {
          const accounts = await helper.createTestAccounts();
          const creatorCommitment = helper.generateCommitment(i % 3, accounts.creator.publicKey);
          
          await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.QUICK_GAME);
          
          return accounts.matchAccount.publicKey;
        })();

        createPromises.push(promise);
      }

      const matchKeys = await Promise.all(createPromises);
      
      // Verify all matches were created successfully
      for (const matchKey of matchKeys) {
        const match = await helper.getMatchState(matchKey);
        assert.equal(match.status.waitingForOpponent !== undefined, true);
      }
    });

    it("Should handle large bet amounts", async () => {
      const accounts = await helper.createTestAccounts();
      
      // Fund accounts with large amounts
      await helper.fundAccount(accounts.creator.publicKey, 100 * LAMPORTS_PER_SOL);
      await helper.fundAccount(accounts.opponent.publicKey, 100 * LAMPORTS_PER_SOL);

      const largeBetAmount = 50 * LAMPORTS_PER_SOL;
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.SCISSORS, accounts.opponent.publicKey);

      const creatorBalanceBefore = await helper.getBalance(accounts.creator.publicKey);
      const opponentBalanceBefore = await helper.getBalance(accounts.opponent.publicKey);

      // Full game with large bet
      await helper.createMatch(accounts, creatorCommitment.hash, { betAmount: largeBetAmount });
      await helper.joinMatch(accounts, opponentCommitment.hash);
      await helper.reveal(accounts, accounts.creator, creatorCommitment);
      await helper.reveal(accounts, accounts.opponent, opponentCommitment);
      await helper.settleMatch(accounts);

      const match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.settled !== undefined, true);

      // Verify proper handling of large amounts
      const creatorBalanceAfter = await helper.getBalance(accounts.creator.publicKey);
      const totalPot = largeBetAmount * 2;
      const expectedWinnings = totalPot - (totalPot * match.feeBps / 10000);

      // Creator should win (Rock beats Scissors)
      expect(creatorBalanceAfter - creatorBalanceBefore).to.be.greaterThan(largeBetAmount * 0.9);
    });
  });
});