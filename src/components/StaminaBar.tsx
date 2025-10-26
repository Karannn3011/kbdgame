// src/components/StaminaBar.tsx

import React from 'react';
import { useGameStore } from '../store';

const StaminaBar: React.FC = () => {
  const stamina = useGameStore((state) => state.stamina);
  const gameState = useGameStore((state) => state.gameState);

  // Only show the stamina bar during an active raid
  if (gameState !== 'PLAYER_RAID' && gameState !== 'AI_RAID') {
    return null;
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="text-sm font-bold">STAMINA</div>
      <div className="w-full h-6 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300 bg-green-500"
          style={{ width: `${stamina}%` }}
        />
      </div>
      <div className="text-lg font-bold">{Math.round(stamina)}%</div>
    </div>
  );
};

export default StaminaBar;