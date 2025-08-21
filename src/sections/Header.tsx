// src/sections/Header.tsx - SolDuel Header
import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useWallet } from '@solana/wallet-adapter-react'
import { SolDuelUi } from '../components/UI'
import { PLATFORM_NAME } from '../constants'
import TokenSelect from './TokenSelect'
import { UserButton } from './UserButton'

const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 20px;
  background: #000000cc;
  backdrop-filter: blur(20px);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
`

const NavMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  
  @media (max-width: 768px) {
    gap: 10px;
  }
`

const NavButton = styled(SolDuelUi.Button)`
  padding: 8px 16px !important;
  font-size: 0.9rem !important;
  
  @media (max-width: 768px) {
    padding: 6px 12px !important;
    font-size: 0.8rem !important;
  }
`

const Logo = styled(NavLink)`
  height: 35px;
  display: flex;
  align-items: center;
  text-decoration: none;
  gap: 12px;
  
  & > img {
    height: 100%;
    object-fit: contain;
  }
`

const LogoText = styled.span`
  font-size: 1.4rem;
  font-weight: bold;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: 768px) {
    display: none;
  }
`

export default function Header() {
  const navigate = useNavigate()
  const { connected } = useWallet()

  return (
    <StyledHeader>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Logo to="/">
          <img alt={PLATFORM_NAME} src="/rps-icon.png" style={{ height: '35px' }} />
          <LogoText>{PLATFORM_NAME}</LogoText>
        </Logo>
        
        {connected && (
          <NavMenu>
            <NavButton onClick={() => navigate('/rps')}>
              🎮 Play
            </NavButton>
            <NavButton onClick={() => navigate('/profile')}>
              📊 Profile
            </NavButton>
            <NavButton onClick={() => navigate('/help')}>
              ❓ Help
            </NavButton>
          </NavMenu>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <TokenSelect />
        <UserButton />
      </div>
    </StyledHeader>
  )
}