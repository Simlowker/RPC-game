import { useCallback, useEffect, useRef, useState } from 'react';

export interface SoundPreferences {
  masterVolume: number;
  soundsEnabled: boolean;
  sfxVolume: number;
  uiVolume: number;
}

export enum SoundEffect {
  // Match Management
  MATCH_CREATED = 'match_created',
  MATCH_JOINED = 'match_joined',
  MATCH_CANCELLED = 'match_cancelled',
  
  // Game Actions
  CHOICE_SELECTION = 'choice_selection',
  CHOICE_COMMIT = 'choice_commit',
  CHOICE_REVEAL = 'choice_reveal',
  
  // Game Results
  GAME_WIN = 'game_win',
  GAME_LOSS = 'game_loss',
  GAME_TIE = 'game_tie',
  
  // UI Interactions
  BUTTON_CLICK = 'button_click',
  MODAL_OPEN = 'modal_open',
  MODAL_CLOSE = 'modal_close',
  
  // Notifications
  NOTIFICATION_INFO = 'notification_info',
  NOTIFICATION_SUCCESS = 'notification_success',
  NOTIFICATION_ERROR = 'notification_error',
  
  // Timer & Status
  COUNTDOWN_TICK = 'countdown_tick',
  COUNTDOWN_END = 'countdown_end',
  STATUS_CHANGE = 'status_change',
}

interface AudioContextManager {
  context: AudioContext | null;
  isInitialized: boolean;
  isSuspended: boolean;
}

interface SoundBuffer {
  buffer: AudioBuffer | null;
  isLoaded: boolean;
  isLoading: boolean;
}

const DEFAULT_PREFERENCES: SoundPreferences = {
  masterVolume: 0.7,
  soundsEnabled: true,
  sfxVolume: 0.8,
  uiVolume: 0.6,
};

// Simple procedural sound generation for different effects
class SoundGenerator {
  private context: AudioContext;

  constructor(context: AudioContext) {
    this.context = context;
  }

  // Generate a simple beep sound
  generateBeep(frequency: number, duration: number, volume: number = 0.3): AudioBuffer {
    const sampleRate = this.context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const time = i / sampleRate;
      // Sine wave with envelope
      const envelope = Math.exp(-time * 3); // Exponential decay
      data[i] = Math.sin(2 * Math.PI * frequency * time) * envelope * volume;
    }

    return buffer;
  }

  // Generate a click sound
  generateClick(): AudioBuffer {
    const duration = 0.1;
    const sampleRate = this.context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const time = i / sampleRate;
      const envelope = Math.exp(-time * 20);
      // Mix of frequencies for a click-like sound
      const sound = (Math.sin(2 * Math.PI * 800 * time) + 
                    Math.sin(2 * Math.PI * 1200 * time) * 0.5) * envelope * 0.2;
      data[i] = sound;
    }

    return buffer;
  }

  // Generate a success sound (ascending tones)
  generateSuccess(): AudioBuffer {
    const duration = 0.5;
    const sampleRate = this.context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const time = i / sampleRate;
      const progress = time / duration;
      const frequency = 400 + progress * 200; // Rising pitch
      const envelope = Math.sin(Math.PI * progress) * 0.3;
      data[i] = Math.sin(2 * Math.PI * frequency * time) * envelope;
    }

    return buffer;
  }

  // Generate an error sound (harsh tone)
  generateError(): AudioBuffer {
    const duration = 0.3;
    const sampleRate = this.context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const time = i / sampleRate;
      const envelope = Math.exp(-time * 3) * 0.3;
      // Mix of dissonant frequencies
      const sound = (Math.sin(2 * Math.PI * 200 * time) + 
                    Math.sin(2 * Math.PI * 150 * time) + 
                    Math.random() * 0.1) * envelope;
      data[i] = sound;
    }

    return buffer;
  }

  // Generate a coin/win sound
  generateWin(): AudioBuffer {
    const duration = 0.8;
    const sampleRate = this.context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const time = i / sampleRate;
      const progress = time / duration;
      
      // Arpeggio-like pattern
      const noteProgress = (progress * 4) % 1;
      const noteIndex = Math.floor(progress * 4);
      const frequencies = [523, 659, 784, 1047]; // C, E, G, C major chord
      const frequency = frequencies[Math.min(noteIndex, 3)];
      
      const envelope = Math.sin(Math.PI * noteProgress) * Math.exp(-time * 2) * 0.25;
      data[i] = Math.sin(2 * Math.PI * frequency * time) * envelope;
    }

    return buffer;
  }
}

export const useGameSounds = () => {
  const [preferences, setPreferences] = useState<SoundPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContextManager>({
    context: null,
    isInitialized: false,
    isSuspended: false,
  });
  
  const soundBuffersRef = useRef<Map<SoundEffect, SoundBuffer>>(new Map());
  const soundGeneratorRef = useRef<SoundGenerator | null>(null);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('rps_sound_preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load sound preferences:', error);
    }
  }, []);

  // Save preferences to localStorage
  const updatePreferences = useCallback((newPreferences: Partial<SoundPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    
    try {
      localStorage.setItem('rps_sound_preferences', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save sound preferences:', error);
    }
  }, [preferences]);

  // Initialize AudioContext
  const initializeAudioContext = useCallback(async () => {
    if (audioContextRef.current.isInitialized) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }

      const context = new AudioContextClass();
      audioContextRef.current.context = context;
      audioContextRef.current.isInitialized = true;
      audioContextRef.current.isSuspended = context.state === 'suspended';

      // Create sound generator
      soundGeneratorRef.current = new SoundGenerator(context);

      // Handle context state changes
      const handleStateChange = () => {
        audioContextRef.current.isSuspended = context.state === 'suspended';
      };

      context.addEventListener('statechange', handleStateChange);
      
      // Try to resume context immediately
      if (context.state === 'suspended') {
        await context.resume();
      }

    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize audio');
    }
  }, []);

  // Resume AudioContext (required for user interaction)
  const resumeAudioContext = useCallback(async () => {
    const { context } = audioContextRef.current;
    if (context && context.state === 'suspended') {
      try {
        await context.resume();
        audioContextRef.current.isSuspended = false;
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
      }
    }
  }, []);

  // Generate and cache sound buffers
  const generateSounds = useCallback(async () => {
    const { context } = audioContextRef.current;
    const generator = soundGeneratorRef.current;
    
    if (!context || !generator) return;

    setIsLoading(true);
    setError(null);

    try {
      const soundConfigs: Record<SoundEffect, () => AudioBuffer> = {
        [SoundEffect.MATCH_CREATED]: () => generator.generateSuccess(),
        [SoundEffect.MATCH_JOINED]: () => generator.generateBeep(600, 0.2, 0.4),
        [SoundEffect.MATCH_CANCELLED]: () => generator.generateError(),
        
        [SoundEffect.CHOICE_SELECTION]: () => generator.generateClick(),
        [SoundEffect.CHOICE_COMMIT]: () => generator.generateBeep(800, 0.3, 0.3),
        [SoundEffect.CHOICE_REVEAL]: () => generator.generateBeep(1000, 0.4, 0.4),
        
        [SoundEffect.GAME_WIN]: () => generator.generateWin(),
        [SoundEffect.GAME_LOSS]: () => generator.generateError(),
        [SoundEffect.GAME_TIE]: () => generator.generateBeep(500, 0.5, 0.3),
        
        [SoundEffect.BUTTON_CLICK]: () => generator.generateClick(),
        [SoundEffect.MODAL_OPEN]: () => generator.generateBeep(400, 0.2, 0.2),
        [SoundEffect.MODAL_CLOSE]: () => generator.generateBeep(300, 0.2, 0.2),
        
        [SoundEffect.NOTIFICATION_INFO]: () => generator.generateBeep(500, 0.3, 0.25),
        [SoundEffect.NOTIFICATION_SUCCESS]: () => generator.generateSuccess(),
        [SoundEffect.NOTIFICATION_ERROR]: () => generator.generateError(),
        
        [SoundEffect.COUNTDOWN_TICK]: () => generator.generateBeep(800, 0.1, 0.2),
        [SoundEffect.COUNTDOWN_END]: () => generator.generateBeep(400, 0.5, 0.4),
        [SoundEffect.STATUS_CHANGE]: () => generator.generateBeep(600, 0.2, 0.3),
      };

      // Generate all sounds
      for (const [effect, generateFn] of Object.entries(soundConfigs)) {
        try {
          const buffer = generateFn();
          soundBuffersRef.current.set(effect as SoundEffect, {
            buffer,
            isLoaded: true,
            isLoading: false,
          });
        } catch (error) {
          console.warn(`Failed to generate sound for ${effect}:`, error);
          soundBuffersRef.current.set(effect as SoundEffect, {
            buffer: null,
            isLoaded: false,
            isLoading: false,
          });
        }
      }

    } catch (error) {
      console.error('Failed to generate sounds:', error);
      setError('Failed to generate sound effects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize audio system
  useEffect(() => {
    if (preferences.soundsEnabled) {
      initializeAudioContext().then(() => {
        if (audioContextRef.current.isInitialized) {
          generateSounds();
        }
      });
    }
  }, [preferences.soundsEnabled, initializeAudioContext, generateSounds]);

  // Play sound effect
  const playSound = useCallback(async (
    effect: SoundEffect,
    options: {
      volume?: number;
      delay?: number;
      forcePlay?: boolean;
    } = {}
  ) => {
    // Check if sounds are enabled
    if (!preferences.soundsEnabled && !options.forcePlay) return;

    const { context } = audioContextRef.current;
    if (!context) return;

    // Resume context if needed (handles user interaction requirement)
    await resumeAudioContext();

    // Get sound buffer
    const soundBuffer = soundBuffersRef.current.get(effect);
    if (!soundBuffer?.buffer || !soundBuffer.isLoaded) return;

    try {
      // Calculate final volume
      const effectiveVolume = (options.volume ?? 1) * 
                            preferences.masterVolume * 
                            (effect.includes('button') || effect.includes('modal') || effect.includes('notification') ? 
                              preferences.uiVolume : preferences.sfxVolume);

      // Create audio nodes
      const source = context.createBufferSource();
      const gainNode = context.createGain();

      source.buffer = soundBuffer.buffer;
      gainNode.gain.value = Math.max(0, Math.min(1, effectiveVolume));

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(context.destination);

      // Play with optional delay
      const startTime = context.currentTime + (options.delay ?? 0);
      source.start(startTime);

    } catch (error) {
      console.warn(`Failed to play sound ${effect}:`, error);
    }
  }, [preferences, resumeAudioContext]);

  // Play sound sequence
  const playSoundSequence = useCallback(async (
    sequence: Array<{ effect: SoundEffect; delay: number; volume?: number }>
  ) => {
    for (const { effect, delay, volume } of sequence) {
      setTimeout(() => {
        playSound(effect, { volume });
      }, delay);
    }
  }, [playSound]);

  // Preload all sounds (call on user interaction)
  const preloadSounds = useCallback(async () => {
    if (!audioContextRef.current.isInitialized) {
      await initializeAudioContext();
    }
    
    await resumeAudioContext();
    
    if (soundBuffersRef.current.size === 0) {
      await generateSounds();
    }
  }, [initializeAudioContext, resumeAudioContext, generateSounds]);

  // Test a sound effect
  const testSound = useCallback((effect: SoundEffect) => {
    playSound(effect, { forcePlay: true });
  }, [playSound]);

  return {
    // State
    preferences,
    isLoading,
    error,
    isInitialized: audioContextRef.current.isInitialized,
    isAudioSuspended: audioContextRef.current.isSuspended,
    
    // Actions
    updatePreferences,
    playSound,
    playSoundSequence,
    preloadSounds,
    testSound,
    resumeAudioContext,
    
    // Utilities
    getSoundEffects: () => Object.values(SoundEffect),
    isReady: audioContextRef.current.isInitialized && soundBuffersRef.current.size > 0,
  };
};

export type GameSoundsHook = ReturnType<typeof useGameSounds>;