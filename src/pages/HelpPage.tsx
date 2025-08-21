import React from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { SolDuelUi } from '../components/UI'

const HelpContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
`

const BackButton = styled(SolDuelUi.Button)`
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`

const HelpSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const SectionTitle = styled.h2`
  color: white;
  margin-bottom: 20px;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
`

const RulesList = styled.ul`
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.8;
  padding-left: 20px;
  
  li {
    margin-bottom: 8px;
  }
`

const GameGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin: 30px 0;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`

const ChoiceCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const ChoiceIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 10px;
`

const ChoiceName = styled.div`
  color: white;
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 1.1rem;
`

const ChoiceBeats = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
`

const InfoText = styled.p`
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin-bottom: 20px;
`

const WarningBox = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
`

const WarningText = styled.p`
  color: #fca5a5;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
`

const FAQ = styled.div`
  margin-top: 20px;
`

const Question = styled.div`
  color: white;
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 1rem;
`

const Answer = styled.div`
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
  line-height: 1.6;
`

export default function HelpPage() {
  const navigate = useNavigate()

  return (
    <HelpContainer>
      <BackButton onClick={() => navigate('/')}>
        ← Back to Home
      </BackButton>

      <HelpSection>
        <SectionTitle>🎮 Game Rules</SectionTitle>
        
        <InfoText>
          Rock Paper Scissors is a classic hand game played between two players. Each player 
          simultaneously chooses one of three options: Rock, Paper, or Scissors.
        </InfoText>

        <GameGrid>
          <ChoiceCard>
            <ChoiceIcon>✊</ChoiceIcon>
            <ChoiceName>Rock</ChoiceName>
            <ChoiceBeats>Beats Scissors</ChoiceBeats>
          </ChoiceCard>
          <ChoiceCard>
            <ChoiceIcon>📄</ChoiceIcon>
            <ChoiceName>Paper</ChoiceName>
            <ChoiceBeats>Beats Rock</ChoiceBeats>
          </ChoiceCard>
          <ChoiceCard>
            <ChoiceIcon>✂️</ChoiceIcon>
            <ChoiceName>Scissors</ChoiceName>
            <ChoiceBeats>Beats Paper</ChoiceBeats>
          </ChoiceCard>
        </GameGrid>

        <RulesList>
          <li><strong>Rock</strong> crushes <strong>Scissors</strong></li>
          <li><strong>Paper</strong> covers <strong>Rock</strong></li>
          <li><strong>Scissors</strong> cuts <strong>Paper</strong></li>
          <li>Same choices result in a <strong>Draw</strong></li>
        </RulesList>
      </HelpSection>

      <HelpSection>
        <SectionTitle>💰 How Betting Works</SectionTitle>
        
        <InfoText>
          Players bet SOL tokens to create and join matches. The winner takes home the entire 
          prize pool minus a small platform fee.
        </InfoText>

        <RulesList>
          <li>Choose your bet amount when creating a match</li>
          <li>Other players can join by matching your bet</li>
          <li>Winner takes 99% of the total pot</li>
          <li>Platform fee is only 1%</li>
          <li>In case of a draw, both players get their bet back</li>
        </RulesList>

        <WarningBox>
          <WarningText>
            ⚠️ <strong>Important:</strong> Only bet what you can afford to lose. 
            Gambling involves risk and you may lose your entire bet.
          </WarningText>
        </WarningBox>
      </HelpSection>

      <HelpSection>
        <SectionTitle>🔒 Fair Play & Security</SectionTitle>
        
        <InfoText>
          We use a commitment-reveal scheme to ensure fair play. Your choice is cryptographically 
          secured until both players reveal their moves.
        </InfoText>

        <RulesList>
          <li>Your choice is encrypted when you make it</li>
          <li>Choices are revealed simultaneously after both players commit</li>
          <li>No player can see the other's choice before revealing</li>
          <li>All games are recorded on the Solana blockchain</li>
          <li>Smart contracts handle payouts automatically</li>
        </RulesList>
      </HelpSection>

      <HelpSection>
        <SectionTitle>❓ Frequently Asked Questions</SectionTitle>
        
        <FAQ>
          <Question>Q: What happens if I disconnect during a match?</Question>
          <Answer>
            A: If you disconnect, you forfeit the match and lose your bet. Make sure you have 
            a stable internet connection before starting.
          </Answer>

          <Question>Q: How long do I have to make a move?</Question>
          <Answer>
            A: You typically have 30 seconds to make your choice. If time runs out, 
            you forfeit the match.
          </Answer>

          <Question>Q: Can I cancel a match after creating it?</Question>
          <Answer>
            A: Yes, you can cancel a match before another player joins. Once joined, 
            the match must be completed.
          </Answer>

          <Question>Q: What are the minimum and maximum bet amounts?</Question>
          <Answer>
            A: Minimum bet is 0.01 SOL, maximum is 10 SOL per match. Choose amounts 
            within your comfort zone.
          </Answer>

          <Question>Q: How do I know the game is fair?</Question>
          <Answer>
            A: All games use cryptographic commitment schemes and are recorded on the blockchain. 
            The smart contract code is open source and auditable.
          </Answer>
        </FAQ>
      </HelpSection>
    </HelpContainer>
  )
}