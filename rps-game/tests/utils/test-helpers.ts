import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import { createHash } from "crypto";
import { expect } from "chai";

export interface TestAccounts {
  creator: Keypair;
  opponent: Keypair;
  feeCollector: Keypair;
  matchAccount: Keypair;
  vaultPda: PublicKey;
  vaultBump: number;
}

export interface GameParameters {
  betAmount: number;
  feeBps: number;
  joinDeadline: number;
  revealDeadline: number;
}

export interface CommitmentData {
  choice: number;
  salt: Buffer;
  nonce: bigint;
  hash: Buffer;
}

export class TestHelper {
  constructor(
    public program: Program,
    public provider: anchor.AnchorProvider,
    public connection: Connection
  ) {}

  // Create test accounts with funding
  async createTestAccounts(): Promise<TestAccounts> {
    const creator = Keypair.generate();
    const opponent = Keypair.generate();
    const feeCollector = Keypair.generate();
    const matchAccount = Keypair.generate();

    // Fund accounts
    await this.fundAccount(creator.publicKey, 5 * LAMPORTS_PER_SOL);
    await this.fundAccount(opponent.publicKey, 5 * LAMPORTS_PER_SOL);
    await this.fundAccount(feeCollector.publicKey, 1 * LAMPORTS_PER_SOL);

    // Derive vault PDA
    const [vaultPda, vaultBump] = await PublicKey.findProgramAddress(
      [Buffer.from("vault"), matchAccount.publicKey.toBuffer()],
      this.program.programId
    );

    return {
      creator,
      opponent,
      feeCollector,
      matchAccount,
      vaultPda,
      vaultBump
    };
  }

  // Fund account with airdrop
  async fundAccount(publicKey: PublicKey, amount: number): Promise<void> {
    const signature = await this.connection.requestAirdrop(publicKey, amount);
    await this.connection.confirmTransaction(signature);
  }

  // Create commitment hash
  createCommitmentHash(choice: number, salt: Buffer, player: PublicKey, nonce: bigint): Buffer {
    const hasher = createHash('sha256');
    hasher.update(Buffer.from([choice]));
    hasher.update(salt);
    hasher.update(player.toBuffer());
    hasher.update(Buffer.from(nonce.toString(16).padStart(16, '0'), 'hex').reverse());
    return hasher.digest();
  }

  // Generate commitment data
  generateCommitment(choice: number, player: PublicKey): CommitmentData {
    const salt = Buffer.from(`salt-${Math.random()}`.padEnd(32, '0'));
    const nonce = BigInt(Math.floor(Math.random() * 1000000));
    const hash = this.createCommitmentHash(choice, salt, player, nonce);
    
    return { choice, salt, nonce, hash };
  }

  // Create match with default parameters
  async createMatch(
    accounts: TestAccounts,
    creatorCommitment: Buffer,
    params: Partial<GameParameters> = {}
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const gameParams: GameParameters = {
      betAmount: 0.1 * LAMPORTS_PER_SOL,
      feeBps: 250,
      joinDeadline: now + 3600,
      revealDeadline: now + 7200,
      ...params
    };

    await this.program.methods
      .createMatch(
        new anchor.BN(gameParams.betAmount),
        Array.from(creatorCommitment),
        new anchor.BN(gameParams.joinDeadline),
        new anchor.BN(gameParams.revealDeadline),
        gameParams.feeBps
      )
      .accounts({
        matchAccount: accounts.matchAccount.publicKey,
        vault: accounts.vaultPda,
        creator: accounts.creator.publicKey,
        tokenMint: null,
        creatorTokenAccount: null,
        vaultTokenAccount: null,
        tokenProgram: null,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([accounts.creator, accounts.matchAccount])
      .rpc();
  }

  // Join match
  async joinMatch(accounts: TestAccounts, opponentCommitment: Buffer): Promise<void> {
    await this.program.methods
      .joinMatch(Array.from(opponentCommitment))
      .accounts({
        matchAccount: accounts.matchAccount.publicKey,
        vault: accounts.vaultPda,
        opponent: accounts.opponent.publicKey,
        opponentTokenAccount: null,
        vaultTokenAccount: null,
        tokenProgram: null,
      })
      .signers([accounts.opponent])
      .rpc();
  }

  // Reveal choice
  async reveal(
    accounts: TestAccounts,
    player: Keypair,
    commitment: CommitmentData
  ): Promise<void> {
    const choice = this.getChoiceEnum(commitment.choice);
    
    await this.program.methods
      .reveal(
        choice,
        Array.from(commitment.salt),
        new anchor.BN(commitment.nonce.toString())
      )
      .accounts({
        matchAccount: accounts.matchAccount.publicKey,
        player: player.publicKey,
      })
      .signers([player])
      .rpc();
  }

  // Settle match
  async settleMatch(accounts: TestAccounts): Promise<void> {
    await this.program.methods
      .settle()
      .accounts({
        matchAccount: accounts.matchAccount.publicKey,
        vault: accounts.vaultPda,
        creator: accounts.creator.publicKey,
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
  }

  // Get choice enum from number
  private getChoiceEnum(choice: number) {
    switch (choice) {
      case 0: return { rock: {} };
      case 1: return { paper: {} };
      case 2: return { scissors: {} };
      default: throw new Error(`Invalid choice: ${choice}`);
    }
  }

  // Get current match state
  async getMatchState(matchPublicKey: PublicKey) {
    return await this.program.account.match.fetch(matchPublicKey);
  }

  // Get account balance
  async getBalance(publicKey: PublicKey): Promise<number> {
    return await this.connection.getBalance(publicKey);
  }

  // Wait for condition with timeout
  async waitForCondition(
    condition: () => Promise<boolean>,
    timeoutMs: number = 10000,
    intervalMs: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error(`Condition not met within ${timeoutMs}ms`);
  }

  // Assert balance change
  assertBalanceChange(
    balanceBefore: number,
    balanceAfter: number,
    expectedChange: number,
    tolerance: number = 0.01 * LAMPORTS_PER_SOL
  ): void {
    const actualChange = balanceAfter - balanceBefore;
    const difference = Math.abs(actualChange - expectedChange);
    
    expect(difference).to.be.lessThan(tolerance, 
      `Balance change ${actualChange} not within ${tolerance} of expected ${expectedChange}`
    );
  }

  // Simulate network delay
  async simulateNetworkDelay(ms: number = 1000): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  // Create multiple test accounts for load testing
  async createMultipleAccounts(count: number): Promise<Keypair[]> {
    const accounts = [];
    
    for (let i = 0; i < count; i++) {
      const account = Keypair.generate();
      await this.fundAccount(account.publicKey, 2 * LAMPORTS_PER_SOL);
      accounts.push(account);
    }
    
    return accounts;
  }
}

// Test fixtures for common scenarios
export const TestFixtures = {
  // Standard game parameters
  STANDARD_GAME: {
    betAmount: 0.1 * LAMPORTS_PER_SOL,
    feeBps: 250, // 2.5%
    joinDeadlineOffset: 3600, // 1 hour
    revealDeadlineOffset: 7200 // 2 hours
  },

  // High stakes game
  HIGH_STAKES: {
    betAmount: 1.0 * LAMPORTS_PER_SOL,
    feeBps: 500, // 5%
    joinDeadlineOffset: 1800, // 30 minutes
    revealDeadlineOffset: 3600 // 1 hour
  },

  // Quick game for testing
  QUICK_GAME: {
    betAmount: 0.01 * LAMPORTS_PER_SOL,
    feeBps: 100, // 1%
    joinDeadlineOffset: 60, // 1 minute
    revealDeadlineOffset: 120 // 2 minutes
  },

  // Game choices
  CHOICES: {
    ROCK: 0,
    PAPER: 1,
    SCISSORS: 2
  },

  // Expected outcomes
  OUTCOMES: {
    CREATOR_WINS: [
      [0, 2], // Rock vs Scissors
      [1, 0], // Paper vs Rock
      [2, 1]  // Scissors vs Paper
    ],
    OPPONENT_WINS: [
      [2, 0], // Scissors vs Rock
      [0, 1], // Rock vs Paper
      [1, 2]  // Paper vs Scissors
    ],
    TIES: [
      [0, 0], // Rock vs Rock
      [1, 1], // Paper vs Paper
      [2, 2]  // Scissors vs Scissors
    ]
  }
};

export default TestHelper;