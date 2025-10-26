// src/components/modals/TimingQTE.tsx

import React, { useState, useEffect, useRef } from 'react';

interface TimingQTEProps {
  successZone: { start: number; end: number }; // e.g., 0.4 to 0.6 (40% to 60%)
  speed: number; // e.g., 2 (moves back and forth 2 times per second)
  onComplete: (success: boolean) => void;
}

const TimingQTE: React.FC<TimingQTEProps> = ({
  successZone,
  speed,
  onComplete,
}) => {
  const [position, setPosition] = useState(0); // 0 to 1
  const direction = useRef(1);
  const requestRef = useRef<number>(0);

  // Animation loop for the marker
  useEffect(() => {
    const animate = (time: number) => {
      setPosition((prevPosition) => {
        let newPos = prevPosition + (speed / 100) * direction.current;
        if (newPos > 1) {
          newPos = 1;
          direction.current = -1;
        } else if (newPos < 0) {
          newPos = 0;
          direction.current = 1;
        }
        return newPos;
      });
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current as number);
  }, [speed]);

  // Handle key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        cancelAnimationFrame(requestRef.current as number); // Stop animation

        // Check if position is in the success zone
        const currentPos = position;
        if (currentPos >= successZone.start && currentPos <= successZone.end) {
          onComplete(true); // Success!
        } else {
          onComplete(false); // Failure!
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [position, successZone, onComplete]);

  const successZoneWidth = (successZone.end - successZone.start) * 100;
  const successZoneLeft = successZone.start * 100;

  return (
    <div className="flex flex-col items-center p-8 bg-gray-800 rounded-lg shadow-xl w-96">
      <h2 className="text-3xl font-bold text-yellow-400 animate-pulse">
        TIMING CHALLENGE!
      </h2>
      <p className="mb-4 text-xl">Press Space in the Green Zone!</p>

      {/* QTE Bar */}
      <div className="relative w-full h-12 bg-gray-700 rounded-full">
        {/* Success Zone */}
        <div
          className="absolute h-full bg-green-500 rounded-full opacity-75"
          style={{
            left: `${successZoneLeft}%`,
            width: `${successZoneWidth}%`,
          }}
        />

        {/* Marker */}
        <div
          className="absolute w-2 h-full bg-white rounded-full"
          style={{ left: `calc(${position * 100}% - 4px)` }}
        />
      </div>
    </div>
  );
};

export default TimingQTE;