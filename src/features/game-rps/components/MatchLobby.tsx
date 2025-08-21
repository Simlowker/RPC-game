// src/games/RPS/components/MatchLobby.tsx - Match Lobby Component
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { SolDuelUi } from '../../../components/UI';
import { PublicKey } from '@solana/web3.js';
import { MatchCard } from './MatchCard';
import { CreateMatchModal } from './CreateMatchModal';
import { MatchDisplayData, CreateMatchForm, GameConfig } from '../types';
import { useSoundEffects } from '../sounds/useSoundEffects';

const LobbyContainer = styled(motion.div)`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const LobbyHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  color: white;
  margin-bottom: 16px;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.2rem;
  margin-bottom: 24px;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #8b5cf6;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
`;

const Controls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
`;

const TabButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const TabButton = styled.button<{ $active?: boolean }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
    : 'rgba(255, 255, 255, 0.05)'
  };
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.$active 
      ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
      : 'rgba(255, 255, 255, 0.1)'
    };
  }
`;

const FilterControls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const Select = styled.select`
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 14px;

  option {
    background: #1f2937;
    color: white;
  }
`;

const MatchesGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.7);
  
  .emoji {
    font-size: 4rem;
    margin-bottom: 16px;
  }
  
  h3 {
    color: white;
    margin-bottom: 12px;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.7);
`;

interface MatchLobbyProps {
  matches: MatchDisplayData[];
  userMatches: MatchDisplayData[];
  createForm: CreateMatchForm;
  config: GameConfig;
  isConnected: boolean;
  isLoading: boolean;
  isCreatingMatch: boolean;
  onCreateMatch: () => void;
  onJoinMatch: (matchId: string) => void;
  onViewMatch: (matchId: string) => void;
  onRevealChoice: (matchId: string) => void;
  onSettleMatch: (matchId: string) => void;
  onUpdateCreateForm: (form: CreateMatchForm) => void;
  onRefresh: () => void;
}

export const MatchLobby: React.FC<MatchLobbyProps> = ({
  matches,
  userMatches,
  createForm,
  config,
  isConnected,
  isLoading,
  isCreatingMatch,
  onCreateMatch,
  onJoinMatch,
  onViewMatch,
  onRevealChoice,
  onSettleMatch,
  onUpdateCreateForm,
  onRefresh,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'user'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'bet' | 'time'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'open' | 'active'>('all');
  const [lastMatchCount, setLastMatchCount] = useState(0);
  const [newMatches, setNewMatches] = useState<string[]>([]);
  
  const sounds = useSoundEffects();

  // Start lobby music on mount
  useEffect(() => {
    sounds.startLobbyMusic();
    return () => {
      sounds.stopLobbyMusic();
    };
  }, [sounds]);

  // Detect new matches and play notification sound
  useEffect(() => {
    if (matches.length > lastMatchCount && lastMatchCount > 0) {
      const newMatchIds = matches.slice(lastMatchCount).map(m => m.id);
      setNewMatches(prev => [...prev, ...newMatchIds]);
      sounds.playMatch();
      
      // Remove new match highlight after 5 seconds
      setTimeout(() => {
        setNewMatches(prev => prev.filter(id => !newMatchIds.includes(id)));
      }, 5000);
    }
    setLastMatchCount(matches.length);
  }, [matches, lastMatchCount, sounds]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        onRefresh();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [onRefresh, isLoading]);

  // Filter and sort matches
  const currentMatches = activeTab === 'all' ? matches : userMatches;
  
  const filteredMatches = currentMatches.filter(match => {
    switch (filterBy) {
      case 'open':
        return match.canJoin;
      case 'active':
        return match.isUserMatch && match.status.toString() !== 'Settled';
      default:
        return true;
    }
  });

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    switch (sortBy) {
      case 'bet':
        return b.betAmount - a.betAmount;
      case 'time':
        return a.timeLeft - b.timeLeft;
      default: // newest
        return b.id.localeCompare(a.id);
    }
  });

  // Calculate stats
  const openMatches = matches.filter(m => m.canJoin).length;
  const activeMatches = matches.filter(m => m.status.toString() === 'WaitingForReveal').length;
  const totalVolume = matches.reduce((sum, m) => sum + (m.betAmount * 2), 0);

  const handleCreateMatch = () => {
    setShowCreateModal(false);
    sounds.playClick();
    onCreateMatch();
  };

  const handleJoinMatch = (matchId: string) => {
    sounds.playJoin();
    onJoinMatch(matchId);
  };

  const handleTabChange = (tab: 'all' | 'user') => {
    sounds.playClick();
    setActiveTab(tab);
  };

  const handleFilterChange = (filter: string) => {
    sounds.playClick();
    setFilterBy(filter as any);
  };

  return (
    <LobbyContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <LobbyHeader>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
        >
          <Title>🎮 RPS Battle Arena</Title>
          <Subtitle>
            Challenge players in Rock Paper Scissors with real SOL betting
          </Subtitle>
        </motion.div>
        
        <StatsContainer>
          {[
            { value: openMatches, label: 'Open Matches', emoji: '🎯' },
            { value: activeMatches, label: 'Active Games', emoji: '⚡' },
            { value: totalVolume.toFixed(2), label: 'Total Volume (SOL)', emoji: '💰' },
            { value: matches.length, label: 'Total Matches', emoji: '🎮' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
            >
              <StatCard>
                <motion.div
                  animate={{ 
                    scale: lastMatchCount > 0 && stat.label === 'Open Matches' ? [1, 1.1, 1] : 1 
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <StatValue>
                    <span style={{ marginRight: '8px' }}>{stat.emoji}</span>
                    {stat.value}
                  </StatValue>
                  <StatLabel>{stat.label}</StatLabel>
                </motion.div>
              </StatCard>
            </motion.div>
          ))}
        </StatsContainer>

        {isConnected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <SolDuelUi.Button
              main
              onClick={() => {
                sounds.playClick();
                setShowCreateModal(true);
              }}
              style={{ fontSize: '18px', padding: '16px 32px' }}
            >
              🚀 Create New Match
            </SolDuelUi.Button>
          </motion.div>
        )}
      </LobbyHeader>

      <Controls>
        <TabButtons>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <TabButton 
              $active={activeTab === 'all'}
              onClick={() => handleTabChange('all')}
            >
              All Matches ({matches.length})
            </TabButton>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <TabButton 
              $active={activeTab === 'user'}
              onClick={() => handleTabChange('user')}
            >
              My Matches ({userMatches.length})
            </TabButton>
          </motion.div>
        </TabButtons>

        <FilterControls>
          <Select value={filterBy} onChange={(e) => handleFilterChange(e.target.value)}>
            <option value="all">All Status</option>
            <option value="open">Open to Join</option>
            <option value="active">Active Games</option>
          </Select>
          
          <Select value={sortBy} onChange={(e) => {
            sounds.playClick();
            setSortBy(e.target.value as any);
          }}>
            <option value="newest">Newest First</option>
            <option value="bet">Highest Bet</option>
            <option value="time">Ending Soon</option>
          </Select>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <SolDuelUi.Button 
              onClick={() => {
                sounds.playClick();
                onRefresh();
              }}
              disabled={isLoading}
              style={{ background: '#6b7280', padding: '8px 16px' }}
            >
              <motion.span
                animate={{ rotate: isLoading ? 360 : 0 }}
                transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: 'linear' }}
              >
                {isLoading ? '⟳' : '🔄'}
              </motion.span>
              {' '}Refresh
            </SolDuelUi.Button>
          </motion.div>
        </FilterControls>
      </Controls>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingState>
              <motion.div 
                style={{ fontSize: '2rem', marginBottom: '16px' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                ⏳
              </motion.div>
              Loading matches...
            </LoadingState>
          </motion.div>
        ) : sortedMatches.length > 0 ? (
          <MatchesGrid
            key="matches"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {sortedMatches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: { delay: index * 0.1, duration: 0.4 }
                }}
                whileHover={{ y: -5 }}
                style={{
                  position: 'relative',
                }}
              >
                {/* New match glow effect */}
                {newMatches.includes(match.id) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: [0, 0.6, 0],
                      scale: [0.8, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: 2,
                      repeatType: 'reverse'
                    }}
                    style={{
                      position: 'absolute',
                      top: -4,
                      left: -4,
                      right: -4,
                      bottom: -4,
                      background: 'linear-gradient(45deg, #10b981, #3b82f6)',
                      borderRadius: 16,
                      zIndex: -1,
                      filter: 'blur(8px)',
                    }}
                  />
                )}
                
                <MatchCard
                  match={match}
                  onJoin={handleJoinMatch}
                  onView={onViewMatch}
                  onReveal={onRevealChoice}
                  onSettle={onSettleMatch}
                />
              </motion.div>
            ))}
          </MatchesGrid>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
          >
            <EmptyState>
              <motion.div 
                className="emoji"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                {activeTab === 'user' ? '🎯' : '🎮'}
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                {activeTab === 'user' 
                  ? 'No matches found' 
                  : filterBy === 'open' 
                    ? 'No open matches' 
                    : 'No matches available'
                }
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                {activeTab === 'user' 
                  ? 'Create your first match to get started!'
                  : 'Be the first to create a match!'
                }
              </motion.p>
              {isConnected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <SolDuelUi.Button
                    main
                    onClick={() => {
                      sounds.playClick();
                      setShowCreateModal(true);
                    }}
                    style={{ marginTop: '20px' }}
                  >
                    Create Match
                  </SolDuelUi.Button>
                </motion.div>
              )}
            </EmptyState>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateMatchModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        form={createForm}
        onChange={onUpdateCreateForm}
        onSubmit={handleCreateMatch}
        config={config}
        isCreating={isCreatingMatch}
      />
    </LobbyContainer>
  );
};