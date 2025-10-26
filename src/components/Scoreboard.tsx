// src/components/Scoreboard.tsx

import React from 'react';
import { useGameStore } from '../store';

const Scoreboard: React.FC = () => {
  const playerScore = useGameStore((state) => state.playerScore);
  const aiScore = useGameStore((state) => state.aiScore);
  const playerEmptyRaids = useGameStore((state) => state.playerEmptyRaids);
  const aiEmptyRaids = useGameStore((state) => state.aiEmptyRaids);
  const isDoOrDie = useGameStore((state) => state.isDoOrDie);

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between gap-8">
        {/* Player Score */}
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">PLAYER</div>
          <div className="text-4xl font-bold">{playerScore}</div>
          <div className="text-xs text-gray-400">
            Empty Raids: {playerEmptyRaids} / 3
          </div>
        </div>

        {/* Game State */}
        <div className="text-center self-center">
          <div className="text-2xl font-bold">VS</div>
          {isDoOrDie && (
            <div className="text-lg font-bold text-red-500 animate-pulse">
              DO OR DIE!
            </div>
          )}
        </div>

        {/* AI Score */}
        <div className="text-center">
          <div className="text-lg font-bold text-red-400">AI</div>
          <div className="text-4xl font-bold">{aiScore}</div>
          <div className="text-xs text-gray-400">
            Empty Raids: {aiEmptyRaids} / 3
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;