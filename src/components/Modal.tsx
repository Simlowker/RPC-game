import React from 'react'
import styled from 'styled-components'

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const ModalContent = styled.div`
  background: white;
  padding: 32px;
  border-radius: 16px;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  margin: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
`

interface ModalProps {
  children: React.ReactNode
  onClose?: () => void
}

export function Modal({ children, onClose }: ModalProps) {
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        {children}
      </ModalContent>
    </ModalOverlay>
  )
}

export default Modal