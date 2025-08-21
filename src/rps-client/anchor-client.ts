// src/rps-client/anchor-client.ts - Anchor Client for RPS Smart Contract
import { 
  PublicKey, 
  Connection, 
  SystemProgram, 
  SYSVAR_CLOCK_PUBKEY,
  Transaction
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN, web3 } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { 
  Choice, 
  CreateMatchParams, 
  JoinMatchParams, 
  RevealParams, 
  RPSMatch,
  MatchCreatedEvent,
  MatchJoinedEvent,
  ChoiceRevealedEvent,
  MatchSettledEvent
} from './types';
import { createCommitmentHash } from './utils';

// RPS Program ID from smart contract
export const RPS_PROGRAM_ID = new PublicKey('32tQhc2c4LurhdBwDzzV8f3PtdhKm1iVaPSumDTZWAvb');

export class RPSClient {
  private program: Program;
  private provider: AnchorProvider;

  constructor(connection: Connection, wallet: Wallet) {
    this.provider = new AnchorProvider(connection, wallet, {});
    // TODO: Load IDL and initialize program
    // This will need the actual IDL from the smart contract
    // this.program = new Program(idl, RPS_PROGRAM_ID, this.provider);
  }

  // Generate match PDA
  async getMatchPDA(creator: PublicKey, timestamp: number): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('match'),
        creator.toBuffer(),
        Buffer.from(timestamp.toString())
      ],
      RPS_PROGRAM_ID
    );
  }

  // Generate vault PDA
  async getVaultPDA(matchAccount: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('vault'),
        matchAccount.toBuffer()
      ],
      RPS_PROGRAM_ID
    );
  }

  // Create a new match
  async createMatch(params: CreateMatchParams): Promise<string> {
    const creator = this.provider.wallet.publicKey;
    const timestamp = Math.floor(Date.now() / 1000);
    
    const [matchAccount, matchBump] = await this.getMatchPDA(creator, timestamp);
    const [vault, vaultBump] = await this.getVaultPDA(matchAccount);

    const accounts = {
      matchAccount,
      vault,
      creator,
      systemProgram: SystemProgram.programId,
    };

    // Add token accounts if using SPL tokens
    if (params.tokenMint) {
      const creatorTokenAccount = await getAssociatedTokenAddress(
        params.tokenMint,
        creator
      );
      const vaultTokenAccount = await getAssociatedTokenAddress(
        params.tokenMint,
        vault,
        true
      );
      
      Object.assign(accounts, {
        tokenMint: params.tokenMint,
        creatorTokenAccount,
        vaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      });
    }

    const tx = await this.program.methods
      .createMatch(
        new BN(params.betAmount),
        params.commitmentHash,
        new BN(params.joinDeadline),
        new BN(params.revealDeadline),
        params.feeBps
      )
      .accounts(accounts)
      .rpc();

    return tx;
  }

  // Join an existing match
  async joinMatch(params: JoinMatchParams): Promise<string> {
    const opponent = this.provider.wallet.publicKey;
    const matchAccount = await this.program.account.match.fetch(params.matchAccount);
    const [vault] = await this.getVaultPDA(params.matchAccount);

    const accounts = {
      matchAccount: params.matchAccount,
      vault,
      opponent,
    };

    // Add token accounts if using SPL tokens
    if (matchAccount.tokenMint) {
      const opponentTokenAccount = await getAssociatedTokenAddress(
        matchAccount.tokenMint,
        opponent
      );
      const vaultTokenAccount = await getAssociatedTokenAddress(
        matchAccount.tokenMint,
        vault,
        true
      );
      
      Object.assign(accounts, {
        opponentTokenAccount,
        vaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      });
    }

    const tx = await this.program.methods
      .joinMatch(params.commitmentHash)
      .accounts(accounts)
      .rpc();

    return tx;
  }

  // Reveal player's choice
  async reveal(params: RevealParams): Promise<string> {
    const player = this.provider.wallet.publicKey;

    const tx = await this.program.methods
      .reveal(
        { [Choice[params.choice].toLowerCase()]: {} },
        Array.from(params.salt),
        new BN(params.nonce)
      )
      .accounts({
        matchAccount: params.matchAccount,
        player,
      })
      .rpc();

    return tx;
  }

  // Settle the match
  async settle(matchAccount: PublicKey): Promise<string> {
    const match = await this.program.account.match.fetch(matchAccount);
    const [vault] = await this.getVaultPDA(matchAccount);

    const accounts = {
      matchAccount,
      vault,
      creator: match.creator,
      opponent: match.opponent,
      feeCollector: new PublicKey('V2grJiwjs25iJYqumbHyKo5MTK7SFqZSdmoRaj8QWb9'), // Platform fee collector
      systemProgram: SystemProgram.programId,
    };

    // Add token accounts if using SPL tokens
    if (match.tokenMint) {
      const creatorTokenAccount = await getAssociatedTokenAddress(
        match.tokenMint,
        match.creator
      );
      const opponentTokenAccount = await getAssociatedTokenAddress(
        match.tokenMint,
        match.opponent
      );
      const vaultTokenAccount = await getAssociatedTokenAddress(
        match.tokenMint,
        vault,
        true
      );
      const feeCollectorTokenAccount = await getAssociatedTokenAddress(
        match.tokenMint,
        accounts.feeCollector
      );
      
      Object.assign(accounts, {
        creatorTokenAccount,
        opponentTokenAccount,
        vaultTokenAccount,
        feeCollectorTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      });
    }

    const tx = await this.program.methods
      .settle()
      .accounts(accounts)
      .rpc();

    return tx;
  }

  // Cancel a match (creator only)
  async cancelMatch(matchAccount: PublicKey): Promise<string> {
    const creator = this.provider.wallet.publicKey;
    const match = await this.program.account.match.fetch(matchAccount);
    const [vault] = await this.getVaultPDA(matchAccount);

    const accounts = {
      matchAccount,
      vault,
      creator,
      systemProgram: SystemProgram.programId,
    };

    // Add token accounts if using SPL tokens
    if (match.tokenMint) {
      const creatorTokenAccount = await getAssociatedTokenAddress(
        match.tokenMint,
        creator
      );
      const vaultTokenAccount = await getAssociatedTokenAddress(
        match.tokenMint,
        vault,
        true
      );
      
      Object.assign(accounts, {
        creatorTokenAccount,
        vaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      });
    }

    const tx = await this.program.methods
      .cancelMatch()
      .accounts(accounts)
      .rpc();

    return tx;
  }

  // Get match data
  async getMatch(matchAccount: PublicKey): Promise<RPSMatch> {
    return await this.program.account.match.fetch(matchAccount);
  }

  // Get all matches for a user
  async getUserMatches(userPubkey: PublicKey): Promise<RPSMatch[]> {
    const matches = await this.program.account.match.all([
      {
        memcmp: {
          offset: 8, // After account discriminator
          bytes: userPubkey.toBase58(),
        },
      },
    ]);

    return matches.map(match => match.account);
  }

  // Get all open matches
  async getOpenMatches(): Promise<RPSMatch[]> {
    const matches = await this.program.account.match.all([
      {
        memcmp: {
          offset: 8 + 32 + 32 + 8 + 33 + 32 + 32 + 2 + 2 + 8 + 8, // Status field offset
          bytes: '0', // WaitingForOpponent status
        },
      },
    ]);

    return matches.map(match => match.account);
  }

  // Event listeners
  onMatchCreated(callback: (event: MatchCreatedEvent) => void) {
    return this.program.addEventListener('MatchCreated', callback);
  }

  onMatchJoined(callback: (event: MatchJoinedEvent) => void) {
    return this.program.addEventListener('MatchJoined', callback);
  }

  onChoiceRevealed(callback: (event: ChoiceRevealedEvent) => void) {
    return this.program.addEventListener('ChoiceRevealed', callback);
  }

  onMatchSettled(callback: (event: MatchSettledEvent) => void) {
    return this.program.addEventListener('MatchSettled', callback);
  }
}