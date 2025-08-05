import 'dotenv/config';
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Electron MessageBridge 完整测试 ===');

// 简化的 MessageBridge 实现，模拟真实功能
class MessageBridge {
  constructor(options) {
    this.env = options.env;
    this.mcpClient = options.mcpClient;
    this.llmService = options.llmService;
    this.listeners = new Map();
    console.log(`✅ MessageBridge 初始化完成 (${this.env})`);
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  off(event, handler) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      this.listeners.set(event, handlers.filter(fn => fn !== handler));
    }
  }

  emit(event, payload) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(fn => fn(payload));
    }
  }

  send(type, payload) {
    console.log(`📤 MessageBridge.send: ${type}`);
    
    switch (type) {
      case 'message/llm/chat': {
        // 模拟 llmService 调用
        console.log('🤖 模拟 LLM 推理开始...');
        
        // 模拟流式响应
        setTimeout(() => {
          this.emit('status', { status: 'thinking' });
        }, 100);
        
        setTimeout(() => {
          this.emit('chunk', { content: '这是一个', delta: '这是一个' });
        }, 200);
        
        setTimeout(() => {
          this.emit('chunk', { content: '这是一个测试', delta: '测试' });
        }, 300);
        
        setTimeout(() => {
          this.emit('chunk', { content: '这是一个测试响应', delta: '响应' });
        }, 400);
        
        setTimeout(() => {
          this.emit('done', { 
            role: 'assistant', 
            content: '这是一个测试响应',
            id: 'msg_' + Date.now(),
            timestamp: Date.now()
          });
        }, 500);
        
        break;
      }
      case 'message/llm/abort': {
        console.log('🛑 中断 LLM 推理');
        this.emit('abort', { reason: '用户中断' });
        break;
      }
      default: {
        console.warn('⚠️ 未知消息类型:', type);
        break;
      }
    }
  }
}

// 创建工厂函数
function createMessageBridge(env, options) {
  return new MessageBridge({
    env,
    ...options
  });
}

// 模拟 MCPClient
class MCPClient {
  constructor() {
    console.log('✅ MCPClient 初始化');
  }
}

// 模拟 llmService
const llmService = {
  send: (type, payload, callback) => {
    console.log('🔄 llmService.send 调用');
    callback({ type: 'chunk', content: '模拟响应' });
    callback({ type: 'done', result: '完成' });
  },
  abort: () => {
    console.log('🛑 llmService.abort 调用');
  }
};

let mainWindow;
let messageBridge;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 加载一个测试页面
  mainWindow.loadURL('data:text/html,<html><body><h1>Electron MessageBridge 测试</h1><p>检查控制台查看测试结果</p><button onclick="window.electronAPI?.send(\'test-messagebridge\')">测试 MessageBridge</button></body></html>');
  
  // 初始化 MessageBridge
  console.log('\n🚀 初始化 MessageBridge...');
  const mcpClient = new MCPClient();
  messageBridge = createMessageBridge('electron', { mcpClient, llmService });
  
  console.log('✅ MessageBridge 创建成功');
  
  // 运行自动测试
  setTimeout(() => {
    runTests();
  }, 1000);
}

function runTests() {
  console.log('\n=== 开始自动化测试 ===');
  
  // 测试 1: 事件系统
  console.log('\n🧪 测试 1: 事件监听和触发');
  let eventCount = 0;
  
  const testEvents = ['status', 'chunk', 'done', 'error', 'abort'];
  testEvents.forEach(eventType => {
    messageBridge.on(eventType, (payload) => {
      eventCount++;
      console.log(`📨 收到 ${eventType} 事件:`, payload);
    });
  });
  
  // 手动触发测试事件
  messageBridge.emit('status', { status: 'test', message: '测试消息' });
  
  // 测试 2: IPC 流式通信
  console.log('\n🧪 测试 2: 模拟 IPC 流式聊天');
  
  const mockStreamId = 'test-stream-' + Date.now();
  const mockPayload = {
    messages: [{ role: 'user', content: '你好，这是一个测试消息' }],
    model: 'test-model',
    temperature: 0.7
  };
  
  // 模拟 IPC 事件处理
  handleChatStream({ streamId: mockStreamId, ...mockPayload });
  
  setTimeout(() => {
    console.log(`\n📊 测试统计: 共处理 ${eventCount} 个事件`);
    console.log('🎉 所有测试完成！');
  }, 2000);
}

// 模拟 IPC 聊天流处理
function handleChatStream({ streamId, ...payload }) {
  console.log(`🚀 开始处理流式聊天 (streamId: ${streamId})`);
  
  // 创建事件处理器
  const eventHandlers = {
    status: (msg) => {
      console.log(`📡 IPC 发送 status:${streamId}:`, msg);
    },
    chunk: (msg) => {
      console.log(`📡 IPC 发送 chunk:${streamId}:`, msg);
    },
    done: (msg) => {
      console.log(`📡 IPC 发送 done:${streamId}:`, msg);
      // 完成后清理
      cleanupEventHandlers();
    },
    error: (msg) => {
      console.log(`📡 IPC 发送 error:${streamId}:`, msg);
      cleanupEventHandlers();
    },
    abort: (msg) => {
      console.log(`📡 IPC 发送 abort:${streamId}:`, msg);
      cleanupEventHandlers();
    }
  };

  // 注册事件监听器
  Object.entries(eventHandlers).forEach(([eventType, handler]) => {
    messageBridge.on(eventType, handler);
  });

  // 清理函数
  const cleanupEventHandlers = () => {
    Object.entries(eventHandlers).forEach(([eventType, handler]) => {
      messageBridge.off(eventType, handler);
    });
    console.log('🧹 事件监听器已清理');
  };

  // 发送 LLM 请求
  messageBridge.send('message/llm/chat', payload);
}

// IPC 处理器
ipcMain.on('test-messagebridge', () => {
  console.log('\n🧪 收到渲染进程测试请求');
  runTests();
});

ipcMain.on('chat:stream', (event, { streamId, ...payload }) => {
  console.log(`\n📥 收到 IPC 聊天请求: ${streamId}`);
  handleChatStream({ streamId, ...payload });
});

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

console.log('Electron MessageBridge 测试应用启动完成');