// 单个聊天会话对象，管理消息、流、订阅与状态
// 供 UI 直接交互，已迁移至 web/src/chat
import type { ChatMessage } from '@engine/types/chat';
import type { LLMService } from '@engine/service/llmService';
import { parseLLMStream, consumeLLMStream } from './streamHandler';
import type { StreamChunk } from '@/types/stream';
import { ToolCallAccumulator } from '@engine/utils/toolCallAccumulator';

export class WebChatSession {
  private messages: ChatMessage[] = [];
  private isGenerating = false;
  private error: string | null = null;
  private listeners: (() => void)[] = [];
  private llmService: LLMService | null = null;
  private toolCallAccumulator: ToolCallAccumulator;

  constructor(opts?: { llmService?: LLMService }) {
    if (opts?.llmService) this.llmService = opts.llmService;
    this.toolCallAccumulator = new ToolCallAccumulator({
      onFlush: async (toolName, toolArgs) => {
        await this.handleToolCall(toolName, toolArgs);
      },
    });
  }

  getMessages() {
    return this.messages;
  }

  getIsGenerating() {
    return this.isGenerating;
  }

  getError() {
    return this.error;
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  async handleSend(input: string) {
    this.isGenerating = true;
    this.error = null;
    this.messages.push({
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    });
    this.notify();
    try {
      if (this.llmService) {
        const stream = await this.llmService.createChatStream(input);
        const chunkIter = parseLLMStream(stream);
        await consumeLLMStream(chunkIter, async (chunk: StreamChunk) => {
          if (!this.isGenerating) return;
          this.appendAssistantChunk(chunk.content);
          // --- tool_call 处理逻辑迁移 ---
          this.toolCallAccumulator.addChunk((chunk as any).tool_calls);
          // 兼容单次 tool_content（如非分片 function call）
          if (
            chunk.tool_content &&
            typeof chunk.tool_content === 'object' &&
            (chunk.tool_content as any).name
          ) {
            const toolContent = chunk.tool_content as any;
            const toolName = toolContent.name;
            let toolArgs: Record<string, unknown> = {};
            try {
              toolArgs = toolContent.arguments ? JSON.parse(toolContent.arguments) : {};
            } catch {}
            await this.handleToolCall(toolName, toolArgs);
          }
          // 检查 finish_reason，flush tool_calls
          const finishReason = ((chunk as any).choices?.[0]?.finish_reason)
            || ((chunk as any).finish_reason);
          await this.toolCallAccumulator.flushIfNeeded(finishReason);
        });
      } else {
        await this.mockStreamResponse();
      }
    } catch (e: any) {
      this.error = e.message || 'LLM error';
    } finally {
      this.isGenerating = false;
      this.toolCallAccumulator.reset();
      this.notify();
    }
  }

  private appendAssistantChunk(chunk: string) {
    let last = this.messages[this.messages.length - 1];
    if (!last || last.role !== 'assistant') {
      last = {
        id: Date.now().toString() + '-assistant',
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      this.messages.push(last);
    }
    last.content += chunk;
    this.notify();
  }

  // tool_call 实际处理逻辑（可根据业务扩展）
  private async handleToolCall(toolName: string, toolArgs: Record<string, unknown>) {
    // TODO: 实现 tool call 的业务逻辑
    // 例如：this.messages.push({ ... }) 或调用外部服务
    // 这里只做日志输出
    console.log('Tool call:', toolName, toolArgs);
  }

  handleStop() {
    this.isGenerating = false;
    this.notify();
  }

  private async mockStreamResponse() {
    const id = Date.now().toString() + '-assistant';
    this.messages.push({
      id,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    });
    this.notify();
    for (let i = 0; i < 5; i++) {
      if (!this.isGenerating) break;
      await new Promise(res => setTimeout(res, 400));
      this.messages[this.messages.length - 1].content += '流片段' + (i + 1) + ' ';
      this.notify();
    }
  }

  save() {
    // 保存到本地/远端
    // ...
  }
}
