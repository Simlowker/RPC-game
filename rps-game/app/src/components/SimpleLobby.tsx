import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Plus, RefreshCw, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ErrorBoundary from './ErrorBoundary';
import CreateMatchModal from './CreateMatchModal';
import { EmptyState } from './LoadingStates';
import type { ActiveMatch } from './GameApp';
import { useGameSounds, SoundEffect } from '../hooks/useGameSounds';

interface SimpleLobbyProps {
  onJoinMatch: (match: ActiveMatch) => void;
}

const SimpleLobby: React.FC<SimpleLobbyProps> = ({ onJoinMatch }) => {
  const { publicKey } = useWallet();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { playSound } = useGameSounds();
  
  const handleCreateMatch = async () => {
    if (!publicKey) {
      toast.error('Wallet not connected');
      playSound(SoundEffect.NOTIFICATION_ERROR);
      return;
    }

    try {
      // For demo purposes, create a mock match
      const mockMatchId = new PublicKey('11111111111111111111111111111112');
      
      playSound(SoundEffect.MATCH_CREATED);
      toast.success('Match created successfully!');
      onJoinMatch({
        matchId: mockMatchId,
        isCreator: true,
      });
    } catch (error) {
      console.error('Error creating match:', error);
      playSound(SoundEffect.NOTIFICATION_ERROR);
      throw error;
    }
  };

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
            onClick={() => {
              playSound(SoundEffect.BUTTON_CLICK);
              setIsCreateModalOpen(true);
            }}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Match</span>
          </button>

          <button
            disabled
            className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg font-medium opacity-50 cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Empty State */}
        <EmptyState
          icon={<Users size={48} />}
          title="No matches available"
          description="Create a match to get started with Rock Paper Scissors!"
          action={{
            label: "Create Your First Match",
            onClick: () => {
              playSound(SoundEffect.BUTTON_CLICK);
              setIsCreateModalOpen(true);
            },
          }}
        />

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">🎮 How to Play</h3>
            <p className="text-gray-400 text-sm">
              Create a match, commit your choice secretly, then reveal to determine the winner!
            </p>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">💰 Betting</h3>
            <p className="text-gray-400 text-sm">
              Bet SOL or SPL tokens. Winner takes all minus small platform fees.
            </p>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">🔒 Fair Play</h3>
            <p className="text-gray-400 text-sm">
              Commitment-reveal scheme ensures no cheating. All moves are final!
            </p>
          </div>
        </div>

        {/* Development Status */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <h3 className="text-yellow-400 font-medium mb-2">🚧 Development Status</h3>
          <p className="text-yellow-300 text-sm">
            This is a demo version. Smart contracts are being deployed to devnet. 
            Full functionality will be available soon!
          </p>
        </div>

        {/* Create Match Modal */}
        <CreateMatchModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateMatch={handleCreateMatch}
        />
      </div>
    </ErrorBoundary>
  );
};

export default SimpleLobby;