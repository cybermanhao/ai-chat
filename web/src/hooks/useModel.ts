import { useCallback, useMemo } from 'react';
import { message } from 'antd';
import { modelConfigService } from '@/services/modelConfigService';
import { useLLMStore } from '@/store/llmStore';
import { usePluginStore } from '@/store/pluginStore';
import { llms } from '@/utils/llms/llms';
import { tools as availableTools } from '@/plugins';
import { useModelConfigState } from './useModelConfigState';
import type { ModelConfig, ModelLoadingKey } from '@/types/model';
import type { ServiceResult } from '@/services/modelConfigService';

export const useModel = () => {
  const { selectedLLM: selectedLLMId, selectedModel, setSelectedLLM, setSelectedModel } = useLLMStore();
  const { getSystemPrompts } = usePluginStore();

  const {
    config,
    loading,
    setConfig,
    setLoading,
  } = useModelConfigState();

  const currentLLM = useMemo(() => llms.find(l => l.id === selectedLLMId) || null, [selectedLLMId]);

  // Model and LLM selection handlers
  const handleModelChange = useCallback((model: string) => {
    if (currentLLM && !currentLLM.models.includes(model)) {
      const targetLLM = llms.find(llm => llm.models.includes(model));
      if (targetLLM) {
        setSelectedLLM(targetLLM.id);
      }
    }
    setSelectedModel(model);
  }, [currentLLM, setSelectedLLM, setSelectedModel]);

  const handleLLMChange = useCallback((llmId: string) => {
    const llm = llms.find(l => l.id === llmId);
    if (llm) {
      setSelectedLLM(llmId);
      setSelectedModel(llm.userModel);
    }
  }, [setSelectedLLM, setSelectedModel]);

  // Model config update handlers
  const updateWithLoading = useCallback(async (
    key: ModelLoadingKey,
    action: Promise<ServiceResult>,
    update: Partial<ModelConfig>
  ): Promise<void> => {
    setLoading(key, true);
    try {
      const result = await action;
      if (result.success) {
        setConfig(update);
      } else {
        message.error(result.error || 'Failed to update configuration');
      }
    } finally {
      setLoading(key, false);
    }
  }, [setLoading, setConfig]);

  const handleTemperatureChange = useCallback(async (value: number) => {
    await updateWithLoading(
      'temperature',
      modelConfigService.updateTemperature(value),
      { temperature: value }
    );
  }, [updateWithLoading]);

  const handleContextBalanceChange = useCallback(async (value: number) => {
    await updateWithLoading(
      'contextBalance',
      modelConfigService.updateContextBalance(value),
      { contextBalance: value }
    );
  }, [updateWithLoading]);

  const handleSystemPromptChange = useCallback(async (value: string) => {
    await updateWithLoading(
      'systemPrompt',
      modelConfigService.updateSystemPrompt(value),
      { systemPrompt: value }
    );
  }, [updateWithLoading]);

  const handleMultiToolsToggle = useCallback(async (enabled: boolean) => {
    await updateWithLoading(
      'multiTools',
      modelConfigService.toggleMultiTools(enabled),
      { multiToolsEnabled: enabled }
    );
  }, [updateWithLoading]);

  const handleToolToggle = useCallback(async (toolId: string, enabled: boolean) => {
    await updateWithLoading(
      'tools',
      modelConfigService.toggleTool(toolId, enabled),
      {
        enabledTools: enabled
          ? [...config.enabledTools, toolId]
          : config.enabledTools.filter(id => id !== toolId)
      }
    );
  }, [updateWithLoading, config.enabledTools]);

  // Combine system prompts
  const combinedSystemPrompt = useMemo(() => {
    const pluginPrompts = getSystemPrompts();
    return [config.systemPrompt, ...pluginPrompts]
      .filter(Boolean)
      .join('\n\n');
  }, [config.systemPrompt, getSystemPrompts]);

  return {
    selectedLLM: currentLLM,
    selectedModel,
    config: {
      ...config,
      systemPrompt: combinedSystemPrompt,
    },
    loading,
    handleModelChange,
    handleLLMChange,
    handleTemperatureChange,
    handleContextBalanceChange,
    handleSystemPromptChange,
    handleMultiToolsToggle,
    handleToolToggle,
    availableLLMs: llms,
    availableTools,
  };
};
