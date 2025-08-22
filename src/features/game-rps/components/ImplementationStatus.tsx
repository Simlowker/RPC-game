import React from 'react';
import styled from 'styled-components';
import { RPS_CONFIG } from '../../../config/rps-config';
import { useConnection } from '@solana/wallet-adapter-react';

const StatusBadge = styled.div<{ $isReal: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: ${props => props.$isReal 
    ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)'
    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  };
  color: white;
  padding: 12px 20px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 1000;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  }
`;

const StatusDot = styled.div<{ $isConnected: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$isConnected ? '#10b981' : '#ef4444'};
  animation: ${props => props.$isConnected ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

const NetworkInfo = styled.div`
  font-size: 12px;
  opacity: 0.9;
`;

export const ImplementationStatus: React.FC = () => {
  const { connection } = useConnection();
  const isReal = RPS_CONFIG.USE_REAL_IMPLEMENTATION;
  const [isConnected, setIsConnected] = React.useState(false);
  const [rpcEndpoint, setRpcEndpoint] = React.useState('');

  React.useEffect(() => {
    if (connection) {
      // Check connection status
      connection.getVersion()
        .then(() => {
          setIsConnected(true);
          setRpcEndpoint(connection.rpcEndpoint);
        })
        .catch(() => setIsConnected(false));
    }
  }, [connection]);

  const handleClick = () => {
    if (isReal) {
      window.open(
        `https://explorer.solana.com/address/${RPS_CONFIG.PROGRAM_ID}?cluster=devnet`,
        '_blank'
      );
    }
  };

  return (
    <StatusBadge $isReal={isReal} onClick={handleClick}>
      <StatusDot $isConnected={isConnected} />
      <div>
        <div>{isReal ? '🔗 ON-CHAIN' : '🧪 MOCK MODE'}</div>
        {isReal && (
          <NetworkInfo>
            {isConnected ? 'Devnet Connected' : 'Connecting...'}
          </NetworkInfo>
        )}
      </div>
    </StatusBadge>
  );
};