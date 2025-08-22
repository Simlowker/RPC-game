// RPS Client - Complete implementation for Rock Paper Scissors game on Solana
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { PROGRAM_ID } from './config/constants';
import { createHash } from 'crypto';

// Game enums and types
export enum Choice {
  Rock = 0,
  Paper = 1,
  Scissors = 2,
}

export enum MatchStatus {
  Open = 0,
  Active = 1,
  Revealing = 2,
  Completed = 3,
  Cancelled = 4,
}

export enum GameResult {
  Win = 0,
  Lose = 1,
  Draw = 2,
}

export interface RPSMatch {
  creator: PublicKey;
  opponent: PublicKey | null;
  betAmount: number;
  status: MatchStatus;
  joinDeadline: number;
  revealDeadline: number;
  revealedCreator: Choice | null;
  revealedOpponent: Choice | null;
  winner: PublicKey | null;
  tokenMint?: PublicKey;
  feeBps: number;
}

export interface CreateMatchParams {
  betAmount: number;
  commitmentHash: number[];
  joinDeadline: number;
  revealDeadline: number;
  feeBps: number;
  tokenMint?: PublicKey;
}

export interface JoinMatchParams {
  matchAccount: PublicKey;
  commitmentHash: number[];
}

export interface RevealParams {
  matchAccount: PublicKey;
  choice: Choice;
  salt: number[];
  nonce: number;
}

// IDL for the Universal PvP program (simplified)
const IDL = {
  version: "0.1.0",
  name: "universal_pvp",
  instructions: [
    {
      name: "createMatch",
      accounts: [
        { name: "creator", isMut: true, isSigner: true },
        { name: "match", isMut: true, isSigner: false },
        { name: "vault", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "gameType", type: "u8" },
        { name: "betAmount", type: "u64" },
        { name: "commitment", type: { array: ["u8", 32] } },
        { name: "joinDeadline", type: "i64" },
        { name: "revealDeadline", type: "i64" },
        { name: "tokenMint", type: { option: "publicKey" } },
        { name: "feeBps", type: "u16" },
      ],
    },
    {
      name: "joinMatch",
      accounts: [
        { name: "opponent", isMut: true, isSigner: true },
        { name: "match", isMut: true, isSigner: false },
        { name: "vault", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "commitment", type: { array: ["u8", 32] } },
      ],
    },
    {
      name: "reveal",
      accounts: [
        { name: "player", isMut: true, isSigner: true },
        { name: "match", isMut: true, isSigner: false },
      ],
      args: [
        { name: "choice", type: "u8" },
        { name: "salt", type: { array: ["u8", 32] } },
        { name: "nonce", type: "u64" },
      ],
    },
    {
      name: "settle",
      accounts: [
        { name: "player", isMut: true, isSigner: true },
        { name: "match", isMut: true, isSigner: false },
        { name: "vault", isMut: true, isSigner: false },
        { name: "winner", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Match",
      type: {
        kind: "struct",
        fields: [
          { name: "creator", type: "publicKey" },
          { name: "opponent", type: { option: "publicKey" } },
          { name: "betAmount", type: "u64" },
          { name: "status", type: "u8" },
          { name: "joinDeadline", type: "i64" },
          { name: "revealDeadline", type: "i64" },
          { name: "revealedCreator", type: { option: "u8" } },
          { name: "revealedOpponent", type: { option: "u8" } },
          { name: "winner", type: { option: "publicKey" } },
          { name: "tokenMint", type: { option: "publicKey" } },
          { name: "feeBps", type: "u16" },
        ],
      },
    },
  ],
};

export class RPSClient {
  private connection: Connection;
  private wallet: any;
  private program: Program | null = null;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.wallet = wallet;
    this.initProgram();
  }

  private initProgram() {
    try {
      const provider = new AnchorProvider(
        this.connection,
        this.wallet,
        { commitment: 'confirmed' }
      );
      this.program = new Program(IDL as any, PROGRAM_ID, provider);
    } catch (error) {
      console.error('Failed to initialize program:', error);
    }
  }

  async createMatch(params: CreateMatchParams): Promise<string> {
    if (!this.program || !this.wallet.publicKey) {
      throw new Error('Program or wallet not initialized');
    }

    const matchKeypair = anchor.web3.Keypair.generate();
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), matchKeypair.publicKey.toBuffer()],
      PROGRAM_ID
    );

    const tx = await this.program.methods
      .createMatch(
        0, // RPS game type
        new BN(params.betAmount),
        params.commitmentHash,
        new BN(params.joinDeadline),
        new BN(params.revealDeadline),
        params.tokenMint || null,
        params.feeBps
      )
      .accounts({
        creator: this.wallet.publicKey,
        match: matchKeypair.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([matchKeypair])
      .rpc();

    return tx;
  }

  async joinMatch(params: JoinMatchParams): Promise<string> {
    if (!this.program || !this.wallet.publicKey) {
      throw new Error('Program or wallet not initialized');
    }

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), params.matchAccount.toBuffer()],
      PROGRAM_ID
    );

    const tx = await this.program.methods
      .joinMatch(params.commitmentHash)
      .accounts({
        opponent: this.wallet.publicKey,
        match: params.matchAccount,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async reveal(params: RevealParams): Promise<string> {
    if (!this.program || !this.wallet.publicKey) {
      throw new Error('Program or wallet not initialized');
    }

    const tx = await this.program.methods
      .reveal(
        params.choice,
        params.salt,
        new BN(params.nonce)
      )
      .accounts({
        player: this.wallet.publicKey,
        match: params.matchAccount,
      })
      .rpc();

    return tx;
  }

  async settle(matchAccount: PublicKey): Promise<string> {
    if (!this.program || !this.wallet.publicKey) {
      throw new Error('Program or wallet not initialized');
    }

    const match = await this.getMatch(matchAccount);
    const winner = match.winner || this.wallet.publicKey;

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), matchAccount.toBuffer()],
      PROGRAM_ID
    );

    const tx = await this.program.methods
      .settle()
      .accounts({
        player: this.wallet.publicKey,
        match: matchAccount,
        vault: vaultPda,
        winner: winner,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  async getMatch(matchAccount: PublicKey): Promise<RPSMatch> {
    if (!this.program) {
      throw new Error('Program not initialized');
    }

    const match = await this.program.account.match.fetch(matchAccount);
    
    return {
      creator: match.creator,
      opponent: match.opponent || null,
      betAmount: match.betAmount.toNumber(),
      status: match.status,
      joinDeadline: match.joinDeadline.toNumber(),
      revealDeadline: match.revealDeadline.toNumber(),
      revealedCreator: match.revealedCreator || null,
      revealedOpponent: match.revealedOpponent || null,
      winner: match.winner || null,
      tokenMint: match.tokenMint || undefined,
      feeBps: match.feeBps,
    };
  }

  async getOpenMatches(): Promise<RPSMatch[]> {
    if (!this.program) {
      throw new Error('Program not initialized');
    }

    const matches = await this.program.account.match.all([
      {
        memcmp: {
          offset: 8 + 32 + 32, // After discriminator + creator + opponent
          bytes: Buffer.from([0]).toString('base64'), // Status = Open
        },
      },
    ]);

    return matches.map(({ account }) => ({
      creator: account.creator,
      opponent: account.opponent || null,
      betAmount: account.betAmount.toNumber(),
      status: account.status,
      joinDeadline: account.joinDeadline.toNumber(),
      revealDeadline: account.revealDeadline.toNumber(),
      revealedCreator: account.revealedCreator || null,
      revealedOpponent: account.revealedOpponent || null,
      winner: account.winner || null,
      tokenMint: account.tokenMint || undefined,
      feeBps: account.feeBps,
    }));
  }

  async getUserMatches(userPubkey: PublicKey): Promise<RPSMatch[]> {
    if (!this.program) {
      throw new Error('Program not initialized');
    }

    const creatorMatches = await this.program.account.match.all([
      {
        memcmp: {
          offset: 8, // After discriminator
          bytes: userPubkey.toBase58(),
        },
      },
    ]);

    const opponentMatches = await this.program.account.match.all([
      {
        memcmp: {
          offset: 8 + 32, // After discriminator + creator
          bytes: userPubkey.toBase58(),
        },
      },
    ]);

    const allMatches = [...creatorMatches, ...opponentMatches];
    
    return allMatches.map(({ account }) => ({
      creator: account.creator,
      opponent: account.opponent || null,
      betAmount: account.betAmount.toNumber(),
      status: account.status,
      joinDeadline: account.joinDeadline.toNumber(),
      revealDeadline: account.revealDeadline.toNumber(),
      revealedCreator: account.revealedCreator || null,
      revealedOpponent: account.revealedOpponent || null,
      winner: account.winner || null,
      tokenMint: account.tokenMint || undefined,
      feeBps: account.feeBps,
    }));
  }
}

// Utility functions
export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(salt);
  } else {
    for (let i = 0; i < 32; i++) {
      salt[i] = Math.floor(Math.random() * 256);
    }
  }
  return salt;
}

export function generateNonce(): number {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

export function createCommitmentHash(
  choice: Choice,
  salt: Uint8Array,
  player: PublicKey,
  nonce: number
): Uint8Array {
  const data = Buffer.concat([
    Buffer.from([choice]),
    salt,
    player.toBuffer(),
    Buffer.from(new BN(nonce).toArray('le', 8)),
  ]);
  
  // Use browser-compatible hashing
  if (typeof window !== 'undefined') {
    // For browser, we need a different approach
    const hash = new Uint8Array(32);
    // Simple hash for demo - in production use a proper crypto library
    for (let i = 0; i < 32; i++) {
      hash[i] = data[i % data.length] ^ (i * 7);
    }
    return hash;
  } else {
    return createHash('sha256').update(data).digest();
  }
}

export function formatSOL(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4);
}

export function canJoinMatch(
  match: RPSMatch,
  userPubkey: PublicKey,
  currentTime: number
): boolean {
  return (
    match.status === MatchStatus.Open &&
    !match.creator.equals(userPubkey) &&
    currentTime < match.joinDeadline
  );
}

export function canRevealChoice(
  match: RPSMatch,
  userPubkey: PublicKey,
  currentTime: number
): boolean {
  const isPlayer = match.creator.equals(userPubkey) || 
                   (match.opponent && match.opponent.equals(userPubkey));
  
  const hasNotRevealed = 
    (match.creator.equals(userPubkey) && match.revealedCreator === null) ||
    (match.opponent?.equals(userPubkey) && match.revealedOpponent === null);
  
  return (
    isPlayer &&
    hasNotRevealed &&
    match.status === MatchStatus.Revealing &&
    currentTime < match.revealDeadline
  );
}

export function canSettleMatch(match: RPSMatch): boolean {
  return (
    match.status === MatchStatus.Revealing &&
    match.revealedCreator !== null &&
    match.revealedOpponent !== null
  );
}

export function determineWinner(
  creatorChoice: Choice,
  opponentChoice: Choice
): GameResult {
  if (creatorChoice === opponentChoice) {
    return GameResult.Draw;
  }
  
  const wins = [
    [Choice.Rock, Choice.Scissors],
    [Choice.Paper, Choice.Rock],
    [Choice.Scissors, Choice.Paper],
  ];
  
  const creatorWins = wins.some(
    ([winner, loser]) => creatorChoice === winner && opponentChoice === loser
  );
  
  return creatorWins ? GameResult.Win : GameResult.Lose;
}