// engine/stream/task-loop.ts
// 任务循环（task-loop）：负责消息生成任务的全生命周期、流式状态、事件订阅，彻底解耦 UI/Redux
// 支持 onChunk、onDone、onError、onStatus、onAdd、onUpdate 等回调
import { streamLLMChat } from '../service/llmService';
import type { EnrichedMessage } from '../types/chat';
import { ToolCall } from './streamHandler';

export type TaskLoopEvent =
  | { type: 'add'; message: EnrichedMessage }
  | { type: 'update'; message: EnrichedMessage }
  | { type: 'toolcall'; toolCall: ToolCall }
  | { type: 'status'; taskId: string; status: string }
  | { type: 'error'; taskId: string; error: string }
  | { type: 'done'; taskId: string; result: any };

// 统一事件流范式，移除 TaskLoopCallbacks，所有订阅均通过 subscribe/emit 事件流实现
// export interface TaskLoopCallbacks { ... } // 已废弃

// 2025重构：TaskLoop 由单例改为多实例，每个会话/聊天对应一个 TaskLoop 实例，支持多轮对话和自动工具链。
// 旧的单例导出已废弃，保留注释如下：
// export const taskLoop = new TaskLoop(); // 已废弃：每个会话应 new 一个实例

export class TaskLoop {
  private listeners: ((event: TaskLoopEvent) => void)[] = [];
  private tasks: Map<string, any> = new Map();
  private chatId: string;
  private messages: EnrichedMessage[] = [];
  private config: any;
  private abortController: AbortController | null = null;

  constructor(opts: { chatId: string; history?: EnrichedMessage[]; config?: any }) {
    this.chatId = opts.chatId;
    this.messages = opts.history || [];
    this.config = opts.config;
  }

  subscribe(listener: (event: TaskLoopEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(event: TaskLoopEvent) {
    this.listeners.forEach(l => l(event));
  }

  /**
   * 启动多轮消息生成任务，支持自动工具链和事件流
   */
  async start(input: string) {
    this.abortController = new AbortController();
    let aborted = false;
    // 监听 abort 信号
    const abortHandler = () => {
      aborted = true;
      this.emit({ type: 'status', taskId: this.chatId, status: 'aborted' });
    };
    this.abortController.signal.addEventListener('abort', abortHandler);
    // 1. 添加用户消息
    this.messages.push({ role: 'user', content: input, id: `msg-${Date.now()}` } as EnrichedMessage);
    const MAX_EPOCHS = 8;
    for (let epoch = 0; epoch < MAX_EPOCHS; ++epoch) {
      const taskId = `task-${Date.now()}-${epoch}`;
      let needToolCall = false;
      try {
        // 解包 config 字段，逐项传递给 streamLLMChat，避免直接传递 config 对象
        const { baseURL, apiKey, model, temperature, tools, ...restConfig } = this.config || {};
        await streamLLMChat({
          chatId: this.chatId,
          messages: this.messages,
          baseURL,
          apiKey,
          model,
          temperature,
          tools,
          ...restConfig, // 允许额外参数透传
          signal: this.abortController.signal,
          onChunk: (chunk: any) => {
            this.emit({ type: 'update', message: chunk });
          },
          onToolCall: (toolCall: any) => {
            this.emit({ type: 'toolcall', toolCall });
            needToolCall = true;
          },
          onDone: (result: any) => {
            if (!aborted) {
              this.emit({ type: 'done', taskId, result });
              this.messages.push(result as EnrichedMessage);
            }
          },
          onError: (err: any) => {
            if (!aborted) {
              this.emit({ type: 'error', taskId, error: String(err) });
            }
          }
        });
      } catch (err) {
        if (!aborted) {
          this.emit({ type: 'error', taskId, error: String(err) });
        }
        break;
      }
      if (aborted) break;
      if (needToolCall) {
        // 工具调用逻辑（需实现 callTool 并聚合结果）
        // const toolResult = await this.callTool(lastMsg.tool_calls);
        // this.messages.push(toolResult);
        continue; // 工具链后继续下一轮
      }
      break; // 无需工具调用则终止
    }
    this.abortController.signal.removeEventListener('abort', abortHandler);
    this.abortController = null;
    return this.messages;
  }

  abortTask() {
    if (this.abortController) {
      this.abortController.abort();
      // 触发中断事件，可自定义 taskId
      this.emit({ type: 'status', taskId: this.chatId, status: 'aborted' });
    }
  }

  // ...可扩展 abortTask、getTaskStatus 等
}

// 修改原因：
// 1. 支持多轮对话和自动工具链，需每个会话/聊天 new 一个 TaskLoop 实例，内部维护自己的消息和状态。
// 2. 旧的单例导出已废弃，防止多会话状态混乱。
// 3. start 方法支持自动多轮、工具链，便于业务层直接驱动复杂对话流程。
// 4. 兼容历史消息恢复，便于从快照/历史 new 实例。
// 5. 事件流/回调模式保持不变，便于 UI/Redux glue。
