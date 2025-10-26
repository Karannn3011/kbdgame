// src/components/Controls.tsx

import React from 'react';
import { useGameStore } from '../store';

// Reusable Button
const Button: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  color?: 'blue' | 'red' | 'gray';
  disabled?: boolean;
}> = ({ onClick, children, color = 'blue', disabled = false }) => {
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-700 disabled:bg-blue-900',
    red: 'bg-red-500 hover:bg-red-700 disabled:bg-red-900',
    gray: 'bg-gray-500 hover:bg-gray-700 disabled:bg-gray-800',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 font-bold text-white rounded-lg text-xl transition-colors ${colorClasses[color]} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
};

const Controls: React.FC = () => {
  // --- Get all state hooks ---
  const gameState = useGameStore((state) => state.gameState);
  const handleRaidAction = useGameStore((state) => state.handleRaidAction);
  const nextTurn = useGameStore((state) => state.nextTurn);
  const mustRetreat = useGameStore((state) => state.mustRetreat);
  const raiderLane = useGameStore((state) => state.raiderLane);
  const feint = useGameStore((state) => state.feint);

  // --- These were missing from my last snippet ---
  const defenderCount = useGameStore((state) =>
    state.aiTeam.filter((p) => !p.isOut).length
  );
  // --- End of missing hooks ---

  const renderControls = () => {
    switch (gameState) {
      case 'PLAYER_RAID':
        // This variable declaration was missing
        const showBonus =  defenderCount >= 6;
        
        return (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Feint Buttons */}
            <Button
              onClick={() => feint('up')}
              disabled={raiderLane === 'top'} // Disable if at top
              color="gray"
            >
              Feint Up
            </Button>
            <Button
              onClick={() => feint('down')}
              disabled={raiderLane === 'bottom'} // Disable if at bottom
              color="gray"
            >
              Feint Down
            </Button>

            {/* Bonus Button (This was also missing) */}
            {showBonus && (
              <Button onClick={() => handleRaidAction('BONUS')} color="blue">
                Attempt Bonus
              </Button>
            )}

            {/* Retreat Button */}
            <Button onClick={() => handleRaidAction('RETREAT')} color="red">
              {mustRetreat ? 'RETREAT (Must)' : 'RETREAT'}
            </Button>
          </div>
        );

      case 'RAID_END':
        return <Button onClick={nextTurn}>Next Turn</Button>;

      case 'AI_RAID':
        return (
          <div className="text-lg font-bold text-yellow-400 animate-pulse">
            AI is Raiding...
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      {renderControls()}
    </div>
  );
};

export default Controls;