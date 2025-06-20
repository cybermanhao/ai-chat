// web/src/hooks/useModelConfig.ts
// 请在 web 端实现 useModelConfig，勿直接复用 engine/hooks/useModelConfig
// 示例：实际应根据 web 端全局状态或配置实现
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/config/storage';
import type { ModelConfig } from '@engine/types/model';

const defaultModelConfig: ModelConfig = {
  temperature: 0.7,
  maxTokens: 2048,
  contextBalance: 0.5,
  systemPrompt: '',
  multiToolsEnabled: false,
  enabledTools: [],
};

interface ModelConfigPersistState {
  config: ModelConfig;
  setConfig: (config: Partial<ModelConfig>) => void;
}

export const useModelConfigStore = create<ModelConfigPersistState>(
  persist(
    (set) => ({
      config: defaultModelConfig,
      setConfig: (config) => set((state) => ({ config: { ...state.config, ...config } })),
    }),
    {
      name: STORAGE_KEYS.MODEL_CONFIG,
    }
  )
);

export function useModelConfig() {
  const config = useModelConfigStore((s) => s.config);
  const setConfig = useModelConfigStore((s) => s.setConfig);
  return { config, setConfig };
}
