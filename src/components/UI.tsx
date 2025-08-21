// Custom UI Components - Replacement for GambaUi
import styled, { css, keyframes } from 'styled-components'
import React from 'react'

// Button Styles
const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  text-decoration: none;
  white-space: nowrap;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const StyledButton = styled.button<{ main?: boolean; size?: 'sm' | 'md' | 'lg' }>`
  ${buttonBase}
  
  ${props => props.main ? css`
    background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
    color: white;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
    }
  ` : css`
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }
  `}
  
  ${props => props.size === 'sm' && css`
    padding: 8px 16px;
    font-size: 12px;
  `}
  
  ${props => props.size === 'lg' && css`
    padding: 16px 32px;
    font-size: 16px;
  `}
`

// Input Styles
const StyledInput = styled.input`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  color: white;
  font-size: 14px;
  width: 100%;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
  }
`

// Loading Animation
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`

// Portal Component for Modals
const PortalContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`

const PortalContent = styled.div`
  background: #1a1a2e;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`

// Switch/Toggle Component
const SwitchContainer = styled.label<{ checked: boolean }>`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  gap: 12px;
`

const SwitchSlider = styled.div<{ checked: boolean }>`
  width: 44px;
  height: 24px;
  background: ${props => props.checked ? '#8b5cf6' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 12px;
  position: relative;
  transition: all 0.2s ease;
  
  &:after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: ${props => props.checked ? '22px' : '2px'};
    transition: all 0.2s ease;
  }
`

const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
  display: none;
`

// Components
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  main?: boolean; 
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}> = ({ children, loading, ...props }) => (
  <StyledButton {...props} disabled={loading || props.disabled}>
    {loading ? <LoadingSpinner /> : children}
  </StyledButton>
)

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <StyledInput {...props} />
)

const Portal: React.FC<{ children: React.ReactNode; onClose?: () => void }> = ({ 
  children, 
  onClose 
}) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <PortalContainer onClick={onClose}>
      <PortalContent onClick={(e) => e.stopPropagation()}>
        {children}
      </PortalContent>
    </PortalContainer>
  )
}

const Switch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}> = ({ checked, onChange, label }) => (
  <SwitchContainer checked={checked}>
    <HiddenCheckbox 
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <SwitchSlider checked={checked} />
    {label && <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{label}</span>}
  </SwitchContainer>
)

// Export as SolDuelUi to replace GambaUi
export const SolDuelUi = {
  Button,
  Input,
  Portal,
  Switch,
}

export default SolDuelUi