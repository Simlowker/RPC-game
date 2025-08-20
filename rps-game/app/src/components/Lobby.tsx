import React, { useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import toast from 'react-hot-toast';
import { Plus, RefreshCw } from 'lucide-react';
import { getProvider, getProgram } from '../utils/anchor';
import { Match, parseSOL } from '../utils/game';
import CreateMatchModal from './CreateMatchModal';
import MatchList from './MatchList';
import ErrorBoundary from './ErrorBoundary';
import { MatchListSkeleton, ErrorState } from './LoadingStates';
import { ActiveMatch } from './GameApp';

interface LobbyProps {
  onJoinMatch: (match: ActiveMatch) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoinMatch }) => {
  const { publicKey, wallet } = useWallet();
  const { connection } = useConnection();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMatch = useCallback(async (
    betAmount: number,
    tokenMint?: PublicKey
  ) => {
    if (!publicKey || !wallet) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      const provider = getProvider({ publicKey, wallet } as any);
      const program = getProgram(provider);

      // Calculate deadlines (24 hours to join, 1 hour to reveal)
      const now = Math.floor(Date.now() / 1000);
      const joinDeadline = now + (24 * 3600);
      const revealDeadline = joinDeadline + (1 * 3600);

      // Create match account
      const matchKeypair = Keypair.generate();
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), matchKeypair.publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .createMatch(
          betAmount,
          [],  // Empty commitment initially
          joinDeadline,
          revealDeadline,
          250 // 2.5% fee
        )
        .accounts({
          matchAccount: matchKeypair.publicKey,
          vault: vaultPda,
          creator: publicKey,
          tokenMint: tokenMint || null,
          creatorTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
          systemProgram: PublicKey.default,
        })
        .signers([matchKeypair])
        .rpc();

      await loadMatches(); // Refresh matches list
      onJoinMatch({
        matchId: matchKeypair.publicKey,
        isCreator: true,
      });
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }, [publicKey, wallet, onJoinMatch]);

  const loadMatches = useCallback(async () => {
    if (!publicKey) return;

    setIsLoading(true);
    setError(null);
    try {
      const provider = getProvider({ publicKey, wallet } as any);
      const program = getProgram(provider);

      // Get all match accounts
      const matchAccounts = await program.account.match.all();
      
      // Convert to our Match interface
      const formattedMatches: Match[] = matchAccounts.map(({ account, publicKey: matchPubkey }) => ({
        ...account,
        id: matchPubkey,
      }));

      setMatches(formattedMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
      setError(error instanceof Error ? error.message : 'Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, wallet]);

  const joinMatch = useCallback(async (matchId: PublicKey) => {
    if (!publicKey || !wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const provider = getProvider({ publicKey, wallet } as any);
      const program = getProgram(provider);

      const matchAccount = await program.account.match.fetch(matchId);
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), matchId.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .joinMatch([])  // Empty commitment initially
        .accounts({
          matchAccount: matchId,
          vault: vaultPda,
          opponent: publicKey,
          opponentTokenAccount: null,
          vaultTokenAccount: null,
          tokenProgram: null,
        })
        .rpc();

      await loadMatches(); // Refresh matches list
    } catch (error) {
      console.error('Error joining match:', error);
      throw error;
    }
  }, [publicKey, wallet, loadMatches]);

  React.useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header - Responsive */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">🗿📄✂️ Game Lobby</h2>
          <p className="text-gray-300 text-sm sm:text-base">Create a new match or join an existing one</p>
        </div>

        {/* Controls - Mobile responsive */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Match</span>
          </button>

          <button
            onClick={loadMatches}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Match List with Loading and Error States */}
        {isLoading ? (
          <MatchListSkeleton />
        ) : error ? (
          <ErrorState
            title="Failed to load matches"
            message={error}
            onRetry={loadMatches}
            retryLabel="Try Again"
          />
        ) : (
          <MatchList
            matches={matches}
            onJoinMatch={joinMatch}
            onSelectMatch={onJoinMatch}
            onRefresh={loadMatches}
            loading={isLoading}
            error={error}
          />
        )}

        {/* Create Match Modal */}
        <CreateMatchModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateMatch={createMatch}
        />
      </div>
    </ErrorBoundary>
  );
};

export default Lobby;