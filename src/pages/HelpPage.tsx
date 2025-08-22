import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { SolDuelUi } from '../components/ui'

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
`

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 30px;
  text-align: center;
`

const HelpCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`

const Question = styled.h3`
  color: #9945FF;
  margin-bottom: 12px;
`

const Answer = styled.p`
  color: #666;
  line-height: 1.6;
  margin-bottom: 24px;
`

function HelpPage() {
  const navigate = useNavigate()

  return (
    <Container>
      <Title>Help & FAQ</Title>
      
      <HelpCard>
        <Question>How does Rock Paper Scissors work?</Question>
        <Answer>
          Classic rules apply: Rock beats Scissors, Scissors beats Paper, Paper beats Rock.
          Both players commit to their choice simultaneously using cryptographic commitment.
        </Answer>

        <Question>How are games provably fair?</Question>
        <Answer>
          We use a commit-reveal scheme where players first commit to their choice with a cryptographic hash,
          then reveal their choice. This ensures neither player can see the other's choice before committing.
        </Answer>

        <Question>What are the fees?</Question>
        <Answer>
          SolDuel charges 0% platform fees! Winner takes the entire pot (minus small Solana network fees).
        </Answer>

        <Question>Which wallets are supported?</Question>
        <Answer>
          Any Solana wallet including Phantom, Solflare, Backpack, and many others.
        </Answer>

        <SolDuelUi.Button onClick={() => navigate('/')}>
          Back to Home
        </SolDuelUi.Button>
      </HelpCard>
    </Container>
  )
}

export default HelpPage