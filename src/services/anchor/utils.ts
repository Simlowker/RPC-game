// src/rps-client/utils.ts - RPS Client Utilities
import { PublicKey } from '@solana/web3.js';
import { Choice, GameResult } from './types';
import { sha256 } from 'js-sha256';

// Generate random salt for commitment
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

// Generate random nonce
export function generateNonce(): number {
  return Math.floor(Math.random() * 0xFFFFFFFF);
}

// Create commitment hash (matches smart contract logic)
export function createCommitmentHash(
  choice: Choice,
  salt: Uint8Array,
  player: PublicKey,
  nonce: number
): Uint8Array {
  const choiceBuffer = new Uint8Array([choice]);
  const playerBuffer = player.toBytes();
  const nonceBuffer = new Uint8Array(8);
  new DataView(nonceBuffer.buffer).setBigUint64(0, BigInt(nonce), true);

  // Concatenate all data
  const data = new Uint8Array(
    choiceBuffer.length + salt.length + playerBuffer.length + nonceBuffer.length
  );
  let offset = 0;
  
  data.set(choiceBuffer, offset);
  offset += choiceBuffer.length;
  
  data.set(salt, offset);
  offset += salt.length;
  
  data.set(playerBuffer, offset);
  offset += playerBuffer.length;
  
  data.set(nonceBuffer, offset);

  // Hash the concatenated data
  return new Uint8Array(sha256.arrayBuffer(data));
}

// Determine game winner (matches smart contract logic)
export function determineWinner(creatorChoice: Choice, opponentChoice: Choice): GameResult {
  if (creatorChoice === opponentChoice) {
    return GameResult.Tie;
  }

  const winningCombos = [
    [Choice.Rock, Choice.Scissors],
    [Choice.Paper, Choice.Rock],
    [Choice.Scissors, Choice.Paper],
  ];

  const creatorWins = winningCombos.some(
    ([winner, loser]) => creatorChoice === winner && opponentChoice === loser
  );

  return creatorWins ? GameResult.CreatorWins : GameResult.OpponentWins;
}

// Format SOL amount for display
export function formatSOL(lamports: number): string {
  return (lamports / 1e9).toFixed(4);
}

// Convert SOL to lamports
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1e9);
}

// Format time remaining
export function formatTimeRemaining(deadline: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = deadline - now;
  
  if (remaining <= 0) {
    return 'Expired';
  }
  
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// Get choice emoji
export function getChoiceEmoji(choice: Choice): string {
  switch (choice) {
    case Choice.Rock:
      return '🪨';
    case Choice.Paper:
      return '📄';
    case Choice.Scissors:
      return '✂️';
    default:
      return '❓';
  }
}

// Get choice name
export function getChoiceName(choice: Choice): string {
  return Choice[choice];
}

// Get result emoji
export function getResultEmoji(result: GameResult): string {
  switch (result) {
    case GameResult.CreatorWins:
    case GameResult.OpponentWins:
      return '🏆';
    case GameResult.Tie:
      return '🤝';
    default:
      return '❓';
  }
}

// Generate match short ID for display
export function generateMatchShortId(pubkey: PublicKey): string {
  const base58 = pubkey.toBase58();
  return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
}

// Validate bet amount
export function validateBetAmount(amount: number, min: number = 0.001, max: number = 100): string | null {
  if (amount < min) {
    return `Minimum bet is ${min} SOL`;
  }
  if (amount > max) {
    return `Maximum bet is ${max} SOL`;
  }
  if (amount % 0.001 !== 0) {
    return 'Bet amount must be in increments of 0.001 SOL';
  }
  return null;
}

// Calculate potential payout
export function calculatePayout(betAmount: number, feeBps: number): number {
  const totalPot = betAmount * 2;
  const fee = (totalPot * feeBps) / 10000;
  return totalPot - fee;
}

// Format error messages for user display
export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    // Handle Anchor program errors
    if (error.message.includes('InvalidBetAmount')) {
      return 'Invalid bet amount';
    }
    if (error.message.includes('DeadlinePassed')) {
      return 'Deadline has passed';
    }
    if (error.message.includes('CannotPlaySelf')) {
      return 'Cannot play against yourself';
    }
    if (error.message.includes('InvalidCommitment')) {
      return 'Invalid choice commitment';
    }
    if (error.message.includes('AlreadyRevealed')) {
      return 'Choice already revealed';
    }
    if (error.message.includes('NotParticipant')) {
      return 'You are not a participant in this match';
    }
    
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

// Check if user can perform actions
export function canJoinMatch(match: any, userPubkey: PublicKey, currentTime: number): boolean {
  return (
    match.status === 0 && // WaitingForOpponent
    currentTime <= match.joinDeadline &&
    !userPubkey.equals(match.creator)
  );
}

export function canRevealChoice(match: any, userPubkey: PublicKey, currentTime: number): boolean {
  if (match.status !== 1 || currentTime > match.revealDeadline) { // WaitingForReveal
    return false;
  }
  
  const isCreator = userPubkey.equals(match.creator);
  const isOpponent = userPubkey.equals(match.opponent);
  
  return (
    (isCreator && !match.revealedCreator) ||
    (isOpponent && !match.revealedOpponent)
  );
}

export function canSettleMatch(match: any): boolean {
  return match.status === 2; // ReadyToSettle
}