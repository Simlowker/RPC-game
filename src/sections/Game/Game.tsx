// src/sections/Game/Game.tsx - Simplified Game Router
import React, { Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { getGameById } from '../../games'
import { SolDuelUi } from '../../components/UI'

const GameContainer = styled.div`
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
`

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  flex-direction: column;
  gap: 20px;
`

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  flex-direction: column;
  gap: 20px;
  text-align: center;
`

const LoadingText = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
`

const ErrorTitle = styled.h1`
  color: white;
  font-size: 2rem;
  margin-bottom: 10px;
`

const ErrorMessage = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  margin-bottom: 30px;
`

function GameLoader({ gameId }: { gameId: string }) {
  const navigate = useNavigate()
  
  const game = getGameById(gameId)
  
  if (!game) {
    return (
      <ErrorContainer>
        <ErrorTitle>🎮 Game Not Found</ErrorTitle>
        <ErrorMessage>
          The game "{gameId}" doesn't exist or isn't available yet.
        </ErrorMessage>
        <SolDuelUi.Button main onClick={() => navigate('/')}>
          ← Back to Home
        </SolDuelUi.Button>
      </ErrorContainer>
    )
  }

  const GameComponent = game.app

  return (
    <GameContainer>
      <Suspense fallback={
        <LoadingContainer>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid rgba(139, 92, 246, 0.3)',
            borderTop: '4px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <LoadingText>Loading {game.meta.name}...</LoadingText>
        </LoadingContainer>
      }>
        <GameComponent />
      </Suspense>
    </GameContainer>
  )
}

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>()
  
  // Default to RPS if no gameId specified
  const targetGameId = gameId || 'rps'
  
  return <GameLoader gameId={targetGameId} />
}