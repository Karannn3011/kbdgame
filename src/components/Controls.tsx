// src/components/Controls.tsx

import React from 'react';
import { useGameStore } from '../store';

// Reusable Button
const Button: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  color?: 'blue' | 'red' | 'gray';
  disabled? : boolean;
}> = ({ onClick, children, color = 'blue'}) => {
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-700',
    red: 'bg-red-500 hover:bg-red-700',
    gray: 'bg-gray-500 hover:bg-gray-700',
  };

  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-bold text-white rounded-lg text-xl ${colorClasses[color]}`}
    >
      {children}
    </button>
  );
};

const Controls: React.FC = () => {
  const gameState = useGameStore((state) => state.gameState);
  const handleRaidAction = useGameStore((state) => state.handleRaidAction);
  const nextTurn = useGameStore((state) => state.nextTurn);
  const mustRetreat = useGameStore((state) => state.mustRetreat);

  const raiderLane = useGameStore((state) => state.raiderLane);
  const feint = useGameStore((state) => state.feint);

  const renderControls = () => {
    switch (gameState) {
      case 'PLAYER_RAID':
        return (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Feint Buttons */}
            <Button
              onClick={() => {
                if (raiderLane === "center") feint('top');
                if (raiderLane === "bottom") feint('center');
              }}
              disabled={raiderLane === 'top'}
              color="gray"
            >
              Feint Top
            </Button>
            
            <Button
              onClick={() => {
                if (raiderLane === "center") feint('bottom');
                if (raiderLane === "top") feint('center');
              }}
              disabled={raiderLane === 'bottom'}
              color="gray"
            >
              Feint Bottom
            </Button>
            
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