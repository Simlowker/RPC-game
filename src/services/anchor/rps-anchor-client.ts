// Real Anchor client for Universal PvP Rock Paper Scissors game
import { 
  PublicKey, 
  Connection, 
  SystemProgram,
  Transaction,
  Keypair,
  TransactionInstruction,
  sendAndConfirmTransaction,
  ComputeBudgetProgram
} from '@solana/web3.js';
import { 
  Program, 
  AnchorProvider, 
  Wallet, 
  BN, 
  web3,
  Idl,
  utils
} from '@coral-xyz/anchor';
import { 
  getAssociatedTokenAddress, 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import IDL from './idl.json';
// Use Web Crypto API for browser compatibility
const createHash = async (data: Uint8Array): Promise<Uint8Array> => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
};

// Universal PvP Program ID (DEVNET)
export const RPS_PROGRAM_ID = new PublicKey('4bdQ9U3yXD9EY2SxxMVasPmp5gw7RLtnc8yTkFZovmRR');

// Types
export enum GameType {
  RockPaperScissors = 0,
  Dice = 1,
  CoinFlip = 2,
  Custom = 3
}

export enum RPSChoice {
  Rock = 0,
  Paper = 1,
  Scissors = 2
}

export enum MatchStatus {
  WaitingForOpponent = 0,
  WaitingForCommit = 1,
  WaitingForReveal = 2,
  ReadyToSettle = 3,
  Settled = 4,
  Cancelled = 5,
  TimedOut = 6
}

export enum GameResult {
  Player1Wins = 0,
  Player2Wins = 1,
  Draw = 2,
  Pending = 3
}

export interface GameConfig {
  maxPlayers: number;
  minBet: BN;
  maxBet: BN;
  rounds: number;
  customParams: number[];
}

export interface UniversalMatch {
  matchId: PublicKey;
  gameType: GameType;
  creator: PublicKey;
  opponent: PublicKey | null;
  betAmount: BN;
  tokenMint: PublicKey | null;
  totalPot: BN;
  status: MatchStatus;
  gameState: Buffer;
  winner: PublicKey | null;
  createdAt: BN;
  startedAt: BN | null;
  endedAt: BN | null;
  timeoutSeconds: number;
  gameConfig: GameConfig;
  vaultBump: number;
}

export interface RPSGameState {
  player1Commitment: Uint8Array;
  player2Commitment: Uint8Array;
  player1Revealed: RPSChoice | null;
  player2Revealed: RPSChoice | null;
  revealDeadline: BN;
}

export interface CommitmentData {
  choice: RPSChoice;
  salt: Uint8Array;
  nonce: number;
  commitment: Uint8Array;
  matchId: string;
  timestamp: number;
}

export class RPSAnchorClient {
  private program: Program;
  private provider: AnchorProvider;
  private connection: Connection;
  private wallet: Wallet;

  constructor(connection: Connection, wallet: Wallet) {
    this.connection = connection;
    this.wallet = wallet;
    this.provider = new AnchorProvider(
      connection, 
      wallet, 
      { 
        commitment: 'confirmed',
        preflightCommitment: 'confirmed'
      }
    );
    
    // Initialize the program with IDL
    this.program = new Program(
      IDL as Idl,
      RPS_PROGRAM_ID,
      this.provider
    );
  }

  // Generate a commitment hash for Rock Paper Scissors
  async generateCommitment(choice: RPSChoice, salt?: Uint8Array): Promise<{ commitment: Uint8Array; salt: Uint8Array }> {
    // Generate random salt if not provided
    const actualSalt = salt || web3.Keypair.generate().secretKey.slice(0, 32);
    
    // Create commitment: hash(choice + salt + player)
    const data = Buffer.concat([
      Buffer.from([choice]),
      actualSalt,
      this.wallet.publicKey.toBuffer()
    ]);
    
    const commitment = await createHash(data);
    
    return {
      commitment,
      salt: actualSalt
    };
  }

  // Store commitment data locally
  storeCommitment(matchId: string, commitmentData: CommitmentData): void {
    const key = `rps_commitment_${matchId}`;
    localStorage.setItem(key, JSON.stringify({
      ...commitmentData,
      salt: Array.from(commitmentData.salt),
      commitment: Array.from(commitmentData.commitment)
    }));
  }

  // Retrieve commitment data
  getCommitment(matchId: string): CommitmentData | null {
    const key = `rps_commitment_${matchId}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      salt: new Uint8Array(parsed.salt),
      commitment: new Uint8Array(parsed.commitment)
    };
  }

  // Calculate PDAs
  async getMatchPDA(matchKeypair: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('match'), matchKeypair.toBuffer()],
      this.program.programId
    );
  }

  async getVaultPDA(matchAccount: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), matchAccount.toBuffer()],
      this.program.programId
    );
  }

  async getGameRegistryPDA(): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('registry')],
      this.program.programId
    );
  }

  // Create a new match
  async createMatch(
    betAmount: number,
    choice: RPSChoice,
    rounds: number = 1
  ): Promise<{ signature: string; matchId: string; commitmentData: CommitmentData }> {
    try {
      const betAmountLamports = new BN(betAmount * web3.LAMPORTS_PER_SOL);
      
      // Generate match keypair
      const matchKeypair = web3.Keypair.generate();
      
      // Generate commitment for initial choice
      const { commitment, salt } = await this.generateCommitment(choice);
      
      // Get PDAs
      const [vaultPDA] = await this.getVaultPDA(matchKeypair.publicKey);
      
      // Create game config
      const gameConfig = {
        maxPlayers: 2,
        minBet: new BN(0.001 * web3.LAMPORTS_PER_SOL),
        maxBet: new BN(100 * web3.LAMPORTS_PER_SOL),
        rounds,
        customParams: new Array(16).fill(0)
      };

      // Build transaction
      const tx = await this.program.methods
        .createUniversalMatch(
          { rockPaperScissors: {} } as any, // GameType enum
          betAmountLamports,
          gameConfig
        )
        .accounts({
          matchAccount: matchKeypair.publicKey,
          creator: this.wallet.publicKey,
          vault: vaultPDA,
          tokenMint: null,
          creatorTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
          systemProgram: SystemProgram.programId
        })
        .signers([matchKeypair])
        .transaction();

      // Add priority fee
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300000
      });
      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000
      });
      
      tx.add(modifyComputeUnits);
      tx.add(addPriorityFee);

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx, [matchKeypair]);

      // Store commitment data locally
      const commitmentData: CommitmentData = {
        choice,
        salt,
        nonce: Date.now(),
        commitment,
        matchId: matchKeypair.publicKey.toString(),
        timestamp: Date.now()
      };
      this.storeCommitment(matchKeypair.publicKey.toString(), commitmentData);

      return {
        signature,
        matchId: matchKeypair.publicKey.toString(),
        commitmentData
      };
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  // Join an existing match
  async joinMatch(
    matchId: string,
    choice: RPSChoice
  ): Promise<{ signature: string; commitmentData: CommitmentData }> {
    try {
      const matchPubkey = new PublicKey(matchId);
      
      // Get match data first
      const matchAccount = await this.getMatch(matchPubkey);
      if (!matchAccount) {
        throw new Error('Match not found');
      }

      // Generate commitment for choice
      const { commitment, salt } = await this.generateCommitment(choice);
      
      // Get PDAs
      const [vaultPDA] = await this.getVaultPDA(matchPubkey);

      // Build transaction
      const tx = await this.program.methods
        .joinMatch()
        .accounts({
          matchAccount: matchPubkey,
          opponent: this.wallet.publicKey,
          vault: vaultPDA,
          tokenMint: null,
          opponentTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
          systemProgram: SystemProgram.programId
        })
        .transaction();

      // Then submit the commitment
      const commitTx = await this.program.methods
        .commitChoice(Array.from(commitment))
        .accounts({
          matchAccount: matchPubkey,
          player: this.wallet.publicKey
        })
        .transaction();

      // Combine transactions
      tx.add(commitTx);

      // Add priority fee
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300000
      });
      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000
      });
      
      tx.add(modifyComputeUnits);
      tx.add(addPriorityFee);

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx);

      // Store commitment data locally
      const commitmentData: CommitmentData = {
        choice,
        salt,
        nonce: Date.now(),
        commitment,
        matchId,
        timestamp: Date.now()
      };
      this.storeCommitment(matchId, commitmentData);

      return {
        signature,
        commitmentData
      };
    } catch (error) {
      console.error('Error joining match:', error);
      throw error;
    }
  }

  // Reveal choice
  async revealChoice(matchId: string): Promise<string> {
    try {
      const matchPubkey = new PublicKey(matchId);
      
      // Get stored commitment data
      const commitmentData = this.getCommitment(matchId);
      if (!commitmentData) {
        throw new Error('Commitment data not found. Cannot reveal choice.');
      }

      // Build transaction
      const tx = await this.program.methods
        .revealChoice(
          commitmentData.choice,
          Array.from(commitmentData.salt)
        )
        .accounts({
          matchAccount: matchPubkey,
          player: this.wallet.publicKey
        })
        .transaction();

      // Add priority fee
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 200000
      });
      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000
      });
      
      tx.add(modifyComputeUnits);
      tx.add(addPriorityFee);

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx);

      return signature;
    } catch (error) {
      console.error('Error revealing choice:', error);
      throw error;
    }
  }

  // Settle match
  async settleMatch(matchId: string): Promise<string> {
    try {
      const matchPubkey = new PublicKey(matchId);
      
      // Get match data
      const matchAccount = await this.getMatch(matchPubkey);
      if (!matchAccount) {
        throw new Error('Match not found');
      }

      // Get PDAs
      const [vaultPDA] = await this.getVaultPDA(matchPubkey);

      // Determine winner account based on match result
      const winnerAccount = matchAccount.winner || matchAccount.creator;

      // Build transaction
      const tx = await this.program.methods
        .settleMatch()
        .accounts({
          matchAccount: matchPubkey,
          creator: matchAccount.creator,
          opponent: matchAccount.opponent || matchAccount.creator, // Fallback if no opponent
          vault: vaultPDA,
          tokenMint: null,
          vaultTokenAccount: null,
          winnerTokenAccount: null,
          tokenProgram: null,
          systemProgram: SystemProgram.programId
        })
        .transaction();

      // Add priority fee
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300000
      });
      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000
      });
      
      tx.add(modifyComputeUnits);
      tx.add(addPriorityFee);

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx);

      // Clean up local storage
      const key = `rps_commitment_${matchId}`;
      localStorage.removeItem(key);

      return signature;
    } catch (error) {
      console.error('Error settling match:', error);
      throw error;
    }
  }

  // Claim timeout (when opponent doesn't reveal in time)
  async claimTimeout(matchId: string): Promise<string> {
    try {
      const matchPubkey = new PublicKey(matchId);
      const [vaultPDA] = await this.getVaultPDA(matchPubkey);

      const tx = await this.program.methods
        .claimTimeout()
        .accounts({
          matchAccount: matchPubkey,
          claimer: this.wallet.publicKey,
          vault: vaultPDA,
          systemProgram: SystemProgram.programId
        })
        .transaction();

      // Add priority fee
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 200000
      });
      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000
      });
      
      tx.add(modifyComputeUnits);
      tx.add(addPriorityFee);

      const signature = await this.provider.sendAndConfirm(tx);
      return signature;
    } catch (error) {
      console.error('Error claiming timeout:', error);
      throw error;
    }
  }

  // Get match data
  async getMatch(matchAccount: PublicKey): Promise<UniversalMatch | null> {
    try {
      const match = await this.program.account.universalMatch.fetch(matchAccount);
      return match as any;
    } catch (error) {
      console.error('Error fetching match:', error);
      return null;
    }
  }

  // Get all open matches
  async getOpenMatches(): Promise<UniversalMatch[]> {
    try {
      const matches = await this.program.account.universalMatch.all([
        {
          memcmp: {
            offset: 8 + 32 + 32, // After discriminator + matchId + gameType
            bytes: utils.bytes.bs58.encode(Buffer.from([MatchStatus.WaitingForOpponent]))
          }
        }
      ]);
      
      return matches.map(m => m.account as any);
    } catch (error) {
      console.error('Error fetching open matches:', error);
      return [];
    }
  }

  // Get user matches
  async getUserMatches(userPubkey: PublicKey): Promise<UniversalMatch[]> {
    try {
      const allMatches = await this.program.account.universalMatch.all();
      
      // Filter matches where user is creator or opponent
      const userMatches = allMatches.filter(m => {
        const match = m.account as any;
        return match.creator.equals(userPubkey) || 
               (match.opponent && match.opponent.equals(userPubkey));
      });
      
      return userMatches.map(m => m.account as any);
    } catch (error) {
      console.error('Error fetching user matches:', error);
      return [];
    }
  }

  // Subscribe to match events
  subscribeToMatchEvents(
    matchId: PublicKey,
    onUpdate: (match: UniversalMatch) => void
  ): number {
    return this.program.account.universalMatch.subscribe(matchId, 'confirmed')
      .on('change', (match: any) => {
        onUpdate(match);
      });
  }

  // Unsubscribe from events
  async unsubscribe(subscriptionId: number): Promise<void> {
    await this.program.account.universalMatch.unsubscribe(subscriptionId);
  }

  // Helper to determine winner from game state
  determineWinner(match: UniversalMatch): GameResult {
    if (match.status !== MatchStatus.Settled) {
      return GameResult.Pending;
    }

    // Parse game state to get choices
    try {
      const gameState = this.parseGameState(match.gameState);
      if (!gameState.player1Revealed || !gameState.player2Revealed) {
        return GameResult.Pending;
      }

      const p1Choice = gameState.player1Revealed;
      const p2Choice = gameState.player2Revealed;

      // Rock Paper Scissors logic
      if (p1Choice === p2Choice) {
        return GameResult.Draw;
      }

      const wins = [
        [RPSChoice.Rock, RPSChoice.Scissors],
        [RPSChoice.Paper, RPSChoice.Rock],
        [RPSChoice.Scissors, RPSChoice.Paper]
      ];

      for (const [winner, loser] of wins) {
        if (p1Choice === winner && p2Choice === loser) {
          return GameResult.Player1Wins;
        }
        if (p2Choice === winner && p1Choice === loser) {
          return GameResult.Player2Wins;
        }
      }

      return GameResult.Pending;
    } catch (error) {
      console.error('Error determining winner:', error);
      return GameResult.Pending;
    }
  }

  // Parse game state buffer
  private parseGameState(gameStateBuffer: Buffer): RPSGameState {
    // Parse according to the Rust struct layout
    const player1Commitment = new Uint8Array(gameStateBuffer.slice(0, 32));
    const player2Commitment = new Uint8Array(gameStateBuffer.slice(32, 64));
    
    const player1RevealedFlag = gameStateBuffer[64];
    const player1RevealedValue = gameStateBuffer[65];
    const player1Revealed = player1RevealedFlag === 1 ? player1RevealedValue as RPSChoice : null;
    
    const player2RevealedFlag = gameStateBuffer[66];
    const player2RevealedValue = gameStateBuffer[67];
    const player2Revealed = player2RevealedFlag === 1 ? player2RevealedValue as RPSChoice : null;
    
    const revealDeadline = new BN(gameStateBuffer.slice(68, 76), 'le');

    return {
      player1Commitment,
      player2Commitment,
      player1Revealed,
      player2Revealed,
      revealDeadline
    };
  }
}