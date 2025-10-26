// src/store/playerSlice.ts

import { StateCreator } from 'zustand';
// Import types from the central types file
import { PlayerSlice, FullStore } from './types';
import { getFormationPositions } from '../utils/formationUtils';

export const createPlayerSlice: StateCreator<
  FullStore, // <-- THIS IS THE FIX. Use the FULL store type
  [],
  [],
  PlayerSlice // This slice ONLY returns actions
> = (set, get, api) => ({
  // --- ACTIONS ---
  _handlePlayerOut: (playerId, reason) => {
    get()._addLog(`Player ${playerId} is OUT! (${reason})`); // <-- This will now work

    set((state) => ({
      playerTeam: state.playerTeam.map((p) =>
        p.id === playerId ? { ...p, isOut: true } : p
      ),
      playerOutQueue: [...state.playerOutQueue, playerId],
    }));
  },

  _updateDefenderFormations: (raiderLane) => {
    const { currentRaiderId, gameState } = get();

    // --- CASE 1: Player is raiding ---
    // Only move the AI defenders.
    if (gameState === 'PLAYER_RAID') {
      const activeAI = get().aiTeam.filter(
        (p) => !p.isOut && p.id !== currentRaiderId
      );
      const aiPositions = getFormationPositions(activeAI.length, raiderLane);

      let aiPosIndex = 0;
      const updatedAITeam = get().aiTeam.map((player) => {
        if (!player.isOut && player.id !== currentRaiderId) {
          const mirroredPos = aiPositions[aiPosIndex] || { x: 50, y: 50 };
          aiPosIndex++;
          return { ...player, position: { ...mirroredPos, x: 100 - mirroredPos.x } };
        }
        return player;
      });
      
      // Only set the AI team
      set({ aiTeam: updatedAITeam });
    } 
    
    // --- CASE 2: AI is raiding ---
    // Only move the Player defenders. (For when we add AI feints)
    else if (gameState === 'AI_RAID') {
      const activePlayers = get().playerTeam.filter(
        (p) => !p.isOut && p.id !== currentRaiderId
      );
      const playerPositions = getFormationPositions(activePlayers.length, raiderLane);
      
      let playerPosIndex = 0;
      const updatedPlayerTeam = get().playerTeam.map((player) => {
        if (!player.isOut && player.id !== currentRaiderId) {
          const newPos = playerPositions[playerPosIndex] || { x: 50, y: 50 };
          playerPosIndex++;
          return { ...player, position: newPos };
        }
        return player;
      });
      
      // Only set the Player team
      set({ playerTeam: updatedPlayerTeam });
    } 
    
    // --- CASE 3: Not raiding (Game start, Raid end) ---
    // Reset BOTH teams to their 'center' formation.
    else {
      // Player Team Reset
      const activePlayers = get().playerTeam.filter(
        (p) => !p.isOut && p.id !== currentRaiderId
      );
      const playerPositions = getFormationPositions(activePlayers.length, 'center');
      let playerPosIndex = 0;
      const updatedPlayerTeam = get().playerTeam.map((player) => {
        if (!player.isOut && player.id !== currentRaiderId) {
          const newPos = playerPositions[playerPosIndex] || { x: 50, y: 50 };
          playerPosIndex++;
          return { ...player, position: newPos };
        }
        return player;
      });

      // AI Team Reset
      const activeAI = get().aiTeam.filter(
        (p) => !p.isOut && p.id !== currentRaiderId
      );
      const aiPositions = getFormationPositions(activeAI.length, 'center');
      let aiPosIndex = 0;
      const updatedAITeam = get().aiTeam.map((player) => {
        if (!player.isOut && player.id !== currentRaiderId) {
          const mirroredPos = aiPositions[aiPosIndex] || { x: 50, y: 50 };
          aiPosIndex++;
          return { ...player, position: { ...mirroredPos, x: 100 - mirroredPos.x } };
        }
        return player;
      });

      // Set both teams
      set({ playerTeam: updatedPlayerTeam, aiTeam: updatedAITeam });
    }
  },
  _handleAIOut: (aiId, reason) => {
    get()._addLog(`AI ${aiId} is OUT! (${reason})`); // <-- This will now work

    set((state) => ({
      aiTeam: state.aiTeam.map((p) =>
        p.id === aiId ? { ...p, isOut: true } : p
      ),
      aiOutQueue: [...state.aiOutQueue, aiId],
    }));
  },

  _handleRevival: (team, pointsScored) => {
    if (team === 'player') {
      let queue = [...get().playerOutQueue];
      let team = [...get().playerTeam];
      let revivedCount = 0;

      for (let i = 0; i < pointsScored && queue.length > 0; i++) {
        const revivedPlayerId = queue.shift(); 
        if (revivedPlayerId) {
          team = team.map((p) =>
            p.id === revivedPlayerId ? { ...p, isOut: false } : p
          );
          revivedCount++;
        }
      }

      if (revivedCount > 0) {
        get()._addLog(`Player revived ${revivedCount} teammate(s)!`); // <-- This will now work
        set({ playerTeam: team, playerOutQueue: queue });
      }
    } else {
      // AI Team logic...
      let queue = [...get().aiOutQueue];
      let team = [...get().aiTeam];
      let revivedCount = 0;

      for (let i = 0; i < pointsScored && queue.length > 0; i++) {
        const revivedPlayerId = queue.shift();
        if (revivedPlayerId) {
          team = team.map((p) =>
            p.id === revivedPlayerId ? { ...p, isOut: false } : p
          );
          revivedCount++;
        }
      }
      
      if (revivedCount > 0) {
        get()._addLog(`AI revived ${revivedCount} teammate(s)!`); // <-- This will now work
        set({ aiTeam: team, aiOutQueue: queue });
      }
    }
  },
});