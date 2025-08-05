// Electron MessageBridge 测试文件
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Electron MessageBridge 测试开始 ===');

// 模拟 MessageBridge 类
class TestMessageBridge {
  constructor(options) {
    this.env = options.env;
    this.listeners = new Map();
    console.log(`✅ TestMessageBridge 创建成功，环境: ${this.env}`);
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
    console.log(`✅ 注册事件监听器: ${event}`);
  }

  emit(event, payload) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(fn => fn(payload));
      console.log(`✅ 触发事件: ${event}`, payload);
    }
  }

  send(type, payload) {
    console.log(`✅ 发送消息: ${type}`, payload);
    // 模拟异步响应
    setTimeout(() => {
      this.emit('status', { type: 'chunk', content: '测试响应' });
      this.emit('done', { type: 'done', result: '测试完成' });
    }, 100);
  }
}

// 测试函数
function testMessageBridge() {
  console.log('\n🧪 测试 1: 创建 MessageBridge 实例');
  const messageBridge = new TestMessageBridge({
    env: 'electron',
    mcpClient: null,
    llmService: null
  });

  console.log('\n🧪 测试 2: 事件监听和触发');
  let eventCount = 0;
  
  messageBridge.on('status', (payload) => {
    eventCount++;
    console.log(`📨 收到 status 事件 ${eventCount}:`, payload);
  });

  messageBridge.on('done', (payload) => {
    eventCount++;
    console.log(`📨 收到 done 事件 ${eventCount}:`, payload);
  });

  console.log('\n🧪 测试 3: IPC 流式通信模拟');
  
  // 模拟 IPC 处理器
  const mockEvent = {
    sender: {
      send: (channel, data) => {
        console.log(`📡 IPC 发送: ${channel}`, data);
      }
    }
  };

  const streamId = 'test-stream-123';
  
  // 模拟 IPC 处理逻辑
  console.log(`🚀 开始流式处理 (streamId: ${streamId})`);
  
  mockEvent.sender.send(`chat:stream:start:${streamId}`);
  
  messageBridge.send('message/llm/chat', {
    messages: [{ role: 'user', content: 'Hello' }],
    model: 'test-model'
  });

  // 模拟清理
  setTimeout(() => {
    console.log('\n🧹 测试清理完成');
    console.log(`📊 总共处理了 ${eventCount} 个事件`);
    console.log('\n🎉 Electron MessageBridge 测试完成！');
  }, 500);
}

// 创建简单的 Electron 窗口用于测试
function createTestWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 加载一个简单的 HTML 页面
  win.loadURL('data:text/html,<html><body><h1>Electron MessageBridge Test</h1><p>Check console for test results</p></body></html>');
  
  // 运行测试
  testMessageBridge();
}

app.whenReady().then(() => {
  createTestWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

console.log('Electron MessageBridge 测试应用已启动');