// 单个聊天会话对象，管理消息、流、订阅与状态
// 继承自 engine/ChatSession，扩展 web 端 UI 订阅等
import { ChatSession } from '@engine/ChatSession';
import type { LLMService } from '@engine/service/llmService';

export class WebChatSession extends ChatSession {
  /**
   * listeners 用于订阅 WebChatSession 状态变化的回调函数数组。
   * 例如 UI 组件可以通过 subscribe 注册回调，实现响应式刷新。
   */
  private listeners: (() => void)[] = [];

  constructor(opts?: { llmService?: LLMService }) {
    super(opts);
  }

  /**
   * 订阅 WebChatSession 状态变化。
   * @param listener 回调函数，状态变化时会被调用
   * @returns 取消订阅的函数
   */
  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 通知所有已注册的 listener 状态发生变化。
   * 例如消息变更、流式状态变更等时调用。
   */
  private notify() {
    this.listeners.forEach(l => l());
  }

  // 重载 handleSend 以在状态变更时通知 UI
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
        const chunkIter = (this as any).parseLLMStream ? (this as any).parseLLMStream(stream) : undefined;
        if (chunkIter) {
          await (this as any).consumeLLMStream(chunkIter, (chunk: any) => {
            if (!this.isGenerating) return;
            this.appendAssistantChunk(chunk.content);
            this.notify();
          });
        } else {
          await super.handleSend(input);
          this.notify();
        }
      } else {
        await this.mockStreamResponse();
        this.notify();
      }
    } catch (e: any) {
      this.error = e.message || 'LLM error';
      this.notify();
    } finally {
      this.isGenerating = false;
      this.notify();
    }
  }

  // 重载 appendAssistantChunk 以在内容变更时通知 UI
  protected appendAssistantChunk(chunk: string) {
    super.appendAssistantChunk(chunk);
    this.notify();
  }

  handleStop() {
    super.handleStop();
    this.notify();
  }

  save() {
    // 保存到本地/远端
    // ...
  }
}
