import { useLLMConfig } from '@/hooks/useLLMConfig';

export const useModelSelection = () => {
  const { activeLLM, currentConfig, selectLLM, updateLLMConfig } = useLLMConfig();

  const handleLLMChange = (llmId: string) => {
    selectLLM(llmId);
    // Reset model when LLM changes
    updateLLMConfig({ model: '' });
  };

  const handleModelChange = (model: string) => {
    updateLLMConfig({ model });
  };

  return {
    selectedLLM: activeLLM,
    selectedModel: currentConfig?.model || '',
    handleLLMChange,
    handleModelChange,
  };
};
