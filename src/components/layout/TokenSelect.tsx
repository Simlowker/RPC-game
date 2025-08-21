import { LAMPORTS_PER_SOL, Connection } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { SolDuelUi } from '../components/UI'
import { RPC_ENDPOINT } from '../constants'

const BalanceDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
`

const SolIcon = styled.span`
  font-size: 1.1rem;
  color: #9945FF;
`

export default function TokenSelect() {
  const { publicKey, connected } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!publicKey || !connected) {
      setBalance(null)
      return
    }

    const fetchBalance = async () => {
      setLoading(true)
      try {
        const connection = new Connection(RPC_ENDPOINT)
        const lamports = await connection.getBalance(publicKey)
        setBalance(lamports / LAMPORTS_PER_SOL)
      } catch (error) {
        console.error('Failed to fetch balance:', error)
        setBalance(null)
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()

    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [publicKey, connected])

  if (!connected) {
    return null
  }

  return (
    <BalanceDisplay>
      <SolIcon>◎</SolIcon>
      {loading ? (
        'Loading...'
      ) : balance !== null ? (
        `${balance.toFixed(4)} SOL`
      ) : (
        'Error'
      )}
    </BalanceDisplay>
  )
}