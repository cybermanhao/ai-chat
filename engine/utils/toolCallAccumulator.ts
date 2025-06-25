// engine/utils/toolCallAccumulator.ts
// 负责 LLM tool_call 分片累加与 flush，适用于 OpenAI/DeepSeek 等协议

export interface ToolCallAccumulatorOptions {
  onFlush: (toolName: string, toolArgs: Record<string, unknown>) => Promise<void>;
}

export class ToolCallAccumulator {
  private cache = new Map<string, { args: string; name: string }>();
  private onFlush: ToolCallAccumulatorOptions['onFlush'];

  constructor(options: ToolCallAccumulatorOptions) {
    this.onFlush = options.onFlush;
  }

  addChunk(toolCalls: any[] | undefined) {
    if (!Array.isArray(toolCalls)) return;
    for (const call of toolCalls) {
      const callId = call.id || call.function?.name || 'default';
      const argDelta = call.function?.arguments || '';
      const toolName = call.function?.name || callId;
      if (!this.cache.has(callId) && argDelta.trim().startsWith('{')) {
        this.cache.set(callId, { args: '', name: toolName });
      }
      const prev = this.cache.get(callId) || { args: '', name: toolName };
      this.cache.set(callId, { args: prev.args + argDelta, name: toolName });
    }
  }

  async flushIfNeeded(finishReason: string | undefined) {
    if (finishReason !== 'tool_calls') return;
    for (const [pendingCallId, { args: fullArgs, name: toolName }] of this.cache.entries()) {
      let toolArgs: Record<string, unknown> = {};
      try {
        toolArgs = JSON.parse(fullArgs);
      } catch {}
      if (toolName) {
        await this.onFlush(toolName, toolArgs);
      }
      this.cache.delete(pendingCallId);
    }
  }

  reset() {
    this.cache.clear();
  }
}
