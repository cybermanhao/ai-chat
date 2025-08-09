import 'dotenv/config';
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
// 新增导入 (CommonJS)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createMessageBridge } = require('../engine/dist/service/messageBridgeFactoryV2.js');
const { createProtocolAdapter, ServerMessageHandler } = require('../engine/dist/service/protocolAdapters.js');
const { MCPClient } = require('../engine/dist/service/mcpClient.js');
const llmService = require('../engine/dist/service/llmService.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 输出 VITE_DEV_SERVER_URL 以便调试
console.log('VITE_DEV_SERVER_URL:', process.env.VITE_DEV_SERVER_URL);

let viteProcess = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 推荐使用 preload.js 做 contextBridge
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 初始缩放-4次（每次缩放级别-1，默认0，最大9，最小-9）
  win.webContents.on('did-finish-load', () => {
    win.webContents.setZoomLevel(-2);
  });

  if (process.env.NODE_ENV === 'development' && process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools(); // 开发环境自动打开开发者工具
  } else {
    win.loadFile(path.join(__dirname, '../web/dist/index.html'));
  }
}

app.whenReady().then(() => {
  if (process.env.NODE_ENV === 'development') {
    // 启动 Vite dev server
    viteProcess = spawn(
      'npx',
      ['vite', '--config', path.join(__dirname, '../web/vite.config.ts'), '--port', '5173'],
      {
        cwd: path.join(__dirname, '../web'),
        stdio: 'inherit',
        shell: true, // 关键：让 Windows 能正确解析 npx
      }
    );
    // 等待几秒再创建窗口，确保 Vite 启动
    setTimeout(createWindow, 3000);
  } else {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (viteProcess) {
    viteProcess.kill();
  }
  if (process.platform !== 'darwin') app.quit();
});

// 基本 IPC 示例，可后续扩展
ipcMain.handle('start-task', async (event, params) => {
  // TODO: 调用 engine 纯逻辑模块
  // 返回模拟结果
  return { status: 'ok', data: 'task started', params };
});

// 新增流式聊天处理
// 初始化 MessageBridge
// 创建MCPClientManager以管理多个MCP服务器连接
class MCPClientManager {
  constructor() {
    this.services = new Map();
  }

  getService(serverId) {
    return this.services.get(serverId);
  }

  getFirstAvailableService() {
    return this.services.values().next().value;
  }

  createService(serverId, url) {
    // 如果已存在，先清理
    const existing = this.services.get(serverId);
    if (existing) {
      existing.disconnect().catch(console.error);
    }

    // 创建新的服务实例
    const service = new MCPClient(url);
    this.services.set(serverId, service);
    return service;
  }

  async removeService(serverId) {
    const service = this.services.get(serverId);
    if (service) {
      try {
        await service.disconnect();
      } catch (error) {
        console.error(`断开服务 ${serverId} 时出错:`, error);
      } finally {
        this.services.delete(serverId);
      }
    }
  }
}

const mcpClientManager = new MCPClientManager();
// 主进程MessageBridge应该直接处理LLM请求，不需要注入llmService
const messageBridge = createMessageBridge({ mcpClient: mcpClientManager });

// AbortController管理器 - 处理Electron主进程中的流取消
class StreamAbortManager {
  constructor() {
    this.abortControllers = new Map();
  }

  createController(streamId) {
    // 在Node.js 16+中，AbortController是原生可用的
    const controller = new AbortController();
    this.abortControllers.set(streamId, controller);
    console.log(`[StreamAbortManager] 创建AbortController: ${streamId}`);
    return controller;
  }

  abortStream(streamId) {
    const controller = this.abortControllers.get(streamId);
    if (controller) {
      console.log(`[StreamAbortManager] 中断流: ${streamId}`);
      controller.abort();
      this.abortControllers.delete(streamId);
      return true;
    }
    console.log(`[StreamAbortManager] 未找到流控制器: ${streamId}`);
    return false;
  }

  cleanupStream(streamId) {
    if (this.abortControllers.has(streamId)) {
      this.abortControllers.delete(streamId);
      console.log(`[StreamAbortManager] 清理流控制器: ${streamId}`);
    }
  }
}

const streamAbortManager = new StreamAbortManager();

// 实现流式聊天 IPC 处理 - 支持中断功能
ipcMain.on('chat:stream', async (event, { streamId, ...payload }) => {
  try {
    console.log('[Electron Main] 接收到LLM聊天请求:', { streamId, payload: { ...payload, messages: payload.messages?.length + ' 条消息' } });
    
    // 通知渲染进程流开始
    event.sender.send(`chat:stream:start:${streamId}`);

    // 创建AbortController用于取消操作
    const abortController = streamAbortManager.createController(streamId);

    // 监听中断请求
    const abortListener = () => {
      console.log(`[Electron Main] 接收到中断请求: ${streamId}`);
      streamAbortManager.abortStream(streamId);
    };
    ipcMain.once(`chat:stream:abort:${streamId}`, abortListener);

    // 直接使用llmService处理LLM请求
    const { streamLLMChat } = llmService;
    
    // 过滤掉渲染进程的signal，使用主进程的AbortController
    const { signal, ...cleanedPayload } = payload;
    
    try {
      await streamLLMChat({
        ...cleanedPayload,
        signal: abortController.signal, // 使用主进程的AbortController
        onChunk: (chunk) => {
          if (!abortController.signal.aborted) {
            event.sender.send(`chat:stream:chunk:${streamId}`, chunk);
          }
        },
        onStatus: (status) => {
          if (!abortController.signal.aborted) {
            event.sender.send(`chat:stream:status:${streamId}`, status);
          }
        },
        onDone: (result) => {
          if (!abortController.signal.aborted) {
            event.sender.send(`chat:stream:done:${streamId}`, result);
          }
          streamAbortManager.cleanupStream(streamId);
          ipcMain.removeListener(`chat:stream:abort:${streamId}`, abortListener);
        },
        onError: (error) => {
          event.sender.send(`chat:stream:error:${streamId}`, { error: String(error) });
          streamAbortManager.cleanupStream(streamId);
          ipcMain.removeListener(`chat:stream:abort:${streamId}`, abortListener);
        },
        onToolCall: (toolCall) => {
          if (!abortController.signal.aborted) {
            event.sender.send(`chat:stream:toolcall:${streamId}`, { toolCall });
          }
        }
      });
    } catch (error) {
      if (abortController.signal.aborted) {
        console.log(`[Electron Main] 流被用户中断: ${streamId}`);
        event.sender.send(`chat:stream:abort:${streamId}`);
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('[Electron Main] LLM请求处理失败:', error);
    event.sender.send(`chat:stream:error:${streamId}`, { error: String(error) });
    streamAbortManager.cleanupStream(streamId);
  }
});

// 处理流中断请求
ipcMain.on('chat:stream:abort', (event, { streamId }) => {
  console.log(`[Electron Main] 处理流中断请求: ${streamId}`);
  const success = streamAbortManager.abortStream(streamId);
  if (success) {
    event.sender.send(`chat:stream:abort:${streamId}`);
  }
});

// MCP连接处理
ipcMain.on('mcp:connect', async (event, { serverId, url }) => {
  try {
    console.log('[Electron Main] 处理MCP连接请求:', { serverId, url });
    
    // 使用MessageBridge处理MCP连接
    messageBridge.on('status', (statusData) => {
      if (statusData.serverId === serverId) {
        console.log('[Electron Main] MCP状态变化:', statusData);
      }
    });
    
    messageBridge.on('done', (doneData) => {
      if (doneData.serverId === serverId) {
        console.log('[Electron Main] MCP连接成功:', doneData);
        event.sender.send(`mcp:connect-result:${serverId}`, {
          tools: doneData.tools || []
        });
      }
    });
    
    messageBridge.on('error', (errorData) => {
      if (errorData.serverId === serverId) {
        console.log('[Electron Main] MCP连接失败:', errorData);
        event.sender.send(`mcp:connect-result:${serverId}`, {
          error: errorData.error
        });
      }
    });
    
    // 发送连接请求到MessageBridge
    messageBridge.send('message/mcp/connect', { serverId, url });
    
  } catch (error) {
    console.error('[Electron Main] MCP连接处理失败:', error);
    event.sender.send(`mcp:connect-result:${serverId}`, {
      error: String(error)
    });
  }
});

// MCP断开处理
ipcMain.on('mcp:disconnect', async (event, { serverId }) => {
  try {
    console.log('[Electron Main] 处理MCP断开请求:', { serverId });
    
    messageBridge.on('done', (doneData) => {
      if (doneData.serverId === serverId) {
        console.log('[Electron Main] MCP断开成功:', doneData);
        event.sender.send(`mcp:disconnect-result:${serverId}`, {});
      }
    });
    
    messageBridge.on('error', (errorData) => {
      if (errorData.serverId === serverId) {
        console.log('[Electron Main] MCP断开失败:', errorData);
        event.sender.send(`mcp:disconnect-result:${serverId}`, {
          error: errorData.error
        });
      }
    });
    
    // 发送断开请求到MessageBridge
    messageBridge.send('message/mcp/disconnect', { serverId });
    
  } catch (error) {
    console.error('[Electron Main] MCP断开处理失败:', error);
    event.sender.send(`mcp:disconnect-result:${serverId}`, {
      error: String(error)
    });
  }
});

// MCP工具调用处理
ipcMain.on('mcp:call-tool', async (event, { serverId, toolName, args, callId }) => {
  try {
    console.log('[Electron Main] 处理MCP工具调用:', { serverId, toolName, callId });
    
    messageBridge.on('toolresult', (resultData) => {
      if (resultData.callId === callId) {
        console.log('[Electron Main] MCP工具调用成功:', resultData);
        event.sender.send(`mcp:tool-result:${callId}`, {
          data: resultData.result
        });
      }
    });
    
    messageBridge.on('error', (errorData) => {
      if (errorData.callId === callId) {
        console.log('[Electron Main] MCP工具调用失败:', errorData);
        event.sender.send(`mcp:tool-error:${callId}`, {
          message: errorData.error
        });
      }
    });
    
    // 发送工具调用请求到MessageBridge
    messageBridge.send('message/mcp/call-tool', {
      serverId,
      toolName,
      args,
      callId
    });
    
  } catch (error) {
    console.error('[Electron Main] MCP工具调用处理失败:', error);
    event.sender.send(`mcp:tool-error:${callId}`, {
      message: String(error)
    });
  }
});
