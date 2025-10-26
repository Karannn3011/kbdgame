// src/components/modals/QTEModal.tsx

import React from 'react';
import { useGameStore } from '../../store';
import MashQTE from './MashQTE';
import TimingQTE from './TimingQTE';

const QTEModal: React.FC = () => {
  // 1. Subscribe to the qte state and the outcome handler
  const qte = useGameStore((state) => state.qte);
  const handleQTEOutcome = useGameStore((state) => state.handleQTEOutcome);

  // If no QTE is active, render nothing
  if (!qte) {
    return null;
  }

  const renderQTE = () => {
    if (qte.type === 'mash') {
      return (
        <MashQTE
          target={qte.target}
          timeLimit={3000} // 3 seconds
          onComplete={handleQTEOutcome}
        />
      );
    }

    if (qte.type === 'timing') {
      // Let's define the success zone. We can make this dynamic later.
      const successZone = { start: 0.4, end: 0.6 }; // 40% to 60%
      return (
        <TimingQTE
          successZone={successZone}
          speed={2} // Adjust speed as needed
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