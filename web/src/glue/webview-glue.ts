// webview-glue.ts
// 多端 postMessage glue 封装，适配 Electron/web/iframe 等

export interface PostMessageble {
  postMessage: (msg: any) => void;
}

export interface LLMStreamGlueOptions {
  webview: PostMessageble;
}

/**
 * 将 LLM 流式 onChunk/onDone glue 到 UI（如 Electron webview、window、iframe 等）
 * @param options webview 实例等
 * @returns { onChunk, onDone } 供 streamManager/llmService glue
 */
export function createWebviewLLMGlue(options: LLMStreamGlueOptions) {
  const { webview } = options;
  return {
    onChunk: (chunk: any) => {
      webview.postMessage({
        command: 'llm/chat/completions/chunk',
        data: { code: 200, msg: { chunk } }
      });
    },
    onDone: (result: any) => {
      webview.postMessage({
        command: 'llm/chat/completions/done',
        data: { code: 200, msg: { success: true, stage: 'done', result } }
      });
    },
    onAbort: () => {
      webview.postMessage({
        command: 'llm/chat/completions/aborted',
        data: { code: 200, msg: { success: true, stage: 'abort' } }
      });
    }
  };
}

// 业务层只需 glue onChunk/onDone 到此 glue，无需关心多端细节 