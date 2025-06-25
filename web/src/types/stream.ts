// web/src/types/stream.ts
// web 层流式类型扩展（如有 UI 相关流式状态，可在此扩展）

export * from '@engine/types/stream';

// 例如：web 端 loading chunk、UI 进度等
export interface UILoadingChunk {
  type: 'loading';
  message: string;
  progress?: number;
}

// 你可以继续扩展 web 端特有的流式类型
