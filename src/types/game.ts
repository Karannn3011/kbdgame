// src/types/game.ts

// All possible game states [cite: 17]
export type GameState =
  | 'PRE_GAME'       // [cite: 18]
  | 'SELECT_RAIDER'  // [cite: 19]
  | 'PLAYER_RAID'    // [cite: 20]
  | "RAID_DECISION"
  | 'AI_RAID'        // [cite: 21]
  | 'QTE_ACTIVE'     // [cite: 22]
  | 'RAID_END'       // [cite: 23]
  | 'GAME_OVER';     // [cite: 24]

// The two QTE types [cite: 40]
export type QTE =
  | { type: 'mash'; target: number } // [cite: 41]
  | { type: 'timing'; successZone: number }; // [cite: 42]

// Type for the text log
export interface LogEntry {
  id: number;
  message: string;
}