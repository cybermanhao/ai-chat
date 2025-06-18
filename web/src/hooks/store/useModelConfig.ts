import { useCallback } from 'react';
import { ModelConfig, ModelLoadingKey } from '@/types/model';
import { modelConfigService, ServiceResult } from '@/services/modelConfigService';

interface UseModelConfigResult {
  updateTemperature: (value: number) => Promise<ServiceResult>;
  updateContextBalance: (value: number) => Promise<ServiceResult>;
  updateSystemPrompt: (value: string) => Promise<ServiceResult>;
  toggleMultiTools: (enabled: boolean) => Promise<ServiceResult>;
  toggleTool: (toolId: string, enabled: boolean) => Promise<ServiceResult>;
}

export const useModelConfig = (
  onConfigUpdate: (update: Partial<ModelConfig> | ((prev: ModelConfig) => Partial<ModelConfig>)) => void,
  onLoadingChange: (key: ModelLoadingKey, isLoading: boolean) => void,
): UseModelConfigResult => {
  const updateWithLoading = useCallback(async <T extends keyof ModelConfig>(
    key: ModelLoadingKey,
    action: Promise<ServiceResult>,
    updateValue: Partial<ModelConfig> | ((prev: ModelConfig) => Partial<ModelConfig>)
  ) => {
    onLoadingChange(key, true);
    try {
      const result = await action;
      if (result.success) {
        onConfigUpdate(updateValue);
      }
      return result;
    } finally {
      onLoadingChange(key, false);
    }
  }, [onConfigUpdate, onLoadingChange]);

  const updateTemperature = useCallback(async (value: number) => {
    return updateWithLoading(
      'temperature',
      modelConfigService.updateTemperature(value),
      { temperature: value }
    );
  }, [updateWithLoading]);

  const updateContextBalance = useCallback(async (value: number) => {
    return updateWithLoading(
      'contextBalance',
      modelConfigService.updateContextBalance(value),
      { contextBalance: value }
    );
  }, [updateWithLoading]);

  const updateSystemPrompt = useCallback(async (value: string) => {
    return updateWithLoading(
      'systemPrompt',
      modelConfigService.updateSystemPrompt(value),
      { systemPrompt: value }
    );
  }, [updateWithLoading]);

  const toggleMultiTools = useCallback(async (enabled: boolean) => {
    return updateWithLoading(
      'multiTools',
      modelConfigService.toggleMultiTools(enabled),
      { multiToolsEnabled: enabled }
    );
  }, [updateWithLoading]);

  const toggleTool = useCallback(async (toolId: string, enabled: boolean) => {
    return updateWithLoading(
      'tools',
      modelConfigService.toggleTool(toolId, enabled),
      prev => ({
        enabledTools: enabled 
          ? [...prev.enabledTools, toolId]
          : prev.enabledTools.filter(id => id !== toolId)
      })
    );
  }, [updateWithLoading]);

  return {
    updateTemperature,
    updateContextBalance,
    updateSystemPrompt,
    toggleMultiTools,
    toggleTool,
  };
};
