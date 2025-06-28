// electron/webview-glue.ts
// Electron 端专用 postMessage glue 架构预留

export interface ElectronPostMessageble {
  postMessage: (msg: any) => void;
}

export interface ElectronLLMStreamGlueOptions {
  webview: ElectronPostMessageble;
}

/**
 * Electron 端 LLM 流式 glue 工厂（仅留接口和注释，防止报错）
 */
export function createElectronWebviewGlue(options: ElectronLLMStreamGlueOptions) {
  // TODO: 实现 Electron webview glue，onChunk/onDone/onAbort glue 到主进程/渲染进程
  return {
    onChunk: (_chunk: any) => {},
    onDone: (_result: any) => {},
    onAbort: () => {}
  };
} 