// web/src/hooks/useModelConfig.ts
// 请在 web 端实现 useModelConfig，勿直接复用 engine/hooks/useModelConfig
// 示例：实际应根据 web 端全局状态或配置实现
import { useModelConfigStore } from './useModelConfigStore';
import { useStore } from 'zustand';
import { useCallback } from 'react';
import { message } from 'antd';
import type { ModelConfig } from '@engine/types/model';

export function useModelConfig() {
  const config = useStore(useModelConfigStore, (state) => state.config);
  const setConfig = useStore(useModelConfigStore, (state) => state.setConfig);

  const updateConfig = useCallback(async (
    key: keyof ModelConfig,
    updateValue: Partial<ModelConfig>
  ) => {
    try {
      setConfig(updateValue);
      return true;
    } catch {
      message.error(`Failed to update ${key}`);
      return false;
    }
  }, [setConfig]);

  const updateTemperature = useCallback(async (value: number) => {
    return updateConfig('temperature', { temperature: value });
  }, [updateConfig]);

  const updateContextBalance = useCallback(async (value: number) => {
    return updateConfig('contextBalance', { contextBalance: value });
  }, [updateConfig]);

  const updateSystemPrompt = useCallback(async (value: string) => {
    return updateConfig('systemPrompt', { systemPrompt: value });
  }, [updateConfig]);

  const toggleMultiTools = useCallback(async (enabled: boolean) => {
    return updateConfig('multiToolsEnabled', { multiToolsEnabled: enabled });
  }, [updateConfig]);

  const updateEnabledTools = useCallback(async (tools: string[]) => {
    return updateConfig('enabledTools', { enabledTools: tools });
  }, [updateConfig]);

  return {
    config,
    updateTemperature,
    updateContextBalance,
    updateSystemPrompt,
    toggleMultiTools,
    updateEnabledTools,
  };
}
