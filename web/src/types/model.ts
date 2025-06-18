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

export interface ModelConfigState {
  config: ModelConfig;
  loading: ModelConfigLoading;
  setConfig: (config: Partial<ModelConfig> | ((prev: ModelConfig) => Partial<ModelConfig>)) => void;
  setLoading: (key: ModelLoadingKey, value: boolean) => void;
  reset: () => void;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UseModelConfigActionsResult {
  updateTemperature: (value: number) => Promise<ApiResponse>;
  updateContextBalance: (value: number) => Promise<ApiResponse>;
  updateSystemPrompt: (value: string) => Promise<ApiResponse>;
  toggleMultiTools: (enabled: boolean) => Promise<ApiResponse>;
  toggleTool: (toolId: string, enabled: boolean) => Promise<ApiResponse>;
}

export interface UseModelConfigActionsOptions {
  onLoading: (key: ModelLoadingKey, loading: boolean) => void;
  onUpdate: (update: Partial<ModelConfig> | ((prev: ModelConfig) => Partial<ModelConfig>)) => void;
}

export interface UseModelSelectionResult {
  selectedLLM: string | null;
  selectedModel: string;
  modelConfig: ModelConfig & { systemPrompt: string };
  loading: ModelConfigLoading;
  handleModelChange: (model: string) => void;
  handleLLMChange: (llmId: string) => void;
  handleTemperatureChange: (value: number) => Promise<void>;
  handleContextBalanceChange: (value: number) => Promise<void>;
  handleSystemPromptChange: (value: string) => Promise<void>;
  handleMultiToolsToggle: (enabled: boolean) => Promise<void>;
  handleToolToggle: (toolId: string, enabled: boolean) => Promise<void>;
}
