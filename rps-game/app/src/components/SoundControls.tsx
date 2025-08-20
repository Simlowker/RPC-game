import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Volume1, 
  Settings, 
  Play,
  Check,
  X,
  Info
} from 'lucide-react';
import { useGameSounds, SoundEffect, type SoundPreferences } from '../hooks/useGameSounds';

interface SoundControlsProps {
  className?: string;
  showAdvanced?: boolean;
  compact?: boolean;
}

interface VolumeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  color?: string;
  icon?: React.ReactNode;
}

const VolumeSlider: React.FC<VolumeSliderProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  color = 'blue',
  icon
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon}
          <label className="text-sm font-medium text-white">{label}</label>
        </div>
        <span className="text-sm text-gray-400">{Math.round(value * 100)}%</span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className={`w-full h-2 rounded-lg appearance-none cursor-pointer
            ${disabled ? 'bg-gray-600' : 'bg-gray-700'}
            slider-${color}`}
          style={{
            background: disabled 
              ? '#4B5563' 
              : `linear-gradient(to right, 
                  var(--tw-${color}-500) 0%, 
                  var(--tw-${color}-500) ${value * 100}%, 
                  #374151 ${value * 100}%, 
                  #374151 100%)`
          }}
        />
      </div>
    </div>
  );
};

const SoundTestButton: React.FC<{
  effect: SoundEffect;
  label: string;
  onTest: (effect: SoundEffect) => void;
  disabled?: boolean;
}> = ({ effect, label, onTest, disabled = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTest = () => {
    if (disabled) return;
    
    setIsPlaying(true);
    onTest(effect);
    
    // Reset playing state after a short delay
    setTimeout(() => setIsPlaying(false), 500);
  };

  return (
    <button
      onClick={handleTest}
      disabled={disabled}
      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all
        ${disabled 
          ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
          : isPlaying
            ? 'bg-green-600 text-white'
            : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
        }`}
    >
      <Play size={14} className={isPlaying ? 'animate-pulse' : ''} />
      <span>{label}</span>
    </button>
  );
};

export const SoundControls: React.FC<SoundControlsProps> = ({
  className = '',
  showAdvanced = false,
  compact = false
}) => {
  const {
    preferences,
    updatePreferences,
    testSound,
    preloadSounds,
    isInitialized,
    isAudioSuspended,
    isLoading,
    error,
    isReady
  } = useGameSounds();

  const [showSettings, setShowSettings] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Handle first user interaction to initialize audio
  const handleFirstInteraction = async () => {
    if (!hasInteracted) {
      await preloadSounds();
      setHasInteracted(true);
    }
  };

  const toggleMute = async () => {
    await handleFirstInteraction();
    updatePreferences({ soundsEnabled: !preferences.soundsEnabled });
  };

  const updateMasterVolume = async (volume: number) => {
    await handleFirstInteraction();
    updatePreferences({ masterVolume: volume });
  };

  const updateSfxVolume = async (volume: number) => {
    await handleFirstInteraction();
    updatePreferences({ sfxVolume: volume });
  };

  const updateUiVolume = async (volume: number) => {
    await handleFirstInteraction();
    updatePreferences({ uiVolume: volume });
  };

  const handleTestSound = async (effect: SoundEffect) => {
    await handleFirstInteraction();
    testSound(effect);
  };

  const getVolumeIcon = () => {
    if (!preferences.soundsEnabled) return <VolumeX size={20} />;
    if (preferences.masterVolume === 0) return <VolumeX size={20} />;
    if (preferences.masterVolume < 0.5) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  const getStatusColor = () => {
    if (error) return 'text-red-400';
    if (isLoading) return 'text-yellow-400';
    if (isReady && preferences.soundsEnabled) return 'text-green-400';
    return 'text-gray-400';
  };

  const getStatusMessage = () => {
    if (error) return 'Audio Error';
    if (isLoading) return 'Loading...';
    if (!isInitialized) return 'Not Initialized';
    if (isAudioSuspended) return 'Click to Enable';
    if (!preferences.soundsEnabled) return 'Muted';
    if (isReady) return 'Ready';
    return 'Initializing';
  };

  // Compact mode - just mute/unmute button
  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          onClick={toggleMute}
          className={`p-2 rounded-lg transition-colors
            ${preferences.soundsEnabled 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          title={preferences.soundsEnabled ? 'Mute sounds' : 'Unmute sounds'}
        >
          {getVolumeIcon()}
        </button>
        
        {showAdvanced && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            title="Sound settings"
          >
            <Settings size={20} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Main Controls */}
      <div className="flex items-center space-x-4">
        {/* Mute/Unmute Button */}
        <button
          onClick={toggleMute}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
            ${preferences.soundsEnabled 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
        >
          {getVolumeIcon()}
          <span>{preferences.soundsEnabled ? 'Sounds On' : 'Sounds Off'}</span>
        </button>

        {/* Master Volume */}
        {preferences.soundsEnabled && (
          <div className="flex items-center space-x-3">
            <VolumeSlider
              label="Volume"
              value={preferences.masterVolume}
              onChange={updateMasterVolume}
              disabled={!preferences.soundsEnabled}
              color="blue"
            />
          </div>
        )}

        {/* Settings Toggle */}
        {showAdvanced && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors
              ${showSettings 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            title="Advanced settings"
          >
            <Settings size={20} />
          </button>
        )}

        {/* Status Indicator */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            error ? 'bg-red-400' :
            isLoading ? 'bg-yellow-400 animate-pulse' :
            isReady && preferences.soundsEnabled ? 'bg-green-400' :
            'bg-gray-400'
          }`} />
          <span className={`text-sm ${getStatusColor()}`}>
            {getStatusMessage()}
          </span>
        </div>
      </div>

      {/* Advanced Settings Panel */}
      {showSettings && showAdvanced && (
        <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <Settings size={20} />
            <span>Sound Settings</span>
          </h3>

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <X className="text-red-400" size={16} />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Audio Status Info */}
          {!error && (
            <div className="mb-6 bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Info size={16} className="text-blue-400" />
                <span className="text-blue-400 font-medium">Audio Status</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Initialized:</span>
                  <span className={`ml-2 ${isInitialized ? 'text-green-400' : 'text-red-400'}`}>
                    {isInitialized ? <Check size={14} className="inline" /> : <X size={14} className="inline" />}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Ready:</span>
                  <span className={`ml-2 ${isReady ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isReady ? <Check size={14} className="inline" /> : <X size={14} className="inline" />}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Suspended:</span>
                  <span className={`ml-2 ${isAudioSuspended ? 'text-yellow-400' : 'text-green-400'}`}>
                    {isAudioSuspended ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Loading:</span>
                  <span className={`ml-2 ${isLoading ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {isLoading ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Volume Controls */}
          <div className="space-y-6">
            <VolumeSlider
              label="Master Volume"
              value={preferences.masterVolume}
              onChange={updateMasterVolume}
              disabled={!preferences.soundsEnabled}
              color="blue"
              icon={<Volume2 size={16} className="text-blue-400" />}
            />

            <VolumeSlider
              label="Game Effects"
              value={preferences.sfxVolume}
              onChange={updateSfxVolume}
              disabled={!preferences.soundsEnabled}
              color="green"
              icon={<Volume2 size={16} className="text-green-400" />}
            />

            <VolumeSlider
              label="UI Sounds"
              value={preferences.uiVolume}
              onChange={updateUiVolume}
              disabled={!preferences.soundsEnabled}
              color="purple"
              icon={<Volume2 size={16} className="text-purple-400" />}
            />
          </div>

          {/* Sound Test Section */}
          {preferences.soundsEnabled && isReady && (
            <div className="mt-8">
              <h4 className="text-md font-bold text-white mb-4">Test Sounds</h4>
              
              <div className="space-y-4">
                {/* Game Sounds */}
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Game Events</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <SoundTestButton
                      effect={SoundEffect.MATCH_CREATED}
                      label="Match Created"
                      onTest={handleTestSound}
                      disabled={!preferences.soundsEnabled}
                    />
                    <SoundTestButton
                      effect={SoundEffect.CHOICE_COMMIT}
                      label="Choice Commit"
                      onTest={handleTestSound}
                      disabled={!preferences.soundsEnabled}
                    />
                    <SoundTestButton
                      effect={SoundEffect.GAME_WIN}
                      label="Win"
                      onTest={handleTestSound}
                      disabled={!preferences.soundsEnabled}
                    />
                    <SoundTestButton
                      effect={SoundEffect.GAME_LOSS}
                      label="Loss"
                      onTest={handleTestSound}
                      disabled={!preferences.soundsEnabled}
                    />
                    <SoundTestButton
                      effect={SoundEffect.GAME_TIE}
                      label="Tie"
                      onTest={handleTestSound}
                      disabled={!preferences.soundsEnabled}
                    />
                    <SoundTestButton
                      effect={SoundEffect.CHOICE_REVEAL}
                      label="Reveal"
                      onTest={handleTestSound}
                      disabled={!preferences.soundsEnabled}
                    />
                  </div>
                </div>

                {/* UI Sounds */}
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">UI Interactions</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <SoundTestButton
                      effect={SoundEffect.BUTTON_CLICK}
                      label="Click"
                      onTest={handleTestSound}
                      disabled={!preferences.soundsEnabled}
                    />
                    <SoundTestButton
                      effect={SoundEffect.NOTIFICATION_SUCCESS}
                      label="Success"
                      onTest={handleTestSound}
                      disabled={!preferences.soundsEnabled}
                    />
                    <SoundTestButton
                      effect={SoundEffect.NOTIFICATION_ERROR}
                      label="Error"
                      onTest={handleTestSound}
                      disabled={!preferences.soundsEnabled}
                    />
                    <SoundTestButton
                      effect={SoundEffect.MODAL_OPEN}
                      label="Modal"
                      onTest={handleTestSound}
                      disabled={!preferences.soundsEnabled}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Usage Instructions */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Sound System Info:</p>
                <ul className="text-xs text-blue-200 space-y-1">
                  <li>• Sounds require user interaction to start (browser security)</li>
                  <li>• Preferences are automatically saved</li>
                  <li>• Uses Web Audio API for cross-browser compatibility</li>
                  <li>• All sounds are generated procedurally (no external files)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Settings Bar */}
      {!showSettings && showAdvanced && preferences.soundsEnabled && (
        <div className="mt-4 flex items-center space-x-6 bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <span className="text-sm text-gray-400 whitespace-nowrap">SFX:</span>
            <div className="flex-1 min-w-0">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={preferences.sfxVolume}
                onChange={(e) => updateSfxVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <span className="text-xs text-gray-400 w-8 text-right">
              {Math.round(preferences.sfxVolume * 100)}%
            </span>
          </div>

          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <span className="text-sm text-gray-400 whitespace-nowrap">UI:</span>
            <div className="flex-1 min-w-0">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={preferences.uiVolume}
                onChange={(e) => updateUiVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <span className="text-xs text-gray-400 w-8 text-right">
              {Math.round(preferences.uiVolume * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoundControls;