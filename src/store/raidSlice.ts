// src/store/raidSlice.ts

import { StateCreator } from "zustand";
// Import types from the central types file
import { RaidSlice, FullStore } from "./types";

export const createRaidSlice: StateCreator<
  FullStore, // <-- THIS IS THE FIX. Use the FULL store type
  [],
  [],
  RaidSlice // This slice ONLY returns actions
> = (set, get, api) => ({
  // --- ACTIONS ---
  startPlayerRaid: (raiderId) => {
    if (get().gameState !== "SELECT_RAIDER") return;

    // Set the raider's starting position (just over the line)
    const updatedPlayerTeam = get().playerTeam.map(
      (p) => (p.id === raiderId ? { ...p, position: { x: 10, y: 50 } } : p) // <-- CHANGED
    );

    set({
      currentRaiderId: raiderId,
      pointsScoredThisRaid: 0,
      playerTeam: updatedPlayerTeam, // <-- Set updated team
      raiderLane: "center",
    });

    get()._addLog(`Player raid started with ${raiderId}.`);
    get()._addLog(`Game state changed to: PLAYER_RAID`);
    get()._changeGameState("PLAYER_RAID");
    get()._startStaminaDrain();
  },

  startAIRaid: () => {
    if (get().gameState !== "AI_RAID") return;

    const raider = get().aiTeam.find((p) => !p.isOut);
    if (!raider) return;

    const updatedAITeam = get().aiTeam.map(
      (p) => (p.id === raider.id ? { ...p, position: { x: 90, y: 50 } } : p) // <-- CHANGED
    );

    set({
      currentRaiderId: raider.id,
      pointsScoredThisRaid: 0,
      aiTeam: updatedAITeam, // <-- Set updated team
      raiderLane: "center",
    });
    get()._addLog(`AI raid started with ${raider.id}.`); // <-- This will now work
    get()._startStaminaDrain();

    const target = get().playerTeam.find((p) => !p.isOut);
    if (target) {
      get().handleRaidAction("TOUCH", target.id); // <-- This will now work
    } else {
      get().handleRaidAction("RETREAT"); // <-- This will now work
    }
  },

  _setRaiderPostRaidPosition: () => {
    const raiderId = get().currentRaiderId;
    if (!raiderId) return;

    const isPlayerRaider = get().playerTeam.some((p) => p.id === raiderId);

    if (isPlayerRaider) {
      // Player raider returns to their OWN (left) half, near x: 100
      set((state) => ({
        playerTeam: state.playerTeam.map((p) =>
          p.id === raiderId ? { ...p, position: { x: 95, y: 50 } } : p
        ),
      }));
    } else {
      // AI raider returns to their OWN (right) half, near x: 0
      set((state) => ({
        aiTeam: state.aiTeam.map((p) =>
          p.id === raiderId ? { ...p, position: { x: 5, y: 50 } } : p
        ),
      }));
    }
  },

  _updateRaiderPosition: (targetLane) => {
    const raiderId = get().currentRaiderId;
    if (!raiderId) return;

    // Set Y-position based on lane
    const newY = targetLane === "top" ? 25 : targetLane === "bottom" ? 75 : 50;
    const newX = targetLane === "top" ? 50 : targetLane === "bottom" ? 50 : 40
    const isPlayerRaider = get().playerTeam.some((p) => p.id === raiderId);

    if (isPlayerRaider) {
      set((state) => ({
        playerTeam: state.playerTeam.map((p) =>
          p.id === raiderId ? { ...p, position: { x: newX, y: newY } } : p
        ),
      }));
    } else {
      set((state) => ({
        aiTeam: state.aiTeam.map((p) =>
          p.id === raiderId ? { ...p, position: { ...p.position, y: newY } } : p
        ),
      }));
    }
  },

  feint: (targetLane) => {
    const { gameState, raiderLane, currentRaiderId } = get();
    // Only allow feint during player raid
    if (gameState !== "PLAYER_RAID" || !currentRaiderId) return;

    // Adjacency Rule
    if (raiderLane === "top" && targetLane === "bottom") return;
    if (raiderLane === "bottom" && targetLane === "top") return;
    if (raiderLane === targetLane) return; // No feint to the same lane

    get()._addLog(`Raider feints to the ${targetLane}.`);

    // 1. Set the new lane state
    set({ raiderLane: targetLane });

    // 2. Move the raider's dot (this will animate via CSS)
    get()._updateRaiderPosition(targetLane);

    // 3. Trigger defender formation change (this will also animate)
    get()._updateDefenderFormations(targetLane);
  },

  _startStaminaDrain: () => {
    get()._stopStaminaDrain(); // Clear any existing timer

    const timer = setInterval(() => {
      set((state) => ({ stamina: state.stamina - 1 }));
      if (get().stamina <= 0) {
        get()._stopStaminaDrain();
        get()._addLog("Stamina depleted! Raider is out.");

        if (get().currentRaiderId) {
          const raiderId = get().currentRaiderId!;
          const isPlayer = get().playerTeam.some((p) => p.id === raiderId);

          if (isPlayer) {
            get()._handlePlayerOut(raiderId, "Stamina depleted"); // <-- This will now work
          } else {
            get()._handleAIOut(raiderId, "Stamina depleted"); // <-- This will now work
          }
          get()._endRaid(raiderId, 0, false); // <-- This will now work
        }
      }
    }, 1000);

    set({ staminaTimer: timer });
  },

  _stopStaminaDrain: () => {
    if (get().staminaTimer) {
      clearInterval(get().staminaTimer);
      set({ staminaTimer: null });
    }
  },

  // ... (rest of the actions) ...
  // All other internal calls to get()._addLog, get()._handlePlayerOut, etc.
  // will now be correctly typed and will work.

  handleRaidAction: (action, targetId) => {
    const raiderId = get().currentRaiderId;
    if (!raiderId) return;

    if (action === "TOUCH") {
      if (!targetId) return;
      get()._addLog(`${raiderId} attempts a touch on ${targetId}.`);
      get()._resolveTackle(raiderId, targetId);
    }

    if (action === "RETREAT") {
      get()._addLog(`${raiderId} attempts to retreat.`);
      get()._resolveRetreat(raiderId);
    }
  },

  _resolveTouch: (raiderId, defenderId) => {
    // This logic is now handled by _resolveTackle
  },

  _resolveTackle: (raiderId, defenderId) => {
    const raider = [...get().playerTeam, ...get().aiTeam].find(
      (p) => p.id === raiderId
    );
    const defender = [...get().playerTeam, ...get().aiTeam].find(
      (p) => p.id === defenderId
    );

    if (!raider || !defender) return;

    const raiderAGI = raider.stats.agi;
    const defenderREF = defender.stats.ref;

    if (raiderAGI > defenderREF) {
      get()._addLog("Touch successful! Defender is out.");
      set((state) => ({
        pointsScoredThisRaid: state.pointsScoredThisRaid + 1,
        mustRetreat: true,
      }));

      const isPlayerRaider = get().playerTeam.some((p) => p.id === raiderId);
      if (isPlayerRaider) {
        get()._handleAIOut(defenderId, "Touched by raider");
      } else {
        get()._handlePlayerOut(defenderId, "Touched by raider");
      }
    } else {
      get()._addLog("Tackle initiated! QTE triggered.");
      const isPlayerRaider = get().playerTeam.some((p) => p.id === raiderId);

      if (isPlayerRaider) {
        get()._triggerQTE({ type: "mash", target: 10 });
      } else {
        get()._triggerQTE({ type: "timing", successZone: 0.5 });
      }
    }
  },

  _resolveRetreat: (raiderId) => {
    get()._stopStaminaDrain();
    const points = get().pointsScoredThisRaid;
    const isPlayerRaider = get().playerTeam.some((p) => p.id === raiderId);

    if (get().isDoOrDie && points === 0) {
      get()._addLog("Do-or-Die raid failed! Raider is out.");
      if (isPlayerRaider) {
        get()._handlePlayerOut(raiderId, "Failed Do-or-Die");
      } else {
        get()._handleAIOut(raiderId, "Failed Do-or-Die");
      }
      get()._endRaid(raiderId, 0, false);
      return;
    }

    get()._addLog("Raider is retreating...");

    const retreatBlocked = Math.random() > 0.5;

    if (
      retreatBlocked &&
      (isPlayerRaider ? get().aiTeam : get().playerTeam).filter((p) => !p.isOut)
        .length > 0
    ) {
      get()._addLog("Retreat is blocked!");
      if (isPlayerRaider) {
        get()._triggerQTE({ type: "timing", successZone: 0.5 });
      } else {
        get()._addLog("AI attempts to escape...");
        get().handleQTEOutcome(true); // Assume AI succeeds for now
      }
    } else {
      get()._addLog("Retreat successful!");
      get()._endRaid(raiderId, points, points > 0 || !get().isDoOrDie);
    }
  },

  _triggerQTE: (qteType) => {
    get()._stopStaminaDrain(); // Pause game
    set({ qte: qteType });
    get()._addLog(`Game state changed to: QTE_ACTIVE`); // <-- ADD LOG HERE
    get()._changeGameState("QTE_ACTIVE"); // Call this last
  },

  handleQTEOutcome: (success) => {
    set({ qte: null });
    const raiderId = get().currentRaiderId!;
    const isPlayerRaider = get().playerTeam.some((p) => p.id === raiderId);

    const newState = isPlayerRaider ? "PLAYER_RAID" : "AI_RAID";
    get()._addLog(`Game state changed to: ${newState}`); // <-- ADD LOG HERE
    get()._changeGameState(newState); // Call this last

    if (success) {
      get()._handleQTEPlayerSuccess();
    } else {
      get()._handleQTEPlayerFailure();
    }
  },

  _handleQTEPlayerSuccess: () => {
    get()._addLog("QTE Success!");
    const raiderId = get().currentRaiderId!;
    const points = get().pointsScoredThisRaid;

    if (get().mustRetreat) {
      // This was a 'Retreat' QTE (Timing)
      get()._addLog("Player escaped the block and is safe!");
      get()._endRaid(raiderId, points, true);
    } else {
      // This was a 'Tackle' QTE
      const isPlayerRaider = get().playerTeam.some((p) => p.id === raiderId);

      if (isPlayerRaider) {
        // Player was raider (Mash QTE)
        // --- THIS IS THE FIX ---
        if (get().isDoOrDie && get().pointsScoredThisRaid === 0) {
          get()._addLog("Player broke free, but failed the Do-or-Die raid!");
          get()._handlePlayerOut(raiderId, "Failed Do-or-Die");
          get()._endRaid(raiderId, 0, false);
        } else {
          // Standard success, no Do-or-Die failure
          get()._addLog("Player broke free from the tackle!");
          set({ mustRetreat: true }); // Must retreat
          get()._startStaminaDrain(); // Resume drain
        }
        // --- END FIX ---
      } else {
        // Player was defender (Timing Tackle QTE)
        get()._addLog("Player successfully tackled the AI raider!");
        get()._handleAIOut(raiderId, "Tackled by player");
        get()._endRaid(raiderId, 0, false);
      }
    }
  },

  _handleQTEPlayerFailure: () => {
    get()._addLog("QTE Failed!");
    const raiderId = get().currentRaiderId!;

    if (get().mustRetreat) {
      get()._addLog("Player was caught during retreat! Raider is out.");
      get()._handlePlayerOut(raiderId, "Caught during retreat");
      get()._endRaid(raiderId, 0, false);
    } else {
      const isPlayerRaider = get().playerTeam.some((p) => p.id === raiderId);
      if (isPlayerRaider) {
        get()._addLog("Player was tackled! Raider is out.");
        get()._handlePlayerOut(raiderId, "Tackled");
        get()._endRaid(raiderId, 0, false);
      } else {
        get()._addLog("Player failed the tackle! AI scores.");
        const defender = get().playerTeam.find((p) => !p.isOut);
        if (defender) {
          get()._handlePlayerOut(defender.id, "Failed tackle");
        }
        set((state) => ({
          pointsScoredThisRaid: state.pointsScoredThisRaid + 1,
        }));
        get()._endRaid(raiderId, 1, true); // AI retreats safely
      }
    }
  },
});
