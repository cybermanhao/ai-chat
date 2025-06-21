// web/src/hooks/useLLMConfig.ts
import { useState } from 'react';
import { llms } from '@engine/utils/llms';

export function useLLMConfig() {
  const [activeLLMId, setActiveLLMId] = useState(llms[0].id);
  const [apiKey, setApiKey] = useState('');
  const availableLLMs = llms;
  const activeLLM = llms.find(llm => llm.id === activeLLMId) || llms[0];
  const currentConfig = { ...activeLLM, apiKey };

  function selectLLM(llmId: string) {
    setActiveLLMId(llmId);
  }

  function updateLLMConfig(config: Partial<typeof activeLLM & { apiKey: string }>) {
    if (config.apiKey !== undefined) setApiKey(config.apiKey);
    // 这里只处理 apiKey，其他字段如 userModel 可按需扩展
  }

  return { activeLLM, currentConfig, availableLLMs, selectLLM, updateLLMConfig };
}
