import { useState } from 'react';
import { useModelSelection } from '../store';

export const useModelView = () => {
  // UI状态
  const [isModelSettingsVisible, setModelSettingsVisible] = useState(false);
  const [isToolsVisible, setToolsVisible] = useState(false);

  // 数据层状态
  const { 
    selectedLLM,
    selectedModel,
    modelConfig,
    loading,
    handleModelChange,
    handleLLMChange,
    handleTemperatureChange,
    handleContextBalanceChange,
    handleSystemPromptChange,
    handleMultiToolsToggle,
    handleToolToggle,
  } = useModelSelection();

  return {
    // UI状态
    isModelSettingsVisible,
    setModelSettingsVisible,
    isToolsVisible,
    setToolsVisible,
    
    // 数据状态
    selectedLLM,
    selectedModel,
    modelConfig,
    loading,
    
    // 操作方法
    handleModelChange,
    handleLLMChange,
    handleTemperatureChange,
    handleContextBalanceChange,
    handleSystemPromptChange,
    handleMultiToolsToggle,
    handleToolToggle,
  };
};
