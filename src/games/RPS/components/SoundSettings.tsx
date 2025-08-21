// src/games/RPS/components/SoundSettings.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundEffects } from '../sounds/useSoundEffects';

const SettingsButton = styled(motion.button)`
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  color: white;
  font-size: 20px;
  cursor: pointer;
  z-index: 1000;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 255, 255, 0.4);
  }
`;

const SettingsPanel = styled(motion.div)`
  position: fixed;
  top: 80px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  min-width: 200px;
  backdrop-filter: blur(20px);
  z-index: 999;
`;

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  color: white;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
  }
`;

const VolumeSlider = styled.input`
  width: 100px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  appearance: none;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #8b5cf6;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #8b5cf6;
    cursor: pointer;
    border: none;
  }
`;

const ToggleButton = styled(motion.button)<{ $active: boolean }>`
  width: 40px;
  height: 20px;
  border-radius: 10px;
  background: ${props => props.$active ? '#10b981' : '#6b7280'};
  border: none;
  position: relative;
  cursor: pointer;
  transition: background 0.3s ease;

  &::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    top: 2px;
    left: ${props => props.$active ? '22px' : '2px'};
    transition: left 0.3s ease;
  }
`;

const TestButton = styled(motion.button)`
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  color: white;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #2563eb;
  }
`;

export const SoundSettings: React.FC = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [volume, setVolume] = useState(50);
  const sounds = useSoundEffects();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    sounds.setVolume(newVolume / 100);
  };

  const testSound = () => {
    sounds.playClick();
  };

  return (
    <>
      <SettingsButton
        onClick={() => setShowPanel(!showPanel)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: showPanel ? 180 : 0 }}
      >
        {sounds.isMuted ? '🔇' : '🔊'}
      </SettingsButton>

      <AnimatePresence>
        {showPanel && (
          <SettingsPanel
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <SettingItem>
              <label>Volume</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <VolumeSlider
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  disabled={sounds.isMuted}
                />
                <span style={{ fontSize: '12px', minWidth: '30px' }}>
                  {sounds.isMuted ? 'OFF' : `${volume}%`}
                </span>
              </div>
            </SettingItem>

            <SettingItem>
              <label>Sound Effects</label>
              <ToggleButton
                $active={!sounds.isMuted}
                onClick={sounds.toggleMute}
                whileTap={{ scale: 0.95 }}
              />
            </SettingItem>

            <SettingItem>
              <label>Test Sound</label>
              <TestButton
                onClick={testSound}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={sounds.isMuted}
              >
                🔊 Test
              </TestButton>
            </SettingItem>

            <div style={{ 
              marginTop: '15px', 
              paddingTop: '15px', 
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Sound settings are saved automatically
            </div>
          </SettingsPanel>
        )}
      </AnimatePresence>
    </>
  );
};