// src/components/modals/SelectRaiderScreen.tsx

import React from 'react';
import { useGameStore } from '../../store'; // Adjust path as needed
import { Player } from '../../types/player';

const SelectRaiderScreen: React.FC = () => {
  // 1. Get the list of players from the store
  const playerTeam = useGameStore((state) => state.playerTeam);
  // 2. Get the action we want to call
  const startPlayerRaid = useGameStore((state) => state.startPlayerRaid);

  // Filter for players who are not out
  const availableRaiders = playerTeam.filter((player) => !player.isOut);

  const handleSelectRaider = (playerId: string) => {
    startPlayerRaid(playerId);
  };

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-75">
      <div className="p-6 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-center">Select Your Raider</h2>
        <div className="grid grid-cols-3 gap-4">
          {availableRaiders.map((player) => (
            <button
              key={player.id}
              onClick={() => handleSelectRaider(player.id)}
              className="p-4 transition bg-blue-600 rounded-lg hover:bg-blue-500 disabled:bg-gray-600 disabled:opacity-50"
            >
              <div className="font-bold">{player.name}</div>
              <div className="text-sm">STR: {player.stats.str}</div>
              <div className="text-sm">AGI: {player.stats.agi}</div>
              <div className="text-sm">REF: {player.stats.ref}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectRaiderScreen;