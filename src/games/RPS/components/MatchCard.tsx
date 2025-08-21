// src/games/RPS/components/MatchCard.tsx - Individual Match Display Card
import React from 'react';
import styled from 'styled-components';
import { SolDuelUi } from '../../../components/UI';
import { MatchDisplayData } from '../types';
import { formatTimeRemaining, formatSOL } from '../../../rps-client';

const Card = styled.div<{ $canJoin?: boolean; $isUserMatch?: boolean }>`
  background: ${props => props.$isUserMatch 
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : 'rgba(255, 255, 255, 0.05)'
  };
  border: 1px solid ${props => props.$canJoin 
    ? '#10b981' 
    : props.$isUserMatch 
      ? '#8b5cf6'
      : 'rgba(255, 255, 255, 0.1)'
  };
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  cursor: ${props => props.$canJoin ? 'pointer' : 'default'};

  &:hover {
    transform: ${props => props.$canJoin ? 'translateY(-2px)' : 'none'};
    box-shadow: ${props => props.$canJoin 
      ? '0 8px 25px rgba(16, 185, 129, 0.3)'
      : '0 4px 15px rgba(0, 0, 0, 0.2)'
    };
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const MatchId = styled.span`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-family: monospace;
`;

const Status = styled.span<{ $status: string }>`
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    switch (props.$status) {
      case 'WaitingForOpponent': return '#10b981';
      case 'WaitingForReveal': return '#f59e0b';
      case 'ReadyToSettle': return '#3b82f6';
      case 'Settled': return '#6b7280';
      default: return '#6b7280';
    }
  }};
  color: white;
`;

const BetAmount = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #fbbf24;
  margin: 8px 0;
  text-align: center;
`;

const Players = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
`;

const Player = styled.div<{ $isUser?: boolean }>`
  text-align: center;
  padding: 8px;
  border-radius: 8px;
  background: ${props => props.$isUser 
    ? 'rgba(139, 92, 246, 0.3)' 
    : 'rgba(255, 255, 255, 0.05)'
  };
  font-size: 12px;
  color: ${props => props.$isUser ? '#a78bfa' : 'rgba(255, 255, 255, 0.7)'};
`;

const VS = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #f87171;
  text-align: center;
`;

const TimeLeft = styled.div<{ $urgent?: boolean }>`
  text-align: center;
  font-size: 14px;
  color: ${props => props.$urgent ? '#f87171' : '#10b981'};
  margin: 12px 0;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

interface MatchCardProps {
  match: MatchDisplayData;
  currentUserPubkey?: string;
  onJoin?: (matchId: string) => void;
  onView?: (matchId: string) => void;
  onReveal?: (matchId: string) => void;
  onSettle?: (matchId: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  currentUserPubkey,
  onJoin,
  onView,
  onReveal,
  onSettle,
}) => {
  const timeRemaining = formatTimeRemaining(
    Math.floor(Date.now() / 1000) + match.timeLeft
  );
  
  const isUrgent = match.timeLeft < 300; // Less than 5 minutes
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'WaitingForOpponent': return 'Open';
      case 'WaitingForReveal': return 'In Progress';
      case 'ReadyToSettle': return 'Ready to Settle';
      case 'Settled': return 'Completed';
      default: return status;
    }
  };

  const handleCardClick = () => {
    if (match.canJoin && onJoin) {
      onJoin(match.id);
    } else if (match.isUserMatch && onView) {
      onView(match.id);
    }
  };

  return (
    <Card 
      $canJoin={match.canJoin}
      $isUserMatch={match.isUserMatch}
      onClick={handleCardClick}
    >
      <Header>
        <MatchId>#{match.id.slice(0, 8)}</MatchId>
        <Status $status={match.status.toString()}>
          {getStatusText(match.status.toString())}
        </Status>
      </Header>

      <BetAmount>
        {formatSOL(match.betAmount * 1e9)} SOL
      </BetAmount>

      <Players>
        <Player $isUser={match.isCreator}>
          <div>Creator</div>
          <div>{match.creator.slice(0, 6)}...</div>
          {match.isCreator && <div>🔵 You</div>}
        </Player>
        
        <VS>VS</VS>
        
        <Player $isUser={match.isOpponent}>
          <div>Opponent</div>
          <div>
            {match.opponent 
              ? `${match.opponent.slice(0, 6)}...`
              : 'Waiting...'
            }
          </div>
          {match.isOpponent && <div>🔵 You</div>}
        </Player>
      </Players>

      {match.timeLeft > 0 && (
        <TimeLeft $urgent={isUrgent}>
          ⏰ {timeRemaining} remaining
        </TimeLeft>
      )}

      <Actions>
        {match.canJoin && (
          <SolDuelUi.Button 
            main 
            onClick={(e) => {
              e.stopPropagation();
              onJoin?.(match.id);
            }}
            style={{ flex: 1 }}
          >
            Join Match
          </SolDuelUi.Button>
        )}
        
        {match.canReveal && (
          <SolDuelUi.Button 
            onClick={(e) => {
              e.stopPropagation();
              onReveal?.(match.id);
            }}
            style={{ flex: 1, background: '#f59e0b' }}
          >
            Reveal Choice
          </SolDuelUi.Button>
        )}
        
        {match.canSettle && (
          <SolDuelUi.Button 
            onClick={(e) => {
              e.stopPropagation();
              onSettle?.(match.id);
            }}
            style={{ flex: 1, background: '#3b82f6' }}
          >
            Settle Match
          </SolDuelUi.Button>
        )}
        
        {match.isUserMatch && !match.canReveal && !match.canSettle && (
          <SolDuelUi.Button 
            onClick={(e) => {
              e.stopPropagation();
              onView?.(match.id);
            }}
            style={{ flex: 1, background: '#6b7280' }}
          >
            View Details
          </SolDuelUi.Button>
        )}
      </Actions>
    </Card>
  );
};