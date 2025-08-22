import React from 'react'
import styled from 'styled-components'
import { ZERO_FEES_ENABLED, PLATFORM_NAME } from '../../config/constants'

const FeaturesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.3);
  max-width: 600px;
  margin: 0 auto;
`

const FeatureTitle = styled.h3`
  color: #8b5cf6;
  font-size: 1.2rem;
  font-weight: 700;
  text-align: center;
  margin: 0 0 16px 0;
`

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
  font-size: 0.95rem;
  
  &::before {
    content: '✅';
    font-size: 1.1rem;
  }
`

const ZeroFeesHighlight = styled.div`
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  color: white;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  font-weight: 700;
  font-size: 1.1rem;
  margin-top: 8px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  
  .percentage {
    font-size: 2rem;
    display: block;
    margin-bottom: 4px;
  }
`

const NetworkInfo = styled.div`
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  padding: 12px;
  color: #f59e0b;
  font-size: 0.9rem;
  text-align: center;
`

export const GameFeatures: React.FC = () => {
  return (
    <FeaturesContainer>
      <FeatureTitle>🎮 {PLATFORM_NAME} Game Features</FeatureTitle>
      
      <FeatureList>
        <FeatureItem>Provably fair Rock Paper Scissors</FeatureItem>
        <FeatureItem>Commit-reveal system for fairness</FeatureItem>
        <FeatureItem>Fast settlement with smart contracts</FeatureItem>
        <FeatureItem>Phantom & Solflare wallet support</FeatureItem>
        <FeatureItem>Create or join matches instantly</FeatureItem>
        <FeatureItem>Real-time match updates</FeatureItem>
      </FeatureList>

      {ZERO_FEES_ENABLED && (
        <ZeroFeesHighlight>
          <span className="percentage">0%</span>
          PLATFORM FEES
          <div style={{ fontSize: '0.9rem', marginTop: '4px', opacity: 0.9 }}>
            Winner takes 100% of the prize pool!
          </div>
        </ZeroFeesHighlight>
      )}

      <NetworkInfo>
        🚧 Currently running on Devnet - Use test SOL only
      </NetworkInfo>
    </FeaturesContainer>
  )
}

export default GameFeatures