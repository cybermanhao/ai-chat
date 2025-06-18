import { useCallback, useMemo } from 'react';
import { useLLMStore } from '@/store/llmStore';
import { usePluginStore } from '@/store/pluginStore';
import { llms } from '@/utils/llms/llms';
import { useModelConfigState } from './useModelConfigState';
import { useModelConfigActions } from './useModelConfigActions';

export const useModelSelection = () => {
  const { selectedLLM, selectedModel, setSelectedLLM, setSelectedModel } = useLLMStore();
  const { getSystemPrompts } = usePluginStore();

  // Model configuration state management
  const {
    config: modelConfig,
    loading,
    setConfig,
    setLoading,
  } = useModelConfigState();

  // Model configuration API actions
  const actions = useModelConfigActions({
    onLoading: (key, isLoading) => setLoading(key, isLoading),
    onUpdate: (update) => setConfig(update),
  });

  // Model and LLM selection
  const handleModelChange = useCallback((model: string) => {
    if (selectedLLM && !selectedLLM.models.includes(model)) {
      const targetLLM = llms.find(llm => llm.models.includes(model));
      if (targetLLM) {
        setSelectedLLM(targetLLM.id);
      }
    }
    setSelectedModel(model);
  }, [selectedLLM, setSelectedLLM, setSelectedModel]);

  const handleLLMChange = useCallback((llmId: string) => {
    const llm = llms.find(l => l.id === llmId);
    if (llm) {
      setSelectedLLM(llmId);
      setSelectedModel(llm.userModel);
    }
  }, [setSelectedLLM, setSelectedModel]);

  // Combine system prompts
  const combinedSystemPrompt = useMemo(() => {
    const pluginPrompts = getSystemPrompts();
    return [modelConfig.systemPrompt, ...pluginPrompts]
      .filter(Boolean)
      .join('\n\n');
  }, [modelConfig.systemPrompt, getSystemPrompts]);

  return {
    selectedLLM,
    selectedModel,
    modelConfig: {
      ...modelConfig,
      systemPrompt: combinedSystemPrompt,
    },
    loading,
    handleModelChange,
    handleLLMChange,
    handleTemperatureChange: actions.updateTemperature,
    handleContextBalanceChange: actions.updateContextBalance,
    handleSystemPromptChange: actions.updateSystemPrompt,
    handleMultiToolsToggle: actions.toggleMultiTools,
    handleToolToggle: actions.toggleTool,
  };
};