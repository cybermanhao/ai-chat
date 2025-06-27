import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { llms } from '@engine/utils/llms';
import { defaultLLMConfig } from '@engine/utils/llmConfig';
import { config as appConfig } from '@/config'; // 新增：引入全局 config

// [说明] deepseek 的 apiKey 默认值来源于项目根目录 .env 文件中的 VITE_DEEPSEEK_API_KEY
// 相关引入文件：web/src/config/index.ts、web/src/env.d.ts
// 修改 .env 后需重启 Vite 服务以生效

const defaultLLM = llms[0];

interface LLMConfigState {
  activeLLMId: string;
  userModel: string;
  apiKeys: Record<string, string>; // 每个 LLM 独立 key
}

// 取 deepseek 默认 key（如有）
const deepseekDefaultKey = appConfig.providers?.deepseek?.apiKey || '';

const initialState: LLMConfigState = {
  activeLLMId: defaultLLM.id,
  userModel: defaultLLM.userModel || defaultLLMConfig.model,
  apiKeys: {
    deepseek: deepseekDefaultKey,
  },
};

const llmConfigSlice = createSlice({
  name: 'llmConfig',
  initialState,
  reducers: {
    setActiveLLMId(state, action: PayloadAction<string>) {
      state.activeLLMId = action.payload;
      const llm = llms.find(l => l.id === action.payload);
      if (llm && llm.userModel) state.userModel = llm.userModel;
    },
    setApiKey(state, action: PayloadAction<{ llmId: string; apiKey: string }>) {
      state.apiKeys[action.payload.llmId] = action.payload.apiKey;
    },
    setUserModel(state, action: PayloadAction<string>) {
      state.userModel = action.payload;
    },
    loadConfigFromStorage(state, action: PayloadAction<LLMConfigState>) {
      state.activeLLMId = action.payload.activeLLMId;
      state.userModel = action.payload.userModel;
      state.apiKeys = action.payload.apiKeys;
    },
  },
});

export const { setActiveLLMId, setApiKey, setUserModel, loadConfigFromStorage } = llmConfigSlice.actions;
export default llmConfigSlice.reducer; 