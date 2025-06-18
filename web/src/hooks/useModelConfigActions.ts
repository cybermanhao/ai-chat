import { useCallback } from 'react';
import type { ModelConfig, ModelLoadingKey } from './useModelConfigState';
import { modelConfigService, type ServiceResult } from '@/services/modelConfigService';

interface UseModelConfigActionsResult {
  updateTemperature: (value: number) => Promise<ServiceResult>;
  updateContextBalance: (value: number) => Promise<ServiceResult>;
  updateSystemPrompt: (value: string) => Promise<ServiceResult>;
  toggleMultiTools: (enabled: boolean) => Promise<ServiceResult>;
  toggleTool: (toolId: string, enabled: boolean) => Promise<ServiceResult>;
}

interface UseModelConfigActionsOptions {
  onLoading: (key: ModelLoadingKey, loading: boolean) => void;
  onUpdate: (update: Partial<ModelConfig> | ((prev: ModelConfig) => Partial<ModelConfig>)) => void;
}

export const useModelConfigActions = ({
  onLoading,
  onUpdate,
}: UseModelConfigActionsOptions): UseModelConfigActionsResult => {

  const updateTemperature = useCallback(async (value: number) => {
    onLoading('temperature', true);
    const result = await modelConfigService.updateTemperature(value);
    if (result.success) {
      onUpdate({ temperature: value });
    }
    onLoading('temperature', false);
    return result;
  }, [onLoading, onUpdate]);

  const updateContextBalance = useCallback(async (value: number) => {
    onLoading('contextBalance', true);
    const result = await modelConfigService.updateContextBalance(value);
    if (result.success) {
      onUpdate({ contextBalance: value });
    }
    onLoading('contextBalance', false);
    return result;
  }, [onLoading, onUpdate]);

  const updateSystemPrompt = useCallback(async (value: string) => {
    onLoading('systemPrompt', true);
    const result = await modelConfigService.updateSystemPrompt(value);
    if (result.success) {
      onUpdate({ systemPrompt: value });
    }
    onLoading('systemPrompt', false);
    return result;
  }, [onLoading, onUpdate]);

  const toggleMultiTools = useCallback(async (enabled: boolean) => {
    onLoading('multiTools', true);
    const result = await modelConfigService.toggleMultiTools(enabled);
    if (result.success) {
      onUpdate({ multiToolsEnabled: enabled });
    }
    onLoading('multiTools', false);
    return result;
  }, [onLoading, onUpdate]);

  const toggleTool = useCallback(async (toolId: string, enabled: boolean) => {
    onLoading('tools', true);
    const result = await modelConfigService.toggleTool(toolId, enabled);
    if (result.success) {
      onUpdate(prev => ({
        enabledTools: enabled 
          ? [...prev.enabledTools, toolId]
          : prev.enabledTools.filter(id => id !== toolId)
      }));
    }
    onLoading('tools', false);
    return result;
  }, [onLoading, onUpdate]);

  return {
    updateTemperature,
    updateContextBalance,
    updateSystemPrompt,
    toggleMultiTools,
    toggleTool,
  };
};
