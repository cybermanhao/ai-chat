// engine/stream/task-loop.ts
// 任务循环（task-loop）：负责消息生成任务的全生命周期、流式状态、事件订阅，彻底解耦 UI/Redux
// 支持 onChunk、onDone、onError、onStatus、onAdd、onUpdate 等回调
import { streamLLMChat } from '../service/llmService';
import type { EnrichedMessage, IMessageCardStatus } from '../types/chat';
import type { ToolCall, EnhancedChunk } from './streamHandler';
import { generateUserMessageId } from '../utils/messageIdGenerator';
import { MCPService } from '../service/mcpService';

export type TaskLoopEvent =
  | { type: 'add'; message: EnrichedMessage; cardStatus?: IMessageCardStatus }
  | { type: 'update'; message: Partial<EnrichedMessage>; cardStatus?: IMessageCardStatus }
  | { type: 'toolcall'; toolCall: ToolCall; cardStatus?: IMessageCardStatus }
  | { type: 'toolresult'; toolCallId: string; result: string; error?: string; cardStatus?: IMessageCardStatus }
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
  private mcpService: MCPService | null = null;

  constructor(opts: { chatId: string; history?: EnrichedMessage[]; config?: any; mcpService?: MCPService }) {
    this.chatId = opts.chatId;
    // 深拷贝历史消息，完全避免 Redux immutable 中间件的干扰
    // 使用 Array.from + 深拷贝确保数组完全可变
    this.messages = opts.history ? Array.from(JSON.parse(JSON.stringify(opts.history))) : [];
    this.config = opts.config;
    this.mcpService = opts.mcpService || null; // 由外部注入 MCP 服务
    
    // 确保始终包含 system 消消息，这对工具调用很重要
    this.ensureSystemMessage();
    
    // 确保数组是可扩展的
    console.log('[TaskLoop] Constructor - Array extensible:', Object.isExtensible(this.messages));
    console.log('[TaskLoop] Constructor - messages length:', this.messages.length);
    console.log('[TaskLoop] Constructor - MCP 服务注入状态:', this.mcpService ? '已注入' : '未注入');
    if (this.mcpService) {
      console.log('[TaskLoop] Constructor - MCP 服务实例存在，工具调用功能可用');
    } else {
      console.log('[TaskLoop] Constructor - MCP 服务未注入，工具调用功能不可用');
    }
  }

  /**
   * 确保消息数组中包含 system 消息
   * 许多 LLM（包括 Deepseek）需要 system 消息来正确处理工具调用
   */
  private ensureSystemMessage() {
    // 检查是否已经有 system 消息
    const hasSystemMessage = this.messages.some(msg => msg.role === 'system');
    
    if (!hasSystemMessage) {
      // 添加空的 system 消息到数组开头
      const systemMessage: EnrichedMessage = {
        role: 'system',
        content: '',
        id: generateUserMessageId(),
        timestamp: Date.now()
      };
      
      this.messages.unshift(systemMessage);
      console.log('[TaskLoop] 添加了 system 消息以支持工具调用');
    }
  }

  /**
   * 清理无效的消息，特别是空的助手消息
   */
  private cleanupInvalidMessages() {
    const originalLength = this.messages.length;
    
    // 过滤掉无效的助手消息（既没有 content 也没有 tool_calls）
    this.messages = this.messages.filter(msg => {
      if (msg.role === 'assistant') {
        const hasContent = !!msg.content && msg.content.trim().length > 0;
        const hasToolCalls = 'tool_calls' in msg && !!(msg as any).tool_calls && (msg as any).tool_calls.length > 0;
        
        if (!hasContent && !hasToolCalls) {
          console.log('[TaskLoop] 清理无效的助手消息:', msg);
          return false; // 过滤掉这条消息
        }
      }
      return true; // 保留这条消息
    });
    
    if (this.messages.length !== originalLength) {
      console.log(`[TaskLoop] 清理了 ${originalLength - this.messages.length} 条无效消息`);
    }
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
      
      // 在每轮开始前清理无效的消息
      this.cleanupInvalidMessages();
      
      try {
        // 发出状态事件：连接中（初始状态）
        this.emit({ type: 'status', taskId, status: 'connecting', cardStatus: 'connecting' });
        
        // 解包 config 字段，逐项传递给 streamLLMChat，避免直接传递 config 对象
        const { baseURL, apiKey, model, temperature, tools, parallelToolCalls, ...restConfig } = this.config || {};
        
        console.log('[TaskLoop] 解包的配置参数:');
        console.log('[TaskLoop] baseURL:', baseURL);
        console.log('[TaskLoop] model:', model);
        console.log('[TaskLoop] temperature:', temperature);
        console.log('[TaskLoop] tools:', tools?.length || 0, '个');
        console.log('[TaskLoop] parallelToolCalls:', parallelToolCalls);
        console.log('[TaskLoop] restConfig:', restConfig);
        
        await streamLLMChat({
          chatId: this.chatId,
          messages: this.messages,
          baseURL,
          apiKey,
          model,
          temperature,
          tools,
          parallelToolCalls, // 明确传递这个参数
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
            // console.log('[TaskLoop] 发送 update 事件:', {
            //   content_length: chunk.content?.length || 0,
            //   reasoning_content_length: chunk.reasoning_content?.length || 0,
            //   phase: chunk.phase,
            //   role: chunk.role
            // });
            this.emit({ type: 'update', message: chunk, cardStatus });
          },
          onToolCall: (toolCall: any) => {
            console.log('[TaskLoop] ============ onToolCall 被触发! ============');
            console.log('[TaskLoop] 工具调用详情:', JSON.stringify(toolCall, null, 2));
            this.emit({ type: 'toolcall', toolCall, cardStatus: 'tool_calling' });
            needToolCall = true;
            console.log('[TaskLoop] 设置 needToolCall = true');
          },
          onDone: (result: any) => {
            if (!aborted) {
              this.emit({ type: 'done', taskId, result, cardStatus: 'stable' });
              
              // 不再在这里添加 assistant 消息，因为消息已经在 update 事件中创建和更新了
              // 只需要确保 result 被添加到本地消息历史中用于后续的工具调用轮次
              const assistantMessage = result as EnrichedMessage;
              if (assistantMessage && 
                  assistantMessage.role === 'assistant' && 
                  (assistantMessage.content || ('tool_calls' in assistantMessage && assistantMessage.tool_calls))) {
                
                // 安全地添加助手消息到本地历史
                if (!Object.isExtensible(this.messages)) {
                  console.log('[TaskLoop] Array not extensible for assistant message, creating new array');
                  this.messages = [...this.messages, assistantMessage];
                } else {
                  this.messages.push(assistantMessage);
                }
                console.log('[TaskLoop] 添加助手消息到本地历史:', {
                  role: assistantMessage.role,
                  has_content: !!assistantMessage.content,
                  has_tool_calls: !!(assistantMessage as any).tool_calls,
                  content_length: assistantMessage.content?.length || 0
                });
              } else {
                console.warn('[TaskLoop] 跳过无效的助手消息:', assistantMessage);
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
      
      console.log('[TaskLoop] ========== Epoch', epoch, '完成 ==========');
      console.log('[TaskLoop] needToolCall:', needToolCall);
      console.log('[TaskLoop] mcpService exists:', !!this.mcpService);
      console.log('[TaskLoop] 当前消息历史长度:', this.messages.length);
      console.log('[TaskLoop] 最后一条消息:', this.messages[this.messages.length - 1]);
      
      if (needToolCall) {
        console.log('[TaskLoop] ========== 进入工具调用分支 ==========');
        
        // 自动工具链调用逻辑
        if (!this.mcpService) {
          console.warn('[TaskLoop] 需要工具调用但 MCP 服务未注入，跳过工具调用');
          break;
        }
        
        console.log('[TaskLoop] MCP 服务存在，继续处理工具调用');
        
        // 获取最后一条助手消息中的工具调用
        const lastMessage = this.messages[this.messages.length - 1];
        console.log('[TaskLoop] 检查最后一条消息，角色:', lastMessage.role);
        console.log('[TaskLoop] 消息是否有 tool_calls 属性:', 'tool_calls' in lastMessage);
        console.log('[TaskLoop] tool_calls 内容:', (lastMessage as any).tool_calls);
        
        if (lastMessage.role !== 'assistant' || !('tool_calls' in lastMessage) || !lastMessage.tool_calls) {
          console.warn('[TaskLoop] 最后一条消息不包含工具调用，跳过');
          console.warn('[TaskLoop] - role:', lastMessage.role);
          console.warn('[TaskLoop] - has tool_calls property:', 'tool_calls' in lastMessage);
          console.warn('[TaskLoop] - tool_calls value:', (lastMessage as any).tool_calls);
          break;
        }
        
        console.log('[TaskLoop] 检测到助手消息包含工具调用:', lastMessage.tool_calls.length, '个');
        console.log('[TaskLoop] 工具调用详情:', JSON.stringify(lastMessage.tool_calls, null, 2));
        
        // 验证每个工具调用都有有效的 ID
        let hasValidIds = true;
        for (const toolCall of lastMessage.tool_calls) {
          if (!toolCall.id) {
            console.error('[TaskLoop] 工具调用缺少 ID:', toolCall);
            hasValidIds = false;
          }
        }
        
        if (!hasValidIds) {
          console.error('[TaskLoop] 某些工具调用缺少 ID，这会导致 OpenAI API 错误');
          break;
        }
        
        // 处理每个工具调用
        try {
          console.log('[TaskLoop] ========== 开始处理工具调用 ==========');
          
          const toolCallPromises = lastMessage.tool_calls.map(async (toolCall: any) => {
            console.log('[TaskLoop] 处理单个工具调用:', JSON.stringify(toolCall, null, 2));
            
            if (!toolCall.function?.name) {
              console.warn('[TaskLoop] 工具调用缺少函数名:', toolCall);
              return null;
            }
            
            let args = {};
            try {
              // 检查 arguments 是否为空字符串或无效 JSON
              const argsStr = toolCall.function.arguments?.trim();
              console.log('[TaskLoop] 原始 arguments 字符串:', JSON.stringify(argsStr));
              
              if (argsStr && argsStr !== '') {
                args = JSON.parse(argsStr);
                console.log('[TaskLoop] 解析后的参数:', JSON.stringify(args));
              } else {
                console.log('[TaskLoop] 工具调用参数为空，使用默认空对象');
                args = {};
              }
            } catch (e) {
              console.warn('[TaskLoop] 工具调用参数解析失败:', toolCall.function.arguments, 'error:', e);
              args = {};
            }
            
            console.log(`[TaskLoop] 即将调用工具: ${toolCall.function.name}`, args);
            
            try {
              const result = await this.mcpService!.callTool(toolCall.function.name, args);
              console.log('[TaskLoop] 工具调用结果:', JSON.stringify(result, null, 2));
              
              // 构造工具结果消息
              const toolMessage: EnrichedMessage = {
                role: 'tool',
                content: result.error ? `错误: ${result.error}` : JSON.stringify(result.data),
                tool_call_id: toolCall.id || `tool_${Date.now()}`,
                id: generateUserMessageId(),
                timestamp: Date.now(),
                toolName: toolCall.function.name, // 添加工具名称
                toolArguments: toolCall.function.arguments || '{}' // 添加工具调用参数
              };
              
              console.log('[TaskLoop] 构造的工具响应消息:', JSON.stringify(toolMessage, null, 2));
              console.log('[TaskLoop] 对应的工具调用 ID:', toolCall.id, '-> tool_call_id:', (toolMessage as any).tool_call_id);
              
              return toolMessage;
            } catch (toolError) {
              console.error('[TaskLoop] 工具调用执行失败:', toolError);
              
              // 即使工具调用失败，也要返回错误消息
              const errorMessage: EnrichedMessage = {
                role: 'tool',
                content: `工具调用失败: ${String(toolError)}`,
                tool_call_id: toolCall.id || `tool_${Date.now()}`,
                id: generateUserMessageId(),
                timestamp: Date.now(),
                toolName: toolCall.function.name, // 添加工具名称
                toolArguments: toolCall.function.arguments || '{}' // 添加工具调用参数
              };
              
              console.log('[TaskLoop] 构造的错误响应消息:', JSON.stringify(errorMessage, null, 2));
              return errorMessage;
            }
          });
          
          console.log('[TaskLoop] 等待所有工具调用完成...');
          // 等待所有工具调用完成
          const toolResults = await Promise.all(toolCallPromises);
          const validToolResults = toolResults.filter(result => result !== null) as EnrichedMessage[];
          
          console.log('[TaskLoop] 工具调用完成，有效结果:', validToolResults.length, '个');
          
          // 将工具结果添加到消息流
          for (const toolResult of validToolResults) {
            console.log('[TaskLoop] 添加工具结果到消息历史:', JSON.stringify({
              role: toolResult.role,
              tool_call_id: (toolResult as any).tool_call_id, // 类型断言，因为这里的 toolResult 一定是 ToolMessage
              content_length: toolResult.content?.length || 0
            }));
            
            if (!Object.isExtensible(this.messages)) {
              console.log('[TaskLoop] Array not extensible for tool result, creating new array');
              this.messages = [...this.messages, toolResult];
            } else {
              this.messages.push(toolResult);
            }
            
            // 发出工具结果事件
            this.emit({ type: 'add', message: toolResult, cardStatus: 'stable' });
            
            // 发出工具调用完成事件，用于更新工具调用状态
            const toolCallId = (toolResult as any).tool_call_id;
            if (toolCallId) {
              this.emit({ 
                type: 'toolresult', 
                toolCallId, 
                result: toolResult.content || '', 
                error: toolResult.content?.includes('错误:') ? toolResult.content : undefined,
                cardStatus: 'stable' 
              });
            }
          }
          
          console.log(`[TaskLoop] 完成 ${validToolResults.length} 个工具调用，消息历史长度:`, this.messages.length);
          console.log('[TaskLoop] 当前消息历史最后3条:', this.messages.slice(-3).map(msg => ({
            role: msg.role,
            has_tool_calls: !!(msg as any).tool_calls,
            tool_call_id: (msg as any).tool_call_id,
            content_preview: msg.content?.substring(0, 50) + '...'
          })));
          
        } catch (error) {
          console.error('[TaskLoop] 工具调用过程中出错:', error);
          this.emit({ type: 'error', taskId, error: `工具调用失败: ${error}`, cardStatus: 'stable' });
          break;
        }
        
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
