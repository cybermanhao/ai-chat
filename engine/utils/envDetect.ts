// 环境检测工具，供 glue 层/中间件统一引用

export type RuntimeMode = 'electron' | 'web-with-nodeserver' | 'web' | 'ssc';

export function detectRuntimeMode(): RuntimeMode {
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

export function isBrowser() {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

export function isNode() {
  return typeof process !== 'undefined' && typeof process.versions !== 'undefined' && !!process.versions.node;
}

export function isElectronMain() {
  return isElectron && isNode() && typeof process !== 'undefined' && (process as any).type === 'browser';
}

export function isElectronRenderer() {
  return isElectron && isBrowser() && typeof window !== 'undefined' && (window.process as any)?.type === 'renderer';
}
