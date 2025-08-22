// SolDuel UI Components
import styled from 'styled-components'

// Button component with variants
const Button = styled.button<{ main?: boolean }>`
  background: ${props => props.main ? '#9945FF' : '#333'};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.main ? '#8932E6' : '#444'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

// Switch component
const Switch = styled.input.attrs({ type: 'checkbox' })<{ checked: boolean }>`
  appearance: none;
  width: 50px;
  height: 26px;
  background: ${props => props.checked ? '#9945FF' : '#ccc'};
  border-radius: 13px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;

  &::before {
    content: '';
    position: absolute;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: white;
    top: 2px;
    left: ${props => props.checked ? '26px' : '2px'};
    transition: left 0.2s ease;
  }
`

// Export all UI components
export const SolDuelUi = {
  Button,
  Switch,
}

export default SolDuelUi