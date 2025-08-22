import React from 'react'
import styled from 'styled-components'
import { NETWORK_NAME, IS_MAINNET, ZERO_FEES_ENABLED, ZERO_FEES_TAGLINE } from '../../config/constants'

const BadgeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  @media (max-width: 768px) {
    gap: 4px;
  }
`

const NetworkBadge = styled.div<{ isMainnet: boolean }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => props.isMainnet ? `
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: white;
    box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
  ` : `
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
  `}
  
  @media (max-width: 768px) {
    padding: 3px 6px;
    font-size: 0.7rem;
  }
`

const ZeroFeesBadge = styled.div`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
  animation: glow 2s ease-in-out infinite alternate;
  
  @keyframes glow {
    from {
      box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
    }
    to {
      box-shadow: 0 2px 8px rgba(139, 92, 246, 0.6);
    }
  }
  
  @media (max-width: 768px) {
    padding: 3px 8px;
    font-size: 0.7rem;
  }
`

export const NetworkStatusBadges: React.FC = () => {
  return (
    <BadgeContainer>
      <NetworkBadge isMainnet={IS_MAINNET}>
        {NETWORK_NAME}
      </NetworkBadge>
      {ZERO_FEES_ENABLED && (
        <ZeroFeesBadge>
          0% FEES
        </ZeroFeesBadge>
      )}
    </BadgeContainer>
  )
}

export default NetworkStatusBadges