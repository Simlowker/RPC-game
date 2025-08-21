// src/rps-client/anchor-client.ts - Mock RPS Client for Development
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
  MatchStatus,
  MatchCreatedEvent,
  MatchJoinedEvent,
  ChoiceRevealedEvent,
  MatchSettledEvent
} from './types';
import { createCommitmentHash } from './utils';

// RPS Program ID from smart contract
export const RPS_PROGRAM_ID = new PublicKey('32tQhc2c4LurhdBwDzzV8f3PtdhKm1iVaPSumDTZWAvb');

// Mock storage for development
let mockMatches: Map<string, RPSMatch> = new Map();
let matchCounter = 0;

export class RPSClient {
  private provider: AnchorProvider;
  private connection: Connection;
  private wallet: Wallet;

  constructor(connection: Connection, wallet: Wallet) {
    this.connection = connection;
    this.wallet = wallet;
    this.provider = new AnchorProvider(connection, wallet, {});
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

  // Create a new match (Mock Implementation)
  async createMatch(params: CreateMatchParams): Promise<string> {
    console.log('Mock createMatch called with params:', params);
    
    if (!this.wallet.publicKey) {
      throw new Error('Wallet not connected - publicKey is null');
    }
    
    const creator = this.wallet.publicKey;
    const timestamp = Math.floor(Date.now() / 1000);
    
    console.log('Creator publicKey:', creator.toString());
    
    // Create mock match with valid PublicKey
    const matchId = `match_${matchCounter++}`;
    // Generate a valid random PublicKey for the match
    const matchAccount = PublicKey.unique();
    
    const mockMatch: RPSMatch = {
      creator,
      opponent: null,
      betAmount: params.betAmount,
      tokenMint: params.tokenMint || null,
      commitmentCreator: params.commitmentHash,
      commitmentOpponent: new Array(32).fill(0),
      revealedCreator: null,
      revealedOpponent: null,
      joinDeadline: params.joinDeadline,
      revealDeadline: params.revealDeadline,
      status: MatchStatus.WaitingForOpponent,
      feeBps: params.feeBps,
      vaultPdaBump: 255,
      createdAt: timestamp,
    };

    mockMatches.set(matchAccount.toString(), mockMatch);
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return 'mock_transaction_' + Date.now().toString();
  }

  // Join an existing match (Mock Implementation)
  async joinMatch(params: JoinMatchParams): Promise<string> {
    const opponent = this.wallet.publicKey;
    const matchKey = params.matchAccount.toString();
    const match = mockMatches.get(matchKey);
    
    if (!match) {
      throw new Error('Match not found');
    }
    
    if (match.status !== MatchStatus.WaitingForOpponent) {
      throw new Error('Match not available for joining');
    }
    
    // Update match with opponent
    match.opponent = opponent;
    match.commitmentOpponent = params.commitmentHash;
    match.status = MatchStatus.WaitingForReveal;
    
    mockMatches.set(matchKey, match);
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return 'mock_join_transaction_' + Date.now().toString();
  }

  // Reveal player's choice (Mock Implementation)
  async reveal(params: RevealParams): Promise<string> {
    const player = this.wallet.publicKey;
    const matchKey = params.matchAccount.toString();
    const match = mockMatches.get(matchKey);
    
    if (!match) {
      throw new Error('Match not found');
    }
    
    // Update revealed choice based on player
    if (match.creator.equals(player)) {
      match.revealedCreator = params.choice;
    } else if (match.opponent && match.opponent.equals(player)) {
      match.revealedOpponent = params.choice;
    } else {
      throw new Error('Not a participant in this match');
    }
    
    // Check if both players have revealed
    if (match.revealedCreator !== null && match.revealedOpponent !== null) {
      match.status = MatchStatus.ReadyToSettle;
    }
    
    mockMatches.set(matchKey, match);
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return 'mock_reveal_transaction_' + Date.now().toString();
  }

  // Settle the match (Mock Implementation)
  async settle(matchAccount: PublicKey): Promise<string> {
    const matchKey = matchAccount.toString();
    const match = mockMatches.get(matchKey);
    
    if (!match) {
      throw new Error('Match not found');
    }
    
    if (match.status !== MatchStatus.ReadyToSettle) {
      throw new Error('Match not ready to settle');
    }
    
    // Update match status
    match.status = MatchStatus.Settled;
    mockMatches.set(matchKey, match);
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return 'mock_settle_transaction_' + Date.now().toString();
  }

  // Cancel a match (creator only) (Mock Implementation)
  async cancelMatch(matchAccount: PublicKey): Promise<string> {
    const creator = this.wallet.publicKey;
    const matchKey = matchAccount.toString();
    const match = mockMatches.get(matchKey);
    
    if (!match) {
      throw new Error('Match not found');
    }
    
    if (!match.creator.equals(creator)) {
      throw new Error('Only creator can cancel the match');
    }
    
    if (match.opponent) {
      throw new Error('Cannot cancel a match that has been joined');
    }
    
    // Update match status
    match.status = MatchStatus.Cancelled;
    mockMatches.set(matchKey, match);
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return 'mock_cancel_transaction_' + Date.now().toString();
  }

  // Get match data (Mock Implementation)
  async getMatch(matchAccount: PublicKey): Promise<RPSMatch> {
    const match = mockMatches.get(matchAccount.toString());
    
    if (!match) {
      throw new Error('Match not found');
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return match;
  }

  // Get all matches for a user (Mock Implementation)
  async getUserMatches(userPubkey: PublicKey): Promise<RPSMatch[]> {
    const userMatches = Array.from(mockMatches.values()).filter(match => 
      match.creator.equals(userPubkey) || 
      (match.opponent && match.opponent.equals(userPubkey))
    );
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return userMatches;
  }

  // Get all open matches (Mock Implementation)
  async getOpenMatches(): Promise<RPSMatch[]> {
    const openMatches = Array.from(mockMatches.values()).filter(match => 
      match.status === MatchStatus.WaitingForOpponent
    );
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return openMatches;
  }

  // Mock event listeners (not implemented in development mode)
  onMatchCreated(callback: (event: MatchCreatedEvent) => void) {
    console.log('Mock: Event listener for MatchCreated registered');
    return () => console.log('Mock: Event listener removed');
  }

  onMatchJoined(callback: (event: MatchJoinedEvent) => void) {
    console.log('Mock: Event listener for MatchJoined registered');
    return () => console.log('Mock: Event listener removed');
  }

  onChoiceRevealed(callback: (event: ChoiceRevealedEvent) => void) {
    console.log('Mock: Event listener for ChoiceRevealed registered');
    return () => console.log('Mock: Event listener removed');
  }

  onMatchSettled(callback: (event: MatchSettledEvent) => void) {
    console.log('Mock: Event listener for MatchSettled registered');
    return () => console.log('Mock: Event listener removed');
  }
}