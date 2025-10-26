// src/components/GameBoard.tsx

import React from 'react';
import { useGameStore } from '../store';
import PlayerDot from './PlayerDot';
import Scoreboard from './Scoreboard';
import Controls from './Controls';
import TextLog from './TextLog';
import StaminaBar from './StaminaBar';

const GameBoard: React.FC = () => {
  const playerTeam = useGameStore((state) => state.playerTeam);
  const aiTeam = useGameStore((state) => state.aiTeam);
  const gameState = useGameStore((state) => state.gameState);
  const currentRaiderId = useGameStore((state) => state.currentRaiderId);
  const handleRaidAction = useGameStore((state) => state.handleRaidAction);

  // --- 2. Determine who the raider is (if any) ---
  const isPlayerRaiding =
    gameState === 'PLAYER_RAID' &&
    playerTeam.some((p) => p.id === currentRaiderId);
    
  const isAIRaiding =
    gameState === 'AI_RAID' &&
    aiTeam.some((p) => p.id === currentRaiderId);

  // Find the actual raider object
  const raider = currentRaiderId
    ? [...playerTeam, ...aiTeam].find((p) => p.id === currentRaiderId)
    : null;

  const onDefenderClick = (defenderId: string) => {
    if (isPlayerRaiding) {
      handleRaidAction('TOUCH', defenderId);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen p-4">
      {/* TOP: Scoreboard and Stamina */}
      <div className="flex justify-between w-full mb-4">
        <div className="w-1/3">
          <Scoreboard />
        </div>
        <div className="w-1/3">
          <StaminaBar />
        </div>
        <div className="w-1/3" />
      </div>

      {/* --- MIDDLE: The Playfield (REBUILT) --- */}
      {/* Main Mat Container: This holds the lobbies and the playing area. */}
      {/* We give it a fixed height and relative positioning. */}
      <div className="w-[70%] mx-auto h-[500px] relative">
        
        {/* 1. Main Playing Area (Purple) */}
        {/* Sits in the middle 70% of the height, 15% from top/bottom. */}
        <div className="absolute top-[15%] left-0 w-full h-[70%] bg-[#800080]">
          
          {/* Center Line */}
          <div className="absolute left-1/2 top-0 h-full w-1 bg-white transform -translate-x-1/2 z-10" />

          {/* --- Player's Half (Left) --- */}
          {/* This div is the relative container for player dots and lines */}
          <div className="absolute left-0 top-0 w-1/2 h-full">
            {/* Baulk Line (at 60% of the half-mat width from the left) */}
            <div className="absolute left-[50%] top-0 h-full w-1 bg-white" />
            {/* Bonus Line (at 80% of the half-mat width from the left) */}
            <div className="absolute left-[30%] top-0 h-full w-1 bg-black" />

            {/* Player Dots */}
            {/* PlayerDot components are positioned relative to this div */}
            {playerTeam
              .filter((p) => p.id !== currentRaiderId) // Filter out player raider
              .map((player) => (
                <PlayerDot
                  key={player.id}
                  player={player}
                  isPlayerTeam={true}
                  isRaider={false}
                  isSelectable={isAIRaiding && !player.isOut} // Can be tackled
                  onClick={() => {}}
                />
              ))}

              {isAIRaiding && raider && (
              <PlayerDot
                key={raider.id}
                player={raider}
                isPlayerTeam={false} // AI team color
                isRaider={true}
                isSelectable={false}
                onClick={() => {}}
              />
            )}
          </div>

          {/* --- AI's Half (Right) --- */}
          {/* This div is the relative container for AI dots and lines */}
          <div className="absolute right-0 top-0 w-1/2 h-full">
            {/* Bonus Line (at 20% from left, mirroring the 80%) */}
            <div className="absolute left-[70%] top-0 h-full w-1 bg-black" />
            {/* Baulk Line (at 40% from left, mirroring the 60%) */}
            <div className="absolute left-[50%] top-0 h-full w-1 bg-white" />

            {/* AI Dots */}
            {/* PlayerDot components are positioned relative to this div */}
            {aiTeam
              .filter((p) => p.id !== currentRaiderId) // Filter out AI raider
              .map((player) => (
                <PlayerDot
                  key={player.id}
                  player={player}
                  isPlayerTeam={false}
                  isRaider={false}
                  isSelectable={isPlayerRaiding && !player.isOut} // Can be touched
                  onClick={onDefenderClick}
                />
              ))}

            {/* Render Player Raider (if there is one) */}
            {isPlayerRaiding && raider && (
              <PlayerDot
                key={raider.id}
                player={raider}
                isPlayerTeam={true} // Player team color
                isRaider={true}
                isSelectable={false}
                onClick={() => {}}
              />
            )}

            {/* Render Player Post-Raid (during RAID_END) */}
            {gameState === 'RAID_END' && raider && isPlayerRaiding && (
               <PlayerDot
                key={raider.id}
                player={raider}
                isPlayerTeam={true}
                isRaider={false} // Not actively raiding
                isSelectable={false}
                onClick={() => {}}
              />
            )}
            
            {/* Render AI Post-Raid (during RAID_END) */}
            {gameState === 'RAID_END' && raider && isAIRaiding && (
               <PlayerDot
                key={raider.id}
                player={raider}
                isPlayerTeam={false}
                isRaider={false} // Not actively raiding
                isSelectable={false}
                onClick={() => {}}
              />
            )}
          </div>
          
        </div> {/* End Purple Area */}

        {/* 2. Top Lobby (Orange) */}
        {/* Sits in the top 15% of the height */}
        <div className="absolute top-0 left-0 w-full h-[15%] bg-[#FF7F50] border-b-2 border-white">
          {/* White center divider for lobby */}
          <div className="absolute left-1/2 top-0 h-full w-1 bg-white transform -translate-x-1/2" />
        </div>

        {/* 3. Bottom Lobby (Orange) */}
        {/* Sits in the bottom 15% of the height */}
        <div className="absolute bottom-0 left-0 w-full h-[15%] bg-[#FF7F50] border-t-2 border-white">
          {/* White center divider for lobby */}
          <div className="absolute left-1/2 top-0 h-full w-1 bg-white transform -translate-x-1/2" />
        </div>

      </div> {/* End Main Mat Container */}
      {/* --- END PLAYFIELD --- */}

      {/* BOTTOM: Controls and Text Log */}
      <div className="flex justify-between w-full mt-4">
        <div className="w-1/2">
          <Controls />
        </div>
        <div className="w-1/2 h-40">
          <TextLog />
        </div>
      </div>
    </div>
  );
};

export default GameBoard;