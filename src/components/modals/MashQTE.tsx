// src/components/modals/MashQTE.tsx

import React, { useState, useEffect } from 'react';

interface MashQTEProps {
  target: number; // e.g., 10 mashes
  timeLimit: number; // e.g., 3000 ms
  onComplete: (success: boolean) => void;
}

const MashQTE: React.FC<MashQTEProps> = ({
  target,
  timeLimit,
  onComplete,
}) => {
  const [count, setCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Stop spacebar from scrolling
        setCount((currentCount) => {
          const newCount = currentCount + 1;
          if (newCount >= target) {
            onComplete(true); // Success!
          }
          return newCount;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [target, onComplete]);

  // Handle the countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete(false); // Failure!
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 100);
    }, 100);

    return () => clearTimeout(timer);
  }, [timeLeft, onComplete]);

  const progressPercent = (count / target) * 100;
  const timePercent = (timeLeft / timeLimit) * 100;

  return (
    <div className="flex flex-col items-center p-8 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold text-red-500 animate-pulse">
        MASH SPACEBAR!
      </h2>
      <p className="text-xl">
        {count} / {target}
      </p>

      {/* Progress Bar (Mashes) */}
      <div className="w-full h-8 my-4 bg-gray-700 rounded-full">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Time Left Bar */}
      <div className="w-full h-4 bg-gray-700 rounded-full">
        <div
          className="h-full bg-red-500 rounded-full"
          style={{ width: `${timePercent}%` }}
        />
      </div>
    </div>
  );
};

export default MashQTE;