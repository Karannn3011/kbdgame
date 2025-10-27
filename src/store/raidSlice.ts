// src/store/raidSlice.ts

import { StateCreator } from "zustand";
// Import types from the central types file
import { RaidSlice, FullStore } from "./types";
import {
  selectAIRaider,
  selectAITarget,
  chooseAIAction,
  getBaitedDefender,
} from "../utils/aiUtils";

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
      raiderLane: "center",
      raidTimer: 30, // Reset timers
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

    // This part had a bug, it wasn't using the 'updatedAITeam'
    const updatedAITeam = get().aiTeam.map((p) =>
      p.id === raider.id ? { ...p, position: { x: 90, y: 50 } } : p
    );

    set({
      currentRaiderId: raider.id,
      pointsScoredThisRaid: 0,
      aiTeam: updatedAITeam, // <-- FIX: Use the updated team
      raiderLane: "center",
      raidTimer: 30,
      multiKillCount: 0,
      activeQTE: null,
    });
    get()._addLog(`AI raid started with ${raider.id}.`);
    get()._startStaminaDrain();
    get()._startRaidTimer();

    // Start the AI "Brain" loop
    get()._aiTick(); // <-- This is correct

    // --- BUG 2 FIX: REMOVE THE OLD PLACEHOLDER LOGIC ---
    // const target = get().playerTeam.find((p) => !p.isOut);
    // if (target) {
    //   get().handleRaidAction("TOUCH", target.id);
    // } else {
    //   get().handleRaidAction("RETREAT");
    // }
    // --- END FIX ---
  },

  _aiTick: () => {
    // Check if raid is still active
    if (get().gameState !== "AI_RAID") {
      return; // Stop the loop
    }

    // Get the AI's decision
    const action = chooseAIAction(get);

    // Execute the action
    switch (action) {
      case "FEINT":
        const currentLane = get().raiderLane;
        const newLane =
          currentLane === "top" || currentLane === "bottom"
            ? "center"
            : Math.random() > 0.5
            ? "top"
            : "bottom";

        set({ raiderLane: newLane });
        get()._updateRaiderPosition(newLane);
        get()._updateDefenderFormations(newLane);
        get()._addLog(`AI raider feints to ${newLane}.`);
        break;

      case "TOUCH":
        const target = selectAITarget(get); // Get best target
        if (target) {
          get()._addLog(`AI targets ${target.id} (REF: ${target.stats.ref}).`);
          get().handleRaidAction("TOUCH", target.id);
        }
        break;

      case "BONUS":
        get().handleRaidAction("BONUS");
        break;

      case "RETREAT":
        get().handleRaidAction("RETREAT");
        break;
    }

    // Continue the loop after a delay (AI "thinking" time)
    if (get().gameState === "AI_RAID") {
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
          get()._addLog("30s raid clock expired! Raider is out.");
          const isPlayer = get().playerTeam.some((p) => p.id === raiderId);
          if (isPlayer) get()._handlePlayerOut(raiderId, "Raid clock");
          else get()._handleAIOut(raiderId, "Raid clock");
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
  _stopStaminaDrain: () => {
    // Modified
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
    const newX = targetLane === "top" ? 50 : targetLane === "bottom" ? 50 : 40;
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

  feint: (direction: "up" | "down") => {
    const { gameState, raiderLane, currentRaiderId } = get();
    // Only allow feint during player raid
    if (gameState !== "PLAYER_RAID" || !currentRaiderId || !raiderLane) return;

    let targetLane: "top" | "center" | "bottom" | null = null;

    // This block calculates the new lane
    if (direction === "up") {
      if (raiderLane === "bottom") {
        targetLane = "center";
      } else if (raiderLane === "center") {
        targetLane = "top";
      }
    } else if (direction === "down") {
      // <-- This was the line with the typo
      if (raiderLane === "top") {
        targetLane = "center";
      } else if (raiderLane === "center") {
        targetLane = "bottom";
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
    const baitedDefender = getBaitedDefender(get);
    if (baitedDefender) {
      get()._addLog(
        `Defender ${baitedDefender.id} takes the bait and lunges for a tackle!`
      );
      get()._triggerQTE({
        type: "mash",
        context: "feint_struggle",
        defenderId: baitedDefender.id,
        mashTarget: Math.floor(Math.random() * 5) + 8, // Random: 8-12 mashes
      });
    }
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

    const isPlayerRaider = get().playerTeam.some((p) => p.id === raiderId);

    // Stat check: Raider AGI vs Defender REF
    const raiderAGI = raider.stats.agi;
    const defenderREF = defender.stats.ref;

    if (raiderAGI > defenderREF) {
      // --- RAIDER ADVANTAGE (Offensive QTE) ---
      get()._addLog("Raider is faster! Attempting a touch...");
      get()._triggerQTE({
        type: "timing",
        context: "tackle_score", // <-- New context
        defenderId: defenderId, // <-- Store defender
        successZone: 0.5, // (Make this easier later?)
      });
    } else {
      // --- DEFENDER ADVANTAGE (Defensive QTE) ---
      get()._addLog("Defender initiates a tackle!");
      get()._triggerQTE({
        type: isPlayerRaider ? "mash" : "timing", // Player mashes, AI does timing
        context: "tackle_escape", // <-- New context
        defenderId: defenderId, // <-- Store defender
        mashTarget: 10,
      });
    }
  },

  _resolveBonus: (raiderId) => {
    get()._addLog(`${raiderId} dives for the bonus point!`);
    const baitedDefender = getBaitedDefender(get); // Check for bait

    // 40% chance to be baited *even if* no defender is in the lane
    if (baitedDefender || Math.random() < 0.4) {
      get()._addLog("The defense converges!");
      get()._triggerQTE({
        type: "mash",
        context: "bonus_struggle",
        defenderId: baitedDefender?.id,
        mashTarget: Math.floor(Math.random() * 5) + 12, // Harder: 12-16
      });
    } else {
      get()._addLog("Bonus point scored!");
      set((state) => ({
        pointsScoredThisRaid: state.pointsScoredThisRaid + 1,
        mustRetreat: true,
      }));
    }
  },

  resolveMultiKill: (decision) => {
    if (get().gameState !== "RAID_DECISION") return;

    if (decision === "retreat") {
      get()._addLog("Raider plays it safe and retreats.");
      set({ mustRetreat: true });
      get()._changeGameState("PLAYER_RAID");
    } else if (decision === "press") {
      const { multiKillCount } = get();
      get()._addLog("Raider goes for another!");

      // Find a new target (closest available defender)
      const raider = get().playerTeam.find(
        (p) => p.id === get().currentRaiderId
      )!;
      const defenders = get().aiTeam.filter((p) => !p.isOut);
      const target = defenders.sort(
        (a, b) =>
          Math.abs(a.position.y - raider.position.y) -
          Math.abs(b.position.y - raider.position.y)
      )[0];

      if (!target) {
        get()._addLog("No defenders left to target!");
        set({ mustRetreat: true });
        get()._changeGameState("PLAYER_RAID");
        return;
      }

      get()._addLog(`[${target.id}] moves in to block!`);
      const newContext =
        multiKillCount === 1 ? "multi_struggle_2" : "multi_struggle_3";

      // This can be any QTE. Let's make it a hard timing one.
      get()._triggerQTE({
        type: "timing",
        context: newContext,
        defenderId: target.id,
        successZone: 0.2, // Very small window
      });
    }
  },

  _resolveRetreat: (raiderId) => {
    get()._stopStaminaDrain();
    get()._stopRaidTimer();
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

    if (retreatBlocked) {
      get()._triggerQTE({
        type: "timing",
        context: "retreat_escape", // <-- Retreat context
        successZone: 0.5,
      });
    } else {
      get()._endRaid(raiderId, points, true);
    }
  },

  _triggerQTE: (qte) => {
    get()._stopStaminaDrain();
    get()._stopRaidTimer();
    set({ activeQTE: qte }); // This will now include defenderId
    get()._addLog(`Game state changed to: QTE_ACTIVE`);
    get()._changeGameState("QTE_ACTIVE");
  },

  handleRaidAction: (action, targetId) => {
    const raiderId = get().currentRaiderId;
    if (!raiderId) return;

    if (get().gameState === "AI_RAID") {
      if (action === "TOUCH") {
        get()._addLog(`${raiderId} attempts a touch on ${targetId}.`);
        get()._resolveTackle(raiderId, targetId!);
      }
      if (action === "RETREAT") get()._resolveRetreat(raiderId);
      if (action === "BONUS") get()._resolveBonus(raiderId);
      return;
    }

    if (action === "RETREAT") {
      get()._resolveRetreat(raiderId);
    }

    if (action === "BONUS") {
      get()._resolveBonus(raiderId);
    }
  },

  // ... (inside createRaidSlice)

  handleQTEOutcome: (success) => {
    const raiderId = get().currentRaiderId!;
    const isPlayerRaider = get().playerTeam.some((p) => p.id === raiderId);
    const qteContext = get().activeQTE?.context;
    const defenderId = get().activeQTE?.defenderId; // <-- Get defenderId

    // Resume timers if the raid isn't over
    if (success) {
      // If we escaped or failed to score, the raid continues
      if (
        qteContext === "tackle_escape" ||
        (qteContext === "tackle_score" && !success)
      ) {
        get()._startStaminaDrain();
        get()._startRaidTimer();
      }
      // (Bonus/Multi-tackle logic already handles its own timers)
    }

    set({ activeQTE: null });

    get()._addLog(
      `Game state changed to: ${isPlayerRaider ? "PLAYER_RAID" : "AI_RAID"}`
    );
    get()._changeGameState(isPlayerRaider ? "PLAYER_RAID" : "AI_RAID");

    if (success) {
      get()._handleQTEPlayerSuccess(qteContext, defenderId); // <-- Pass defenderId
    } else {
      get()._handleQTEPlayerFailure(qteContext, defenderId); // <-- Pass defenderId
    }
  },

  _handleQTEPlayerSuccess: (context, defenderId) => {
    get()._addLog("QTE Success!");
    const raiderId = get().currentRaiderId!;
    const points = get().pointsScoredThisRaid;
    const isPlayerRaider = get().playerTeam.some((p) => p.id === raiderId);

    // --- AI QTE Logic (Restored) ---
    if (!isPlayerRaider) {
      switch (context) {
        case "tackle_score": // AI Raider Won Offensive Timing QTE
          get()._addLog("AI Touch successful! Defender is out.");
          if (defenderId) {
            get()._handlePlayerOut(defenderId, "Touched by AI");
          }
          set((state) => ({
            pointsScoredThisRaid: state.pointsScoredThisRaid + 1,
            multiKillCount: state.multiKillCount + 1, // AI also tracks this for score
          }));
          set({ mustRetreat: true }); // AI must retreat after scoring
          // Restart AI brain so it sees 'mustRetreat'
          setTimeout(get()._aiTick, 1000);
          break;

        case "tackle_escape": // AI Raider Won Defensive Mash QTE (Escaped Player Tackle)
          get()._addLog("AI Raider broke free from the tackle!");
          if (get().isDoOrDie && get().pointsScoredThisRaid === 0) {
            get()._addLog("...but failed the Do-or-Die raid!");
            get()._handleAIOut(raiderId, "Failed Do-or-Die");
            get()._endRaid(raiderId, 0, false);
            return;
          }
          // Raid continues. Restart timers and AI tick.
          get()._startStaminaDrain();
          get()._startRaidTimer();
          setTimeout(get()._aiTick, 1000);
          break;

        // AI doesn't currently trigger these contexts, but handle defensively
        case "multi_tackle": // Should not happen for AI currently
        case "bonus_struggle":
        case "feint_struggle":
        case "retreat_escape":
          get()._addLog("AI escaped tackle/block unexpectedly.");
          set({ mustRetreat: true }); // Play safe
          setTimeout(get()._aiTick, 1000); // Let AI retreat
          break;
      }
      return; // End AI logic
    }

    // --- Player QTE Logic (Your existing correct logic) ---
    switch (context) {
      case "feint_struggle":
        get()._addLog(`Raider struggles free and scores 1 point!`);
        if (defenderId) get()._handleAIOut(defenderId, "Tackled");
        set((state) => ({
          pointsScoredThisRaid: state.pointsScoredThisRaid + 1,
          multiKillCount: 1,
        }));

        if (Math.random() < 0.3) {
          get()._addLog("A 2nd defender approaches... Press the attack?");
          get()._changeGameState("RAID_DECISION");
        } else {
          set({ mustRetreat: true });
        }
        break;

      case "multi_struggle_2":
        get()._addLog("A second touch! That's 2 points!");
        if (defenderId) get()._handleAIOut(defenderId, "Tackled");
        set((state) => ({
          pointsScoredThisRaid: state.pointsScoredThisRaid + 1,
          multiKillCount: 2,
        }));

        if (Math.random() < 0.15) {
          get()._addLog("A 3rd defender charges... Go for the SUPER RAID?");
          get()._changeGameState("RAID_DECISION");
        } else {
          set({ mustRetreat: true });
        }
        break;

      case "multi_struggle_3":
        get()._addLog("SUPER RAID! 3 points scored!");
        if (defenderId) get()._handleAIOut(defenderId, "Tackled");
        set((state) => ({
          pointsScoredThisRaid: state.pointsScoredThisRaid + 1,
          multiKillCount: 3,
          mustRetreat: true,
        }));
        break;

      case "bonus_struggle":
        get()._addLog("Escaped the bonus tackle AND scored the point!");
        set((state) => ({
          pointsScoredThisRaid: state.pointsScoredThisRaid + 1,
          mustRetreat: true,
        }));
        break;

      case "retreat_escape":
        get()._addLog("Player escaped the block and is safe!");
        get()._endRaid(raiderId, points, true);
        break;
    }
  },

  _handleQTEPlayerFailure: (context, defenderId) => {
    get()._addLog("QTE Failed!");
    const raiderId = get().currentRaiderId!;
    const isPlayerRaider = get().playerTeam.some((p) => p.id === raiderId);

    // --- AI QTE Logic (Restored) ---
    if (!isPlayerRaider) {
      switch (context) {
        case "tackle_score": // AI Raider Failed Offensive Timing QTE (Player Blocked)
          get()._addLog("AI touch blocked by the defender!");
          // Raid continues. Restart timers and AI tick.
          get()._startStaminaDrain();
          get()._startRaidTimer();
          setTimeout(get()._aiTick, 1000);
          break;

        case "tackle_escape": // AI Raider Failed Defensive Mash QTE (Player Tackled)
          get()._addLog("Player tackled the AI Raider! AI is out.");
          get()._handleAIOut(raiderId, "Tackled by player");
          get()._endRaid(raiderId, 0, false);
          break;

        // AI doesn't currently trigger these contexts, but handle defensively
        case "multi_tackle": // Should not happen for AI currently
        case "bonus_struggle":
        case "feint_struggle":
        case "retreat_escape":
          get()._addLog("AI was caught during escape/struggle! AI is out.");
          get()._handleAIOut(raiderId, `Caught during ${context}`);
          get()._endRaid(raiderId, 0, false); // Failed raid
          break;
      }
      return; // End AI logic
    }

    // --- Player QTE Failure (Your existing correct logic) ---
    get()._addLog(`Raider ${raiderId} was caught and is OUT!`);
    get()._handlePlayerOut(raiderId, `Tackled during ${context}`);
    set((state) => ({ aiScore: state.aiScore + 1 }));
    get()._addLog("AI scores 1 point for the tackle.");
    get()._endRaid(raiderId, 0, false);
  },
});
