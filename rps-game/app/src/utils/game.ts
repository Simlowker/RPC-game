import { Sha256 } from 'sha2';
import { PublicKey } from '@solana/web3.js';

export const Choice = {
  Rock: 'Rock',
  Paper: 'Paper', 
  Scissors: 'Scissors',
} as const;

export type Choice = typeof Choice[keyof typeof Choice];

export const MatchStatus = {
  WaitingForOpponent: 'WaitingForOpponent',
  WaitingForReveal: 'WaitingForReveal',
  ReadyToSettle: 'ReadyToSettle',
  Settled: 'Settled',
  Cancelled: 'Cancelled',
  TimedOut: 'TimedOut',
} as const;

export type MatchStatus = typeof MatchStatus[keyof typeof MatchStatus];

export const GameResult = {
  CreatorWins: 'CreatorWins',
  OpponentWins: 'OpponentWins',
  Tie: 'Tie',
} as const;

export type GameResult = typeof GameResult[keyof typeof GameResult];

export interface Match {
  creator: PublicKey;
  opponent: PublicKey;
  betAmount: number;
  tokenMint?: PublicKey;
  commitmentCreator: Uint8Array;
  commitmentOpponent: Uint8Array;
  revealedCreator?: Choice;
  revealedOpponent?: Choice;
  joinDeadline: number;
  revealDeadline: number;
  status: MatchStatus;
  feeBps: number;
  vaultPdaBump: number;
}

export function createCommitmentHash(
  choice: Choice,
  salt: Uint8Array,
  player: PublicKey,
  nonce: number
): Uint8Array {
  const hasher = new Sha256();
  
  // Convert choice to byte
  const choiceIndex = Object.values(Choice).indexOf(choice);
  hasher.update(new Uint8Array([choiceIndex]));
  
  // Add salt
  hasher.update(salt);
  
  // Add player public key
  hasher.update(player.toBytes());
  
  // Add nonce as little-endian bytes
  const nonceBytes = new Uint8Array(8);
  const view = new DataView(nonceBytes.buffer);
  view.setBigUint64(0, BigInt(nonce), true); // true for little-endian
  hasher.update(nonceBytes);
  
  return hasher.digest();
}

export function determineWinner(creatorChoice: Choice, opponentChoice: Choice): GameResult {
  if (creatorChoice === opponentChoice) {
    return GameResult.Tie;
  }
  
  const winConditions = {
    [Choice.Rock]: Choice.Scissors,
    [Choice.Paper]: Choice.Rock,
    [Choice.Scissors]: Choice.Paper,
  };
  
  return winConditions[creatorChoice] === opponentChoice 
    ? GameResult.CreatorWins 
    : GameResult.OpponentWins;
}

export function getChoiceEmoji(choice: Choice): string {
  switch (choice) {
    case Choice.Rock:
      return '🗿';
    case Choice.Paper:
      return '📄';
    case Choice.Scissors:
      return '✂️';
    default:
      return '❓';
  }
}

export function getStatusMessage(status: MatchStatus): string {
  switch (status) {
    case MatchStatus.WaitingForOpponent:
      return 'Waiting for opponent to join';
    case MatchStatus.WaitingForReveal:
      return 'Waiting for players to reveal';
    case MatchStatus.ReadyToSettle:
      return 'Ready to settle';
    case MatchStatus.Settled:
      return 'Match settled';
    case MatchStatus.Cancelled:
      return 'Match cancelled';
    case MatchStatus.TimedOut:
      return 'Match timed out';
    default:
      return 'Unknown status';
  }
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function generateNonce(): number {
  return Math.floor(Math.random() * 1000000);
}

export function formatSOL(lamports: number): string {
  return (lamports / 1e9).toFixed(4);
}

export function parseSOL(sol: string): number {
  return Math.floor(parseFloat(sol) * 1e9);
}