/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_DEEPSEEK_API_KEY: string
  // 在这里添加更多环境变量类型
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
