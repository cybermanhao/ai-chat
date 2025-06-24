// ...existing code from web/src/types/model.ts...

export interface ModelConfig {
  temperature: number;
  maxTokens: number;
  contextBalance: number;
  systemPrompt: string;
  multiToolsEnabled: boolean;
  enabledTools: string[];
}

export type ModelLoadingKey = 'temperature' | 'contextBalance' | 'systemPrompt' | 'multiTools' | 'enabledTools';

// ...existing code from web/src/types/model.ts...
