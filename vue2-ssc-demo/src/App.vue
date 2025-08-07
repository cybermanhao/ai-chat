<template>
  <div class="container">
    <h1>Vue2 SSC Demo - TaskLoop SDK 验证</h1>
    
    <!-- 配置区域 -->
    <div class="config">
      <div class="config-item">
        <label>SSC API地址:</label>
        <input 
          v-model="sscApiUrl" 
          placeholder="http://localhost:8082"
          :disabled="isConnected"
        />
      </div>
      <div class="config-item">
        <label>模型:</label>
        <select v-model="selectedModel" :disabled="isConnected">
          <option v-for="model in availableModels" :key="model.id" :value="model.id">
            {{ model.name }}
          </option>
        </select>
      </div>
      <div class="config-item">
        <label>温度:</label>
        <input 
          v-model.number="temperature" 
          type="number" 
          min="0" 
          max="2" 
          step="0.1"
          :disabled="isConnected"
        />
      </div>
    </div>

    <!-- 状态显示 -->
    <div class="status">
      <div>状态: {{ connectionStatus }} | 消息数: {{ messages.length }}</div>
      <div>MCP: {{ mcpConnectionStatus }}</div>
      <div v-if="availableTools.length > 0" class="tools-info">
        工具: 
        <span v-for="(tool, index) in availableTools" :key="tool.name">
          {{ tool.name }}<span v-if="index < availableTools.length - 1">, </span>
        </span>
      </div>
    </div>

    <!-- 聊天区域 -->
    <div class="chat-container" ref="chatContainer">
      <div 
        v-for="message in filteredMessages" 
        :key="message.id" 
        :class="['message', message.role, message.cardStatus]"
      >
        <div class="message-header">
          <strong>{{ getRoleDisplayName(message.role) }}:</strong>
          <span v-if="message.cardStatus && message.cardStatus !== 'stable'" class="status-badge">
            {{ getStatusDisplayName(message.cardStatus) }}
          </span>
        </div>
        <div class="message-content">
          <div v-if="message.isToolCall" class="tool-call-info">
            <div class="tool-header">
              🔧 调用工具: <strong>{{ message.toolName }}</strong>
            </div>
            <div v-if="message.toolArgs" class="tool-args">
              参数: {{ message.toolArgs }}
            </div>
            <div v-if="message.isToolResult" class="tool-result">
              <div class="result-status">{{ message.content }}</div>
              <div v-if="message.toolResult" class="result-data">
                {{ formatToolResult(message.toolResult) }}
              </div>
            </div>
          </div>
          <div v-else-if="message.isToolResult" class="tool-result">
            <div class="result-status">{{ message.content }}</div>
            <div v-if="message.toolResult" class="result-data">
              {{ formatToolResult(message.toolResult) }}
            </div>
          </div>
          <div v-else v-html="formatMessageContent(message.content)"></div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-group">
      <input 
        v-model="userInput"
        placeholder="输入消息..."
        @keyup.enter="sendMessage"
        :disabled="isProcessing"
      />
      <button 
        @click="sendMessage"
        :disabled="isProcessing || !userInput.trim()"
      >
        {{ isProcessing ? '发送中...' : '发送' }}
      </button>
      <button 
        @click="clearChat"
        :disabled="isProcessing"
      >
        清空
      </button>
    </div>

    <!-- 调试信息 -->
    <div v-if="debugInfo" class="debug-info">
      <h3>调试信息:</h3>
      <pre>{{ debugInfo }}</pre>
    </div>
  </div>
</template>

<script>
// 导入TaskLoop SDK
import { createTaskLoop } from './lib/index.js'

export default {
  name: 'App',
  data() {
    return {
      // 配置
      sscApiUrl: 'http://localhost:8080',
      mcpServerUrl: 'http://localhost:8000/mcp',
      selectedModel: 'deepseek-chat',
      temperature: 0.7,
      
      // 状态
      isConnected: false,
      isProcessing: false,
      connectionStatus: '未连接',
      mcpConnectionStatus: '未连接',
      
      // 聊天数据
      messages: [],
      userInput: '',
      
      // TaskLoop实例
      taskLoop: null,
      taskLoopUnsubscribe: null,
      
      // 可用模型
      availableModels: [],
      
      // MCP相关
      availableTools: [],
      mcpClient: null,
      
      // 调试信息
      debugInfo: null
    }
  },

  computed: {
    // 过滤重复和无关的消息
    filteredMessages() {
      const messageMap = new Map();
      const filtered = [];
      
      for (const message of this.messages) {
        // 跳过空内容的占位消息
        if (message.role === 'assistant' && !message.content && !message.isToolCall && !message.isToolResult) {
          continue;
        }
        
        // 合并重复的用户消息
        if (message.role === 'user') {
          const key = `${message.role}-${message.content}`;
          if (!messageMap.has(key)) {
            messageMap.set(key, message);
            filtered.push(message);
          }
        } else {
          filtered.push(message);
        }
      }
      
      return filtered;
    }
  },
  
  async mounted() {
    console.log('Vue2 SSC Demo 启动')
    await this.loadAvailableModels()
    
    // 并行处理MCP连接和TaskLoop初始化，MCP失败不应阻塞TaskLoop
    const mcpPromise = this.connectMCPServer().catch(error => {
      console.error('MCP连接失败，但继续初始化TaskLoop:', error)
    })
    
    const taskLoopPromise = this.initializeTaskLoop()
    
    // 等待TaskLoop初始化完成（必需），MCP连接可以稍后完成
    await taskLoopPromise
    
    // 等待MCP连接尝试完成（可选）
    await mcpPromise
    
    // 如果MCP连接成功，重新配置TaskLoop的工具
    if (this.availableTools.length > 0) {
      console.log('MCP连接成功，重新配置TaskLoop工具')
      await this.reinitializeTaskLoopWithTools()
    }
  },
  
  methods: {
    async loadAvailableModels() {
      try {
        const response = await fetch(`${this.sscApiUrl}/api/llm/models`)
        const data = await response.json()
        this.availableModels = data.models || []
        console.log('加载可用模型:', this.availableModels)
        
        // 设置默认模型
        if (this.availableModels.length > 0 && !this.availableModels.find(m => m.id === this.selectedModel)) {
          this.selectedModel = this.availableModels[0].id
        }
      } catch (error) {
        console.error('加载模型失败:', error)
        this.availableModels = [
          { id: 'deepseek-chat', name: 'DeepSeek Chat (默认)' }
        ]
      }
    },

    async connectMCPServer() {
      try {
        this.mcpConnectionStatus = '连接中...'
        console.log('连接MCP服务器:', this.mcpServerUrl)
        
        // 通过SSC服务器获取MCP工具列表
        const response = await fetch(`${this.sscApiUrl}/api/mcp/tools`)
        if (response.ok) {
          const data = await response.json()
          this.availableTools = data.tools || []
          this.mcpConnectionStatus = `已连接 (${this.availableTools.length} 工具)`
          console.log('MCP工具列表:', this.availableTools)
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
      } catch (error) {
        console.error('MCP连接失败:', error)
        this.mcpConnectionStatus = `连接失败: ${error.message}`
        // 不清空现有工具，避免影响已初始化的TaskLoop
        // this.availableTools = []
        this.debugInfo = JSON.stringify(error, null, 2)
      }
    },
    
    async initializeTaskLoop() {
      try {
        console.log('初始化TaskLoop SDK...')
        console.log('createTaskLoop函数:', typeof createTaskLoop)
        console.log('可用工具数量:', this.availableTools.length)
        
        const config = {
          chatId: 'vue2-demo-' + Date.now(),
          history: [],
          config: {
            model: this.selectedModel,
            temperature: this.temperature,
            sscApiBaseUrl: this.sscApiUrl,
            // 传递工具列表给TaskLoop
            tools: this.availableTools.map(tool => ({
              type: 'function',
              function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema
              }
            }))
          }
        }
        
        console.log('TaskLoop配置:', config)
        
        // 创建TaskLoop实例
        this.taskLoop = createTaskLoop(config)
        
        console.log('TaskLoop实例创建成功:', this.taskLoop)
        
        // 订阅事件
        this.taskLoopUnsubscribe = this.taskLoop.subscribe((event) => {
          switch (event.type) {
            case 'add':
              this.handleTaskLoopAdd(event)
              break
            case 'update':
              this.handleTaskLoopUpdate(event)
              break
            case 'status':
              this.handleTaskLoopStatus(event)
              break
            case 'error':
              this.handleTaskLoopError(event)
              break
            case 'done':
              this.handleTaskLoopDone(event)
              break
            case 'toolcall':
              this.handleTaskLoopToolCall(event)
              break
            case 'toolresult':
              this.handleTaskLoopToolResult(event)
              break
          }
        })
        
        this.connectionStatus = '已就绪'
        this.isConnected = true
        
        console.log('TaskLoop事件监听器已设置')
        
      } catch (error) {
        console.error('TaskLoop初始化失败:', error)
        this.connectionStatus = '初始化失败: ' + error.message
        this.debugInfo = JSON.stringify(error, null, 2)
      }
    },

    async reinitializeTaskLoopWithTools() {
      try {
        console.log('重新初始化TaskLoop以包含工具...')
        console.log('当前可用工具数量:', this.availableTools.length)
        
        // 确保有工具可用
        if (this.availableTools.length === 0) {
          console.warn('没有可用工具，跳过重新初始化')
          return
        }
        
        // 断开现有连接
        if (this.taskLoopUnsubscribe) {
          this.taskLoopUnsubscribe()
          this.taskLoopUnsubscribe = null
        }
        
        // 重新创建包含工具的TaskLoop
        await this.initializeTaskLoop()
        
        console.log('TaskLoop重新初始化完成，包含工具:', this.availableTools.length)
      } catch (error) {
        console.error('重新初始化TaskLoop失败:', error)
      }
    },
    
    async sendMessage() {
      if (!this.userInput.trim() || this.isProcessing) return
      
      if (!this.taskLoop) {
        console.error('TaskLoop未初始化')
        alert('TaskLoop未初始化，请刷新页面重试')
        return
      }
      
      const userMessage = this.userInput.trim()
      this.userInput = ''
      this.isProcessing = true
      this.connectionStatus = '发送中...'
      
      try {
        console.log('发送消息:', userMessage)
        
        // 添加用户消息到界面
        this.messages.push({
          id: 'user-' + Date.now(),
          role: 'user',
          content: userMessage,
          timestamp: Date.now(),
          cardStatus: 'stable'
        })
        
        // 添加助手消息占位符
        this.messages.push({
          id: 'assistant-' + Date.now(),
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          cardStatus: 'connecting'
        })
        
        this.scrollToBottom()
        
        // 调用TaskLoop发送消息
        await this.taskLoop.start(userMessage)
        
      } catch (error) {
        console.error('发送消息失败:', error)
        this.connectionStatus = '发送失败: ' + error.message
        this.debugInfo = JSON.stringify(error, null, 2)
        this.isProcessing = false
      }
    },
    
    clearChat() {
      this.messages = []
      this.debugInfo = null
      console.log('聊天记录已清空')
    },
    
    // TaskLoop事件处理器
    handleTaskLoopAdd(event) {
      console.log('TaskLoop Add事件:', event)
      this.messages.push({
        id: event.message.id || 'msg-' + Date.now(),
        role: event.message.role,
        content: event.message.content || '',
        timestamp: event.message.timestamp || Date.now(),
        cardStatus: event.cardStatus
      })
      this.scrollToBottom()
    },
    
    handleTaskLoopUpdate(event) {
      console.log('TaskLoop Update事件:', event)
      // 找到最后一个助手消息进行更新
      const lastAssistantIndex = this.messages.findIndex((m, index) => 
        m.role === 'assistant' && index === this.messages.length - 1
      )
      
      if (lastAssistantIndex >= 0) {
        const existingMessage = this.messages[lastAssistantIndex]
        // 更新消息内容 - 使用增量更新
        const updatedContent = existingMessage.content + (event.message.content_delta || '')
        
        this.$set(this.messages, lastAssistantIndex, {
          ...existingMessage,
          content: updatedContent,
          cardStatus: event.cardStatus || existingMessage.cardStatus
        })
        this.scrollToBottom()
      }
    },
    
    handleTaskLoopStatus(event) {
      console.log('TaskLoop Status事件:', event)
      this.connectionStatus = event.status || '处理中...'
    },
    
    handleTaskLoopError(event) {
      console.error('TaskLoop Error事件:', event)
      this.connectionStatus = '错误: ' + (event.error || '未知错误')
      this.debugInfo = JSON.stringify(event, null, 2)
      this.isProcessing = false
    },
    
    handleTaskLoopDone(event) {
      console.log('TaskLoop Done事件:', event)
      
      // 如果Done事件包含完整消息，更新最后的助手消息
      if (event.content) {
        const lastAssistantIndex = this.messages.findIndex((m, index) => 
          m.role === 'assistant' && index === this.messages.length - 1
        )
        
        if (lastAssistantIndex >= 0) {
          this.$set(this.messages, lastAssistantIndex, {
            ...this.messages[lastAssistantIndex],
            content: event.content,
            cardStatus: 'stable'
          })
        }
      }
      
      this.connectionStatus = '已就绪'
      this.isProcessing = false
      this.scrollToBottom()
    },

    handleTaskLoopToolCall(event) {
      console.log('TaskLoop ToolCall事件:', event)
      
      // 在消息列表中添加工具调用显示
      const toolCall = event.toolCall;
      const toolName = toolCall.function?.name || toolCall.name;
      let toolArgs = '';
      
      try {
        if (toolCall.function?.arguments) {
          const args = JSON.parse(toolCall.function.arguments);
          toolArgs = Object.entries(args).map(([key, value]) => `${key}: ${value}`).join(', ');
        }
      } catch (e) {
        // 解析失败时显示原始参数
        toolArgs = toolCall.function?.arguments || '';
      }
      
      this.messages.push({
        id: 'toolcall-' + Date.now(),
        role: 'system',
        content: `🔧 调用工具: ${toolName}`,
        timestamp: Date.now(),
        cardStatus: 'processing',
        toolName: toolName,
        toolArgs: toolArgs,
        isToolCall: true,
        toolCall: toolCall
      })
      
      this.scrollToBottom()
    },

    handleTaskLoopToolResult(event) {
      console.log('TaskLoop ToolResult事件:', event)
      
      // 找到对应的工具调用消息并更新结果
      const toolCallIndex = this.messages.findIndex(m => 
        m.isToolCall && m.toolCall?.id === event.toolCallId
      )
      
      if (toolCallIndex >= 0) {
        const toolCallMessage = this.messages[toolCallIndex]
        this.$set(this.messages, toolCallIndex, {
          ...toolCallMessage,
          content: event.error ? `❌ 错误: ${event.result}` : `✅ 完成`,
          toolResult: event.result,
          cardStatus: event.error ? 'error' : 'stable',
          isToolResult: true
        })
      } else {
        // 如果找不到对应的工具调用，直接添加结果消息
        this.messages.push({
          id: 'toolresult-' + Date.now(),
          role: 'system',
          content: event.error ? `❌ 工具执行失败: ${event.result}` : `✅ 工具执行成功`,
          toolResult: event.result,
          timestamp: Date.now(),
          cardStatus: event.error ? 'error' : 'stable',
          isToolResult: true
        })
      }
      
      this.scrollToBottom()
    },
    
    // 辅助方法
    getRoleDisplayName(role) {
      const roleMap = {
        user: '用户',
        assistant: 'AI助手',
        system: '系统',
        tool: '工具'
      }
      return roleMap[role] || role
    },

    getStatusDisplayName(status) {
      const statusMap = {
        connecting: '连接中',
        thinking: '思考中',
        generating: '生成中',
        tool_calling: '工具调用中',
        processing: '处理中',
        stable: '完成',
        error: '错误'
      }
      return statusMap[status] || status
    },
    
    formatMessageContent(content) {
      if (!content) return ''
      // 简单的换行处理
      return content.replace(/\n/g, '<br>')
    },

    formatToolResult(result) {
      if (!result) return ''
      try {
        // 尝试解析JSON并格式化显示
        const parsed = JSON.parse(result);
        if (parsed.content && Array.isArray(parsed.content)) {
          // 处理MCP工具返回的标准格式
          return parsed.content.map(item => {
            if (item.type === 'text') {
              try {
                // 尝试解析天气数据等结构化内容
                const data = JSON.parse(item.text);
                return this.formatStructuredData(data);
              } catch {
                return item.text;
              }
            }
            return JSON.stringify(item);
          }).join('\n');
        }
        return this.formatStructuredData(parsed);
      } catch {
        // 如果不是JSON，直接返回
        return result;
      }
    },

    formatStructuredData(data) {
      if (typeof data === 'object' && data !== null) {
        // 格式化对象数据，特别处理天气等常见数据
        return Object.entries(data).map(([key, value]) => {
          const keyMap = {
            '城市中文名': '城市',
            '当前气温': '气温',
            '天气状况': '状态',
            '湿度': '湿度',
            '空气质量指数': 'AQI'
          };
          const displayKey = keyMap[key] || key;
          return `${displayKey}: ${value}`;
        }).join(' | ');
      }
      return String(data);
    },
    
    scrollToBottom() {
      this.$nextTick(() => {
        if (this.$refs.chatContainer) {
          this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight
        }
      })
    }
  }
}
</script>

<style>
/* 样式已在index.html中定义 */
.debug-info {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

.debug-info h3 {
  margin-top: 0;
  color: #007bff;
}

.debug-info pre {
  background: white;
  padding: 10px;
  border-radius: 3px;
  overflow-x: auto;
  font-size: 12px;
}

.card-status {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  font-style: italic;
}

.tools-info {
  font-size: 12px;
  color: #007bff;
  margin-top: 2px;
}

.message.system {
  background-color: #f8f9fa;
  border-left: 4px solid #007bff;
}

.message.system .content {
  font-family: monospace;
  font-size: 13px;
}
</style>