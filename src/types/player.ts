// src/types/player.ts

// Defines the player's stats [cite: 103]
export interface PlayerStats {
  str: number; // Strength: For mash QTEs [cite: 104]
  agi: number; // Agility: For touch attempts and escape QTEs [cite: 105]
  ref: number; // Reflex: For defensive tackle QTEs [cite: 106]
}

// Defines the main player object [cite: 97]
export interface Player {
  id: string; // "p1", "a1", etc. [cite: 98]
  name: string; 
  position: { x: number; y: number }; 
  isOut: boolean; 
  stats: PlayerStats;
}