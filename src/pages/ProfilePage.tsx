import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { SolDuelUi } from '../components/ui'
import { useWallet } from '@solana/wallet-adapter-react'

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

const ProfileCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`

const Section = styled.div`
  margin-bottom: 24px;
`

const SectionTitle = styled.h3`
  margin-bottom: 16px;
  color: #333;
`

function ProfilePage() {
  const navigate = useNavigate()
  const { wallet, disconnect } = useWallet()

  const handleDisconnect = () => {
    disconnect()
    navigate('/')
  }

  return (
    <Container>
      <Title>Profile</Title>
      
      <ProfileCard>
        <Section>
          <SectionTitle>Wallet</SectionTitle>
          <p>Connected: {wallet?.adapter.name || 'None'}</p>
        </Section>

        <Section>
          <SectionTitle>Settings</SectionTitle>
          <div style={{ marginBottom: '16px' }}>
            <label>Sound Effects: </label>
            <SolDuelUi.Switch checked={true} onChange={() => {}} />
          </div>
        </Section>

        <Section>
          <SolDuelUi.Button onClick={() => navigate('/')}>
            Back to Home
          </SolDuelUi.Button>
          {wallet && (
            <SolDuelUi.Button onClick={handleDisconnect} style={{ marginLeft: '16px' }}>
              Disconnect Wallet
            </SolDuelUi.Button>
          )}
        </Section>
      </ProfileCard>
    </Container>
  )
}

export default ProfilePage