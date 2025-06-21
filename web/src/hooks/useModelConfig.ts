// web/src/hooks/useModelConfig.ts
// 请在 web 端实现 useModelConfig，勿直接复用 engine/hooks/useModelConfig
// 示例：实际应根据 web 端全局状态或配置实现
import { useState } from 'react';
import { llms } from '@engine/utils/llms';

export function useModelConfig() {
  // 提供完整 ModelConfig 类型，避免类型报错
  const [config] = useState({
    temperature: 0.7,
    maxTokens: 2048,
    contextBalance: 0.5,
    systemPrompt: '',
    model: llms[0].userModel,
    multiToolsEnabled: false,
    enabledTools: []
  });
  return { config };
}
