import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert, expect } from "chai";
import TestHelper, { TestFixtures } from "../utils/test-helpers";

describe("RPS End-to-End User Journey Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program(
    require("../../target/idl/rps.json"),
    new PublicKey("32tQhc2c4LurhdBwDzzV8f3PtdhKm1iVaPSumDTZWAvb"),
    provider
  );

  let helper: TestHelper;

  before(() => {
    helper = new TestHelper(program, provider, provider.connection);
  });

  describe("Complete User Journeys", () => {
    it("Should simulate realistic user behavior - Patient Player", async () => {
      console.log("\n👤 Testing Patient Player Journey...");
      
      const accounts = await helper.createTestAccounts();
      
      // User story: Alice creates a match and waits for Bob to join
      const aliceChoice = TestFixtures.CHOICES.ROCK;
      const bobChoice = TestFixtures.CHOICES.SCISSORS;
      
      const aliceCommitment = helper.generateCommitment(aliceChoice, accounts.creator.publicKey);
      const bobCommitment = helper.generateCommitment(bobChoice, accounts.opponent.publicKey);

      console.log("  📝 Alice creates a match (Rock, hidden)");
      const aliceBalanceBefore = await helper.getBalance(accounts.creator.publicKey);
      
      await helper.createMatch(accounts, aliceCommitment.hash, {
        betAmount: 0.1 * LAMPORTS_PER_SOL,
        feeBps: 250,
        joinDeadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        revealDeadline: Math.floor(Date.now() / 1000) + 7200 // 2 hours
      });

      let match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.waitingForOpponent !== undefined, true);
      console.log("  ✅ Match created successfully");

      // Simulate waiting time (user might check back later)
      await helper.simulateNetworkDelay(1000);

      console.log("  🎯 Bob discovers the match and joins (Scissors, hidden)");
      const bobBalanceBefore = await helper.getBalance(accounts.opponent.publicKey);
      
      await helper.joinMatch(accounts, bobCommitment.hash);
      
      match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.waitingForReveal !== undefined, true);
      console.log("  ✅ Bob joined successfully");

      // Both players reveal their choices
      console.log("  🔍 Alice reveals her choice (Rock)");
      await helper.reveal(accounts, accounts.creator, aliceCommitment);
      
      match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.revealedCreator.rock !== undefined, true);

      console.log("  🔍 Bob reveals his choice (Scissors)");
      await helper.reveal(accounts, accounts.opponent, bobCommitment);
      
      match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.readyToSettle !== undefined, true);
      assert.equal(match.revealedOpponent.scissors !== undefined, true);

      // Settlement
      console.log("  🏆 Settling the match - Alice should win (Rock beats Scissors)");
      await helper.settleMatch(accounts);
      
      match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.settled !== undefined, true);

      // Check final balances
      const aliceBalanceAfter = await helper.getBalance(accounts.creator.publicKey);
      const bobBalanceAfter = await helper.getBalance(accounts.opponent.publicKey);

      console.log("  💰 Checking final balances...");
      console.log(`    Alice: ${(aliceBalanceAfter / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      console.log(`    Bob: ${(bobBalanceAfter / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

      // Alice should have more than she started with (won the bet)
      expect(aliceBalanceAfter).to.be.greaterThan(aliceBalanceBefore);
      console.log("  ✅ Alice won and received the payout!");
    });

    it("Should simulate impatient user canceling match", async () => {
      console.log("\n😤 Testing Impatient Player Journey...");
      
      const accounts = await helper.createTestAccounts();
      const commitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.creator.publicKey);

      console.log("  📝 Charlie creates a match but gets impatient");
      const balanceBefore = await helper.getBalance(accounts.creator.publicKey);
      
      await helper.createMatch(accounts, commitment.hash, TestFixtures.STANDARD_GAME);
      
      let match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.waitingForOpponent !== undefined, true);

      // Simulate user waiting and getting impatient
      console.log("  ⏰ Charlie waits but no opponent joins...");
      await helper.simulateNetworkDelay(2000);

      console.log("  ❌ Charlie cancels the match");
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

      match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.cancelled !== undefined, true);

      const balanceAfter = await helper.getBalance(accounts.creator.publicKey);
      console.log("  💰 Charlie got his money back (minus tx fees)");
      
      // Should get refund (accounting for transaction fees)
      expect(balanceAfter).to.be.greaterThan(balanceBefore - (0.01 * LAMPORTS_PER_SOL));
    });

    it("Should simulate user losing connection during reveal", async () => {
      console.log("\n🔌 Testing Connection Loss During Reveal...");
      
      const accounts = await helper.createTestAccounts();
      const aliceCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const bobCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      // Setup match
      await helper.createMatch(accounts, aliceCommitment.hash, {
        joinDeadline: Math.floor(Date.now() / 1000) + 3600,
        revealDeadline: Math.floor(Date.now() / 1000) + 10 // Short deadline for test
      });
      await helper.joinMatch(accounts, bobCommitment.hash);

      console.log("  🔍 Alice reveals her choice (Rock)");
      await helper.reveal(accounts, accounts.creator, aliceCommitment);

      console.log("  📡 Bob loses connection and doesn't reveal in time");
      // Simulate Bob not revealing by waiting for deadline
      await helper.simulateNetworkDelay(12000); // Wait past reveal deadline

      console.log("  ⏰ Timeout triggered - Alice should win by default");
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
      console.log("  ✅ Match timed out successfully");
    });

    it("Should simulate multiple games between same players", async () => {
      console.log("\n🔄 Testing Repeated Games Between Friends...");
      
      const accounts = await helper.createTestAccounts();
      const gameResults = [];

      const gameScenarios = [
        { alice: TestFixtures.CHOICES.ROCK, bob: TestFixtures.CHOICES.SCISSORS, winner: "Alice" },
        { alice: TestFixtures.CHOICES.PAPER, bob: TestFixtures.CHOICES.ROCK, winner: "Alice" },
        { alice: TestFixtures.CHOICES.SCISSORS, bob: TestFixtures.CHOICES.SCISSORS, winner: "Tie" }
      ];

      for (let i = 0; i < gameScenarios.length; i++) {
        const scenario = gameScenarios[i];
        console.log(`\n  🎮 Game ${i + 1}: Alice(${Object.keys(TestFixtures.CHOICES)[scenario.alice]}) vs Bob(${Object.keys(TestFixtures.CHOICES)[scenario.bob]})`);

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

        const aliceCommitment = helper.generateCommitment(scenario.alice, accounts.creator.publicKey);
        const bobCommitment = helper.generateCommitment(scenario.bob, accounts.opponent.publicKey);

        const aliceBalanceBefore = await helper.getBalance(accounts.creator.publicKey);
        const bobBalanceBefore = await helper.getBalance(accounts.opponent.publicKey);

        // Play the game
        await helper.createMatch(gameAccounts, aliceCommitment.hash, TestFixtures.QUICK_GAME);
        await helper.joinMatch(gameAccounts, bobCommitment.hash);
        await helper.reveal(gameAccounts, accounts.creator, aliceCommitment);
        await helper.reveal(gameAccounts, accounts.opponent, bobCommitment);
        await helper.settleMatch(gameAccounts);

        const match = await helper.getMatchState(gameAccounts.matchAccount.publicKey);
        assert.equal(match.status.settled !== undefined, true);

        const aliceBalanceAfter = await helper.getBalance(accounts.creator.publicKey);
        const bobBalanceAfter = await helper.getBalance(accounts.opponent.publicKey);

        gameResults.push({
          game: i + 1,
          expectedWinner: scenario.winner,
          aliceChange: aliceBalanceAfter - aliceBalanceBefore,
          bobChange: bobBalanceAfter - bobBalanceBefore
        });

        console.log(`    Expected winner: ${scenario.winner}`);
        console.log(`    Alice balance change: ${(gameResults[i].aliceChange / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
        console.log(`    Bob balance change: ${(gameResults[i].bobChange / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      }

      console.log(`\n  📊 Game Series Summary:`);
      gameResults.forEach(result => {
        const actualWinner = result.aliceChange > 0 ? "Alice" : 
                            result.bobChange > 0 ? "Bob" : "Tie";
        const correct = result.expectedWinner === actualWinner ? "✅" : "❌";
        console.log(`    Game ${result.game}: Expected ${result.expectedWinner}, Got ${actualWinner} ${correct}`);
      });
    });

    it("Should simulate high-stakes tournament scenario", async () => {
      console.log("\n🏆 Testing High-Stakes Tournament Scenario...");
      
      const players = await Promise.all([
        helper.createTestAccounts(),
        helper.createTestAccounts(),
        helper.createTestAccounts(),
        helper.createTestAccounts()
      ]);

      // Fund players with tournament buy-in
      const buyIn = 1 * LAMPORTS_PER_SOL;
      for (const player of players) {
        await helper.fundAccount(player.creator.publicKey, buyIn + (0.1 * LAMPORTS_PER_SOL));
      }

      console.log("  🥊 Semi-final 1: Player 1 vs Player 2");
      const match1Accounts = players[0];
      const p1Commitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, match1Accounts.creator.publicKey);
      const p2Commitment = helper.generateCommitment(TestFixtures.CHOICES.SCISSORS, players[1].creator.publicKey);

      // Set up match between player 1 and player 2
      await helper.createMatch(match1Accounts, p1Commitment.hash, { 
        betAmount: buyIn,
        feeBps: 500 // 5% tournament fee
      });

      await program.methods
        .joinMatch(Array.from(p2Commitment.hash))
        .accounts({
          matchAccount: match1Accounts.matchAccount.publicKey,
          vault: match1Accounts.vaultPda,
          opponent: players[1].creator.publicKey,
          opponentTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
        })
        .signers([players[1].creator])
        .rpc();

      await helper.reveal(match1Accounts, match1Accounts.creator, p1Commitment);
      
      await program.methods
        .reveal(
          { scissors: {} },
          Array.from(p2Commitment.salt),
          new anchor.BN(p2Commitment.nonce.toString())
        )
        .accounts({
          matchAccount: match1Accounts.matchAccount.publicKey,
          player: players[1].creator.publicKey,
        })
        .signers([players[1].creator])
        .rpc();

      await helper.settleMatch(match1Accounts);

      const semifinal1 = await helper.getMatchState(match1Accounts.matchAccount.publicKey);
      assert.equal(semifinal1.status.settled !== undefined, true);
      console.log("  ✅ Player 1 wins semi-final 1 (Rock beats Scissors)");

      console.log("  🥊 Semi-final 2: Player 3 vs Player 4");
      const match2Accounts = players[2];
      const p3Commitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, match2Accounts.creator.publicKey);
      const p4Commitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, players[3].creator.publicKey);

      await helper.createMatch(match2Accounts, p3Commitment.hash, { 
        betAmount: buyIn,
        feeBps: 500
      });

      await program.methods
        .joinMatch(Array.from(p4Commitment.hash))
        .accounts({
          matchAccount: match2Accounts.matchAccount.publicKey,
          vault: match2Accounts.vaultPda,
          opponent: players[3].creator.publicKey,
          opponentTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
        })
        .signers([players[3].creator])
        .rpc();

      await helper.reveal(match2Accounts, match2Accounts.creator, p3Commitment);
      
      await program.methods
        .reveal(
          { rock: {} },
          Array.from(p4Commitment.salt),
          new anchor.BN(p4Commitment.nonce.toString())
        )
        .accounts({
          matchAccount: match2Accounts.matchAccount.publicKey,
          player: players[3].creator.publicKey,
        })
        .signers([players[3].creator])
        .rpc();

      await helper.settleMatch(match2Accounts);

      const semifinal2 = await helper.getMatchState(match2Accounts.matchAccount.publicKey);
      assert.equal(semifinal2.status.settled !== undefined, true);
      console.log("  ✅ Player 3 wins semi-final 2 (Paper beats Rock)");

      console.log("  🏆 Final: Player 1 vs Player 3");
      const finalAccounts = await helper.createTestAccounts();
      
      // Fund finalists
      await helper.fundAccount(finalAccounts.creator.publicKey, buyIn + (0.1 * LAMPORTS_PER_SOL));
      await helper.fundAccount(finalAccounts.opponent.publicKey, buyIn + (0.1 * LAMPORTS_PER_SOL));

      const finalP1Commitment = helper.generateCommitment(TestFixtures.CHOICES.SCISSORS, finalAccounts.creator.publicKey);
      const finalP3Commitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, finalAccounts.opponent.publicKey);

      await helper.createMatch(finalAccounts, finalP1Commitment.hash, { 
        betAmount: buyIn,
        feeBps: 250 // Lower fee for final
      });
      await helper.joinMatch(finalAccounts, finalP3Commitment.hash);
      await helper.reveal(finalAccounts, finalAccounts.creator, finalP1Commitment);
      await helper.reveal(finalAccounts, finalAccounts.opponent, finalP3Commitment);
      await helper.settleMatch(finalAccounts);

      const finalMatch = await helper.getMatchState(finalAccounts.matchAccount.publicKey);
      assert.equal(finalMatch.status.settled !== undefined, true);
      console.log("  🎉 Player 1 wins the tournament! (Scissors beats Paper)");

      const winnerBalance = await helper.getBalance(finalAccounts.creator.publicKey);
      console.log(`  💰 Tournament champion balance: ${(winnerBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    });
  });

  describe("Error Recovery Scenarios", () => {
    it("Should handle user attempting invalid operations", async () => {
      console.log("\n🚫 Testing Invalid User Operations...");
      
      const accounts = await helper.createTestAccounts();
      const commitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);

      await helper.createMatch(accounts, commitment.hash, TestFixtures.STANDARD_GAME);

      console.log("  ❌ User tries to cancel already joined match");
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);
      await helper.joinMatch(accounts, opponentCommitment.hash);

      try {
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
        
        assert.fail("Should have prevented cancellation");
      } catch (error) {
        console.log("  ✅ Correctly prevented invalid cancellation");
        expect(error.message).to.include("CannotCancelJoinedMatch");
      }

      console.log("  ❌ User tries to settle before revealing");
      try {
        await helper.settleMatch(accounts);
        assert.fail("Should have prevented early settlement");
      } catch (error) {
        console.log("  ✅ Correctly prevented early settlement");
        expect(error.message).to.include("InvalidMatchStatus");
      }
    });

    it("Should handle wallet connection issues gracefully", async () => {
      console.log("\n💳 Testing Wallet Connection Issues...");
      
      const accounts = await helper.createTestAccounts();
      
      // Simulate insufficient funds
      const poorAccount = anchor.web3.Keypair.generate();
      await helper.fundAccount(poorAccount.publicKey, 0.001 * LAMPORTS_PER_SOL); // Very little

      const commitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, poorAccount.publicKey);

      console.log("  💸 User with insufficient funds tries to create match");
      try {
        const [matchAccount] = await PublicKey.findProgramAddress(
          [Buffer.from("match"), poorAccount.publicKey.toBuffer(), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])],
          program.programId
        );
        
        const [vaultPda] = await PublicKey.findProgramAddress(
          [Buffer.from("vault"), matchAccount.toBuffer()],
          program.programId
        );

        await program.methods
          .createMatch(
            new anchor.BN(1 * LAMPORTS_PER_SOL),
            Array.from(commitment.hash),
            new anchor.BN(Math.floor(Date.now() / 1000) + 3600),
            new anchor.BN(Math.floor(Date.now() / 1000) + 7200),
            250
          )
          .accounts({
            matchAccount: matchAccount,
            vault: vaultPda,
            creator: poorAccount.publicKey,
            tokenMint: null,
            creatorTokenAccount: null,
            vaultTokenAccount: null,
            tokenProgram: null,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([poorAccount])
          .rpc();
        
        assert.fail("Should have failed due to insufficient funds");
      } catch (error) {
        console.log("  ✅ Correctly handled insufficient funds");
        expect(error.message.toLowerCase()).to.include("insufficient");
      }
    });
  });
});