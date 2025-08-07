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
const mcpClient = new MCPClient();
const messageBridge = createMessageBridge({ mcpClient, llmService });

// 实现流式聊天 IPC 处理 - 使用统一架构
ipcMain.on('chat:stream', async (event, { streamId, ...payload }) => {
  try {
    // 通知渲染进程流开始
    event.sender.send(`chat:stream:start:${streamId}`);

    // 创建IPC协议适配器
    const protocolAdapter = createProtocolAdapter('ipc', event, streamId);
    
    // 创建统一的消息处理器
    const messageHandler = new ServerMessageHandler(protocolAdapter, messageBridge);

    // 监听中断请求
    ipcMain.once(`chat:stream:abort:${streamId}`, () => {
      messageHandler.handleLLMAbort({ streamId });
    });

    // 使用统一的处理逻辑
    await messageHandler.handleLLMChat(payload);

  } catch (error) {
    event.sender.send(`chat:stream:error:${streamId}`, { error: String(error) });
  }
});
