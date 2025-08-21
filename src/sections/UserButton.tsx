import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import React from 'react'
import { Modal } from '../components/Modal'
import { SolDuelUi } from '../components/UI'
import { useUserStore } from '../hooks/useUserStore'
import { truncateString } from '../utils'

function UserModal() {
  const user = useUserStore()
  const wallet = useWallet()

  return (
    <Modal onClose={() => user.set({ userModal: false })}>
      <h1>
        {truncateString(wallet.publicKey?.toString() ?? '', 6, 3)}
      </h1>
      <div style={{ display: 'flex', gap: '20px', flexDirection: 'column', width: '100%', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', width: '100%' }}>
          <div style={{ 
            padding: '16px',
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.1rem', marginBottom: '8px' }}>🎮 Ready to Play!</div>
            <div style={{ opacity: '0.8', fontSize: '0.9rem' }}>
              Challenge other players in Rock Paper Scissors matches.
            </div>
          </div>
        </div>
        
        <SolDuelUi.Button onClick={() => wallet.disconnect()}>
          Disconnect Wallet
        </SolDuelUi.Button>
      </div>
    </Modal>
  )
}

export function UserButton() {
  const walletModal = useWalletModal()
  const wallet = useWallet()
  const user = useUserStore()

  const connect = () => {
    if (wallet.wallet) {
      wallet.connect()
    } else {
      walletModal.setVisible(true)
    }
  }

  return (
    <>
      {wallet.connected && user.userModal && (
        <UserModal />
      )}
      {wallet.connected ? (
        <div style={{ position: 'relative' }}>
          <SolDuelUi.Button
            onClick={() => user.set({ userModal: true })}
          >
            <div style={{ display: 'flex', gap: '.5em', alignItems: 'center' }}>
              <img src={wallet.wallet?.adapter.icon} height="20px" />
              {truncateString(wallet.publicKey?.toBase58(), 3)}
            </div>
          </SolDuelUi.Button>
        </div>
      ) : (
        <SolDuelUi.Button main onClick={connect}>
          {wallet.connecting ? 'Connecting...' : 'Connect Wallet'}
        </SolDuelUi.Button>
      )}
    </>
  )
}