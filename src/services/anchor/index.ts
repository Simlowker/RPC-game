// src/services/anchor/index.ts - Anchor Client Exports
export * from './types';
export * from './anchor-client';
export * from './utils';
export * from './rps-anchor-client';
export { RPS_PROGRAM_ID } from './anchor-client';

// Export the real Anchor client as the preferred client
export { RPSAnchorClient } from './rps-anchor-client';
export type { 
  UniversalMatch,
  CommitmentData,
  RPSGameState,
  GameConfig as AnchorGameConfig
} from './rps-anchor-client';

export {
  RPSChoice,
  MatchStatus,
  GameResult,
  GameType
} from './rps-anchor-client';