import React from 'react'
import styled from 'styled-components'
import { NETWORK_NAME, IS_MAINNET } from '../../config/constants'

const WarningBanner = styled.div`
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 8px 16px;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  z-index: 999;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
    padding: 6px 12px;
  }
`

const DevnetWarning: React.FC = () => {
  if (IS_MAINNET) return null

  return (
    <WarningBanner>
      🚧 You are using {NETWORK_NAME} - Test tokens only! This is not real money. 🚧
    </WarningBanner>
  )
}

export default DevnetWarning