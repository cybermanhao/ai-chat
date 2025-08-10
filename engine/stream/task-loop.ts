// engine/stream/task-loop.ts
// 任务循环（task-loop）：负责消息生成任务的全生命周期、流式状态、事件订阅，彻底解耦 UI/Redux
// 支持 onChunk、onDone、onError、onStatus、onAdd、onUpdate 等回调
// TaskLoop：负责管理一个聊天会话的消息流、工具链自动推理、事件分发等核心逻辑
// 用法说明：
// 1. 每个聊天会话建议 new 一个 TaskLoop 实例，传入 chatId、历史消息、配置、mcpClient。
// 2. 每次用户输入时，调用 taskLoop.start(input)，自动处理大模型推理和工具调用链。
// 3. 内部通过 epoch 轮次自动处理工具调用，直到本次输入的推理链全部完成。
// 4. 支持事件订阅（subscribe），可监听 add/update/toolcall/toolresult/status/error/done 等事件。
// 5. 完全解耦 UI/Redux，业务层只需订阅事件和调用 start/abortTask。
// 6. 消息历史自动维护，支持多轮工具链和流式推理。
// 7. 工具调用由 mcpClient 注入，支持多端 glue。
// 8. 兼容 system 消息、历史恢复、异常处理等场景。
//
// 典型流程：
// - 用户输入 -> start(input)
// - 大模型推理（streamLLMChat）
// - 检测到工具调用 -> 处理工具调用 -> 工具结果加入消息流
// - 自动进入下一轮 epoch，继续推理，直到无工具调用或达到最大轮数
// - 事件流通知 UI 层更新
//
// 设计目标：最大化业务逻辑复用，彻底解耦 glue/adapter 层，支持 Web/Electron/SSC 多端。
//
// 详细事件流机制、工具链自动化、异常处理等见相关文档和注释。
// import { streamLLMChat } from '../service/llmService'; // 未使用
import type { EnrichedMessage, IMessageCardStatus } from '../types/chat';
import type { ToolCall } from './streamHandler';
import { generateUserMessageId } from '../utils/messageIdGenerator';
import { MCPClient } from '../service/mcpClient';
import { MessageBridgeV2, type MessageBridgeOptions } from '../service/messageBridgeV2';
import { createMessageBridge } from '../service/messageBridgeFactoryV2';

// 增量消息更新类型，支持 delta 字段
export interface IncrementalMessage {
  role?: string;
  content?: string;
  reasoning_content?: string;
  tool_calls?: any[];
  content_delta?: string;
  reasoning_delta?: string;
}

export type TaskLoopEvent =
  | { type: 'add'; message: EnrichedMessage; cardStatus?: IMessageCardStatus }
  | { type: 'update'; message: IncrementalMessage; cardStatus?: IMessageCardStatus }
  | { type: 'toolcall'; toolCall: ToolCall; cardStatus?: IMessageCardStatus }
  | { type: 'toolresult'; toolCallId: string; result: string; error?: string; cardStatus?: IMessageCardStatus }
  | { type: 'status'; taskId: string; status: string; cardStatus?: IMessageCardStatus }
  | { type: 'error'; taskId: string; error: string; cardStatus?: IMessageCardStatus }
  | { type: 'done'; taskId: string; result: any; tool_calls?: ToolCall[]; cardStatus?: IMessageCardStatus };

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
  private mcpClient: MCPClient | null = null;
  // engine 层如需 messageBridge 实例，可在此创建（参数可为 null 或 TODO 注释，实际 glue 由 web 层注入）
  private messageBridge: MessageBridgeV2;

  constructor(opts: { chatId: string; history?: EnrichedMessage[]; config?: any; mcpClient?: MCPClient; messageBridgeOptions?: MessageBridgeOptions }) {
    this.chatId = opts.chatId;
    // 深拷贝历史消息，完全避免 Redux immutable 中间件的干扰
    // 使用 Array.from + 深拷贝确保数组完全可变
    this.messages = opts.history ? Array.from(JSON.parse(JSON.stringify(opts.history))) : [];
    this.config = opts.config;
    this.mcpClient = opts.mcpClient || null;
    // 自动检测环境并创建适配的 messageBridge 实例
    this.messageBridge = createMessageBridge({ 
      mcpClient: this.mcpClient, 
      llmService: null,
      // env 将由 createMessageBridge 自动检测
    });

    // 确保始终包含 system 消消息，这对工具调用很重要
    this.ensureSystemMessage();
    
    // 确保数组是可扩展的
    console.log('[TaskLoop] Constructor - Array extensible:', Object.isExtensible(this.messages));
    console.log('[TaskLoop] Constructor - messages length:', this.messages.length);
    console.log('[TaskLoop] Constructor - MCP 服务注入状态:', this.mcpClient ? '已注入' : '未注入');
    if (this.mcpClient) {
      console.log('[TaskLoop] Constructor - MCP 服务实例存在，工具调用功能可用');
    } else {
      console.log('[TaskLoop] Constructor - MCP 服务未注入，工具调用功能不可用');
    }
  }

  /**
   * 通过MessageBridge调用工具（支持多端适配）
   * 框架无关设计：不依赖Redux等特定状态管理
   */
  private async callToolViaMessageBridge(toolName: string, args: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      // 生成唯一的调用ID，避免并发冲突
      const callId = `${toolName}-${Date.now()}-${Math.random()}`;
      
      // 框架无关的工具调用：使用'auto'让MessageBridge自动选择第一个可用服务器
      // Web环境：MessageBridge会使用注入的mcpClientManager的第一个可用服务
      // Electron环境：MessageBridge会通过IPC转发到主进程处理
      this.messageBridge.send('message/mcp/call-tool', { 
        serverId: 'auto', // 让MessageBridge自动选择，保持框架无关
        toolName, 
        args,
        callId // 用于匹配响应
      });
      
      // 监听工具调用结果（使用callId精确匹配）
      const onToolResult = (payload: any) => {
        if (payload.callId === callId || payload.toolName === toolName) {
          this.messageBridge.off('toolresult', onToolResult);
          this.messageBridge.off('error', onError);
          resolve({ data: payload.result, error: null });
        }
      };
      
      const onError = (payload: any) => {
        if (payload.callId === callId || payload.toolName === toolName) {
          this.messageBridge.off('toolresult', onToolResult);
          this.messageBridge.off('error', onError);
          resolve({ data: null, error: payload.error });
        }
      };
      
      this.messageBridge.on('toolresult', onToolResult);
      this.messageBridge.on('error', onError);
      
      // 设置超时（Vue/React等框架都能使用）
      setTimeout(() => {
        this.messageBridge.off('toolresult', onToolResult);
        this.messageBridge.off('error', onError);
        reject(new Error('工具调用超时'));
      }, 30000);
    });
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
    
    // 按照架构设计：TaskLoop管理消息创建，发出用户消息事件
    this.emit({ type: 'add', message: userMessage, cardStatus: 'stable' });
    console.log('[TaskLoop] Successfully added user message and emitted add event');
    
    const MAX_EPOCHS = 8;
    console.log(`[TaskLoop] [DEBUG] 开始主循环，MAX_EPOCHS: ${MAX_EPOCHS} - 时间戳: ${Date.now()}`);
    
    for (let epoch = 0; epoch < MAX_EPOCHS; ++epoch) {
      console.log(`[TaskLoop] [DEBUG] 进入Epoch ${epoch} - 时间戳: ${Date.now()}`);
      const taskId = `task-${Date.now()}-${epoch}`;
      let needToolCall = false;
      
      // 在每轮开始前清理无效的消息
      this.cleanupInvalidMessages();
      
      // 为UI层创建占位assistant消息（用于显示流式更新）
      // 注意：此消息仅用于UI显示，不添加到TaskLoop内部历史
      const uiAssistantMessage: EnrichedMessage = {
        id: `assistant-${Date.now()}-${epoch}`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      
      // 发出UI事件（框架无关）
      this.emit({ type: 'add', message: uiAssistantMessage, cardStatus: 'connecting' });
      console.log(`[TaskLoop] Created UI placeholder message for epoch ${epoch} (not added to internal history)`);
      
      try {
        // 发出状态事件：连接中（初始状态）
        this.emit({ type: 'status', taskId, status: 'connecting', cardStatus: 'connecting' });
        
        // 解包 config 字段，逐项传递给 messageBridge
        const { baseURL, apiKey, model, temperature, tools, parallelToolCalls, ...restConfig } = this.config || {};
        
        console.log('[TaskLoop] 解包的配置参数:');
        console.log('[TaskLoop] baseURL:', baseURL);
        console.log('[TaskLoop] model:', model);
        console.log('[TaskLoop] temperature:', temperature);
        console.log('[TaskLoop] tools:', tools?.length || 0, '个');
        console.log('[TaskLoop] parallelToolCalls:', parallelToolCalls);
        console.log('[TaskLoop] restConfig:', restConfig);
        
        // 通过 messageBridge 发送 LLM 请求
        console.log(`[TaskLoop] [DEBUG] 开始LLM调用 - Epoch ${epoch} - 时间戳: ${Date.now()}`);
        this.messageBridge.chatLLM({
          chatId: this.chatId,
          messages: this.messages,
          baseURL,
          apiKey,
          model,
          temperature,
          tools,
          parallelToolCalls,
          ...restConfig,
          signal: this.abortController.signal,
          assistantMessageId: uiAssistantMessage.id, // 使用UI占位消息的ID
        });
        console.log(`[TaskLoop] [DEBUG] LLM调用已发送（同步返回） - Epoch ${epoch} - 时间戳: ${Date.now()}`);

        // 等待LLM完成的Promise
        await new Promise<void>((resolve, reject) => {
          let llmCompleted = false;
          
          // 注册协议事件监听（只处理协议事件，不处理 UI 本地事件）
          const protocolEvents: Array<'chunk'|'status'|'toolcall'|'toolresult'|'done'|'error'|'abort'> = ['chunk','status','toolcall','toolresult','done','error','abort'];
          const eventHandlers = new Map<string, (payload: any) => void>();
          
          protocolEvents.forEach(eventType => {
            const handler = (payload: any) => {
              console.log(`[TaskLoop] 收到MessageBridge协议事件: ${eventType}`, payload);
              
              // 协议事件转换为UI事件
              if (eventType === 'chunk') {
                // chunk协议事件 → update UI事件（只负责内容更新）
                this.emit({ 
                  type: 'update', 
                  message: {
                    role: payload.role,
                    // 只使用增量数据
                    content_delta: payload.content_delta,
                    reasoning_delta: payload.reasoning_delta,
                    // 工具调用直接使用完整数据
                    tool_calls: payload.tool_calls,
                  }
                  // 移除 cardStatus，状态变化由独立的 status 事件处理
                });
              } else if (eventType === 'status') {
                // status协议事件 → status UI事件（专门处理状态变化）
                this.emit({ 
                  type: 'status', 
                  taskId: this.chatId,
                  status: payload.phase || 'processing',
                  cardStatus: payload.cardStatus
                });
              } else {
                // 其他协议事件直接转发到UI
                this.emit({ ...payload, type: eventType });
              }
              
              // 业务逻辑处理
              if (eventType === 'toolcall') {
                needToolCall = true;
                console.log(`[TaskLoop] [DEBUG] 设置 needToolCall = true (toolcall 事件) - Epoch ${epoch} - 时间戳: ${Date.now()}`);
              }
              if (eventType === 'done' && !aborted && !llmCompleted) {
                llmCompleted = true;
                console.log(`[TaskLoop] [DEBUG] 收到done事件，准备清理监听器 - Epoch ${epoch} - 时间戳: ${Date.now()}`);
                
                // 清理事件监听器
                protocolEvents.forEach(evt => {
                  const h = eventHandlers.get(evt);
                  if (h) this.messageBridge.off(evt as any, h);
                });
                
                // TaskLoop内部历史管理：添加完整的assistant消息到内部历史用于后续LLM调用
                // 这确保了TaskLoop是框架无关的，完全自管理消息历史
                const completedAssistantMessage = payload as EnrichedMessage;
                if (completedAssistantMessage && 
                    completedAssistantMessage.role === 'assistant' && 
                    (completedAssistantMessage.content || ('tool_calls' in completedAssistantMessage && (completedAssistantMessage as any).tool_calls))) {
                  
                  // 为内部历史创建独立的消息对象（与UI显示分离）
                  const internalHistoryMessage: EnrichedMessage = {
                    id: `internal-${Date.now()}-${epoch}`, // 内部历史使用独立ID
                    role: 'assistant',
                    content: completedAssistantMessage.content || '',
                    timestamp: Date.now(),
                    ...(completedAssistantMessage.reasoning_content && { reasoning_content: completedAssistantMessage.reasoning_content }),
                    ...((completedAssistantMessage as any).tool_calls && (completedAssistantMessage as any).tool_calls.length > 0 && { tool_calls: (completedAssistantMessage as any).tool_calls }),
                  };
                  
                  if (!Object.isExtensible(this.messages)) {
                    console.log('[TaskLoop] Array not extensible for internal history, creating new array');
                    this.messages = [...this.messages, internalHistoryMessage];
                  } else {
                    this.messages.push(internalHistoryMessage);
                  }
                  
                  console.log('[TaskLoop] 添加完整助手消息到内部历史:', {
                    internal_id: internalHistoryMessage.id,
                    role: internalHistoryMessage.role,
                    has_content: !!internalHistoryMessage.content,
                    has_tool_calls: !!(internalHistoryMessage as any).tool_calls,
                    content_length: internalHistoryMessage.content?.length || 0
                  });
                } else {
                  console.warn('[TaskLoop] 跳过无效的助手消息，无法添加到内部历史:', completedAssistantMessage);
                }
                
                console.log(`[TaskLoop] [DEBUG] LLM完成，继续执行epoch检查 - Epoch ${epoch} - 时间戳: ${Date.now()}`);
                resolve();
              }
              if (eventType === 'error' && !llmCompleted) {
                llmCompleted = true;
                console.log(`[TaskLoop] [DEBUG] 收到error事件，准备清理监听器 - Epoch ${epoch} - 时间戳: ${Date.now()}`);
                
                // 清理事件监听器
                protocolEvents.forEach(evt => {
                  const h = eventHandlers.get(evt);
                  if (h) this.messageBridge.off(evt as any, h);
                });
                
                reject(new Error(payload.error || 'LLM调用失败'));
              }
            };
            
            eventHandlers.set(eventType, handler);
            this.messageBridge.on(eventType, handler);
          });
          
          console.log(`[TaskLoop] [DEBUG] 事件监听器注册完成，开始等待LLM完成 - Epoch ${epoch} - 时间戳: ${Date.now()}`);
        });
        // UI 本地事件（add/update）仍由 TaskLoop 内部 emit
      } catch (err) {
        console.log(`[TaskLoop] [DEBUG] Epoch ${epoch} 发生异常:`, err);
        if (!aborted) {
          this.emit({ type: 'error', taskId, error: String(err) });
        }
        break;
      }
      if (aborted) break;
      
      console.log(`[TaskLoop] [DEBUG] 开始检查Epoch完成状态 - Epoch ${epoch} - 时间戳: ${Date.now()}`);
      console.log('[TaskLoop] ========== Epoch', epoch, '完成 ==========');
      console.log('[TaskLoop] needToolCall:', needToolCall);
      console.log('[TaskLoop] mcpClient exists:', !!this.mcpClient);
      console.log('[TaskLoop] 当前消息历史长度:', this.messages.length);
      console.log('[TaskLoop] 最后一条消息:', this.messages[this.messages.length - 1]);
      
      if (needToolCall) {
        console.log('[TaskLoop] ========== 进入工具调用分支 ==========');
        
        // 自动工具链调用逻辑
        // 检查工具调用能力：直接MCP客户端或MessageBridge代理
        const hasToolCallCapability = this.mcpClient || this.messageBridge;
        if (!hasToolCallCapability) {
          console.warn('[TaskLoop] 需要工具调用但 MCP 服务未注入且 MessageBridge 不可用，跳过工具调用');
          break;
        }
        
        if (this.mcpClient) {
          console.log('[TaskLoop] 使用直接 MCP 服务进行工具调用');
        } else {
          console.log('[TaskLoop] 使用 MessageBridge 代理进行工具调用');
        }
        
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
          
          // 发出工具调用状态事件，告知UI当前正在执行工具调用
          this.emit({ 
            type: 'status', 
            taskId: `task-${Date.now()}-${epoch}`, 
            status: 'tool_calling', 
            cardStatus: 'tool_calling' 
          });
          
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
              // 通过MessageBridge调用工具（支持多端适配）
              const result = await this.callToolViaMessageBridge(toolCall.function.name, args);
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
          
          // 工具调用完成后，发出状态更新表示准备进入下一轮
          this.emit({ 
            type: 'status', 
            taskId: `task-${Date.now()}-${epoch}`, 
            status: 'tool_completed', 
            cardStatus: 'connecting' // 准备进入下一轮LLM调用
          });
          
        } catch (error) {
          console.error('[TaskLoop] 工具调用过程中出错:', error);
          this.emit({ type: 'error', taskId, error: `工具调用失败: ${error}`, cardStatus: 'stable' });
          break;
        }
        
        continue; // 工具链后继续下一轮
      }
      break; // 无需工具调用则终止
    }
    
    // TaskLoop完成所有工作后，发出最终完成状态
    this.emit({ 
      type: 'status', 
      taskId: this.chatId, 
      status: 'completed', 
      cardStatus: 'stable' 
    });
    
    this.abortController.signal.removeEventListener('abort', abortHandler);
    this.abortController = null;
    return this.messages;
  }

  abortTask() {
    // 通过 MessageBridge 发送中断协议，适配多端
    if (this.messageBridge) {
      this.messageBridge.abortLLM();
    }
    // 保留本地 abortController.abort()，确保本地流中断
    if (this.abortController) {
      this.abortController.abort();
      // 触发中断事件，可自定义 taskId
      this.emit({ type: 'status', taskId: this.chatId, status: 'aborted' });
    }
  }

  // ...可扩展 abortTask、getTaskStatus 等
}

/**
 * TaskLoop 用法示例：
 *
 * // 创建 TaskLoop 实例（web端环境）
 * const taskLoop = new TaskLoop({
 *   chatId: 'chat-xxx',
 *   history: [],
 *   config: { model: 'gpt-4', ... },
 *   mcpClient: mcpClientInstance
 *   // 可选：messageBridgeOptions: { env: 'web', mcpClient: mcpClientInstance }
 * });
 *
 * // 订阅事件（UI层）
 * taskLoop.subscribe((event) => {
 *   // 处理 add/update/toolcall/toolresult/status/done/error 事件
 *   // 如：更新 UI、消息流、工具链状态等
 * });
 *
 * // 启动推理任务
 * taskLoop.start('用户输入内容');
 *
 * // 中断任务
 * taskLoop.abortTask();
 */
// 修改原因：
// 1. 支持多轮对话和自动工具链，需每个会话/聊天 new 一个 TaskLoop 实例，内部维护自己的消息和状态。
// 2. 旧的单例导出已废弃，防止多会话状态混乱。
// 3. start 方法支持自动多轮、工具链，便于业务层直接驱动复杂对话流程。
// 4. 兼容历史消息恢复，便于从快照/历史 new 实例。
// 5. 事件流/回调模式保持不变，便于 UI/Redux glue。
