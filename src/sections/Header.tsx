import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { SolDuelUi } from '../components/ui'

const HeaderWrapper = styled.header`
  background: white;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  padding: 16px 0;
  position: sticky;
  top: 0;
  z-index: 100;
`

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
`

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: #9945FF;
  text-decoration: none;
  
  &:hover {
    color: #8932E6;
  }
`

const Nav = styled.nav`
  display: flex;
  gap: 24px;
  align-items: center;
`

const NavButton = styled(SolDuelUi.Button)`
  background: transparent;
  color: #666;
  border: 1px solid #e0e0e0;
  font-size: 14px;
  padding: 8px 16px;

  &:hover {
    background: #f5f5f5;
    color: #333;
  }
`

const WalletButtonStyled = styled(WalletMultiButton)`
  background: #9945FF !important;
  border: none !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  
  &:hover {
    background: #8932E6 !important;
  }
`

function Header() {
  const navigate = useNavigate()

  return (
    <HeaderWrapper>
      <HeaderContent>
        <Logo to="/">SolDuel</Logo>
        
        <Nav>
          <NavButton onClick={() => navigate('/profile')}>
            Profile
          </NavButton>
          <NavButton onClick={() => navigate('/help')}>
            Help
          </NavButton>
          <WalletButtonStyled />
        </Nav>
      </HeaderContent>
    </HeaderWrapper>
  )
}

export default Header