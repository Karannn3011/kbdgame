// src/utils/formationUtils.ts

// 1. DEFINE POSITION INTERFACE
export interface Position {
  x: number;
  y: number;
}

// 2. DEFINE THE DEFAULT 7-PLAYER CENTER FORMATION (Replaced 'referenceDefaultPos7')
// This is a 7-player arc, consistent with your other formations.
const defaultPos7 = [
  { x: 100-60, y: (100 * 1) / 8 },
  { x: 100-65, y: (100 * 2) / 8 },
  { x: 100-68, y: (100 * 3) / 8 },
  { x: 100-70, y: (100 * 4) / 8 },
  { x: 100-68, y: (100 * 5) / 8 },
  { x: 100-65, y: (100 * 6) / 8 },
  { x: 100-60, y: (100 * 7) / 8 },
];

// 3. YOUR NEW FORMATIONS OBJECT
// I've pasted your data directly, only replacing the 'referenceDefaultPos7' line.
const formations = {
  // --- 7 DEFENDERS ---
  7: {
    CENTER: defaultPos7, // Use the defined default positions
    TOP_COVER: [
      // Deeper at bottom, shallower at top
      { x: 100-70, y: (100 * 1) / 8 },
      { x: 100-68, y: (100 * 2) / 8 }, // Top players move shallower
      { x: 100-60, y: (100 * 3) / 8 + 3 },
      { x: 100-50, y: (100 * 4) / 8 - 1 },
      { x: 100-55, y: (100 * 5) / 8 },
      { x: 100-52, y: (100 * 6) / 8 }, // Bottom players move deeper
      { x: 100-40, y: (100 * 7) / 8 - 5 },
    ],
    BOTTOM_COVER: [
      // Shallower at bottom, deeper at top
      { x: 100-40, y: (100 * 1) / 8 + 6 },
      { x: 100-52, y: (100 * 2) / 8 }, // Top players move deeper
      { x: 100-55, y: (100 * 3) / 8 },
      { x: 100-50, y: (100 * 4) / 8 + 1 },
      { x: 100-60, y: (100 * 5) / 8 - 3 },
      { x: 100-68, y: (100 * 6) / 8 }, // Bottom players move shallower
      { x: 100-70, y: (100 * 7) / 8 },
    ],
  },
  // --- 6 DEFENDERS ---
  6: {
    CENTER: [
      { x: 100-60, y: (100 * 1) / 7 },
      { x: 100-65, y: (100 * 2) / 7 },
      { x: 100-70, y: (100 * 3) / 7 },
      { x: 100-70, y: (100 * 4) / 7 },
      { x: 100-65, y: (100 * 5) / 7 },
      { x: 100-60, y: (100 * 6) / 7 },
    ],
    TOP_COVER: [
      { x: 100-70, y: (100 * 1) / 7 },
      { x: 100-68, y: (100 * 2) / 7 - 1 },
      { x: 100-65, y: (100 * 3) / 7 - 2 },
      { x: 100-52, y: (100 * 4) / 7 - 6 },
      { x: 100-50, y: (100 * 5) / 7 - 4 },
      { x: 100-40, y: (100 * 6) / 7 - 18 },
    ],
    BOTTOM_COVER: [
      { x: 100-40, y: (100 * 1) / 7 + 18 },
      { x: 100-50, y: (100 * 2) / 7 + 4 },
      { x: 100-52, y: (100 * 3) / 7 + 6 },
      { x: 100-65, y: (100 * 4) / 7 + 2 },
      { x: 100-68, y: (100 * 5) / 7 + 1 },
      { x: 100-70, y: (100 * 6) / 7 },
    ],
  },
  // --- 5 DEFENDERS ---
  5: {
    CENTER: [
      { x: 100-60, y: (100 * 1) / 6 },
      { x: 100-65, y: (100 * 2) / 6 },
      { x: 100-70, y: (100 * 3) / 6 },
      { x: 100-65, y: (100 * 4) / 6 },
      { x: 100-60, y: (100 * 5) / 6 },
    ],
    TOP_COVER: [
      { x: 100-80, y: (100 * 1) / 6 },
      { x: 100-75, y: (100 * 2) / 6 },
      { x: 100-55, y: (100 * 3) / 6 },
      { x: 100-52, y: (100 * 4) / 6 },
      { x: 100-40, y: (100 * 5) / 6 - 15 },
    ],
    BOTTOM_COVER: [
      { x: 100-40, y: (100 * 1) / 6 + 15 },
      { x: 100-52, y: (100 * 2) / 6 },
      { x: 100-55, y: (100 * 3) / 6 },
      { x: 100-75, y: (100 * 4) / 6 },
      { x: 100-80, y: (100 * 5) / 6 },
    ],
  },
  // --- 4 DEFENDERS ---
  4: {
    CENTER: [
      { x: 100-60, y: (100 * 1) / 5 },
      { x: 100-65, y: (100 * 2) / 5 },
      { x: 100-65, y: (100 * 3) / 5 },
      { x: 100-60, y: (100 * 4) / 5 },
    ],
    TOP_COVER: [
      { x: 100-75, y: (100 * 1) / 5 },
      { x: 100-70, y: (100 * 2) / 5 },
      { x: 100-52, y: (100 * 3) / 5 - 10 },
      { x: 100-42, y: (100 * 3) / 5 - 8 },
    ],
    BOTTOM_COVER: [
      { x: 100-42, y: (100 * 2) / 5 + 8 },
      { x: 100-52, y: (100 * 2) / 5 + 10 },
      { x: 100-70, y: (100 * 3) / 5 },
      { x: 100-75, y: (100 * 4) / 5 },
    ],
  },
  // --- 3 DEFENDERS ---
  3: {
    CENTER: [
      { x: 100-60, y: (100 * 1) / 4 },
      { x: 100-65, y: (100 * 2) / 4 },
      { x: 100-60, y: (100 * 3) / 4 },
    ],
    TOP_COVER: [
      { x: 100-70, y: (100 * 1) / 4 - 4 },
      { x: 100-52, y: (100 * 2) / 4 - 2 },
      { x: 100-40, y: (100 * 2) / 4 - 2 },
    ],
    BOTTOM_COVER: [
      { x: 100-40, y: (100 * 2) / 4 + 2 },
      { x: 100-52, y: (100 * 2) / 4 + 2 },
      { x: 100-70, y: (100 * 3) / 4 + 4 },
    ],
  },
  // --- 2 DEFENDERS ---
  2: {
    CENTER: [
      { x: 100-60, y: 25 },
      { x: 100-60, y: 75 },
    ],
    TOP_COVER: [
      { x: 100-70, y: 20 },
      { x: 100-45, y: 50 },
    ],
    BOTTOM_COVER: [
      { x: 100-45, y: 50 },
      { x: 100-70, y: 80 },
    ],
  },
  // --- 1 DEFENDER ---
  1: {
    CENTER: [{ x: 100-70, y: 50 }],
    TOP_COVER: [{ x: 100-70, y: 40 }],
    BOTTOM_COVER: [{ x: 100-70, y: 60 }],
  },
  // --- 0 DEFENDERS ---
  0: {
    CENTER: [],
    TOP_COVER: [],
    BOTTOM_COVER: [],
  },
};

// 4. THE GETTER FUNCTION
// This function acts as the public API for the rest of our app.
// It maps the simple 'top', 'center', 'bottom' lanes to your new data structure.
/**
 * Gets a specific array of positions based on the number of
 * active defenders and the raider's current lane.
 */
export const getFormationPositions = (
  defenderCount: number,
  raiderLane: 'top' | 'center' | 'bottom'
): Position[] => {
  
  // Get the set of 3 formations (CENTER, TOP_COVER, BOTTOM_COVER) and assert the type
  const formationSet = formations[defenderCount as keyof typeof formations];

  if (!formationSet) {
    return []; // Return empty if count is 0
  }

  // Map our simple 'raiderLane' string to your new object keys
  switch (raiderLane) {
    case 'top':
      return formationSet.TOP_COVER;
    case 'bottom':
      return formationSet.BOTTOM_COVER;
    case 'center':
    default:
      return formationSet.CENTER;
  }
};