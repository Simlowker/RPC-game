import React from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { SolDuelUi } from '../components/UI'
import { LAMPORTS_PER_SOL, Connection } from '@solana/web3.js'
import { RPC_ENDPOINT } from '../constants'

const ProfileContainer = styled.div`
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

const ProfileHeader = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
`

const WalletAddress = styled.div`
  font-family: 'Courier New', monospace;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin-bottom: 20px;
  word-break: break-all;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 25px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const StatValue = styled.div`
  font-size: 2.2rem;
  font-weight: bold;
  color: #8b5cf6;
  margin-bottom: 8px;
`

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const HistorySection = styled.div`
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
`

const MatchList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const MatchItem = styled.div<{ result: 'win' | 'loss' | 'draw' }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border-left: 4px solid ${props => 
    props.result === 'win' ? '#10b981' : 
    props.result === 'loss' ? '#ef4444' : '#6b7280'
  };
`

const MatchInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const MatchResult = styled.div<{ result: 'win' | 'loss' | 'draw' }>`
  color: ${props => 
    props.result === 'win' ? '#10b981' : 
    props.result === 'loss' ? '#ef4444' : '#6b7280'
  };
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.9rem;
`

const MatchDetails = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
`

const MatchAmount = styled.div`
  color: white;
  font-weight: bold;
`

const SettingsSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`

const SettingLabel = styled.div`
  color: white;
  font-size: 1rem;
`

const EmptyState = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 40px 20px;
  font-style: italic;
`

// Mock data - in real app this would come from the blockchain/API
const mockStats = {
  totalMatches: 12,
  wins: 8,
  losses: 3,
  draws: 1,
  totalWon: 2.4,
  totalLost: 0.9,
  winRate: 66.7
}

const mockHistory = [
  { id: 1, result: 'win' as const, bet: 0.1, opponent: '7xKf...9mQ2', timestamp: '2 hours ago' },
  { id: 2, result: 'loss' as const, bet: 0.25, opponent: '3nBv...5kR8', timestamp: '5 hours ago' },
  { id: 3, result: 'win' as const, bet: 0.1, opponent: '8zPq...2wE6', timestamp: '1 day ago' },
  { id: 4, result: 'draw' as const, bet: 0.5, opponent: '5mLx...7nT9', timestamp: '2 days ago' },
  { id: 5, result: 'win' as const, bet: 0.1, opponent: '9rYs...4bK3', timestamp: '3 days ago' },
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const { publicKey, disconnect } = useWallet()
  const [balance, setBalance] = React.useState<number | null>(null)
  
  React.useEffect(() => {
    if (!publicKey) return
    
    const fetchBalance = async () => {
      try {
        const connection = new Connection(RPC_ENDPOINT)
        const lamports = await connection.getBalance(publicKey)
        setBalance(lamports / LAMPORTS_PER_SOL)
      } catch (error) {
        console.error('Failed to fetch balance:', error)
      }
    }
    
    fetchBalance()
  }, [publicKey])
  
  const formatAddress = (address: string) => {
    if (address.length <= 8) return address
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const handleDisconnect = async () => {
    await disconnect()
    navigate('/')
  }

  return (
    <ProfileContainer>
      <BackButton onClick={() => navigate('/')}>
        ← Back to Home
      </BackButton>

      <ProfileHeader>
        <h1 style={{ color: 'white', marginBottom: '10px' }}>🏆 Player Profile</h1>
        <WalletAddress>
          {publicKey ? formatAddress(publicKey.toBase58()) : 'Not Connected'}
        </WalletAddress>
        <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          Balance: {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
        </div>
      </ProfileHeader>

      <StatsGrid>
        <StatCard>
          <StatValue>{mockStats.totalMatches}</StatValue>
          <StatLabel>Total Matches</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{mockStats.wins}</StatValue>
          <StatLabel>Wins</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{mockStats.losses}</StatValue>
          <StatLabel>Losses</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{mockStats.winRate}%</StatValue>
          <StatLabel>Win Rate</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{mockStats.totalWon}</StatValue>
          <StatLabel>SOL Won</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{mockStats.totalLost}</StatValue>
          <StatLabel>SOL Lost</StatLabel>
        </StatCard>
      </StatsGrid>

      <HistorySection>
        <SectionTitle>Recent Matches</SectionTitle>
        {mockHistory.length > 0 ? (
          <MatchList>
            {mockHistory.map(match => (
              <MatchItem key={match.id} result={match.result}>
                <MatchInfo>
                  <MatchResult result={match.result}>
                    {match.result === 'win' ? '✅ Win' : 
                     match.result === 'loss' ? '❌ Loss' : '➖ Draw'}
                  </MatchResult>
                  <MatchDetails>
                    vs {match.opponent} • {match.timestamp}
                  </MatchDetails>
                </MatchInfo>
                <MatchAmount>
                  {match.result === 'win' ? '+' : match.result === 'loss' ? '-' : '±'}{match.bet} SOL
                </MatchAmount>
              </MatchItem>
            ))}
          </MatchList>
        ) : (
          <EmptyState>
            No matches played yet. Start your first match!
          </EmptyState>
        )}
      </HistorySection>

      <SettingsSection>
        <SectionTitle>Settings</SectionTitle>
        
        <SettingItem>
          <SettingLabel>Sound Effects</SettingLabel>
          <SolDuelUi.Switch checked={true} onChange={() => {}} />
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>Disconnect Wallet</SettingLabel>
          <SolDuelUi.Button onClick={handleDisconnect}>
            Disconnect
          </SolDuelUi.Button>
        </SettingItem>
      </SettingsSection>
    </ProfileContainer>
  )
}