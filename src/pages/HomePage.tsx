import React, { useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { SolDuelUi } from '../components/UI'

const HomeContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
`

const HeroSection = styled.div`
  padding: 80px 20px 60px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  border-radius: 20px;
  margin-bottom: 40px;
  border: 1px solid rgba(139, 92, 246, 0.2);
`

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: bold;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`

const HeroSubtitle = styled.p`
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 40px;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`

const ActionButtons = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`

const PrimaryButton = styled(SolDuelUi.Button)`
  font-size: 1.3rem !important;
  padding: 18px 40px !important;
  border-radius: 12px !important;
  min-width: 180px;
`

const SecondaryButton = styled(SolDuelUi.Button)`
  font-size: 1.1rem !important;
  padding: 14px 32px !important;
  border-radius: 12px !important;
  min-width: 160px;
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
`

const QuickStats = styled.div`
  display: flex;
  justify-content: space-around;
  margin: 40px 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
`

const StatItem = styled.div`
  text-align: center;
`

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #8b5cf6;
  margin-bottom: 8px;
`

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const MatchSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 30px;
  margin-top: 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const SectionTitle = styled.h2`
  color: white;
  margin-bottom: 20px;
  font-size: 1.8rem;
`

const BetAmountSelector = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 20px 0;
  flex-wrap: wrap;
`

const BetButton = styled.button<{ selected: boolean }>`
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid ${props => props.selected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.2)'};
  background: ${props => props.selected ? 'rgba(139, 92, 246, 0.2)' : 'transparent'};
  color: ${props => props.selected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.7)'};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  
  &:hover {
    border-color: #8b5cf6;
    color: #8b5cf6;
  }
`

const InfoText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin: 20px 0;
  line-height: 1.5;
`

export default function HomePage() {
  const navigate = useNavigate()
  const { connected } = useWallet()
  const [selectedBet, setSelectedBet] = useState(0.1)
  
  const betAmounts = [0.05, 0.1, 0.25, 0.5, 1.0] // Use constants from constants.ts
  
  const handleCreateMatch = () => {
    if (!connected) {
      // Wallet connection will be handled by the UserButton/WalletConnect
      return
    }
    // Navigate to game with bet amount
    navigate(`/rps?bet=${selectedBet}&mode=create`)
  }
  
  const handleJoinMatch = () => {
    if (!connected) {
      return
    }
    navigate('/rps?mode=join')
  }
  
  const handleViewProfile = () => {
    navigate('/profile')
  }

  return (
    <HomeContainer>
      <HeroSection>
        <HeroTitle>⚡ Rock Paper Scissors Arena</HeroTitle>
        <HeroSubtitle>
          Challenge players in the classic game with real SOL betting.
          Fair, fast, and secure.
        </HeroSubtitle>
        
        {connected ? (
          <ActionButtons>
            <PrimaryButton main onClick={handleCreateMatch}>
              🎯 Create Match
            </PrimaryButton>
            <SecondaryButton onClick={handleJoinMatch}>
              🔍 Join Match
            </SecondaryButton>
          </ActionButtons>
        ) : (
          <InfoText>
            Connect your wallet to start playing
          </InfoText>
        )}
      </HeroSection>

      {connected && (
        <MatchSection>
          <SectionTitle>Quick Match Setup</SectionTitle>
          
          <InfoText>Select your bet amount:</InfoText>
          
          <BetAmountSelector>
            {betAmounts.map(amount => (
              <BetButton
                key={amount}
                selected={selectedBet === amount}
                onClick={() => setSelectedBet(amount)}
              >
                {amount} SOL
              </BetButton>
            ))}
          </BetAmountSelector>
          
          <PrimaryButton main onClick={handleCreateMatch} style={{ marginTop: '20px' }}>
            Create Match with {selectedBet} SOL
          </PrimaryButton>
          
          <InfoText>
            Winner takes 99% of the pot • Platform fee: 1%
          </InfoText>
        </MatchSection>
      )}

      <QuickStats>
        <StatItem>
          <StatValue>1v1</StatValue>
          <StatLabel>Player Battles</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>⚡</StatValue>
          <StatLabel>Instant Results</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>🔒</StatValue>
          <StatLabel>Secure Betting</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>1%</StatValue>
          <StatLabel>Platform Fee</StatLabel>
        </StatItem>
      </QuickStats>
      
      {connected && (
        <SecondaryButton onClick={handleViewProfile} style={{ marginTop: '20px' }}>
          📊 View Profile & Stats
        </SecondaryButton>
      )}
    </HomeContainer>
  )
}