import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Replace with your actual program ID
export const PROGRAM_ID = new PublicKey('zYQ16fyWiwZWgWjpQ9JBzL4QwLbp5MbezSBwSi2YTfY');

// RPS IDL generated from the Rust program
export const RPS_IDL: Idl = {
  version: '0.1.0',
  name: 'rps',
  instructions: [
    {
      name: 'createMatch',
      accounts: [
        { name: 'matchAccount', isMut: true, isSigner: false },
        { name: 'vault', isMut: true, isSigner: false },
        { name: 'creator', isMut: true, isSigner: true },
        { name: 'tokenMint', isMut: false, isSigner: false, isOptional: true },
        { name: 'creatorTokenAccount', isMut: true, isSigner: false, isOptional: true },
        { name: 'vaultTokenAccount', isMut: true, isSigner: false, isOptional: true },
        { name: 'tokenProgram', isMut: false, isSigner: false, isOptional: true },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [
        { name: 'betAmount', type: 'u64' },
        { name: 'commitmentHash', type: { array: ['u8', 32] } },
        { name: 'joinDeadline', type: 'i64' },
        { name: 'revealDeadline', type: 'i64' },
        { name: 'feeBps', type: 'u16' },
      ],
    },
    {
      name: 'joinMatch',
      accounts: [
        { name: 'matchAccount', isMut: true, isSigner: false },
        { name: 'vault', isMut: true, isSigner: false },
        { name: 'opponent', isMut: true, isSigner: true },
        { name: 'opponentTokenAccount', isMut: true, isSigner: false, isOptional: true },
        { name: 'vaultTokenAccount', isMut: true, isSigner: false, isOptional: true },
        { name: 'tokenProgram', isMut: false, isSigner: false, isOptional: true },
      ],
      args: [
        { name: 'commitmentHash', type: { array: ['u8', 32] } },
      ],
    },
    {
      name: 'reveal',
      accounts: [
        { name: 'matchAccount', isMut: true, isSigner: false },
        { name: 'player', isMut: false, isSigner: true },
      ],
      args: [
        { name: 'choice', type: { defined: 'Choice' } },
        { name: 'salt', type: { array: ['u8', 32] } },
        { name: 'nonce', type: 'u64' },
      ],
    },
    {
      name: 'settle',
      accounts: [
        { name: 'matchAccount', isMut: true, isSigner: false },
        { name: 'vault', isMut: true, isSigner: false },
        { name: 'creator', isMut: true, isSigner: false },
        { name: 'opponent', isMut: true, isSigner: false },
        { name: 'feeCollector', isMut: true, isSigner: false },
        { name: 'creatorTokenAccount', isMut: true, isSigner: false, isOptional: true },
        { name: 'opponentTokenAccount', isMut: true, isSigner: false, isOptional: true },
        { name: 'vaultTokenAccount', isMut: true, isSigner: false, isOptional: true },
        { name: 'feeCollectorTokenAccount', isMut: true, isSigner: false, isOptional: true },
        { name: 'tokenProgram', isMut: false, isSigner: false, isOptional: true },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: 'cancelMatch',
      accounts: [
        { name: 'matchAccount', isMut: true, isSigner: false },
        { name: 'vault', isMut: true, isSigner: false },
        { name: 'creator', isMut: true, isSigner: true },
        { name: 'creatorTokenAccount', isMut: true, isSigner: false, isOptional: true },
        { name: 'vaultTokenAccount', isMut: true, isSigner: false, isOptional: true },
        { name: 'tokenProgram', isMut: false, isSigner: false, isOptional: true },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: 'timeoutMatch',
      accounts: [
        { name: 'matchAccount', isMut: true, isSigner: false },
        { name: 'vault', isMut: true, isSigner: false },
        { name: 'creator', isMut: true, isSigner: false },
        { name: 'opponent', isMut: true, isSigner: false },
        { name: 'creatorTokenAccount', isMut: true, isSigner: false, isOptional: true },
        { name: 'opponentTokenAccount', isMut: true, isSigner: false, isOptional: true },
        { name: 'vaultTokenAccount', isMut: true, isSigner: false, isOptional: true },
        { name: 'tokenProgram', isMut: false, isSigner: false, isOptional: true },
        { name: 'systemProgram', isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: 'match',
      type: {
        kind: 'struct',
        fields: [
          { name: 'creator', type: 'publicKey' },
          { name: 'opponent', type: 'publicKey' },
          { name: 'betAmount', type: 'u64' },
          { name: 'tokenMint', type: { option: 'publicKey' } },
          { name: 'commitmentCreator', type: { array: ['u8', 32] } },
          { name: 'commitmentOpponent', type: { array: ['u8', 32] } },
          { name: 'revealedCreator', type: { option: { defined: 'Choice' } } },
          { name: 'revealedOpponent', type: { option: { defined: 'Choice' } } },
          { name: 'joinDeadline', type: 'i64' },
          { name: 'revealDeadline', type: 'i64' },
          { name: 'status', type: { defined: 'MatchStatus' } },
          { name: 'feeBps', type: 'u16' },
          { name: 'vaultPdaBump', type: 'u8' },
        ],
      },
    },
  ],
  types: [
    {
      name: 'Choice',
      type: {
        kind: 'enum',
        variants: [
          { name: 'Rock' },
          { name: 'Paper' },
          { name: 'Scissors' },
        ],
      },
    },
    {
      name: 'MatchStatus',
      type: {
        kind: 'enum',
        variants: [
          { name: 'WaitingForOpponent' },
          { name: 'WaitingForReveal' },
          { name: 'ReadyToSettle' },
          { name: 'Settled' },
          { name: 'Cancelled' },
          { name: 'TimedOut' },
        ],
      },
    },
    {
      name: 'GameResult',
      type: {
        kind: 'enum',
        variants: [
          { name: 'CreatorWins' },
          { name: 'OpponentWins' },
          { name: 'Tie' },
        ],
      },
    },
  ],
  events: [
    {
      name: 'MatchCreated',
      fields: [
        { name: 'matchId', type: 'publicKey', index: false },
        { name: 'creator', type: 'publicKey', index: false },
        { name: 'betAmount', type: 'u64', index: false },
        { name: 'tokenMint', type: { option: 'publicKey' }, index: false },
        { name: 'joinDeadline', type: 'i64', index: false },
      ],
    },
    {
      name: 'MatchJoined',
      fields: [
        { name: 'matchId', type: 'publicKey', index: false },
        { name: 'opponent', type: 'publicKey', index: false },
      ],
    },
    {
      name: 'ChoiceRevealed',
      fields: [
        { name: 'matchId', type: 'publicKey', index: false },
        { name: 'player', type: 'publicKey', index: false },
        { name: 'choice', type: { defined: 'Choice' }, index: false },
      ],
    },
    {
      name: 'MatchSettled',
      fields: [
        { name: 'matchId', type: 'publicKey', index: false },
        { name: 'winner', type: { option: 'publicKey' }, index: false },
        { name: 'result', type: { defined: 'GameResult' }, index: false },
      ],
    },
    {
      name: 'MatchCancelled',
      fields: [
        { name: 'matchId', type: 'publicKey', index: false },
      ],
    },
    {
      name: 'MatchTimedOut',
      fields: [
        { name: 'matchId', type: 'publicKey', index: false },
      ],
    },
  ],
};

export function getProvider(wallet: WalletContextState, network = 'devnet') {
  const connection = new Connection(clusterApiUrl(network as any), 'processed');
  return new AnchorProvider(connection, wallet as any, {
    commitment: 'processed',
  });
}

export function getProgram(provider: AnchorProvider) {
  return new Program(RPS_IDL, PROGRAM_ID, provider);
}