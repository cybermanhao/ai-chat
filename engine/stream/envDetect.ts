// 环境检测工具，供 glue 层/中间件统一引用

export function detectRuntimeMode(): 'electron' | 'web-with-nodeserver' | 'web' | 'ssc' {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return 'electron';
  }
  if (typeof window !== 'undefined' && (window as any).NODE_SERVER_API) {
    return 'web-with-nodeserver';
  }
  if (typeof process !== 'undefined' && process.env.SSC_MODE === 'true') {
    return 'ssc';
  }
  return 'web';
}

export const isElectron = detectRuntimeMode() === 'electron';
export const isNodeServer = detectRuntimeMode() === 'web-with-nodeserver';
export const isWeb = detectRuntimeMode() === 'web';
export const isSSC = detectRuntimeMode() === 'ssc';

export type RuntimeMode = 'electron' | 'web-with-nodeserver' | 'web' | 'ssc';

export function getEnvInfo() {
  return {
    mode: detectRuntimeMode(),
    isElectron,
    isNodeServer,
    isWeb,
    isSSC,
    platform: typeof process !== 'undefined' ? process.platform : undefined,
    nodeVersion: typeof process !== 'undefined' ? process.version : undefined,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    env: typeof process !== 'undefined' ? process.env : undefined,
  };
}
