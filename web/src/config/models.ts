import { config } from '@/config'

export interface ModelConfig {
  name: string
  label: string
  apiKey: string
  maxTokens?: number
}

const models: ModelConfig[] = [
  {
    name: 'deepseek-chat',
    label: 'DeepSeek Chat',
    apiKey: config.deepseekApiKey,
    maxTokens: 2000,
  },
]

export const defaultModel = models[0]
export const availableModels = models
