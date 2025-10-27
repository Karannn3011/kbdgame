// src/store/types.ts

import { GameState, QTE, LogEntry } from '../types/game';
import { Player } from '../types/player';


export type QTEContext =
  | "feint_struggle" // Player feinted and baited a defender
  | "bonus_struggle" // Player attempted bonus and was caught
  | "multi_struggle_2" // Player is pressing for a 2nd point
  | "multi_struggle_3" // Player is pressing for a 3rd point
  | "retreat_escape" // Player was caught while retreating
  // AI-specific contexts (unchanged)
  | "tackle_score"
  | "tackle_escape"
  | "multi_tackle";
// 1. All STATE properties
export interface GameStoreState {
  // Game Flow State
  gameState: GameState;
  isDoOrDie: boolean;
  playerEmptyRaids: number;
  aiEmptyRaids: number;
  textLog: LogEntry[];
  lastRaidBy: 'player' | 'ai' | null;
  raidCount: number;
  // Team & Score State
  playerTeam: Player[];
  aiTeam: Player[];
  playerScore: number;
  aiScore: number;
  playerOutQueue: string[]; // FIFO queue of player IDs
  aiOutQueue: string[]; // FIFO queue of AI player IDs
  raiderLane: 'top' | 'center' | 'bottom' | null;
  // Raid State
  currentRaiderId: string | null;
  stamina: number;
  staminaTimer: any;
  raidTimer: number; // <-- ADD (for 30s clock)
  raidTimerId: any; // <-- ADD
  mustRetreat: boolean;
  pointsScoredThisRaid: number;
  multiKillCount: number; // <-- ADD

  // QTE State
  activeQTE: {
    type: "mash" | "timing";
    context: QTEContext;
    defenderId?: string | null; // The defender who was baited
    mashTarget?: number; // For the random mash goal
    successZone?: number;
  } | null;
}

// 2. All ACTION interfaces (Slices)
export interface GameSlice {
  _addLog: (message: string) => void;
  _changeGameState: (newState: GameState) => void;
  startGame: () => void;
  _endRaid: (raiderId: string, pointsScored: number, wasSuccessful: boolean) => void;
  _handleAllOut: () => boolean; // <-- RENAMED from _checkForGameOver
  _checkForGameEnd: () => boolean; // <-- ADD THIS
  nextTurn: () => void;
}

export interface PlayerSlice {
  _handlePlayerOut: (playerId: string, reason: string) => void;
  _handleAIOut: (aiId: string, reason: string) => void;
  _handleRevival: (team: 'player' | 'ai', pointsScored: number) => void;
  _updateDefenderFormations: (raiderLane: 'top' | 'center' | 'bottom') => void; // <-- RENAMED
}

export interface RaidSlice {
  startPlayerRaid: (raiderId: string) => void;
  startAIRaid: () => void;
  _aiTick: () => void; // <-- ADD (replaces _simulateAIRaid)
  _startStaminaDrain: () => void;
  _stopStaminaDrain: () => void;
  _startRaidTimer: () => void; // <-- ADD
  _stopRaidTimer: () => void; // <-- ADD
  handleRaidAction: (
    action: 'TOUCH' | 'RETREAT' | 'BONUS', // <-- ADD 'BONUS'
    targetId?: string
  ) => void;
  _resolveTouch: (raiderId: string, defenderId: string) => void;
  _resolveTackle: (raiderId: string, defenderId: string) => void;
  _resolveRetreat: (raiderId: string) => void;
  _resolveBonus: (raiderId: string) => void; // <-- ADD
  _triggerQTE: (qte: GameStoreState['activeQTE']) => void; // <-- UPDATED
  handleQTEOutcome: (success: boolean) => void;
  _handleQTEPlayerSuccess: (context : QTEContext |undefined, defenderId : string | null | undefined) => void;
  _handleQTEPlayerFailure: (context : QTEContext |undefined, defenderId : string | null | undefined) => void;
  feint: (direction: 'up' | 'down') => void;
  _updateRaiderPosition: (targetLane: 'top' | 'center' | 'bottom') => void;
  _setRaiderPostRaidPosition: () => void;
  resolveMultiKill: (decision: "press" | "retreat") => void; // <-- NEW
}

// 3. Combined Types
export type GameStoreActions = GameSlice & PlayerSlice & RaidSlice;

// This is the most important type: the shape of the ENTIRE store
export type FullStore = GameStoreState & GameStoreActions;