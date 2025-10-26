// src/components/TextLog.tsx

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store';

const TextLog: React.FC = () => {
  const textLog = useGameStore((state) => state.textLog);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new messages are added
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [textLog]);

  return (
    <div className="h-full p-2 bg-gray-800 rounded-lg overflow-y-auto flex flex-col-reverse">
      <div ref={logEndRef} />
      {/* Reverse the array to show the newest messages at the bottom */}
      {[...textLog].reverse().map((entry) => (
        <div key={entry.id} className="text-sm text-gray-300 mb-1">
          {entry.message}
        </div>
      ))}
    </div>
  );
};

export default TextLog;