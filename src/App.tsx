// src/App.tsx

import React from "react";
import { useGameStore } from "./store"; // Correct path to our store
import SelectRaiderScreen from "./components/modals/SelectRaiderScreen";
import GameBoard from "./components/GameBoard"; // <-- Import this
import QTEModal from "./components/modals/QTEModal";
import GameOverScreen from "./components/modals/GameOverScreen";

// A simple button component we'll use
const Button: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
  >
    {children}
  </button>
);

function App() {
  const gameState = useGameStore((state) => state.gameState);
  const startGame = useGameStore((state) => state.startGame);

  const renderGameContent = () => {
    switch (gameState) {
      case "PRE_GAME":
        return (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-3xl font-bold">KabaddiSim V2</h1>
            <Button onClick={startGame}>Start New Game</Button>
          </div>
        );

      case "SELECT_RAIDER":
        return <SelectRaiderScreen />;

      case "PLAYER_RAID":
      case "AI_RAID":
      case "RAID_END":
        return <GameBoard />;

      case "QTE_ACTIVE":
        // Show the board *and* the QTE modal on top
        return (
          <div>
            <GameBoard />
            <QTEModal /> {/* <-- Render it here */}
          </div>
        );

      case "GAME_OVER":
        return <GameOverScreen />;

      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-900 text-white">
      {renderGameContent()}
    </div>
  );
}

export default App;
