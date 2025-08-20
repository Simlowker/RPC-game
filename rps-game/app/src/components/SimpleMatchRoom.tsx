import React from 'react';
import { PublicKey } from '@solana/web3.js';
import { ArrowLeft, Clock } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

interface SimpleMatchRoomProps {
  matchId: PublicKey;
  isCreator: boolean;
  onBack: () => void;
}

const SimpleMatchRoom: React.FC<SimpleMatchRoomProps> = ({
  matchId,
  isCreator,
  onBack,
}) => {
  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Lobby</span>
          </button>
        </div>

        {/* Match Info */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Match Room</h2>
          
          <div className="space-y-4">
            <div>
              <span className="text-gray-400">Match ID:</span>
              <p className="text-white font-mono text-sm break-all">
                {matchId.toString()}
              </p>
            </div>
            
            <div>
              <span className="text-gray-400">Role:</span>
              <p className="text-white">
                {isCreator ? '👑 Creator' : '🎮 Player'}
              </p>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Game Status</h3>
          <div className="text-center py-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Clock className="text-yellow-400 animate-pulse" size={24} />
              <span className="text-yellow-400">Match implementation in progress...</span>
            </div>
            <p className="text-gray-400">
              Full game mechanics will be available once the smart contract is deployed.
            </p>
          </div>
        </div>

        {/* Placeholder Actions */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Available Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['🗿 Rock', '📄 Paper', '✂️ Scissors'].map((choice, index) => (
              <button
                key={index}
                disabled
                className="p-4 bg-gray-700 border border-gray-600 rounded-lg text-white opacity-50 cursor-not-allowed"
              >
                <div className="text-2xl mb-2">{choice.split(' ')[0]}</div>
                <div className="text-sm">{choice.split(' ')[1]}</div>
              </button>
            ))}
          </div>
          <p className="text-gray-400 text-sm mt-4 text-center">
            Game actions will be enabled when the smart contract is ready
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SimpleMatchRoom;