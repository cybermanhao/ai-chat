import { useCallback, useMemo } from 'react';
import { useLLMConfigStore } from '@/store/llmConfigStore';
import { llms } from '@/utils/llms/llms';

export const useLLMConfig = () => {
  const { activeLLMId, configs, setActiveLLM, updateConfig } = useLLMConfigStore();

  const availableLLMs = useMemo(() => llms, []);
  const activeLLM = useMemo(
    () => availableLLMs.find(llm => llm.id === activeLLMId),
    [activeLLMId, availableLLMs]
  );
  
  const currentConfig = useMemo(
    () => activeLLMId ? configs[activeLLMId] : undefined,
    [activeLLMId, configs]
  );

  const selectLLM = useCallback((llmId: string) => {
    const llm = availableLLMs.find(l => l.id === llmId);
    if (llm) {
      setActiveLLM(llmId);
      // 如果没有配置，使用LLM的默认配置
      if (!configs[llmId]) {
        updateConfig(llmId, {
          model: llm.userModel,
          baseUrl: llm.baseUrl,
        });
      }
    }
  }, [availableLLMs, configs, setActiveLLM, updateConfig]);

  const updateLLMConfig = useCallback((config: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }) => {
    if (activeLLMId) {
      updateConfig(activeLLMId, config);
    }
  }, [activeLLMId, updateConfig]);

  const getRequestConfig = useCallback(() => {
    if (!activeLLM || !currentConfig) return null;

    return {
      baseUrl: currentConfig.baseUrl || activeLLM.baseUrl,
      apiKey: currentConfig.apiKey,
      model: currentConfig.model || activeLLM.userModel,
      temperature: currentConfig.temperature,
      maxTokens: currentConfig.maxTokens,
      systemPrompt: currentConfig.systemPrompt,
    };
  }, [activeLLM, currentConfig]);

  const isConfigValid = useCallback(() => {
    if (!activeLLM || !currentConfig) return false;
    return Boolean(currentConfig.apiKey && currentConfig.model);
  }, [activeLLM, currentConfig]);

  return {
    // 状态
    activeLLM,
    currentConfig,
    availableLLMs,
    
    // 动作
    selectLLM,
    updateLLMConfig,
    
    // 工具方法
    getRequestConfig,
    isConfigValid,
  };
};
