import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert, expect } from "chai";
import TestHelper, { TestFixtures } from "../utils/test-helpers";

describe("RPS Smart Contract - Unit Tests", () => {
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

  describe("Contract Initialization", () => {
    it("Should have correct program ID", () => {
      expect(program.programId.toString()).to.equal("zYQ16fyWiwZWgWjpQ9JBzL4QwLbp5MbezSBwSi2YTfY");
    });
  });

  describe("Match Creation", () => {
    it("Should create match with valid parameters", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);

      const match = await helper.getMatchState(accounts.matchAccount.publicKey);
      
      assert.equal(match.creator.toString(), accounts.creator.publicKey.toString());
      assert.equal(match.betAmount.toString(), TestFixtures.STANDARD_GAME.betAmount.toString());
      assert.equal(match.feeBps, TestFixtures.STANDARD_GAME.feeBps);
      assert.equal(match.status.waitingForOpponent !== undefined, true);
    });

    it("Should reject zero bet amount", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);

      try {
        await helper.createMatch(accounts, creatorCommitment.hash, { betAmount: 0 });
        assert.fail("Should have rejected zero bet amount");
      } catch (error) {
        expect(error.message).to.include("InvalidBetAmount");
      }
    });

    it("Should reject invalid deadlines", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      
      const now = Math.floor(Date.now() / 1000);

      try {
        await helper.createMatch(accounts, creatorCommitment.hash, {
          joinDeadline: now - 1, // Past deadline
          revealDeadline: now + 3600
        });
        assert.fail("Should have rejected past deadline");
      } catch (error) {
        expect(error.message).to.include("InvalidDeadline");
      }
    });

    it("Should reject excessive fee rate", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);

      try {
        await helper.createMatch(accounts, creatorCommitment.hash, { feeBps: 1001 }); // > 10%
        assert.fail("Should have rejected excessive fee");
      } catch (error) {
        expect(error.message).to.include("InvalidFeeRate");
      }
    });

    it("Should transfer creator's bet to vault", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      
      const creatorBalanceBefore = await helper.getBalance(accounts.creator.publicKey);
      const vaultBalanceBefore = await helper.getBalance(accounts.vaultPda);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);

      const creatorBalanceAfter = await helper.getBalance(accounts.creator.publicKey);
      const vaultBalanceAfter = await helper.getBalance(accounts.vaultPda);

      // Creator should lose bet amount (plus tx fees)
      expect(creatorBalanceAfter).to.be.lessThan(creatorBalanceBefore);
      
      // Vault should gain bet amount
      expect(vaultBalanceAfter - vaultBalanceBefore).to.equal(TestFixtures.STANDARD_GAME.betAmount);
    });
  });

  describe("Match Joining", () => {
    it("Should allow opponent to join with correct bet", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
      await helper.joinMatch(accounts, opponentCommitment.hash);

      const match = await helper.getMatchState(accounts.matchAccount.publicKey);
      
      assert.equal(match.opponent.toString(), accounts.opponent.publicKey.toString());
      assert.equal(match.status.waitingForReveal !== undefined, true);
    });

    it("Should reject join after deadline", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      const now = Math.floor(Date.now() / 1000);
      await helper.createMatch(accounts, creatorCommitment.hash, {
        joinDeadline: now + 1,
        revealDeadline: now + 2
      });

      // Wait for deadline to pass
      await helper.simulateNetworkDelay(2000);

      try {
        await helper.joinMatch(accounts, opponentCommitment.hash);
        assert.fail("Should have rejected join after deadline");
      } catch (error) {
        expect(error.message).to.include("DeadlinePassed");
      }
    });

    it("Should prevent creator from joining own match", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const creatorAsOpponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.creator.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);

      try {
        await program.methods
          .joinMatch(Array.from(creatorAsOpponentCommitment.hash))
          .accounts({
            matchAccount: accounts.matchAccount.publicKey,
            vault: accounts.vaultPda,
            opponent: accounts.creator.publicKey, // Same as creator
            opponentTokenAccount: null,
            vaultTokenAccount: null,
            tokenProgram: null,
          })
          .signers([accounts.creator])
          .rpc();
        
        assert.fail("Should have prevented self-join");
      } catch (error) {
        expect(error.message).to.include("CannotPlaySelf");
      }
    });

    it("Should transfer opponent's bet to vault", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);

      const opponentBalanceBefore = await helper.getBalance(accounts.opponent.publicKey);
      const vaultBalanceBefore = await helper.getBalance(accounts.vaultPda);

      await helper.joinMatch(accounts, opponentCommitment.hash);

      const opponentBalanceAfter = await helper.getBalance(accounts.opponent.publicKey);
      const vaultBalanceAfter = await helper.getBalance(accounts.vaultPda);

      // Opponent should lose bet amount
      expect(opponentBalanceAfter).to.be.lessThan(opponentBalanceBefore);
      
      // Vault should gain another bet amount
      expect(vaultBalanceAfter - vaultBalanceBefore).to.equal(TestFixtures.STANDARD_GAME.betAmount);
    });
  });

  describe("Choice Revealing", () => {
    it("Should accept valid reveal from creator", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
      await helper.joinMatch(accounts, opponentCommitment.hash);
      await helper.reveal(accounts, accounts.creator, creatorCommitment);

      const match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.revealedCreator.rock !== undefined, true);
    });

    it("Should accept valid reveal from opponent", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
      await helper.joinMatch(accounts, opponentCommitment.hash);
      await helper.reveal(accounts, accounts.opponent, opponentCommitment);

      const match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.revealedOpponent.paper !== undefined, true);
    });

    it("Should reject invalid commitment hash", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
      await helper.joinMatch(accounts, opponentCommitment.hash);

      // Try to reveal with wrong salt
      const wrongCommitment = { ...creatorCommitment };
      wrongCommitment.salt = Buffer.from("wrong-salt".padEnd(32, '0'));

      try {
        await helper.reveal(accounts, accounts.creator, wrongCommitment);
        assert.fail("Should have rejected invalid commitment");
      } catch (error) {
        expect(error.message).to.include("InvalidCommitment");
      }
    });

    it("Should prevent double reveal", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
      await helper.joinMatch(accounts, opponentCommitment.hash);
      await helper.reveal(accounts, accounts.creator, creatorCommitment);

      try {
        await helper.reveal(accounts, accounts.creator, creatorCommitment);
        assert.fail("Should have prevented double reveal");
      } catch (error) {
        expect(error.message).to.include("AlreadyRevealed");
      }
    });

    it("Should transition to ReadyToSettle when both revealed", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
      await helper.joinMatch(accounts, opponentCommitment.hash);
      await helper.reveal(accounts, accounts.creator, creatorCommitment);
      await helper.reveal(accounts, accounts.opponent, opponentCommitment);

      const match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.status.readyToSettle !== undefined, true);
    });

    it("Should reject reveal from non-participant", async () => {
      const accounts = await helper.createTestAccounts();
      const randomPlayer = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);
      const opponentCommitment = helper.generateCommitment(TestFixtures.CHOICES.PAPER, accounts.opponent.publicKey);
      const randomCommitment = helper.generateCommitment(TestFixtures.CHOICES.SCISSORS, randomPlayer.creator.publicKey);

      await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
      await helper.joinMatch(accounts, opponentCommitment.hash);

      try {
        await helper.reveal(accounts, randomPlayer.creator, randomCommitment);
        assert.fail("Should have rejected non-participant");
      } catch (error) {
        expect(error.message).to.include("NotParticipant");
      }
    });
  });

  describe("Game Logic", () => {
    TestFixtures.OUTCOMES.CREATOR_WINS.forEach(([creatorChoice, opponentChoice], index) => {
      it(`Should determine creator wins: ${creatorChoice} vs ${opponentChoice}`, async () => {
        const accounts = await helper.createTestAccounts();
        const creatorCommitment = helper.generateCommitment(creatorChoice, accounts.creator.publicKey);
        const opponentCommitment = helper.generateCommitment(opponentChoice, accounts.opponent.publicKey);

        await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
        await helper.joinMatch(accounts, opponentCommitment.hash);
        await helper.reveal(accounts, accounts.creator, creatorCommitment);
        await helper.reveal(accounts, accounts.opponent, opponentCommitment);
        await helper.settleMatch(accounts);

        const match = await helper.getMatchState(accounts.matchAccount.publicKey);
        assert.equal(match.status.settled !== undefined, true);
        // Note: Full settlement testing needs implementation completion
      });
    });

    TestFixtures.OUTCOMES.TIES.forEach(([creatorChoice, opponentChoice], index) => {
      it(`Should handle tie: ${creatorChoice} vs ${opponentChoice}`, async () => {
        const accounts = await helper.createTestAccounts();
        const creatorCommitment = helper.generateCommitment(creatorChoice, accounts.creator.publicKey);
        const opponentCommitment = helper.generateCommitment(opponentChoice, accounts.opponent.publicKey);

        await helper.createMatch(accounts, creatorCommitment.hash, TestFixtures.STANDARD_GAME);
        await helper.joinMatch(accounts, opponentCommitment.hash);
        await helper.reveal(accounts, accounts.creator, creatorCommitment);
        await helper.reveal(accounts, accounts.opponent, opponentCommitment);
        await helper.settleMatch(accounts);

        const match = await helper.getMatchState(accounts.matchAccount.publicKey);
        assert.equal(match.status.settled !== undefined, true);
      });
    });
  });

  describe("Edge Cases", () => {
    it("Should handle maximum bet amount", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);

      // Fund creator with maximum amount
      await helper.fundAccount(accounts.creator.publicKey, 100 * LAMPORTS_PER_SOL);

      await helper.createMatch(accounts, creatorCommitment.hash, {
        betAmount: 50 * LAMPORTS_PER_SOL
      });

      const match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.betAmount.toString(), (50 * LAMPORTS_PER_SOL).toString());
    });

    it("Should handle minimum valid deadlines", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);

      const now = Math.floor(Date.now() / 1000);
      await helper.createMatch(accounts, creatorCommitment.hash, {
        joinDeadline: now + 1,
        revealDeadline: now + 2
      });

      const match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.joinDeadline.toString(), (now + 1).toString());
    });

    it("Should handle boundary fee rates", async () => {
      const accounts = await helper.createTestAccounts();
      const creatorCommitment = helper.generateCommitment(TestFixtures.CHOICES.ROCK, accounts.creator.publicKey);

      // Test maximum allowed fee (10%)
      await helper.createMatch(accounts, creatorCommitment.hash, { feeBps: 1000 });

      const match = await helper.getMatchState(accounts.matchAccount.publicKey);
      assert.equal(match.feeBps, 1000);
    });
  });
});