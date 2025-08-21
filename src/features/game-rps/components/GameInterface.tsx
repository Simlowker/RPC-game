// src/games/RPS/components/GameInterface.tsx - Main Game Interface
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { SolDuelUi } from '../../../components/UI';
import { Choice, GameResult } from '../../../rps-client';
import { getChoiceEmoji, getChoiceName, formatSOL } from '../../../rps-client';
import { ChoiceAnimation, CelebrationAnimation } from '../animations/ChoiceAnimations';
import { CountdownTransition, PhaseTransition, ResultsTransition } from '../animations/GameTransitions';
import { useSoundEffects } from '../sounds/useSoundEffects';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const reveal = keyframes`
  0% { opacity: 0; transform: scale(0.8) rotateY(90deg); }
  100% { opacity: 1; transform: scale(1) rotateY(0deg); }
`;

const celebration = keyframes`
  0% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(-5deg); }
  50% { transform: scale(1.2) rotate(5deg); }
  75% { transform: scale(1.1) rotate(-2deg); }
  100% { transform: scale(1) rotate(0deg); }
`;

const GameContainer = styled(motion.div)`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const GameHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const MatchInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  text-align: center;
`;

const InfoItem = styled.div`
  h4 {
    color: rgba(255, 255, 255, 0.7);
    margin: 0 0 8px 0;
    font-size: 14px;
  }
  
  p {
    color: white;
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
`;

const PhaseIndicator = styled.div<{ $phase: string }>`
  text-align: center;
  margin: 30px 0;
  padding: 15px;
  border-radius: 10px;
  background: ${props => {
    switch (props.$phase) {
      case 'choosing': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'revealing': return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
      case 'results': return 'linear-gradient(135deg, #10b981 0%, #047857 100%)';
      default: return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
    }
  }};
  animation: ${pulse} 2s infinite;
`;

const ChoicesContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin: 30px 0;
`;

const ChoiceButton = styled(motion.button)<{ $selected?: boolean; $disabled?: boolean }>`
  background: ${props => props.$selected 
    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
    : 'rgba(255, 255, 255, 0.05)'
  };
  border: 2px solid ${props => props.$selected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 16px;
  padding: 30px 20px;
  color: white;
  font-size: 18px;
  font-weight: 600;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  opacity: ${props => props.$disabled ? 0.5 : 1};
  position: relative;
  overflow: hidden;

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
  }

  .emoji {
    font-size: 48px;
    margin-bottom: 12px;
    display: block;
    position: relative;
    z-index: 2;
  }
`;

const RevealContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 30px;
  margin: 40px 0;
`;

const PlayerChoice = styled.div<{ $revealed?: boolean; $winner?: boolean }>`
  text-align: center;
  padding: 30px;
  border-radius: 16px;
  background: ${props => props.$winner 
    ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)'
    : 'rgba(255, 255, 255, 0.05)'
  };
  border: 2px solid ${props => props.$winner ? '#10b981' : 'rgba(255, 255, 255, 0.1)'};
  animation: ${props => props.$revealed ? reveal : 'none'} 0.6s ease-out;

  .emoji {
    font-size: 64px;
    margin-bottom: 16px;
    display: block;
    animation: ${props => props.$winner ? celebration : 'none'} 1s ease-out;
  }

  .choice-name {
    font-size: 20px;
    font-weight: 600;
    color: white;
    margin-bottom: 8px;
  }

  .player-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }
`;

const VSIndicator = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #f87171;
  text-align: center;
`;

const ResultsContainer = styled.div`
  text-align: center;
  margin: 40px 0;
`;

const ResultMessage = styled.h2<{ $result: GameResult }>`
  font-size: 32px;
  margin: 20px 0;
  color: ${props => {
    switch (props.$result) {
      case GameResult.CreatorWins:
      case GameResult.OpponentWins:
        return '#10b981';
      case GameResult.Tie:
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  }};
`;

const PayoutInfo = styled.div`
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  font-size: 18px;
  color: #6ee7b7;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 30px;
`;

interface GameInterfaceProps {
  phase: string;
  betAmount: number;
  timeLeft?: number;
  userChoice?: Choice;
  opponentChoice?: Choice;
  gameResult?: GameResult;
  isUserCreator: boolean;
  canReveal: boolean;
  canSettle: boolean;
  isRevealing: boolean;
  isSettling: boolean;
  onMakeChoice: (choice: Choice) => void;
  onReveal: () => void;
  onSettle: () => void;
  onNewGame: () => void;
}

export const GameInterface: React.FC<GameInterfaceProps> = ({
  phase,
  betAmount,
  timeLeft,
  userChoice,
  opponentChoice,
  gameResult,
  isUserCreator,
  canReveal,
  canSettle,
  isRevealing,
  isSettling,
  onMakeChoice,
  onReveal,
  onSettle,
  onNewGame,
}) => {
  const [showCountdown, setShowCountdown] = useState(false);
  const [showPhaseTransition, setShowPhaseTransition] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [animatingChoice, setAnimatingChoice] = useState<Choice | null>(null);
  const [hoveredChoice, setHoveredChoice] = useState<Choice | null>(null);
  
  const sounds = useSoundEffects();

  // Handle phase transitions
  useEffect(() => {
    if (phase === 'choosing' && !showCountdown) {
      setShowCountdown(true);
      sounds.startGameMusic();
    }
    
    if (phase === 'revealing') {
      setShowPhaseTransition(true);
      sounds.playReveal();
    }
    
    if (phase === 'results' && gameResult !== undefined) {
      setShowResults(true);
      const isWinner = getUserWon();
      const isTie = gameResult === GameResult.Tie;
      
      if (isTie) {
        sounds.playTie();
      } else if (isWinner) {
        sounds.playWin();
      } else {
        sounds.playLose();
      }
    }
  }, [phase, gameResult, sounds]);

  // Handle choice selection with sound effects
  const handleChoiceSelect = (choice: Choice) => {
    setAnimatingChoice(choice);
    
    // Play choice-specific sound
    switch (choice) {
      case Choice.Rock:
        sounds.playRock();
        break;
      case Choice.Paper:
        sounds.playPaper();
        break;
      case Choice.Scissors:
        sounds.playScissors();
        break;
    }
    
    // Brief delay for animation, then make choice
    setTimeout(() => {
      onMakeChoice(choice);
      setAnimatingChoice(null);
    }, 300);
  };

  const handleChoiceHover = (choice: Choice | null) => {
    if (choice && choice !== hoveredChoice) {
      sounds.playHover();
    }
    setHoveredChoice(choice);
  };
  const getPhaseMessage = () => {
    switch (phase) {
      case 'choosing':
        return '🎯 Choose your move!';
      case 'revealing':
        return '🔍 Reveal your choice when ready';
      case 'results':
        return '🎉 Match Complete!';
      default:
        return '⌛ Waiting...';
    }
  };

  const getResultMessage = () => {
    if (gameResult === undefined) return '';
    
    switch (gameResult) {
      case GameResult.CreatorWins:
        return isUserCreator ? '🏆 You Won!' : '😔 You Lost';
      case GameResult.OpponentWins:
        return isUserCreator ? '😔 You Lost' : '🏆 You Won!';
      case GameResult.Tie:
        return '🤝 It\'s a Tie!';
      default:
        return '';
    }
  };

  const getUserWon = () => {
    if (gameResult === undefined) return false;
    return (
      (gameResult === GameResult.CreatorWins && isUserCreator) ||
      (gameResult === GameResult.OpponentWins && !isUserCreator)
    );
  };

  return (
    <>
      <GameContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GameHeader>
          <motion.h1
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            🎮 Rock Paper Scissors
          </motion.h1>
        </GameHeader>

        <MatchInfo>
          <InfoItem>
            <h4>Bet Amount</h4>
            <p>{formatSOL(betAmount * 1e9)} SOL</p>
          </InfoItem>
          <InfoItem>
            <h4>Prize Pool</h4>
            <p>{formatSOL(betAmount * 2 * 1e9)} SOL</p>
          </InfoItem>
          <InfoItem>
            <h4>Your Role</h4>
            <p>{isUserCreator ? 'Creator' : 'Challenger'}</p>
          </InfoItem>
          {timeLeft !== undefined && timeLeft > 0 && (
            <InfoItem>
              <h4>Time Left</h4>
              <motion.p
                animate={{ 
                  color: timeLeft < 60 ? '#f87171' : 'white',
                  scale: timeLeft < 10 ? [1, 1.1, 1] : 1
                }}
                transition={{ 
                  scale: { repeat: timeLeft < 10 ? Infinity : 0, duration: 0.5 }
                }}
              >
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </motion.p>
            </InfoItem>
          )}
        </MatchInfo>

        <PhaseIndicator $phase={phase}>
          <h3>{getPhaseMessage()}</h3>
        </PhaseIndicator>

        <AnimatePresence mode="wait">
          {phase === 'choosing' && (
            <ChoicesContainer
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              {[Choice.Rock, Choice.Paper, Choice.Scissors].map((choice, index) => (
                <ChoiceButton
                  key={choice}
                  $selected={userChoice === choice}
                  $disabled={!!userChoice}
                  onClick={() => handleChoiceSelect(choice)}
                  onMouseEnter={() => handleChoiceHover(choice)}
                  onMouseLeave={() => handleChoiceHover(null)}
                  whileHover={!userChoice ? { scale: 1.05, y: -5 } : {}}
                  whileTap={!userChoice ? { scale: 0.95 } : {}}
                  initial={{ opacity: 0, y: 50, rotateY: -90 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    rotateY: 0,
                    transition: { delay: index * 0.1, duration: 0.5 }
                  }}
                >
                  <motion.div className="emoji">
                    {animatingChoice === choice ? (
                      <ChoiceAnimation
                        choice={choice}
                        state="action"
                        onAnimationComplete={() => setAnimatingChoice(null)}
                      />
                    ) : (
                      getChoiceEmoji(choice)
                    )}
                  </motion.div>
                  {getChoiceName(choice)}
                  
                  {/* Selection glow effect */}
                  {userChoice === choice && (
                    <motion.div
                      style={{
                        position: 'absolute',
                        top: -2,
                        left: -2,
                        right: -2,
                        bottom: -2,
                        background: 'linear-gradient(45deg, #8b5cf6, #3b82f6)',
                        borderRadius: 18,
                        zIndex: -1,
                      }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </ChoiceButton>
              ))}
            </ChoicesContainer>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === 'revealing' && userChoice !== undefined && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <RevealContainer>
                <PlayerChoice $revealed={true}>
                  <motion.span 
                    className="emoji"
                    initial={{ rotateY: 180 }}
                    animate={{ rotateY: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  >
                    <ChoiceAnimation
                      choice={userChoice}
                      state="selected"
                    />
                  </motion.span>
                  <div className="choice-name">{getChoiceName(userChoice)}</div>
                  <div className="player-label">Your Choice</div>
                </PlayerChoice>
                
                <VSIndicator>
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: 'reverse'
                    }}
                  >
                    VS
                  </motion.div>
                </VSIndicator>
                
                <PlayerChoice>
                  <motion.span 
                    className="emoji"
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: 'reverse'
                    }}
                  >
                    ❓
                  </motion.span>
                  <div className="choice-name">Hidden</div>
                  <div className="player-label">Opponent</div>
                </PlayerChoice>
              </RevealContainer>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === 'results' && userChoice !== undefined && opponentChoice !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <RevealContainer>
                <PlayerChoice 
                  $revealed={true} 
                  $winner={getUserWon()}
                >
                  <motion.span 
                    className="emoji"
                    initial={{ scale: 0, rotateY: 180 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{ delay: 0.4, duration: 0.6, type: 'spring' }}
                  >
                    {getUserWon() ? (
                      <CelebrationAnimation
                        choice={userChoice}
                        isWinner={true}
                      />
                    ) : (
                      <ChoiceAnimation
                        choice={userChoice}
                        state="idle"
                      />
                    )}
                  </motion.span>
                  <div className="choice-name">{getChoiceName(userChoice)}</div>
                  <div className="player-label">Your Choice</div>
                </PlayerChoice>
                
                <VSIndicator>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: 'spring' }}
                  >
                    VS
                  </motion.div>
                </VSIndicator>
                
                <PlayerChoice 
                  $revealed={true}
                  $winner={!getUserWon() && gameResult !== GameResult.Tie}
                >
                  <motion.span 
                    className="emoji"
                    initial={{ scale: 0, rotateY: 180 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{ delay: 0.5, duration: 0.6, type: 'spring' }}
                  >
                    {(!getUserWon() && gameResult !== GameResult.Tie) ? (
                      <CelebrationAnimation
                        choice={opponentChoice}
                        isWinner={true}
                      />
                    ) : (
                      <ChoiceAnimation
                        choice={opponentChoice}
                        state="idle"
                      />
                    )}
                  </motion.span>
                  <div className="choice-name">{getChoiceName(opponentChoice)}</div>
                  <div className="player-label">Opponent</div>
                </PlayerChoice>
              </RevealContainer>

              <ResultsContainer>
                {gameResult !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1, duration: 0.5, type: 'spring' }}
                  >
                    <ResultMessage $result={gameResult}>
                      {getResultMessage()}
                    </ResultMessage>
                  </motion.div>
                )}

                {getUserWon() && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                  >
                    <PayoutInfo>
                      💰 You won {formatSOL((betAmount * 2 * 0.99) * 1e9)} SOL!
                    </PayoutInfo>
                  </motion.div>
                )}

                {gameResult === GameResult.Tie && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                  >
                    <PayoutInfo>
                      🔄 Tie game - bets will be refunded
                    </PayoutInfo>
                  </motion.div>
                )}
              </ResultsContainer>
            </motion.div>
          )}
        </AnimatePresence>

        <ActionButtons>
          <AnimatePresence>
            {canReveal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <SolDuelUi.Button
                  main
                  onClick={() => {
                    sounds.playClick();
                    onReveal();
                  }}
                  disabled={isRevealing}
                  style={{ background: '#3b82f6' }}
                >
                  {isRevealing ? 'Revealing...' : 'Reveal Choice'}
                </SolDuelUi.Button>
              </motion.div>
            )}

            {canSettle && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <SolDuelUi.Button
                  main
                  onClick={() => {
                    sounds.playClick();
                    onSettle();
                  }}
                  disabled={isSettling}
                  style={{ background: '#10b981' }}
                >
                  {isSettling ? 'Settling...' : 'Settle Match'}
                </SolDuelUi.Button>
              </motion.div>
            )}

            {phase === 'results' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: 2 }}
              >
                <SolDuelUi.Button
                  onClick={() => {
                    sounds.playClick();
                    sounds.stopGameMusic();
                    onNewGame();
                  }}
                  style={{ background: '#6b7280' }}
                >
                  New Game
                </SolDuelUi.Button>
              </motion.div>
            )}
          </AnimatePresence>
        </ActionButtons>
      </GameContainer>

      {/* Countdown Transition */}
      <AnimatePresence>
        {showCountdown && phase === 'choosing' && (
          <CountdownTransition
            seconds={3}
            onComplete={() => {
              setShowCountdown(false);
              sounds.playCountdown();
            }}
          />
        )}
      </AnimatePresence>

      {/* Phase Transition */}
      <AnimatePresence>
        {showPhaseTransition && phase === 'revealing' && (
          <PhaseTransition
            title="🔍 Revealing Choices"
            description="Waiting for both players to reveal..."
            duration={2000}
            showSpinner
            onComplete={() => setShowPhaseTransition(false)}
          />
        )}
      </AnimatePresence>

      {/* Results Transition */}
      <AnimatePresence>
        {showResults && phase === 'results' && gameResult !== undefined && (
          <ResultsTransition
            isWinner={getUserWon()}
            isTie={gameResult === GameResult.Tie}
            winnings={getUserWon() ? (betAmount * 2 * 0.99) : undefined}
            duration={4000}
            onComplete={() => setShowResults(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};