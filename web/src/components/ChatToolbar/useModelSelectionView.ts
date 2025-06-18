import { useState } from 'react';

export const useModelSelectionView = () => {
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [showTemperature, setShowTemperature] = useState(false);
  const [showContextBalance, setShowContextBalance] = useState(false);

  return {
    isSystemPromptOpen,
    setIsSystemPromptOpen,
    isToolsModalOpen,
    setIsToolsModalOpen,
    showTemperature,
    setShowTemperature,
    showContextBalance,
    setShowContextBalance,
  };
};
