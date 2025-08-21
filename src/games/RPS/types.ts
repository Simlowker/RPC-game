// src/games/RPS/types.ts - RPS Game UI Types
import { PublicKey } from '@solana/web3.js';
import { Choice, MatchStatus, GameResult } from '../../rps-client';

export interface GameConfig {
  minBet: number;
  maxBet: number;
  defaultJoinDeadlineMinutes: number;
  defaultRevealDeadlineMinutes: number;
  feeBps: number;
}

export interface CreateMatchForm {
  betAmount: string;
  joinDeadlineMinutes: number;
  revealDeadlineMinutes: number;
  tokenMint?: PublicKey;
}

export interface GamePhase {
  phase: 'lobby' | 'waiting' | 'choosing' | 'revealing' | 'results' | 'settled';
  canTransition: boolean;
  nextPhase?: string;
}

export interface AnimationState {
  choiceSelection: boolean;
  revealing: boolean;
  results: boolean;
  payout: boolean;
}

export interface SoundEffects {
  select: boolean;
  reveal: boolean;
  win: boolean;
  lose: boolean;
  tie: boolean;
}

export interface MatchDisplayData {
  id: string;
  creator: string;
  opponent?: string;
  betAmount: number;
  timeLeft: number;
  status: MatchStatus;
  canJoin: boolean;
  canReveal: boolean;
  canSettle: boolean;
  isUserMatch: boolean;
  isCreator: boolean;
  isOpponent: boolean;
}

export interface GameStats {
  totalMatches: number;
  wins: number;
  losses: number;
  ties: number;
  totalWinnings: number;
  winRate: number;
}

export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
}