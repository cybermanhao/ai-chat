// engine/stream/streamAccumulator.ts
// 流式数据累积器，用于处理分片 tool calls
export interface ToolCallChunk {
  function?: {
    name?: string;
    arguments?: string;
  };
}

export interface ToolCallAccumulatorOptions {
  onFlush: (toolName: string, toolArgs: Record<string, unknown>) => Promise<void>;
}

export class ToolCallAccumulator {
  private chunks: ToolCallChunk[] = [];
  private options: ToolCallAccumulatorOptions;

  constructor(options: ToolCallAccumulatorOptions) {
    this.options = options;
  }

  addChunk(chunk: ToolCallChunk) {
    this.chunks.push(chunk);
  }

  async flushIfNeeded(finishReason?: string) {
    if (finishReason === 'tool_calls' || this.chunks.length > 0) {
      await this.flush();
    }
  }

  private async flush() {
    if (this.chunks.length === 0) return;

    // 合并所有 chunks 中的 function 信息
    let toolName = '';
    let toolArgs = '';

    for (const chunk of this.chunks) {
      if (chunk.function?.name) {
        toolName = chunk.function.name;
      }
      if (chunk.function?.arguments) {
        toolArgs += chunk.function.arguments;
      }
    }

    if (toolName) {
      try {
        const parsedArgs = toolArgs ? JSON.parse(toolArgs) : {};
        await this.options.onFlush(toolName, parsedArgs);
      } catch (error) {
        console.error('Failed to parse tool args:', error);
      }
    }

    this.reset();
  }

  reset() {
    this.chunks = [];
  }
} 