import { useState, useCallback } from 'react';

export interface ModelConfigKey {
  temperature: 'temperature';
  contextBalance: 'contextBalance';
  systemPrompt: 'systemPrompt';
  multiToolsEnabled: 'multiTools';
  enabledTools: 'tools';
}

export interface ModelConfig {
  temperature: number;
  contextBalance: number;
  systemPrompt: string;
  multiToolsEnabled: boolean;
  enabledTools: string[];
}

export interface ModelConfigLoading {
  temperature: boolean;
  contextBalance: boolean;
  systemPrompt: boolean;
  multiTools: boolean;
  tools: boolean;
}

export type ModelLoadingKey = keyof ModelConfigLoading;

interface UseModelConfigStateResult {
  config: ModelConfig;
  loading: ModelConfigLoading;
  setConfig: (update: Partial<ModelConfig> | ((prev: ModelConfig) => Partial<ModelConfig>)) => void;
  setLoading: (key: ModelLoadingKey, value: boolean) => void;
  reset: () => void;
}

const defaultConfig: ModelConfig = {
  temperature: 0.7,
  contextBalance: 1,
  systemPrompt: '',
  multiToolsEnabled: false,
  enabledTools: [],
};

const defaultLoading: ModelConfigLoading = {
  temperature: false,
  contextBalance: false,
  systemPrompt: false,
  multiTools: false,
  tools: false,
};

export const useModelConfigState = (
  initialConfig: Partial<ModelConfig> = {}
): UseModelConfigStateResult => {
  const [config, setConfigInternal] = useState<ModelConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  const [loading, setLoadingInternal] = useState<ModelConfigLoading>(defaultLoading);
  const setConfig = useCallback((update: Partial<ModelConfig> | ((prev: ModelConfig) => Partial<ModelConfig>)) => {
    setConfigInternal(prev => ({
      ...prev,
      ...(typeof update === 'function' ? update(prev) : update),
    }));
  }, []);

  const setLoading = useCallback((key: ModelLoadingKey, value: boolean) => {
    setLoadingInternal(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const reset = useCallback(() => {
    setConfigInternal(defaultConfig);
    setLoadingInternal(defaultLoading);
  }, []);

  return {
    config,
    loading,
    setConfig,
    setLoading,
    reset,
  };
};
