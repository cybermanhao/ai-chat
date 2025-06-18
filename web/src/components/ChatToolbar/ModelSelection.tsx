import { useModel } from '@/hooks/useModel';
import { ModelSelectionView } from './ModelSelectionView';

export const ModelSelection = () => {
  const {
    selectedLLM,
    selectedModel,
    config,
    loading,
    handleModelChange,
    handleLLMChange,
    handleTemperatureChange,
    handleContextBalanceChange,
    handleSystemPromptChange,
    handleMultiToolsToggle,
    handleToolToggle,
    availableLLMs,
    availableTools,
  } = useModel();

  return (
    <ModelSelectionView
      selectedLLM={selectedLLM?.id || null}
      selectedModel={selectedModel}
      modelConfig={config}
      loading={loading}
      availableLLMs={availableLLMs}
      availableTools={availableTools}
      onModelChange={handleModelChange}
      onLLMChange={handleLLMChange}
      onTemperatureChange={handleTemperatureChange}
      onContextBalanceChange={handleContextBalanceChange}
      onSystemPromptChange={handleSystemPromptChange}
      onMultiToolsToggle={handleMultiToolsToggle}
      onToolToggle={handleToolToggle}
    />
  );
};
