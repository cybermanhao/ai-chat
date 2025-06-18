import { message } from 'antd';
import { useCallback } from 'react';
import { useModelConfigStore } from '@/store/modelConfigStore';
import type { ModelConfig, ModelLoadingKey } from '@/types/model';

type ConfigUpdateValue = Partial<ModelConfig> | ((prev: ModelConfig) => Partial<ModelConfig>);

export function useModelConfig() {
  const { config, loading, setConfig, setLoading } = useModelConfigStore();

  const updateConfigWithLoading = useCallback(async (
    key: ModelLoadingKey,
    updateValue: ConfigUpdateValue
  ) => {
    setLoading(key, true);
    try {
      setConfig(updateValue);
      return true;
    } catch {
      message.error(`Failed to update ${key}`);
      return false;
    } finally {
      setLoading(key, false);
    }
  }, [setConfig, setLoading]);

  const updateTemperature = useCallback(async (value: number) => {
    return updateConfigWithLoading('temperature', { temperature: value });
  }, [updateConfigWithLoading]);

  const updateContextBalance = useCallback(async (value: number) => {
    return updateConfigWithLoading('contextBalance', { contextBalance: value });
  }, [updateConfigWithLoading]);

  const updateSystemPrompt = useCallback(async (value: string) => {
    return updateConfigWithLoading('systemPrompt', { systemPrompt: value });
  }, [updateConfigWithLoading]);

  const toggleMultiTools = useCallback(async (enabled: boolean) => {
    return updateConfigWithLoading('multiTools', { multiToolsEnabled: enabled });
  }, [updateConfigWithLoading]);

  const updateEnabledTools = useCallback(async (tools: string[]) => {
    return updateConfigWithLoading('enabledTools', { enabledTools: tools });
  }, [updateConfigWithLoading]);

  return {
    config,
    loading,
    updateTemperature,
    updateContextBalance,
    updateSystemPrompt,
    toggleMultiTools,
    updateEnabledTools,
  };
}
