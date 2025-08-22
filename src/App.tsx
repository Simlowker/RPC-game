import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { SolDuelUi } from './components/ui'

import { Modal } from './components/Modal'
import { TOS_HTML } from './config/constants'
import DevnetWarning from './components/common/DevnetWarning'
import { useToast } from './hooks/useToast'
import { useUserStore } from './hooks/useUserStore'

import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import HelpPage from './pages/HelpPage'
import Game from './sections/Game/Game'
import Header from './sections/Header'
import Toasts from './sections/Toasts'

import { MainWrapper, TosInner, TosWrapper } from './styles'

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function ScrollToTop() {
  const { pathname } = useLocation()
  React.useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

function ErrorHandler() {
  const walletModal = useWalletModal()
  const toast       = useToast()

  // Custom error handling for SolDuel
  // Transaction errors will be handled by individual components

  return null
}

/* -------------------------------------------------------------------------- */
/* App                                                                        */
/* -------------------------------------------------------------------------- */

export default function App() {
  const newcomer = useUserStore((s) => s.newcomer)
  const set      = useUserStore((s) => s.set)

  return (
    <>
      {/* onboarding / ToS */}
      {newcomer && (
        <Modal>
          <h1>Welcome</h1>
          <TosWrapper>
            <TosInner dangerouslySetInnerHTML={{ __html: TOS_HTML }} />
          </TosWrapper>
          <p>By playing on our platform, you confirm your compliance.</p>
          <SolDuelUi.Button main onClick={() => set({ newcomer: false })}>
            Acknowledge
          </SolDuelUi.Button>
        </Modal>
      )}

      <ScrollToTop />
      <ErrorHandler />

      <Header />
      <DevnetWarning />
      <Toasts />

      <MainWrapper>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/rps" element={<Game />} />
          <Route path="/:gameId" element={<Game />} />
        </Routes>
      </MainWrapper>
    </>
  )
}
