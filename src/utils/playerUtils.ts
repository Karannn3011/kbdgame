// src/utils/playerUtils.ts

import { Player, PlayerStats } from '../types/player';

// Helper to generate stats for a player
const generateStats = (): PlayerStats => {
  // Simple random stats for now. V2 could have defined roles.
  return {
    str: Math.floor(Math.random() * 5) + 3, // 3-7
    agi: Math.floor(Math.random() * 5) + 3, // 3-7
    ref: Math.floor(Math.random() * 5) + 3, // 3-7
  };
};

// Helper to create a single player
const createPlayer = (id: string, name: string): Player => ({
  id,
  name,
  position: { x: 0, y: 0 }, // We'll handle positions later
  isOut: false,
  stats: generateStats(),
});

// Called by startGame() in gameSlice.ts
export const createPlayers = (): { playerTeam: Player[]; aiTeam: Player[] } => {
  const playerTeam: Player[] = [
    createPlayer('p1', 'Player 1'),
    createPlayer('p2', 'Player 2'),
    createPlayer('p3', 'Player 3'),
    createPlayer('p4', 'Player 4'),
    createPlayer('p5', 'Player 5'),
    createPlayer('p6', 'Player 6'),
    createPlayer('p7', 'Player 7'),
  ];

  const aiTeam: Player[] = [
    createPlayer('a1', 'AI 1'),
    createPlayer('a2', 'AI 2'),
    createPlayer('a3', 'AI 3'),
    createPlayer('a4', 'AI 4'),
    createPlayer('a5', 'AI 5'),
    createPlayer('a6', 'AI 6'),
    createPlayer('a7', 'AI 7'),
  ];

  return { playerTeam, aiTeam };
};