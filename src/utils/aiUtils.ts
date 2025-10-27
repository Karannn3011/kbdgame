// src/utils/aiUtils.ts

import { Player } from "../types/player";
import { GameStoreState } from "../store/types";

// We get the *entire* game state to make smart decisions
type StoreGetter = () => GameStoreState;

/**
 * Selects the best raider from the AI team.
 */
export const selectAIRaider = (aiTeam: Player[]): Player | null => {
  const availableRaiders = aiTeam.filter((p) => !p.isOut);
  if (availableRaiders.length === 0) return null;
  // V3: Selects based on high AGI and high STR (for struggles)
  return availableRaiders.sort(
    (a, b) => b.stats.agi + b.stats.str - (a.stats.agi + a.stats.str)
  )[0];
};

/**
 * Selects the best target from the Player team based on
 * proximity (raiderLane) and "weakness" (low REF).
 */
export const selectAITarget = (get: StoreGetter): Player | null => {
  const { playerTeam, raiderLane } = get();
  const availableDefenders = playerTeam.filter((p) => !p.isOut);
  if (availableDefenders.length === 0) return null;

  const getProximityBonus = (defender: Player): number => {
    // Proximity is based on Y-axis
    if (raiderLane === "top" && defender.position.y < 40) return 10;
    if (
      raiderLane === "center" &&
      defender.position.y >= 40 &&
      defender.position.y <= 60
    )
      return 10;
    if (raiderLane === "bottom" && defender.position.y > 60) return 10;
    return 0; // Not in the same lane
  };

  // AI calculates a "Target Score" for every defender
  const scoredDefenders = availableDefenders.map((defender) => {
    // We *invert* REF so low reflex = high score
    const statScore = 10 - defender.stats.ref;
    const proximityScore = getProximityBonus(defender);
    // V3: Add bonus for isolated players (Chain Tackle logic)

    return {
      player: defender,
      score: statScore + proximityScore,
    };
  });

  // Return the player with the highest score
  return scoredDefenders.sort((a, b) => b.score - a.score)[0].player;
};

/**
 * The core AI "Brain". It runs every tick and decides what to do.
 */
export const chooseAIAction = (
  get: StoreGetter
): "FEINT" | "TOUCH" | "BONUS" | "RETREAT" => {
  const {
    stamina,
    raidTimer,
    isDoOrDie,
    pointsScoredThisRaid,
    playerTeam,
    raiderLane,
  } = get();

  const defenderCount = playerTeam.filter((p) => !p.isOut).length;

  // --- 1. Survival Checks (Highest Priority) ---
  if (stamina < 20 || raidTimer < 5) {
    return "RETREAT";
  }

  // --- 2. Objective Checks (Do-or-Die) ---
  if (isDoOrDie && pointsScoredThisRaid === 0) {
    // AI is desperate. High chance to touch.
    return Math.random() < 0.8 ? "TOUCH" : "FEINT";
  }

  // --- 3. Baulk Line Check ---

  // --- 4. Bonus Point Check ---
  if (defenderCount >= 6 && pointsScoredThisRaid > 0) {
    // AI has scored and sees a bonus opportunity.
    if (Math.random() < 0.2) {
      // 20% chance to try for bonus
      return "BONUS";
    }
  }

  // --- 5. Standard Action (Feint or Touch) ---
  // If we're here, the AI is "roaming".
  // It will feint 60% of the time, touch 40% of the time.
  return Math.random() < 0.6 ? "FEINT" : "TOUCH";
};

export const getBaitedDefender = (get: () => GameStoreState): Player | null => {
  const { playerTeam, aiTeam, raiderLane, currentRaiderId } = get();
  const raider = playerTeam.find((p) => p.id === currentRaiderId);
  if (!raider) return null;

  const availableDefenders = aiTeam.filter((p) => !p.isOut);

  for (const defender of availableDefenders) {
    // 1. Check Proximity (is defender in the same lane?)
    let proximity = 0;
    const defY = defender.position.y;
    if (raiderLane === "top" && defY < 40) proximity = 1;
    else if (raiderLane === "center" && defY >= 40 && defY <= 60) proximity = 1;
    else if (raiderLane === "bottom" && defY > 60) proximity = 1;
    
    if (proximity === 0) continue; // Not in the same lane, can't be baited

    // 2. Calculate Bait Probability (dynamic)
    // Base 10% chance, +1% for every point raider AGI > defender REF
    const statDifference = raider.stats.agi - defender.stats.ref;
    const baitProbability = 0.1 + Math.max(0, statDifference * 0.01);

    if (Math.random() < baitProbability) {
      return defender; // This defender was baited!
    }
  }

  return null; // No one was baited
};
