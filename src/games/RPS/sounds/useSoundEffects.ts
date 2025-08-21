// src/games/RPS/sounds/useSoundEffects.ts
import React, { useCallback, useRef } from 'react';
import useSound from 'use-sound';

// Sound file URLs (you can replace these with actual audio files)
const SOUND_URLS = {
  // Choice selection sounds
  rock: '/sounds/rps/rock.mp3',
  paper: '/sounds/rps/paper.mp3', 
  scissors: '/sounds/rps/scissors.mp3',
  
  // Game state sounds
  countdown: '/sounds/rps/countdown.mp3',
  reveal: '/sounds/rps/reveal.mp3',
  match: '/sounds/rps/match.mp3',
  
  // Result sounds
  win: '/sounds/rps/win.mp3',
  lose: '/sounds/rps/lose.mp3',
  tie: '/sounds/rps/tie.mp3',
  
  // UI sounds
  click: '/sounds/rps/click.mp3',
  hover: '/sounds/rps/hover.mp3',
  join: '/sounds/rps/join.mp3',
  waiting: '/sounds/rps/waiting.mp3',
  
  // Background music
  lobbyMusic: '/sounds/rps/lobby-music.mp3',
  gameMusic: '/sounds/rps/game-music.mp3',
};

// Fallback to simple audio generation if files don't exist
const generateTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

const createFallbackSounds = () => {
  return {
    rock: () => generateTone(150, 0.3, 'square'),
    paper: () => generateTone(300, 0.2, 'sine'),
    scissors: () => generateTone(500, 0.15, 'triangle'),
    countdown: () => generateTone(800, 0.1, 'sine'),
    reveal: () => {
      setTimeout(() => generateTone(400, 0.1), 0);
      setTimeout(() => generateTone(600, 0.1), 100);
      setTimeout(() => generateTone(800, 0.2), 200);
    },
    match: () => {
      generateTone(600, 0.2);
      setTimeout(() => generateTone(800, 0.3), 150);
    },
    win: () => {
      generateTone(523, 0.2); // C
      setTimeout(() => generateTone(659, 0.2), 100); // E
      setTimeout(() => generateTone(783, 0.3), 200); // G
    },
    lose: () => generateTone(200, 0.5, 'sawtooth'),
    tie: () => generateTone(400, 0.3, 'sine'),
    click: () => generateTone(1000, 0.05, 'square'),
    hover: () => generateTone(800, 0.03, 'sine'),
    join: () => {
      generateTone(440, 0.1);
      setTimeout(() => generateTone(550, 0.2), 100);
    },
    waiting: () => generateTone(300, 0.1, 'sine'),
  };
};

export interface SoundEffects {
  // Choice sounds
  playRock: () => void;
  playPaper: () => void;
  playScissors: () => void;
  
  // Game sounds
  playCountdown: () => void;
  playReveal: () => void;
  playMatch: () => void;
  
  // Result sounds
  playWin: () => void;
  playLose: () => void;
  playTie: () => void;
  
  // UI sounds
  playClick: () => void;
  playHover: () => void;
  playJoin: () => void;
  playWaiting: () => void;
  
  // Music controls
  startLobbyMusic: () => void;
  stopLobbyMusic: () => void;
  startGameMusic: () => void;
  stopGameMusic: () => void;
  
  // Settings
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  isMuted: boolean;
}

export const useSoundEffects = (): SoundEffects => {
  const volumeRef = useRef(0.5);
  const mutedRef = useRef(false);
  const fallbackSounds = useRef(createFallbackSounds());
  
  // Try to load actual sound files, fallback to generated tones
  const [playRockSound] = useSound(SOUND_URLS.rock, { 
    volume: volumeRef.current,
    onError: () => fallbackSounds.current.rock(),
  });
  
  const [playPaperSound] = useSound(SOUND_URLS.paper, {
    volume: volumeRef.current,
    onError: () => fallbackSounds.current.paper(),
  });
  
  const [playScissorsSound] = useSound(SOUND_URLS.scissors, {
    volume: volumeRef.current,
    onError: () => fallbackSounds.current.scissors(),
  });
  
  const [playCountdownSound] = useSound(SOUND_URLS.countdown, {
    volume: volumeRef.current,
    onError: () => fallbackSounds.current.countdown(),
  });
  
  const [playRevealSound] = useSound(SOUND_URLS.reveal, {
    volume: volumeRef.current,
    onError: () => fallbackSounds.current.reveal(),
  });
  
  const [playMatchSound] = useSound(SOUND_URLS.match, {
    volume: volumeRef.current,
    onError: () => fallbackSounds.current.match(),
  });
  
  const [playWinSound] = useSound(SOUND_URLS.win, {
    volume: volumeRef.current,
    onError: () => fallbackSounds.current.win(),
  });
  
  const [playLoseSound] = useSound(SOUND_URLS.lose, {
    volume: volumeRef.current,
    onError: () => fallbackSounds.current.lose(),
  });
  
  const [playTieSound] = useSound(SOUND_URLS.tie, {
    volume: volumeRef.current,
    onError: () => fallbackSounds.current.tie(),
  });
  
  const [playClickSound] = useSound(SOUND_URLS.click, {
    volume: volumeRef.current * 0.3,
    onError: () => fallbackSounds.current.click(),
  });
  
  const [playHoverSound] = useSound(SOUND_URLS.hover, {
    volume: volumeRef.current * 0.2,
    onError: () => fallbackSounds.current.hover(),
  });
  
  const [playJoinSound] = useSound(SOUND_URLS.join, {
    volume: volumeRef.current,
    onError: () => fallbackSounds.current.join(),
  });
  
  const [playWaitingSound] = useSound(SOUND_URLS.waiting, {
    volume: volumeRef.current * 0.7,
    onError: () => fallbackSounds.current.waiting(),
  });
  
  // Background music
  const [playLobbyMusic, { stop: stopLobbyMusic }] = useSound(SOUND_URLS.lobbyMusic, {
    volume: volumeRef.current * 0.3,
    loop: true,
    onError: () => {}, // Silent fallback for background music
  });
  
  const [playGameMusic, { stop: stopGameMusic }] = useSound(SOUND_URLS.gameMusic, {
    volume: volumeRef.current * 0.3,
    loop: true,
    onError: () => {}, // Silent fallback for background music
  });
  
  // Safe play functions that check mute state
  const createSafePlay = (playFn: () => void) => useCallback(() => {
    if (!mutedRef.current) {
      try {
        playFn();
      } catch (error) {
        console.warn('Sound playback failed:', error);
      }
    }
  }, [playFn]);
  
  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.max(0, Math.min(1, volume));
    localStorage.setItem('rps-volume', volumeRef.current.toString());
  }, []);
  
  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    localStorage.setItem('rps-muted', mutedRef.current.toString());
  }, []);
  
  // Load saved settings
  React.useEffect(() => {
    const savedVolume = localStorage.getItem('rps-volume');
    const savedMuted = localStorage.getItem('rps-muted');
    
    if (savedVolume) {
      volumeRef.current = parseFloat(savedVolume);
    }
    
    if (savedMuted) {
      mutedRef.current = savedMuted === 'true';
    }
  }, []);
  
  return {
    // Choice sounds
    playRock: createSafePlay(playRockSound),
    playPaper: createSafePlay(playPaperSound),
    playScissors: createSafePlay(playScissorsSound),
    
    // Game sounds
    playCountdown: createSafePlay(playCountdownSound),
    playReveal: createSafePlay(playRevealSound),
    playMatch: createSafePlay(playMatchSound),
    
    // Result sounds
    playWin: createSafePlay(playWinSound),
    playLose: createSafePlay(playLoseSound),
    playTie: createSafePlay(playTieSound),
    
    // UI sounds
    playClick: createSafePlay(playClickSound),
    playHover: createSafePlay(playHoverSound),
    playJoin: createSafePlay(playJoinSound),
    playWaiting: createSafePlay(playWaitingSound),
    
    // Music
    startLobbyMusic: createSafePlay(playLobbyMusic),
    stopLobbyMusic,
    startGameMusic: createSafePlay(playGameMusic),
    stopGameMusic,
    
    // Settings
    setVolume,
    toggleMute,
    isMuted: mutedRef.current,
  };
};