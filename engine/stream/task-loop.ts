// engine/stream/task-loop.ts
// 任务循环（task-loop）：负责消息生成任务的全生命周期、流式状态、事件订阅，彻底解耦 UI/Redux
// 支持 onChunk、onDone、onError、onStatus、onAdd、onUpdate 等回调
import { streamLLMChat } from '../service/llmService';
import type { EnrichedMessage, IMessageCardStatus } from '../types/chat';
import type { ToolCall, EnhancedChunk } from './streamHandler';
import { generateUserMessageId } from '../utils/messageIdGenerator';

export type TaskLoopEvent =
  | { type: 'add'; message: EnrichedMessage; cardStatus?: IMessageCardStatus }
  | { type: 'update'; message: Partial<EnrichedMessage>; cardStatus?: IMessageCardStatus }
  | { type: 'toolcall'; toolCall: ToolCall; cardStatus?: IMessageCardStatus }
  | { type: 'status'; taskId: string; status: string; cardStatus?: IMessageCardStatus }
  | { type: 'error'; taskId: string; error: string; cardStatus?: IMessageCardStatus }
  | { type: 'done'; taskId: string; result: any; cardStatus?: IMessageCardStatus };

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
    // 深拷贝历史消息，完全避免 Redux immutable 中间件的干扰
    // 使用 Array.from + 深拷贝确保数组完全可变
    this.messages = opts.history ? Array.from(JSON.parse(JSON.stringify(opts.history))) : [];
    this.config = opts.config;
    
    // 确保数组是可扩展的
    console.log('[TaskLoop] Constructor - Array extensible:', Object.isExtensible(this.messages));
    console.log('[TaskLoop] Constructor - messages length:', this.messages.length);
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
      this.emit({ type: 'status', taskId: this.chatId, status: 'aborted', cardStatus: 'stable' });
    };
    this.abortController.signal.addEventListener('abort', abortHandler);
    // 1. 添加用户消息
    console.log('[TaskLoop] About to push user message, messages array:', this.messages);
    console.log('[TaskLoop] Array extensible:', Object.isExtensible(this.messages));
    
    const userMessage: EnrichedMessage = { 
      role: 'user', 
      content: input, 
      id: generateUserMessageId(), 
      timestamp: Date.now() 
    };
    
    // 安全地添加消息：如果数组不可扩展，创建新数组
    if (!Object.isExtensible(this.messages)) {
      console.log('[TaskLoop] Array not extensible, creating new array');
      this.messages = [...this.messages, userMessage];
    } else {
      this.messages.push(userMessage);
    }
    console.log('[TaskLoop] Successfully added user message');
    const MAX_EPOCHS = 8;
    for (let epoch = 0; epoch < MAX_EPOCHS; ++epoch) {
      const taskId = `task-${Date.now()}-${epoch}`;
      let needToolCall = false;
      try {
        // 发出状态事件：连接中（初始状态）
        this.emit({ type: 'status', taskId, status: 'connecting', cardStatus: 'connecting' });
        
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
          assistantMessageId: this.config.assistantMessageId, // 传递固定的 assistant 消息 ID
          onChunk: (chunk: EnhancedChunk) => {
            // 使用 StreamHandler 提供的 phase 信息来更新状态
            let cardStatus: IMessageCardStatus = 'stable';
            let statusText = '';
            
            switch (chunk.phase) {
              case 'connecting':
                cardStatus = 'connecting';
                statusText = 'connecting';
                break;
              case 'thinking':
                cardStatus = 'thinking';
                statusText = 'thinking';
                break;
              case 'generating':
                cardStatus = 'generating';
                statusText = 'generating';
                break;
              case 'tool_calling':
                cardStatus = 'tool_calling';
                statusText = 'tool_calling';
                break;
            }
            
            // 发出状态更新事件
            this.emit({ type: 'status', taskId, status: statusText, cardStatus });
            
            // 发出内容更新事件
            console.log('[TaskLoop] 发送 update 事件:', {
              content_length: chunk.content?.length || 0,
              reasoning_content_length: chunk.reasoning_content?.length || 0,
              phase: chunk.phase,
              role: chunk.role
            });
            this.emit({ type: 'update', message: chunk, cardStatus });
          },
          onToolCall: (toolCall: any) => {
            this.emit({ type: 'toolcall', toolCall, cardStatus: 'tool_calling' });
            needToolCall = true;
          },
          onDone: (result: any) => {
            if (!aborted) {
              this.emit({ type: 'done', taskId, result, cardStatus: 'stable' });
              // 安全地添加助手消息
              if (!Object.isExtensible(this.messages)) {
                console.log('[TaskLoop] Array not extensible for assistant message, creating new array');
                this.messages = [...this.messages, result as EnrichedMessage];
              } else {
                this.messages.push(result as EnrichedMessage);
              }
            }
          },
          onError: (err: any) => {
            if (!aborted) {
              this.emit({ type: 'error', taskId, error: String(err), cardStatus: 'stable' });
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
