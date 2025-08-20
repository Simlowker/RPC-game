import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert, expect } from "chai";
import { createHash } from "crypto";

// Import the generated IDL type
// Note: You'll need to generate this by running: anchor build
// import { Rps } from "../target/types/rps";

describe("RPS PvP Game", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // const program = anchor.workspace.Rps as Program<Rps>;
  const program = new Program(
    require("../target/idl/rps.json"),
    new PublicKey("zYQ16fyWiwZWgWjpQ9JBzL4QwLbp5MbezSBwSi2YTfY"),
    provider
  );

  // Test accounts
  let creator: Keypair;
  let opponent: Keypair;
  let feeCollector: Keypair;
  let matchAccount: Keypair;
  let vaultPda: PublicKey;
  let vaultBump: number;

  // Game parameters
  const betAmount = 0.1 * LAMPORTS_PER_SOL;
  const feeBps = 250; // 2.5%
  
  // Helper functions
  function createCommitmentHash(choice: number, salt: Buffer, player: PublicKey, nonce: bigint): Buffer {
    const hasher = createHash('sha256');
    hasher.update(Buffer.from([choice]));
    hasher.update(salt);
    hasher.update(player.toBuffer());
    hasher.update(Buffer.from(nonce.toString(16).padStart(16, '0'), 'hex').reverse());
    return hasher.digest();
  }

  beforeEach(async () => {
    // Create test keypairs
    creator = Keypair.generate();
    opponent = Keypair.generate();
    feeCollector = Keypair.generate();
    matchAccount = Keypair.generate();

    // Fund test accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(creator.publicKey, 2 * LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(opponent.publicKey, 2 * LAMPORTS_PER_SOL)
    );

    // Derive vault PDA
    [vaultPda, vaultBump] = await PublicKey.findProgramAddress(
      [Buffer.from("vault"), matchAccount.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("Happy Path Tests", () => {
    it("Complete game flow - Creator wins", async () => {
      const creatorChoice = 0; // Rock
      const opponentChoice = 2; // Scissors (Rock beats Scissors)
      const salt1 = Buffer.from("salt1".padEnd(32, '0'));
      const salt2 = Buffer.from("salt2".padEnd(32, '0'));
      const nonce1 = BigInt(12345);
      const nonce2 = BigInt(67890);

      // Create commitments
      const creatorCommitment = createCommitmentHash(creatorChoice, salt1, creator.publicKey, nonce1);
      const opponentCommitment = createCommitmentHash(opponentChoice, salt2, opponent.publicKey, nonce2);

      const now = Math.floor(Date.now() / 1000);
      const joinDeadline = now + 3600; // 1 hour
      const revealDeadline = joinDeadline + 3600; // 2 hours total

      // Step 1: Create match
      await program.methods
        .createMatch(
          new anchor.BN(betAmount),
          Array.from(creatorCommitment),
          new anchor.BN(joinDeadline),
          new anchor.BN(revealDeadline),
          feeBps
        )
        .accounts({
          matchAccount: matchAccount.publicKey,
          vault: vaultPda,
          creator: creator.publicKey,
          tokenMint: null,
          creatorTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator, matchAccount])
        .rpc();

      let match = await program.account.match.fetch(matchAccount.publicKey);
      assert.equal(match.status.waitingForOpponent !== undefined, true);
      assert.equal(match.betAmount.toString(), betAmount.toString());

      // Step 2: Join match
      await program.methods
        .joinMatch(Array.from(opponentCommitment))
        .accounts({
          matchAccount: matchAccount.publicKey,
          vault: vaultPda,
          opponent: opponent.publicKey,
          opponentTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
        })
        .signers([opponent])
        .rpc();

      match = await program.account.match.fetch(matchAccount.publicKey);
      assert.equal(match.status.waitingForReveal !== undefined, true);
      assert.equal(match.opponent.toString(), opponent.publicKey.toString());

      // Step 3: Both players reveal
      await program.methods
        .reveal(
          { rock: {} },
          Array.from(salt1),
          new anchor.BN(nonce1.toString())
        )
        .accounts({
          matchAccount: matchAccount.publicKey,
          player: creator.publicKey,
        })
        .signers([creator])
        .rpc();

      await program.methods
        .reveal(
          { scissors: {} },
          Array.from(salt2),
          new anchor.BN(nonce2.toString())
        )
        .accounts({
          matchAccount: matchAccount.publicKey,
          player: opponent.publicKey,
        })
        .signers([opponent])
        .rpc();

      match = await program.account.match.fetch(matchAccount.publicKey);
      assert.equal(match.status.readyToSettle !== undefined, true);

      // Step 4: Settle match
      const creatorBalanceBefore = await provider.connection.getBalance(creator.publicKey);
      const opponentBalanceBefore = await provider.connection.getBalance(opponent.publicKey);

      await program.methods
        .settle()
        .accounts({
          matchAccount: matchAccount.publicKey,
          vault: vaultPda,
          creator: creator.publicKey,
          opponent: opponent.publicKey,
          feeCollector: feeCollector.publicKey,
          creatorTokenAccount: null,
          opponentTokenAccount: null,
          vaultTokenAccount: null,
          feeCollectorTokenAccount: null,
          tokenProgram: null,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      match = await program.account.match.fetch(matchAccount.publicKey);
      assert.equal(match.status.settled !== undefined, true);

      // Check balances (creator should win)
      const creatorBalanceAfter = await provider.connection.getBalance(creator.publicKey);
      const totalBet = betAmount * 2;
      const feeAmount = (totalBet * feeBps) / 10000;
      const payout = totalBet - feeAmount;

      assert.isTrue(creatorBalanceAfter > creatorBalanceBefore);
      // Note: Exact balance checking is complex due to transaction fees
    });

    it("Complete game flow - Tie results in refund", async () => {
      const creatorChoice = 0; // Rock  
      const opponentChoice = 0; // Rock (Tie)
      const salt1 = Buffer.from("salt1".padEnd(32, '0'));
      const salt2 = Buffer.from("salt2".padEnd(32, '0'));
      const nonce1 = BigInt(12345);
      const nonce2 = BigInt(67890);

      const creatorCommitment = createCommitmentHash(creatorChoice, salt1, creator.publicKey, nonce1);
      const opponentCommitment = createCommitmentHash(opponentChoice, salt2, opponent.publicKey, nonce2);

      const now = Math.floor(Date.now() / 1000);
      const joinDeadline = now + 3600;
      const revealDeadline = joinDeadline + 3600;

      // Create match
      await program.methods
        .createMatch(
          new anchor.BN(betAmount),
          Array.from(creatorCommitment),
          new anchor.BN(joinDeadline),
          new anchor.BN(revealDeadline),
          feeBps
        )
        .accounts({
          matchAccount: matchAccount.publicKey,
          vault: vaultPda,
          creator: creator.publicKey,
          tokenMint: null,
          creatorTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator, matchAccount])
        .rpc();

      // Join match
      await program.methods
        .joinMatch(Array.from(opponentCommitment))
        .accounts({
          matchAccount: matchAccount.publicKey,
          vault: vaultPda,
          opponent: opponent.publicKey,
          opponentTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
        })
        .signers([opponent])
        .rpc();

      // Reveal both
      await program.methods
        .reveal(
          { rock: {} },
          Array.from(salt1),
          new anchor.BN(nonce1.toString())
        )
        .accounts({
          matchAccount: matchAccount.publicKey,
          player: creator.publicKey,
        })
        .signers([creator])
        .rpc();

      await program.methods
        .reveal(
          { rock: {} },
          Array.from(salt2),
          new anchor.BN(nonce2.toString())
        )
        .accounts({
          matchAccount: matchAccount.publicKey,
          player: opponent.publicKey,
        })
        .signers([opponent])
        .rpc();

      // Settle - should refund both players
      const creatorBalanceBefore = await provider.connection.getBalance(creator.publicKey);
      const opponentBalanceBefore = await provider.connection.getBalance(opponent.publicKey);

      await program.methods
        .settle()
        .accounts({
          matchAccount: matchAccount.publicKey,
          vault: vaultPda,
          creator: creator.publicKey,
          opponent: opponent.publicKey,
          feeCollector: feeCollector.publicKey,
          creatorTokenAccount: null,
          opponentTokenAccount: null,
          vaultTokenAccount: null,
          feeCollectorTokenAccount: null,
          tokenProgram: null,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const match = await program.account.match.fetch(matchAccount.publicKey);
      assert.equal(match.status.settled !== undefined, true);

      // Both players should get their money back (minus tx fees)
      const creatorBalanceAfter = await provider.connection.getBalance(creator.publicKey);
      const opponentBalanceAfter = await provider.connection.getBalance(opponent.publicKey);
      
      // Check they're roughly back to original (accounting for tx fees)
      assert.isTrue(Math.abs(creatorBalanceAfter - creatorBalanceBefore) < 0.01 * LAMPORTS_PER_SOL);
      assert.isTrue(Math.abs(opponentBalanceAfter - opponentBalanceBefore) < 0.01 * LAMPORTS_PER_SOL);
    });
  });

  describe("Error Handling Tests", () => {
    it("Rejects mismatched bet amounts", async () => {
      const creatorChoice = 0;
      const salt1 = Buffer.from("salt1".padEnd(32, '0'));
      const nonce1 = BigInt(12345);
      const creatorCommitment = createCommitmentHash(creatorChoice, salt1, creator.publicKey, nonce1);

      const now = Math.floor(Date.now() / 1000);
      const joinDeadline = now + 3600;
      const revealDeadline = joinDeadline + 3600;

      // Create match with different bet amount
      const differentBetAmount = 0.5 * LAMPORTS_PER_SOL;
      
      await program.methods
        .createMatch(
          new anchor.BN(differentBetAmount),
          Array.from(creatorCommitment),
          new anchor.BN(joinDeadline),
          new anchor.BN(revealDeadline),
          feeBps
        )
        .accounts({
          matchAccount: matchAccount.publicKey,
          vault: vaultPda,
          creator: creator.publicKey,
          tokenMint: null,
          creatorTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator, matchAccount])
        .rpc();

      // Try to join with insufficient funds (opponent only has enough for 0.1 SOL bet)
      const opponentChoice = 1;
      const salt2 = Buffer.from("salt2".padEnd(32, '0'));
      const nonce2 = BigInt(67890);
      const opponentCommitment = createCommitmentHash(opponentChoice, salt2, opponent.publicKey, nonce2);

      try {
        await program.methods
          .joinMatch(Array.from(opponentCommitment))
          .accounts({
            matchAccount: matchAccount.publicKey,
            vault: vaultPda,
            opponent: opponent.publicKey,
            opponentTokenAccount: null,
            vaultTokenAccount: null,
            tokenProgram: null,
          })
          .signers([opponent])
          .rpc();
        
        assert.fail("Should have failed due to insufficient funds");
      } catch (error) {
        // Expected to fail
        assert.isTrue(error.message.includes("insufficient"));
      }
    });

    it("Prevents double reveal", async () => {
      const creatorChoice = 1; // Paper
      const opponentChoice = 0; // Rock
      const salt1 = Buffer.from("salt1".padEnd(32, '0'));
      const salt2 = Buffer.from("salt2".padEnd(32, '0'));
      const nonce1 = BigInt(12345);
      const nonce2 = BigInt(67890);

      const creatorCommitment = createCommitmentHash(creatorChoice, salt1, creator.publicKey, nonce1);
      const opponentCommitment = createCommitmentHash(opponentChoice, salt2, opponent.publicKey, nonce2);

      const now = Math.floor(Date.now() / 1000);
      const joinDeadline = now + 3600;
      const revealDeadline = joinDeadline + 3600;

      // Create and join match
      await program.methods
        .createMatch(
          new anchor.BN(betAmount),
          Array.from(creatorCommitment),
          new anchor.BN(joinDeadline),
          new anchor.BN(revealDeadline),
          feeBps
        )
        .accounts({
          matchAccount: matchAccount.publicKey,
          vault: vaultPda,
          creator: creator.publicKey,
          tokenMint: null,
          creatorTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator, matchAccount])
        .rpc();

      await program.methods
        .joinMatch(Array.from(opponentCommitment))
        .accounts({
          matchAccount: matchAccount.publicKey,
          vault: vaultPda,
          opponent: opponent.publicKey,
          opponentTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
        })
        .signers([opponent])
        .rpc();

      // First reveal should succeed
      await program.methods
        .reveal(
          { paper: {} },
          Array.from(salt1),
          new anchor.BN(nonce1.toString())
        )
        .accounts({
          matchAccount: matchAccount.publicKey,
          player: creator.publicKey,
        })
        .signers([creator])
        .rpc();

      // Second reveal from same player should fail
      try {
        await program.methods
          .reveal(
            { rock: {} }, // Different choice
            Array.from(salt1),
            new anchor.BN(nonce1.toString())
          )
          .accounts({
            matchAccount: matchAccount.publicKey,
            player: creator.publicKey,
          })
          .signers([creator])
          .rpc();
        
        assert.fail("Should have failed due to double reveal");
      } catch (error) {
        assert.isTrue(error.message.includes("AlreadyRevealed"));
      }
    });

    it("Handles timeout correctly", async () => {
      const creatorChoice = 0;
      const salt1 = Buffer.from("salt1".padEnd(32, '0'));
      const nonce1 = BigInt(12345);
      const creatorCommitment = createCommitmentHash(creatorChoice, salt1, creator.publicKey, nonce1);

      // Set very short deadlines for testing
      const now = Math.floor(Date.now() / 1000);
      const joinDeadline = now - 1; // Already passed
      const revealDeadline = now + 1;

      await program.methods
        .createMatch(
          new anchor.BN(betAmount),
          Array.from(creatorCommitment),
          new anchor.BN(joinDeadline),
          new anchor.BN(revealDeadline),
          feeBps
        )
        .accounts({
          matchAccount: matchAccount.publicKey,
          vault: vaultPda,
          creator: creator.publicKey,
          tokenMint: null,
          creatorTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator, matchAccount])
        .rpc();

      // Wait a moment to ensure deadline has passed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Timeout should work
      await program.methods
        .timeoutMatch()
        .accounts({
          matchAccount: matchAccount.publicKey,
          vault: vaultPda,
          creator: creator.publicKey,
          opponent: opponent.publicKey,
          creatorTokenAccount: null,
          opponentTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const match = await program.account.match.fetch(matchAccount.publicKey);
      assert.equal(match.status.timedOut !== undefined, true);
    });
  });

  describe("Cancel Match", () => {
    it("Allows creator to cancel unjoined match", async () => {
      const creatorChoice = 0;
      const salt1 = Buffer.from("salt1".padEnd(32, '0'));
      const nonce1 = BigInt(12345);
      const creatorCommitment = createCommitmentHash(creatorChoice, salt1, creator.publicKey, nonce1);

      const now = Math.floor(Date.now() / 1000);
      const joinDeadline = now + 3600;
      const revealDeadline = joinDeadline + 3600;

      await program.methods
        .createMatch(
          new anchor.BN(betAmount),
          Array.from(creatorCommitment),
          new anchor.BN(joinDeadline),
          new anchor.BN(revealDeadline),
          feeBps
        )
        .accounts({
          matchAccount: matchAccount.publicKey,
          vault: vaultPda,
          creator: creator.publicKey,
          tokenMint: null,
          creatorTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator, matchAccount])
        .rpc();

      const creatorBalanceBefore = await provider.connection.getBalance(creator.publicKey);

      // Cancel match
      await program.methods
        .cancelMatch()
        .accounts({
          matchAccount: matchAccount.publicKey,
          vault: vaultPda,
          creator: creator.publicKey,
          creatorTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      const match = await program.account.match.fetch(matchAccount.publicKey);
      assert.equal(match.status.cancelled !== undefined, true);

      // Creator should get refund
      const creatorBalanceAfter = await provider.connection.getBalance(creator.publicKey);
      assert.isTrue(creatorBalanceAfter > creatorBalanceBefore);
    });
  });
});