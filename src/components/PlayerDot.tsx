// src/components/PlayerDot.tsx

import React from 'react';
import { Player } from '../types/player';

interface PlayerDotProps {
  player: Player;
  isRaider: boolean;
  isSelectable: boolean;
  isPlayerTeam: boolean; // We need to know which team to color it
  onClick: (id: string) => void;
}

const PlayerDot: React.FC<PlayerDotProps> = ({
  player,
  isRaider,
  isSelectable,
  isPlayerTeam,
  onClick,
}) => {
  // Base classes
  let classes =
    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 absolute transform -translate-x-1/2 -translate-y-1/2';

  // Team Color
  classes += isPlayerTeam ? ' bg-blue-500' : ' bg-red-500';

  // Style for 'out' players
  if (player.isOut) {
    classes += ' opacity-10'; // Make them almost invisible
  } else {
    // Style for 'in' players
    if (isSelectable) {
      classes += ' cursor-pointer hover:ring-4 hover:ring-white';
    }
    if (isRaider) {
      classes += ' ring-4 ring-yellow-400 animate-pulse z-10';
    }
  }

  const handleClick = () => {
    if (!player.isOut && isSelectable) {
      onClick(player.id);
    }
  };

  // If the player is out, don't render them on the mat
  if (player.isOut) {
    return null; // Or render them on a "bench" area
  }

  return (
    <div
      className={classes}
      onClick={handleClick}
      // This is the core 2D logic!
      style={{
        top: `${player.position.y}%`,
        left: `${player.position.x}%`,
      }}
    >
      {player.id.toUpperCase()}
    </div>
  );
};

export default PlayerDot;