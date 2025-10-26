// src/components/modals/GameOverScreen.tsx

import React from 'react';
import { useGameStore } from '../../store';

const GameOverScreen: React.FC = () => {
  const { playerScore, aiScore, startGame } = useGameStore((state) => ({
    playerScore: state.playerScore,
    aiScore: state.aiScore,
    startGame: state.startGame,
  }));

  let message = '';
  let messageColor = 'text-green-500';

  if (playerScore > aiScore) {
    message = 'YOU WIN!';
    messageColor = 'text-green-500';
  } else if (aiScore > playerScore) {
    message = 'GAME OVER';
    messageColor = 'text-red-500';
  } else {
    message = "IT'S A TIE!";
    messageColor = 'text-yellow-500';
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-85">
      <h1 className={`text-6xl font-bold mb-4 ${messageColor}`}>
        {message}
      </h1>
      
      <div className="text-3xl mb-8">
        Final Score: {playerScore} - {aiScore}
      </div>

      <button
        onClick={startGame}
        className="px-8 py-4 text-2xl font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-800"
      >
        Play Again
      </button>
    </div>
  );
};

export default GameOverScreen;