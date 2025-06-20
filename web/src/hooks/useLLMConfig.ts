// web/src/hooks/useLLMConfig.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { llms } from '@engine/utils/llms';
import { DEEPSEEK_API_KEY } from '@/config';
import { STORAGE_KEYS } from '@/config/storage';

// 类型定义
interface LLMConfigPersistState {
  activeLLMId: string;
  apiKey: string;
  userModel: string;
  setActiveLLMId: (id: string) => void;
  setApiKey: (key: string) => void;
  setUserModel: (model: string) => void;
}

const defaultLLM = llms[0];

export const useLLMConfigStore = create<LLMConfigPersistState>()(
  persist(
    (set) => ({
      activeLLMId: defaultLLM.id,
      apiKey: DEEPSEEK_API_KEY || '',
      userModel: defaultLLM.userModel || '',
      setActiveLLMId: (id) => set({ activeLLMId: id }),
      setApiKey: (key) => set({ apiKey: key }),
      setUserModel: (model) => set({ userModel: model }),
    }),
    {
      name: STORAGE_KEYS.LLM_CONFIG,
    }
  )
);

// 兼容原有 useLLMConfig 用法
export function useLLMConfig() {
  const activeLLMId = useLLMConfigStore(s => s.activeLLMId);
  const apiKey = useLLMConfigStore(s => s.apiKey);
  const userModel = useLLMConfigStore(s => s.userModel);
  const setActiveLLMId = useLLMConfigStore(s => s.setActiveLLMId);
  const setApiKey = useLLMConfigStore(s => s.setApiKey);
  const setUserModel = useLLMConfigStore(s => s.setUserModel);
  const availableLLMs = llms;
  const activeLLM = llms.find(llm => llm.id === activeLLMId) || llms[0];
  const currentConfig = { ...activeLLM, apiKey, userModel };

  function selectLLM(llmId: string) {
    setActiveLLMId(llmId);
    // 切换模型时自动切换 userModel
    const llm = llms.find(l => l.id === llmId);
    if (llm && llm.userModel) setUserModel(llm.userModel);
  }

  function updateLLMConfig(config: Partial<typeof activeLLM & { apiKey: string; userModel: string }>) {
    if (config.apiKey !== undefined) setApiKey(config.apiKey);
    if (config.userModel !== undefined) setUserModel(config.userModel);
  }

  return { activeLLM, currentConfig, availableLLMs, selectLLM, updateLLMConfig };
}
