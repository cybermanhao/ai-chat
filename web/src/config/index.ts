// API 配置
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
export const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY

// 你可以在这里添加更多配置项
export const config = {
  api: {
    baseURL: API_BASE_URL,
  },
  deepseekApiKey: DEEPSEEK_API_KEY,
  defaultModelName: 'deepseek-chat' as const,
} as const
