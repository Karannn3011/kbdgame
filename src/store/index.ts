// src/store/index.ts

import { create } from 'zustand';
import { GameStoreState, FullStore } from './types';
// Import slice creators (we will create these next)
import { createGameSlice } from './gameSlice';
import { createPlayerSlice } from './playerSlice';
import { createRaidSlice } from './raidSlice';


const initialState: GameStoreState = {
  gameState: 'PRE_GAME',
  isDoOrDie: false,
  playerEmptyRaids: 0,
  aiEmptyRaids: 0,
  textLog: [],
  lastRaidBy: null,
  playerTeam: [],
  aiTeam: [],
  playerScore: 0,
  raidCount: 0,
  aiScore: 0,
  raiderLane: null,
  playerOutQueue: [],
  aiOutQueue: [],
  currentRaiderId: null,
  stamina: 100,
  staminaTimer: null,
  raidTimer: 30, // <-- ADD (30 seconds)
  raidTimerId: null, // <-- ADD
  mustRetreat: false,
  pointsScoredThisRaid: 0,
  hasCrossedBaulkLine: false, // <-- ADD
  multiKillCount: 0, // <-- ADD
  activeQTE: null, // <-- UPDATED
};

// 4. Create the store
// We use the "slice" pattern, passing `set` and `get` to each slice creator.
// This combines all state and actions into one store. 
export const useGameStore = create<FullStore>()((set, get, api) => ({
  ...initialState,
  
  // Spread in the actions from all our slices
  ...createGameSlice(set, get, api),
  ...createPlayerSlice(set, get, api),
  ...createRaidSlice(set, get, api),

  // We can add simple, shared actions here if needed,
  // but most logic will live in the slices.
}));