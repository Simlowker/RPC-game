// src/games/RPS/index.tsx - Main RPS Game Component
import React from 'react';
import styled from 'styled-components';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolDuelUi } from '../../components/UI';
import { PublicKey } from '@solana/web3.js';

import { useRPSGame } from './hooks/useRPSGameWrapper';
import { MatchLobby } from './components/MatchLobby';
import { GameInterface } from './components/GameInterface';
import { SoundSettings } from './components/SoundSettings';
import { ImplementationStatus } from './components/ImplementationStatus';
import { formatTimeRemaining } from '../../rps-client';

const GameContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
`;

const Header = styled.div`
  text-align: center;
  padding: 20px;
  margin-bottom: 20px;
`;

const ConnectPrompt = styled.div`
  text-align: center;
  padding: 60px 20px;
  
  .icon {
    font-size: 4rem;
    margin-bottom: 24px;
  }
  
  h2 {
    color: white;
    margin-bottom: 16px;
  }
  
  p {
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 32px;
    font-size: 1.1rem;
  }
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
`;

const ErrorMessage = styled.div`
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin: 20px auto;
  max-width: 500px;
  text-align: center;
  color: #fca5a5;
`;

export default function RPSGame() {
  const wallet = useWallet();
  const { connected, publicKey } = wallet;
  const {
    // State
    matches,
    userMatches,
    currentMatch,
    gamePhase,
    createForm,
    userChoice,
    isRevealed,
    gameResult,

    // Loading states
    isCreatingMatch,
    isJoiningMatch,
    isRevealing,
    isSettling,
    isLoading,

    // Actions
    setCreateForm,
    createMatch,
    joinMatch,
    makeChoice,
    revealChoice,
    settleMatch,
    resetGame,
    loadMatches,

    // Utils
    config,
    isConnected,
  } = useRPSGame();

  // Debug connection status
  console.log('RPS Game Wallet Status:', {
    connected,
    publicKey: publicKey?.toString(),
    walletAdapter: wallet.wallet?.adapter.name,
    isConnected,
    walletReady: wallet.wallet?.readyState
  });

  // Handle wallet connection requirement
  if (!connected || !publicKey) {
    return (
      <GameContainer>
        <ConnectPrompt>
          <div className="icon">🔗</div>
          <h2>Connect Your Wallet</h2>
          <p>
            Connect your Solana wallet to start playing Rock Paper Scissors
            <br />
            with real SOL betting against other players.
          </p>
          <div style={{ fontSize: '0.8rem', marginBottom: '16px', opacity: '0.7' }}>
            Status: Connected={connected ? 'true' : 'false'}, PublicKey={publicKey ? 'exists' : 'null'}
          </div>
          <SolDuelUi.Button main>
            Connect Wallet
          </SolDuelUi.Button>
        </ConnectPrompt>
      </GameContainer>
    );
  }

  // Handle join match action
  const handleJoinMatch = async (matchId: string) => {
    try {
      const matchPubkey = new PublicKey(matchId);
      await joinMatch(matchPubkey);
    } catch (error) {
      console.error('Failed to join match:', error);
    }
  };

  // Handle view match action
  const handleViewMatch = (matchId: string) => {
    // Find the match and set it as current
    const match = [...matches, ...userMatches].find(m => m.id === matchId);
    if (match) {
      // TODO: Load full match data and set current match
      console.log('Viewing match:', matchId);
    }
  };

  // Handle reveal choice action
  const handleRevealChoice = async (matchId: string) => {
    try {
      const matchPubkey = new PublicKey(matchId);
      await revealChoice(matchPubkey);
    } catch (error) {
      console.error('Failed to reveal choice:', error);
    }
  };

  // Handle settle match action
  const handleSettleMatch = async (matchId: string) => {
    try {
      const matchPubkey = new PublicKey(matchId);
      await settleMatch(matchPubkey);
    } catch (error) {
      console.error('Failed to settle match:', error);
    }
  };

  // Handle reveal action in game interface
  const handleReveal = async () => {
    if (currentMatch) {
      try {
        await revealChoice(new PublicKey(currentMatch.creator.toString()));
      } catch (error) {
        console.error('Failed to reveal choice:', error);
      }
    }
  };

  // Handle settle action in game interface
  const handleSettle = async () => {
    if (currentMatch) {
      try {
        await settleMatch(new PublicKey(currentMatch.creator.toString()));
      } catch (error) {
        console.error('Failed to settle match:', error);
      }
    }
  };

  // Main game interface when in an active match
  if (currentMatch && gamePhase.phase !== 'lobby') {
    const isUserCreator = currentMatch.creator.equals(publicKey);
    const timeLeft = Math.max(0, currentMatch.revealDeadline - Math.floor(Date.now() / 1000));
    
    // Determine what actions are available
    const canReveal = gamePhase.phase === 'revealing' && !isRevealed;
    const canSettle = gamePhase.phase === 'results';
    
    // Get opponent choice if revealed
    const opponentChoice = isUserCreator 
      ? currentMatch.revealedOpponent 
      : currentMatch.revealedCreator;

    return (
      <GameContainer>
        <SoundSettings />
        <ImplementationStatus />
        
        <Header>
          <BackButton onClick={resetGame}>
            ← Back to Lobby
          </BackButton>
        </Header>

        <GameInterface
          phase={gamePhase.phase}
          betAmount={currentMatch.betAmount / 1e9} // Convert from lamports
          timeLeft={timeLeft}
          userChoice={userChoice}
          opponentChoice={opponentChoice}
          gameResult={gameResult}
          isUserCreator={isUserCreator}
          canReveal={canReveal}
          canSettle={canSettle}
          isRevealing={isRevealing}
          isSettling={isSettling}
          onMakeChoice={makeChoice}
          onReveal={handleReveal}
          onSettle={handleSettle}
          onNewGame={resetGame}
        />
      </GameContainer>
    );
  }

  // Default lobby view
  return (
    <GameContainer>
      <SoundSettings />
      <ImplementationStatus />
      
      {/* Show any errors */}
      {!isConnected && (
        <ErrorMessage>
          ⚠️ Wallet connection issue. Please try reconnecting your wallet.
        </ErrorMessage>
      )}

      <MatchLobby
        matches={matches}
        userMatches={userMatches.map(match => ({
          id: match.creator.toString(),
          creator: match.creator.toString(),
          opponent: match.opponent?.toString(),
          betAmount: match.betAmount / 1e9,
          timeLeft: Math.max(0, match.joinDeadline - Math.floor(Date.now() / 1000)),
          status: match.status,
          canJoin: false, // User matches can't be joined by the user
          canReveal: match.revealedCreator === null || match.revealedOpponent === null,
          canSettle: match.revealedCreator !== null && match.revealedOpponent !== null,
          isUserMatch: true,
          isCreator: match.creator.equals(publicKey),
          isOpponent: match.opponent?.equals(publicKey) || false,
        }))}
        createForm={createForm}
        config={config}
        isConnected={isConnected}
        isLoading={isLoading}
        isCreatingMatch={isCreatingMatch}
        onCreateMatch={createMatch}
        onJoinMatch={handleJoinMatch}
        onViewMatch={handleViewMatch}
        onRevealChoice={handleRevealChoice}
        onSettleMatch={handleSettleMatch}
        onUpdateCreateForm={setCreateForm}
        onRefresh={loadMatches}
      />
    </GameContainer>
  );
}