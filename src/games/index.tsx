// src/games/index.tsx - RPS Game Registry
import React from 'react';

export interface GameMeta {
  background: string;
  name: string;
  image: string;
  description: string;
  tag?: string;
}

export interface RPSGame {
  id: string;
  meta: GameMeta;
  app: React.ComponentType;
}

export const GAMES: RPSGame[] = [
  {
    id: 'rps',
    meta: {
      background: '#ff6490',
      name: 'Rock Paper Scissors',
      image: '/rps-icon.png',
      description: `
        Challenge other players in the classic Rock Paper Scissors game with real SOL betting. 
        Create or join matches, place your bets, make your choice, and win big! 
        Secure commitment-reveal scheme ensures fair play for all players.
      `,
      tag: 'PvP',
    },
    app: React.lazy(() => import('./RPS')),
  },
];

export const getGameById = (id: string): RPSGame | undefined => {
  return GAMES.find(game => game.id === id);
};