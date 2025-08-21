// src/rps-client/types.ts - RPS Smart Contract Types
import { PublicKey } from '@solana/web3.js';

export enum Choice {
  Rock = 0,
  Paper = 1,
  Scissors = 2,
}

export enum MatchStatus {
  WaitingForOpponent = 0,
  WaitingForReveal = 1,
  ReadyToSettle = 2,
  Settled = 3,
  Cancelled = 4,
  TimedOut = 5,
}

export enum GameResult {
  CreatorWins = 0,
  OpponentWins = 1,
  Tie = 2,
}

export interface RPSMatch {
  creator: PublicKey;
  opponent: PublicKey;
  betAmount: number;
  tokenMint?: PublicKey;
  commitmentCreator: number[];
  commitmentOpponent: number[];
  revealedCreator?: Choice;
  revealedOpponent?: Choice;
  joinDeadline: number;
  revealDeadline: number;
  status: MatchStatus;
  feeBps: number;
  vaultPdaBump: number;
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

// Event types
export interface MatchCreatedEvent {
  matchId: PublicKey;
  creator: PublicKey;
  betAmount: number;
  tokenMint?: PublicKey;
  joinDeadline: number;
}

export interface MatchJoinedEvent {
  matchId: PublicKey;
  opponent: PublicKey;
}

export interface ChoiceRevealedEvent {
  matchId: PublicKey;
  player: PublicKey;
  choice: Choice;
}

export interface MatchSettledEvent {
  matchId: PublicKey;
  winner?: PublicKey;
  result: GameResult;
}

// UI State types
export interface MatchUI extends RPSMatch {
  id: PublicKey;
  timeLeft: number;
  canJoin: boolean;
  canReveal: boolean;
  canSettle: boolean;
  isUserCreator: boolean;
  isUserOpponent: boolean;
  isUserParticipant: boolean;
}

export interface GameState {
  userChoice?: Choice;
  commitmentSalt?: Uint8Array;
  commitmentNonce?: number;
  isCommitted: boolean;
  isRevealed: boolean;
  opponentChoice?: Choice;
  gameResult?: GameResult;
  winner?: PublicKey;
}