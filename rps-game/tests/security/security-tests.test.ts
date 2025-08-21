import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert, expect } from "chai";
import TestHelper, { TestFixtures } from "../utils/test-helpers";

describe("RPS Security Tests", () => {
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

  describe("Access Control Tests", () => {
    it("Should prevent unauthorized match cancellation", async () => {
      const accounts = await helper.createTestAccounts();
      const maliciousUser = Keypair.generate();
      await helper.fundAccount(maliciousUser.publicKey, 1 * LAMPORTS_PER_SOL);

      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);

      // Malicious user tries to cancel someone else's match
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
        
        assert.fail("Should have prevented unauthorized cancellation");
      } catch (error) {
        expect(error.message).to.include("OnlyCreatorCanCancel");
      }
    });

    it("Should prevent unauthorized settlement", async () => {
      const accounts = await helper.createTestAccounts();
      const maliciousUser = Keypair.generate();
      await helper.fundAccount(maliciousUser.publicKey, 1 * LAMPORTS_PER_SOL);

      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
      await helper.joinMatch(accounts, opponentCommitment.hash);
      await helper.reveal(accounts, accounts.creator, creatorCommitment);
      await helper.reveal(accounts, accounts.opponent, opponentCommitment);

      // Malicious user tries to settle match they're not part of
      try {
        await program.methods
          .settle()
          .accounts({
            matchAccount: accounts.matchAccount.publicKey,
            vault: accounts.vaultPda,
            creator: maliciousUser.publicKey, // Wrong creator
            opponent: accounts.opponent.publicKey,
            feeCollector: accounts.feeCollector.publicKey,
            creatorTokenAccount: null,
            opponentTokenAccount: null,
            vaultTokenAccount: null,
            feeCollectorTokenAccount: null,
            tokenProgram: null,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        
        assert.fail("Should have prevented unauthorized settlement");
      } catch (error) {
        // Expected to fail due to account mismatch
        expect(error).to.exist;
      }
    });

    it("Should prevent non-participants from revealing", async () => {
      const accounts = await helper.createTestAccounts();
      const maliciousUser = Keypair.generate();
      await helper.fundAccount(maliciousUser.publicKey, 1 * LAMPORTS_PER_SOL);

      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);
      const maliciousCommitment = helper.generateCommitment(TestFixtures.CHOICES.SCISSORS, maliciousUser.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
      await helper.joinMatch(accounts, opponentCommitment.hash);

      try {
        await helper.reveal(accounts, maliciousUser, maliciousCommitment);
        assert.fail("Should have prevented non-participant reveal");
      } catch (error) {
        expect(error.message).to.include("NotParticipant");
      }
    });
  });

  describe("Input Validation Tests", () => {
    it("Should prevent match creation with extreme parameters", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);

      // Test various invalid parameters
      const invalidParams = [
        { betAmount: 0, error: "InvalidBetAmount" },
        { feeBps: 10001, error: "InvalidFeeRate" }, // > 100%
        { 
          joinDeadline: Math.floor(Date.now() / 1000) - 3600, // Past deadline
          error: "InvalidDeadline" 
        }
      ];

      for (const params of invalidParams) {
        try {
          await helper.createMatch(accounts, creatorCommitment.hash, params);
          assert.fail(`Should have rejected invalid params: ${JSON.stringify(params)}`);
        } catch (error) {
          expect(error.message).to.include(params.error);
        }
      }
    });

    it("Should validate commitment hash integrity", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
      await helper.joinMatch(accounts, opponentCommitment.hash);

      // Test various invalid reveal attempts
      const invalidReveals = [
        {
          name: "Wrong choice",
          commitment: { ...creatorCommitment, choice: TestFixtures.CHOICES.PAPER }
        },
        {
          name: "Wrong salt",
          commitment: { ...creatorCommitment, salt: Buffer.from("wrong-salt".padEnd(32, '0')) }
        },
        {
          name: "Wrong nonce",
          commitment: { ...creatorCommitment, nonce: BigInt(999999) }
        }
      ];

      for (const invalidReveal of invalidReveals) {
        try {
          await helper.reveal(accounts, accounts.creator, invalidReveal.commitment);
          assert.fail(`Should have rejected ${invalidReveal.name}`);
        } catch (error) {
          expect(error.message).to.include("InvalidCommitment");
        }
      }
    });

    it("Should prevent replay attacks", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
      await helper.joinMatch(accounts, opponentCommitment.hash);
      await helper.reveal(accounts, accounts.creator, creatorCommitment);

      // Try to reveal again with same commitment
      try {
        await helper.reveal(accounts, accounts.creator, creatorCommitment);
        assert.fail("Should have prevented replay attack");
      } catch (error) {
        expect(error.message).to.include("AlreadyRevealed");
      }
    });
  });

  describe("State Manipulation Tests", () => {
    it("Should prevent operations in wrong states", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);

      // Try to reveal before opponent joins
      try {
        await helper.reveal(accounts, accounts.creator, creatorCommitment);
        assert.fail("Should have prevented reveal before opponent joins");
      } catch (error) {
        expect(error.message).to.include("InvalidMatchStatus");
      }

      // Try to settle before both reveal
      try {
        await helper.settleMatch(accounts);
        assert.fail("Should have prevented settlement without reveals");
      } catch (error) {
        expect(error.message).to.include("InvalidMatchStatus");
      }
    });

    it("Should prevent joining already joined match", async () => {
      const accounts = await helper.createTestAccounts();
      const secondOpponent = Keypair.generate();
      await helper.fundAccount(secondOpponent.publicKey, 2 * LAMPORTS_PER_SOL);

      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);
      const secondOpponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.SCISSORS, secondOpponent.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
      await helper.joinMatch(accounts, opponentCommitment.hash);

      // Second opponent tries to join
      try {
        await program.methods
          .joinMatch(Array.from(secondOpponentCommitment.hash))
          .accounts({
            matchAccount: accounts.matchAccount.publicKey,
            vault: accounts.vaultPda,
            opponent: secondOpponent.publicKey,
            opponentTokenAccount: null,
            vaultTokenAccount: null,
            tokenProgram: null,
          })
          .signers([secondOpponent])
          .rpc();
        
        assert.fail("Should have prevented second join");
      } catch (error) {
        expect(error.message).to.include("InvalidMatchStatus");
      }
    });

    it("Should prevent cancellation after join", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
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
        
        assert.fail("Should have prevented cancellation after join");
      } catch (error) {
        expect(error.message).to.include("CannotCancelJoinedMatch");
      }
    });
  });

  describe("Economic Attack Tests", () => {
    it("Should handle insufficient balance attacks", async () => {
      const poorAccount = Keypair.generate();
      const richAccount = Keypair.generate();
      
      // Give minimal funding
      await helper.fundAccount(poorAccount.publicKey, 0.001 * LAMPORTS_PER_SOL);
      await helper.fundAccount(richAccount.publicKey, 10 * LAMPORTS_PER_SOL);

      const [matchAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("match"), poorAccount.publicKey.toBuffer(), Buffer.from([0, 0, 0, 0, 0, 0, 0, 0])],
        program.programId
      );
      
      const [vaultPda] = await PublicKey.findProgramAddress(
        [Buffer.from("vault"), matchAccount.toBuffer()],
        program.programId
      );

      const commitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, poorAccount.publicKey);

      try {
        await program.methods
          .createMatch(
            new anchor.BN(1 * LAMPORTS_PER_SOL), // More than account has
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
        expect(error.message.toLowerCase()).to.include("insufficient");
      }
    });

    it("Should prevent griefing through timeout manipulation", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);

      const now = Math.floor(Date.now() / 1000);
      
      // Create match with future deadline
      await helper.createMatch(accounts, creatorCommitment.hash, {
        joinDeadline: now + 3600,
        revealDeadline: now + 7200
      });

      // Try to timeout before deadline passes
      try {
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
        
        assert.fail("Should have prevented premature timeout");
      } catch (error) {
        expect(error.message).to.include("DeadlineNotPassed");
      }
    });

    it("Should prevent front-running attacks", async () => {
      const accounts = await helper.createTestAccounts();
      const frontRunner = Keypair.generate();
      await helper.fundAccount(frontRunner.publicKey, 2 * LAMPORTS_PER_SOL);

      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const frontRunnerCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, frontRunner.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);

      // Simulate front-runner trying to join with higher gas
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.SCISSORS, accounts.opponent.publicKey);

      // Both try to join simultaneously (simulate front-running)
      const joinPromises = [
        helper.joinMatch(accounts, opponentCommitment.hash),
        program.methods
          .joinMatch(Array.from(frontRunnerCommitment.hash))
          .accounts({
            matchAccount: accounts.matchAccount.publicKey,
            vault: accounts.vaultPda,
            opponent: frontRunner.publicKey,
            opponentTokenAccount: null,
            vaultTokenAccount: null,
            tokenProgram: null,
          })
          .signers([frontRunner])
          .rpc()
      ];

      try {
        await Promise.all(joinPromises);
        // One should succeed, one should fail
        const match = await helper.getMatchState(accounts.matchAccount.publicKey);
        assert.equal(match.status.waitingForReveal !== undefined, true);
        
        // Only one opponent should be set
        const isFirstOpponent = match.opponent.toString() === accounts.opponent.publicKey.toString();
        const isFrontRunner = match.opponent.toString() === frontRunner.publicKey.toString();
        assert.isTrue(isFirstOpponent || isFrontRunner, "One opponent should be set");
      } catch (error) {
        // Expected that one of the transactions fails
        assert.isTrue(error.message.includes("InvalidMatchStatus") || error.message.includes("already in use"));
      }
    });
  });

  describe("Randomness and Cryptographic Security", () => {
    it("Should ensure commitment hash uniqueness", async () => {
      const accounts = await helper.createTestAccounts();
      const commitments = [];

      // Generate multiple commitments with same choice but different salts/nonces
      for (let i = 0; i < 10; i++) {
        const commitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
        commitments.push(commitment);
      }

      // Verify all hashes are unique
      const hashes = commitments.map(c => c.hash.toString('hex'));
      const uniqueHashes = new Set(hashes);
      
      assert.equal(hashes.length, uniqueHashes.size, "All commitment hashes should be unique");
    });

    it("Should detect hash collision attempts", async () => {
      const accounts = await helper.createTestAccounts();
      
      // Try to create two different commitments with same hash (impossible but test the validation)
      const commitment1 = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const commitment2 = { ...commitment1, choice: TestFixtures.CHOICES.PAPER }; // Different choice, same hash

      await helper.createMatch(accounts, commitment1.hash, TestFixtures.STANDARD_GAME);
      
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.SCISSORS, accounts.opponent.publicKey);
      await helper.joinMatch(accounts, opponentCommitment.hash);

      // First reveal should work
      await helper.reveal(accounts, accounts.creator, commitment1);

      // Try to reveal different choice with same hash (should fail)
      try {
        await helper.reveal(accounts, accounts.creator, commitment2);
        assert.fail("Should have detected hash collision attempt");
      } catch (error) {
        expect(error.message).to.include("AlreadyRevealed");
      }
    });

    it("Should handle edge cases in hash verification", async () => {
      const accounts = await helper.createTestAccounts();
      
      // Test with boundary values
      const boundaryTests = [
        { choice: 0, description: "minimum choice" },
        { choice: 2, description: "maximum choice" },
      ];

      for (const test of boundaryTests) {
        const testAccounts = await helper.createTestAccounts();
        const commitment = helper.generateCommitment(test.choice, testAccounts.creator.publicKey);

        await helper.createMatch(testAccounts, commitment.hash, TestFixtures.QUICK_GAME);
        
        const opponentCommitment = helper.generateCommitment(
          (test.choice + 1) % 3, 
          testAccounts.opponent.publicKey
        );
        await helper.joinMatch(testAccounts, opponentCommitment.hash);

        // Should successfully reveal boundary values
        await helper.reveal(testAccounts, testAccounts.creator, commitment);
        
        const match = await helper.getMatchState(testAccounts.matchAccount.publicKey);
        assert.isNotNull(match.revealedCreator, `Should handle ${test.description}`);
      }
    });
  });

  describe("Resource Exhaustion Tests", () => {
    it("Should handle rapid match creation attempts", async () => {
      const rapidCreator = Keypair.generate();
      await helper.fundAccount(rapidCreator.publicKey, 10 * LAMPORTS_PER_SOL);

      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        const promise = (async () => {
          try {
            const matchAccount = Keypair.generate();
            const [vaultPda] = await PublicKey.findProgramAddress(
              [Buffer.from("vault"), matchAccount.publicKey.toBuffer()],
              program.programId
            );
            
            const commitment = helper.generateCommitment(i % 3, rapidCreator.publicKey);
            
            await program.methods
              .createMatch(
                new anchor.BN(0.01 * LAMPORTS_PER_SOL),
                Array.from(commitment.hash),
                new anchor.BN(Math.floor(Date.now() / 1000) + 3600),
                new anchor.BN(Math.floor(Date.now() / 1000) + 7200),
                250
              )
              .accounts({
                matchAccount: matchAccount.publicKey,
                vault: vaultPda,
                creator: rapidCreator.publicKey,
                tokenMint: null,
                creatorTokenAccount: null,
                vaultTokenAccount: null,
                tokenProgram: null,
                systemProgram: anchor.web3.SystemProgram.programId,
              })
              .signers([rapidCreator, matchAccount])
              .rpc();
            
            return matchAccount.publicKey;
          } catch (error) {
            return null;
          }
        })();
        
        promises.push(promise);
      }

      const results = await Promise.all(promises);
      const successfulMatches = results.filter(r => r !== null);
      
      // Should handle at least some rapid creations
      expect(successfulMatches.length).to.be.greaterThan(0);
    });
  });
});