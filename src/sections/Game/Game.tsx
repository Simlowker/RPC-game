import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { SolDuelUi } from '../../components/ui'

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
`

const GameArea = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 30px;
`

function Game() {
  const navigate = useNavigate()

  return (
    <Container>
      <Title>🗿📄✂️ Rock Paper Scissors</Title>
      
      <GameArea>
        <h3>Game Coming Soon!</h3>
        <p>The interactive Rock Paper Scissors game is currently under development.</p>
        <p>Features will include:</p>
        <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '20px auto' }}>
          <li>Provably fair gameplay</li>
          <li>Instant settlements</li>
          <li>Multiple bet amounts</li>
          <li>Real-time matching</li>
          <li>Zero platform fees</li>
        </ul>
        
        <SolDuelUi.Button main onClick={() => navigate('/')}>
          Back to Home
        </SolDuelUi.Button>
      </GameArea>
    </Container>
  )
}

export default Game