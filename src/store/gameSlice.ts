// src/store/gameSlice.ts

import { StateCreator } from "zustand";
// Import types from the central types file
import { GameSlice, FullStore } from "./types";
import { createPlayers } from "../utils/playerUtils";

export const createGameSlice: StateCreator<
  FullStore, // <-- THIS IS THE FIX. Use the FULL store type
  [],
  [],
  GameSlice // This slice ONLY returns actions
> = (set, get, api) => ({
  // --- ACTIONS ---
  _addLog: (message) => {
    set((state) => ({
      textLog: [...state.textLog, { id: state.textLog.length, message }],
    }));
  },

  _changeGameState: (newState) => {
    set({ gameState: newState });
  },

  startGame: () => {
    const { playerTeam, aiTeam } = createPlayers();
    set({
      playerTeam,
      aiTeam,
      playerScore: 0,
      aiScore: 0,
      playerOutQueue: [],
      aiOutQueue: [],
      playerEmptyRaids: 0,
      aiEmptyRaids: 0,
      textLog: [],
      raidCount: 0,
      isDoOrDie: false,
      lastRaidBy: null,
    });
    get()._updateDefenderFormations('center');

    get()._addLog("A new game has started!"); // <-- This will now work
    get()._addLog(`Game state changed to: SELECT_RAIDER`); // <-- ADD LOG HERE
    get()._changeGameState("SELECT_RAIDER"); // Call this last
  },

  _endRaid: (raiderId, pointsScored, wasSuccessful) => {
    const isPlayerRaid = get().playerTeam.some((p) => p.id === raiderId);
    set({ lastRaidBy: isPlayerRaid ? "player" : "ai" }); // Set this

    if (isPlayerRaid) {
      if (wasSuccessful) {
        set((state) => ({
          playerScore: state.playerScore + pointsScored,
          playerEmptyRaids: 0,
        }));
        get()._addLog(`Player raid success! Scored ${pointsScored} points.`);
        get()._handleRevival("player", pointsScored); // <-- This will now work
      } else {
        set((state) => ({ playerEmptyRaids: state.playerEmptyRaids + 1 }));
        get()._addLog("Player raid failed.");
      }
    } else {
      // AI Raid logic...
      if (wasSuccessful) {
        set((state) => ({
          aiScore: state.aiScore + pointsScored,
          aiEmptyRaids: 0,
        }));
        get()._addLog(`AI raid success! Scored ${pointsScored} points.`);
        get()._handleRevival("ai", pointsScored); // <-- This will now work
      } else {
        set((state) => ({ aiEmptyRaids: state.aiEmptyRaids + 1 }));
        get()._addLog("AI raid failed.");
      }
    }

    // Do-or-Die logic
    if (get().playerEmptyRaids >= 3) {
      // <-- This will now work
      set({ isDoOrDie: true });
      get()._addLog("Player is in a DO-OR-DIE raid!");
    } else {
      set({ isDoOrDie: false });
    }

    set({
      stamina: 100,
      mustRetreat: false,
      pointsScoredThisRaid: 0,
      raiderLane: null, // <-- ADD THIS
      lastRaidBy: get().playerTeam.some(p => p.id === raiderId) ? 'player' : 'ai',
    });

    set((state) => ({ raidCount: state.raidCount + 1 }));
    get()._addLog(`Raid ${get().raidCount} has ended.`);

    // 2. Check for an "All Out" and apply bonuses/revivals
    get()._handleAllOut();
    get()._setRaiderPostRaidPosition();
    

    // 3. Check if the raid limit has been reached
    const isGameOver = get()._checkForGameEnd();

    if (!isGameOver) {
      get()._addLog(`Game state changed to: RAID_END`);
      get()._changeGameState("RAID_END");
      get()._updateDefenderFormations('center');
    }
  },

  _handleAllOut: () => {
    const playerTeamCount = get().playerTeam.filter((p) => !p.isOut).length;
    const aiTeamCount = get().aiTeam.filter((p) => !p.isOut).length;

    if (playerTeamCount === 0) {
      get()._addLog("All players are out. GAME OVER. AI wins!");
      get()._changeGameState("GAME_OVER");
      return true;
    }
    if (aiTeamCount === 0) {
      get()._addLog("All AI are out. GAME OVER. Player wins!");
      get()._changeGameState("GAME_OVER");
      return true;
    }
    return false;
  },

  _checkForGameEnd: () => {
    const MAX_RAIDS = 20; // 10 raids per team

    if (get().raidCount >= MAX_RAIDS) {
      get()._addLog("Raid limit reached. GAME OVER.");

      const pScore = get().playerScore;
      const aScore = get().aiScore;

      if (pScore > aScore) get()._addLog(`Player wins! ${pScore} - ${aScore}`);
      else if (aScore > pScore) get()._addLog(`AI wins! ${aScore} - ${pScore}`);
      else get()._addLog(`The game is a TIE! ${pScore} - ${pScore}`);

      get()._addLog(`Game state changed to: GAME_OVER`);
      get()._changeGameState("GAME_OVER");
      return true;
    }
    return false;
  },

  nextTurn: () => {
    if (get().gameState !== 'RAID_END') return;

    const lastRaidBy = get().lastRaidBy;

    if (lastRaidBy === 'player') {
      get()._addLog(`Game state changed to: AI_RAID`);
      get()._changeGameState('AI_RAID');
      get().startAIRaid();
    } else {
      get()._addLog(`Game state changed to: SELECT_RAIDER`);
      // Nullify the raider ID *here*, when the turn fully ends.
      set({ currentRaiderId: null }); 
      get()._changeGameState('SELECT_RAIDER');
    }
  },
});
