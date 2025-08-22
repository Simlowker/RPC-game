import React from 'react'
import styled from 'styled-components'

const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Toast = styled.div<{ type: 'success' | 'error' | 'info' }>`
  background: ${props => {
    switch (props.type) {
      case 'success': return '#4ade80'
      case 'error': return '#ef4444'
      case 'info': return '#3b82f6'
      default: return '#6b7280'
    }
  }};
  color: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 400px;
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`

// This is a placeholder component for the toast system
// In a real implementation, this would connect to a toast context/store
function Toasts() {
  return (
    <ToastContainer>
      {/* Toasts will be rendered here when the toast system is implemented */}
    </ToastContainer>
  )
}

export default Toasts