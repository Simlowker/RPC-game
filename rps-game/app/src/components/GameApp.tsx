import React, { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import Header from './Header';
import SimpleLobby from './SimpleLobby';
import SimpleMatchRoom from './SimpleMatchRoom';
import ErrorBoundary from './ErrorBoundary';
import { WalletSkeleton } from './LoadingStates';
import { useGameSounds, SoundEffect } from '../hooks/useGameSounds';

export interface ActiveMatch {
  matchId: PublicKey;
  isCreator: boolean;
}

const GameApp: React.FC = () => {
  const { connected } = useWallet();
  const [activeMatch, setActiveMatch] = useState<ActiveMatch | null>(null);
  const { playSound } = useGameSounds();

  const handleJoinMatch = useCallback((match: ActiveMatch) => {
    setActiveMatch(match);
    playSound(SoundEffect.MATCH_JOINED);
  }, [playSound]);

  if (!connected) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-lg w-full">
            <WalletSkeleton />
            <div className="mt-6">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">🗿📄✂️ Rock Paper Scissors</h1>
              <p className="text-lg sm:text-xl mb-6 text-gray-300">Connect your wallet to start playing</p>
              <div className="flex justify-center">
                <Header />
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <Header />
        <main className="py-4 sm:py-8">
          {activeMatch ? (
            <SimpleMatchRoom 
              matchId={activeMatch.matchId}
              isCreator={activeMatch.isCreator}
              onBack={() => {
                setActiveMatch(null);
                playSound(SoundEffect.BUTTON_CLICK);
              }}
            />
          ) : (
            <SimpleLobby onJoinMatch={handleJoinMatch} />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default GameApp;