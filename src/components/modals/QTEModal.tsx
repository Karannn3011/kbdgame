// src/components/modals/QTEModal.tsx

import React from 'react';
import { useGameStore } from '../../store';
import MashQTE from './MashQTE';
import TimingQTE from './TimingQTE';

const QTEModal: React.FC = () => {
  // 1. Subscribe to the CORRECT state variable: activeQTE
  const activeQTE = useGameStore((state) => state.activeQTE); // <-- FIX HERE
  const handleQTEOutcome = useGameStore((state) => state.handleQTEOutcome);

  // If no QTE is active, render nothing
  if (!activeQTE) { // <-- FIX HERE
    return null;
  }

  const renderQTE = () => {
    // Check the type from the activeQTE object
    if (activeQTE.type === 'mash') { // <-- FIX HERE
      return (
        <MashQTE
          // Pass the target from the activeQTE object
          target={activeQTE.target ?? 10} // <-- FIX HERE (provide default if needed)
          timeLimit={3000} 
          onComplete={handleQTEOutcome}
        />
      );
    }

    if (activeQTE.type === 'timing') { // <-- FIX HERE
      // Define the success zone based on context if needed, or use default
      const successZoneData = activeQTE.successZone ?? 0.5; // <-- FIX HERE (provide default)
      const successZone = { 
          start: Math.max(0, successZoneData - 0.1), // Example: center +/- 0.1
          end: Math.min(1, successZoneData + 0.1) 
      }; 
      
      // You could adjust speed based on activeQTE.context too
      let speed = 2;
      if (activeQTE.context === 'bonus_tackle' || activeQTE.context === 'multi_tackle'){
          speed = 3; // Make harder QTEs faster
      }

      return (
        <TimingQTE
          successZone={successZone}
          speed={speed} 
          onComplete={handleQTEOutcome}
        />
      );
    }

    return null;
  };

  return (
    // This is the modal overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      {renderQTE()}
    </div>
  );
};

export default QTEModal;