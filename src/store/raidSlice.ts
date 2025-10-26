// src/store/raidSlice.ts

import { StateCreator } from "zustand";
// Import types from the central types file
import { RaidSlice, FullStore } from "./types";
import { selectAIRaider, selectAITarget, chooseAIAction } from '../utils/aiUtils';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

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
      raiderLane: 'center',
      raidTimer: 30, // Reset timers
      hasCrossedBaulkLine: false,
      multiKillCount: 0,
      activeQTE: null,
      pointsScoredThisRaid: 0,
      playerTeam: updatedPlayerTeam, // <-- Set updated team
      
    });

    get()._addLog(`Player raid started with ${raiderId}.`);
    get()._addLog(`Game state changed to: PLAYER_RAID`);
    get()._changeGameState("PLAYER_RAID");
    get()._startStaminaDrain();
    get()._startRaidTimer();
  },

  startAIRaid: () => {
    if (get().gameState !== "AI_RAID") return;

    const raider = selectAIRaider(get().aiTeam);
    if (!raider) return;

    const updatedAITeam = get().aiTeam.map(
      (p) => (p.id === raider.id ? { ...p, position: { x: 90, y: 50 } } : p) // <-- CHANGED
    );

    set({
      currentRaiderId: raider.id,
      pointsScoredThisRaid: 0,
      aiTeam: get().aiTeam.map((p) =>
        p.id === raider.id ? { ...p, position: { x: 90, y: 50 } } : p
      ),
      raiderLane: 'center',
      raidTimer: 30,
      hasCrossedBaulkLine: false,
      multiKillCount: 0,
      activeQTE: null,
    });
    get()._addLog(`AI raid started with ${raider.id}.`); // <-- This will now work
    get()._startStaminaDrain();
    get()._startRaidTimer(); // <-- START 30s CLOCK
    
    // Start the AI "Brain" loop
    get()._aiTick(); // <-- CALL AI TICK

    const target = get().playerTeam.find((p) => !p.isOut);
    if (target) {
      get().handleRaidAction("TOUCH", target.id); // <-- This will now work
    } else {
      get().handleRaidAction("RETREAT"); // <-- This will now work
    }
  },

  _aiTick: () => {
    // Check if raid is still active
    if (get().gameState !== 'AI_RAID') {
      return; // Stop the loop
    }

    // Get the AI's decision
    const action = chooseAIAction(get);
    
    // Execute the action
    switch (action) {
      case 'FEINT':
        const currentLane = get().raiderLane;
        const newLane = (currentLane === 'top' || currentLane === 'bottom')
          ? 'center' 
          : (Math.random() > 0.5 ? 'top' : 'bottom');
        
        set({ raiderLane: newLane });
        get()._updateRaiderPosition(newLane);
        get()._updateDefenderFormations(newLane);
        get()._addLog(`AI raider feints to ${newLane}.`);
        break;
        
      case 'TOUCH':
        const target = selectAITarget(get); // Get best target
        if (target) {
          get()._addLog(`AI targets ${target.id} (REF: ${target.stats.ref}).`);
          get().handleRaidAction('TOUCH', target.id);
        }
        break;
        
      case 'BONUS':
        get().handleRaidAction('BONUS');
        break;
        
      case 'RETREAT':
        get().handleRaidAction('RETREAT');
        break;
    }

    // Continue the loop after a delay (AI "thinking" time)
    if (get().gameState === 'AI_RAID') {
      setTimeout(get()._aiTick, 1500); // Loop every 1.5 seconds
    }
  },

  _startRaidTimer: () => {
    get()._stopRaidTimer();
    const timerId = setInterval(() => {
      set((state) => ({ raidTimer: state.raidTimer - 1 }));
      if (get().raidTimer <= 0) {
        get()._stopRaidTimer();
        get()._stopStaminaDrain();
        const raiderId = get().currentRaiderId;
        if (raiderId) {
          get()._addLog('30s raid clock expired! Raider is out.');
          const isPlayer = get().playerTeam.some(p => p.id === raiderId);
          if (isPlayer) get()._handlePlayerOut(raiderId, 'Raid clock');
          else get()._handleAIOut(raiderId, 'Raid clock');
          get()._endRaid(raiderId, 0, false);
        }
      }
    }, 1000);
    set({ raidTimerId: timerId });
  },

  _stopRaidTimer: () => {
    if (get().raidTimerId) {
      clearInterval(get().raidTimerId);
      set({ raidTimerId: null });
    }
  },
  
  // Stop *all* timers
  _stopStaminaDrain: () => { // Modified
    if (get().staminaTimer) {
      clearInterval(get().staminaTimer);
      set({ staminaTimer: null });
    }
    // Also stop the raid clock when stamina runs out
    if (get().stamina <= 0) {
      get()._stopRaidTimer();
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

  feint: (direction: 'up' | 'down') => {
    const { gameState, raiderLane, currentRaiderId } = get();
    // Only allow feint during player raid
    if (gameState !== 'PLAYER_RAID' || !currentRaiderId || !raiderLane) return;

    let targetLane: 'top' | 'center' | 'bottom' | null = null;

    // This block calculates the new lane
    if (direction === 'up') {
      if (raiderLane === 'bottom') {
        targetLane = 'center';
      } else if (raiderLane === 'center') {
        targetLane = 'top';
      }
    } else if (direction === 'down') { // <-- This was the line with the typo
      if (raiderLane === 'top') {
        targetLane = 'center';
      } else if (raiderLane === 'center') {
        targetLane = 'bottom';
      }
    }

    // If there's no valid target lane (e.g., trying to go up from 'top'), do nothing
    if (!targetLane) {
      return;
    }

    get()._addLog(`Raider feints to the ${targetLane}.`);
    
    // 1. Set the new lane state
    set({ raiderLane: targetLane });
    
    // 2. Move the raider's dot
    get()._updateRaiderPosition(targetLane);
    
    // 3. Trigger defender formation change
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


  // ... (rest of the actions) ...
  // All other internal calls to get()._addLog, get()._handlePlayerOut, etc.
  // will now be correctly typed and will work.


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
        multiKillCount: state.multiKillCount + 1, // <-- ADD
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

      get()._triggerQTE({ 
        type: isPlayerRaider ? 'mash' : 'timing',
        context: 'tackle', // <-- Use new context
        target: 10,
        successZone: 0.5
      });
    }
  },

  _resolveBonus: (raiderId) => {
    if (!get().hasCrossedBaulkLine) {
      get()._addLog('Must cross baulk line to attempt bonus!');
      return;
    }
    
    get()._addLog(`${raiderId} dives for the bonus point!`);
    const isPlayerRaider = get().playerTeam.some(p => p.id === raiderId);

    // 50% chance to be "tackled" during a bonus attempt
    if (Math.random() < 0.5) {
      get()._addLog('The defense converges!');
      get()._triggerQTE({
        type: isPlayerRaider ? 'timing' : 'mash', // Escape QTE
        context: 'bonus_tackle', // <-- Bonus context
        target: 15, // Harder
        successZone: 0.3 // Harder
      });
    } else {
      // Bonus success
      get()._addLog('Bonus point scored!');
      set((state) => ({
        pointsScoredThisRaid: state.pointsScoredThisRaid + 1,
      }));
      get().handleRaidAction('RETREAT'); // Auto-retreat
    }
  },

  _resolveRetreat: (raiderId) => {
    get()._stopStaminaDrain();
    get()._stopRaidTimer();
    const points = get().pointsScoredThisRaid;
    const isPlayerRaider = get().playerTeam.some((p) => p.id === raiderId);

    if (!get().hasCrossedBaulkLine && points === 0) {
      get()._addLog('Failed to cross baulk line! Raider is out.');
      // ... (handle player/ai out)
      get()._endRaid(raiderId, 0, false);
      return;
    }

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

    if (retreatBlocked) {
      get()._triggerQTE({
        type: 'timing',
        context: 'retreat_escape', // <-- Retreat context
        successZone: 0.5
      });
    } else {
      get()._endRaid(raiderId, points, true);
    }
  },

  _triggerQTE: (qte) => { // Updated
    get()._stopStaminaDrain();
    get()._stopRaidTimer(); // Pause raid clock
    set({ activeQTE: qte }); // Use new object
    get()._addLog(`Game state changed to: QTE_ACTIVE`);
    get()._changeGameState('QTE_ACTIVE');
  },
  
  handleRaidAction: (action, targetId) => {
    const raiderId = get().currentRaiderId;
    if (!raiderId) return;

    if (action === 'TOUCH') {
      if (!targetId) return;
      // --- BAULK LINE LOGIC ---
      if (!get().hasCrossedBaulkLine) {
        set({ hasCrossedBaulkLine: true });
        get()._addLog('Raider has crossed the baulk line.');
      }
      get()._addLog(`${raiderId} attempts a touch on ${targetId}.`);
      get()._resolveTackle(raiderId, targetId);
    }
    
    if (action === 'RETREAT') {
      get()._resolveRetreat(raiderId);
    }
    
    if (action === 'BONUS') {
      get()._resolveBonus(raiderId);
    }
  },

  handleQTEOutcome: (success) => {
    const raiderId = get().currentRaiderId!;
    const isPlayerRaider = get().playerTeam.some(p => p.id === raiderId);
    
    // Resume timers *if* raid isn't over
    if (success) {
      // If we escaped, the raid continues
      const qteContext = get().activeQTE?.context;
      if (qteContext === 'tackle' || qteContext === 'bonus_tackle') {
        get()._startStaminaDrain();
        get()._startRaidTimer();
      }
    }
    
    set({ activeQTE: null });
    get()._changeGameState(isPlayerRaider ? 'PLAYER_RAID' : 'AI_RAID');

    if (success) get()._handleQTEPlayerSuccess();
    else get()._handleQTEPlayerFailure();
  },

  _handleQTEPlayerSuccess: () => {
    get()._addLog("QTE Success!");
    const raiderId = get().currentRaiderId!;
    const points = get().pointsScoredThisRaid;
    const context = get().activeQTE?.context;

    if (get().mustRetreat) {
      // This was a 'Retreat' QTE (Timing)
      get()._addLog("Player escaped the block and is safe!");
      get()._endRaid(raiderId, points, true);
    } else {
      // This was a 'Tackle' QTE
      const isPlayerRaider = get().playerTeam.some((p) => p.id === raiderId);
      switch (context) {
      case 'tackle':
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
        // --- MULTI-KILL LOGIC ---
        const multiKillCount = get().multiKillCount;
        const probability = multiKillCount === 1 ? 0.3 : 0.15; // 30% for 2nd, 15% for 3rd
        
        if (isPlayerRaider && Math.random() < probability) {
          get()._addLog('Another defender approaches!');
          get()._triggerQTE({
            type: 'mash',
            context: 'multi_tackle',
            target: 12 + (multiKillCount * 3) // Gets harder
          });
        } else {
          set({ mustRetreat: true });
          get()._startStaminaDrain();
          get()._startRaidTimer();
        }
        break;
        
      case 'bonus_tackle':
        get()._addLog('Escaped the bonus tackle!');
        set((state) => ({
          pointsScoredThisRaid: state.pointsScoredThisRaid + 1,
        }));
        get().handleRaidAction('RETREAT'); // Auto-retreat
        break;

      case 'retreat_escape':
        get()._addLog('Player escaped the block and is safe!');
        get()._endRaid(raiderId, points, true);
        break;
    }
      
    }
  },

  _handleQTEPlayerFailure: () => {
    get()._addLog("QTE Failed!");
    const raiderId = get().currentRaiderId!;
    const context = get().activeQTE?.context;

    if (context === 'retreat_escape' || context === 'bonus_tackle') {
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
