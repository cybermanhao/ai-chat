# Electron模式开发部署指南

Electron模式将Web应用打包为跨平台的桌面应用，支持Windows、macOS和Linux系统。具备完整的桌面应用特性，如系统托盘、文件访问、离线使用等。

## 🏗️ 架构特点

- **主进程 (Main Process)**: 管理应用生命周期、窗口创建、系统API
- **渲染进程 (Renderer Process)**: 运行Web应用UI（基于Chromium）
- **IPC通信**: 主进程与渲染进程间的安全通信
- **本地存储**: 使用本地文件系统，无需网络依赖

## 📋 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Python 3.x（用于native依赖编译）
- Visual Studio Build Tools（Windows）或 Xcode（macOS）

## 🚀 开发环境启动

### 1. 安装依赖
```bash
# 在项目根目录安装所有依赖
pnpm install

# 如果遇到native依赖问题
pnpm rebuild
```

### 2. 启动开发环境
```bash
# 方法1：同时启动Web和Electron
pnpm run dev:all

# 方法2：分别启动
pnpm run dev:web        # 终端1: 启动Web开发服务器
pnpm run dev:electron   # 终端2: 启动Electron开发模式
```

### 3. 开发模式特性
- **热重载**: Web内容修改后自动刷新
- **开发者工具**: 内置Chrome DevTools
- **实时调试**: 主进程和渲染进程分别调试

## 🏭 生产环境构建

### 1. 构建Web应用
```bash
# 先构建Web应用
pnpm run build:web
```

### 2. 构建Electron应用
```bash
# 构建当前平台的应用
pnpm run build:electron

# 构建产物位置
dist/                    # Electron应用安装包
├── win-unpacked/       # Windows应用文件
├── mac/                # macOS应用包  
└── *.exe, *.dmg, *.AppImage  # 安装包文件
```

### 3. 跨平台构建
```bash
# Windows平台
pnpm run build:electron --win

# macOS平台  
pnpm run build:electron --mac

# Linux平台
pnpm run build:electron --linux

# 所有平台
pnpm run build:electron --win --mac --linux
```

## ⚙️ Electron配置

### 主进程配置
```javascript
// electron/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// 创建主窗口
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,    // 安全考虑
      contextIsolation: true,    // 启用上下文隔离
      preload: path.join(__dirname, 'preload.js')  // 预加载脚本
    }
  });

  // 加载应用
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../web/dist/index.html'));
  }
}
```

### 预加载脚本
```javascript
// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
  saveFile: (content) => ipcRenderer.invoke('file:save', content),
  
  // LLM流式通信
  createStream: (type, payload) => {
    const streamId = Date.now().toString();
    ipcRenderer.send('llm:stream:start', { streamId, type, payload });
    
    return {
      onChunk: (callback) => ipcRenderer.on(`llm:stream:chunk:${streamId}`, callback),
      onDone: (callback) => ipcRenderer.on(`llm:stream:done:${streamId}`, callback),
      onError: (callback) => ipcRenderer.on(`llm:stream:error:${streamId}`, callback),
    };
  },
  
  // 系统集成
  showNotification: (title, body) => ipcRenderer.invoke('notification:show', { title, body }),
  setTray: (tooltip) => ipcRenderer.invoke('tray:set', tooltip),
});
```

### 构建配置
```json
// electron-builder.json
{
  "appId": "com.example.zz-ai-chat",
  "productName": "ZZ AI Chat",
  "directories": {
    "output": "dist/"
  },
  "files": [
    "electron/**/*",
    "web/dist/**/*"
  ],
  "win": {
    "target": "nsis",
    "icon": "assets/icon.ico"
  },
  "mac": {
    "target": "dmg",
    "icon": "assets/icon.icns",
    "category": "public.app-category.productivity"
  },
  "linux": {
    "target": "AppImage",
    "icon": "assets/icon.png",
    "category": "Office"
  }
}
```

## 🔧 IPC通信实现

### 渲染进程 → 主进程
```typescript
// web/src/services/electronAPI.ts
export interface ElectronAPI {
  selectFile: () => Promise<string>;
  saveFile: (content: string) => Promise<void>;
  createStream: (type: string, payload: any) => ElectronStream;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// 使用示例
const filePath = await window.electronAPI.selectFile();
```

### 主进程处理IPC
```javascript
// electron/main.js
ipcMain.handle('dialog:selectFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md'] }
    ]
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('file:save', async (event, content) => {
  const result = await dialog.showSaveDialog({
    filters: [
      { name: 'Text Files', extensions: ['txt'] }
    ]
  });
  
  if (!result.canceled) {
    await fs.writeFile(result.filePath, content);
  }
});
```

## 🔐 安全配置

### 渲染进程安全
```javascript
// 禁用不安全的功能
webPreferences: {
  nodeIntegration: false,           // 禁用Node.js集成
  contextIsolation: true,           // 启用上下文隔离
  webSecurity: true,                // 启用Web安全
  allowRunningInsecureContent: false, // 禁用不安全内容
  experimentalFeatures: false       // 禁用实验性功能
}
```

### CSP配置
```html
<!-- web/index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' ws: wss: https:;
">
```

## 🧪 测试和调试

### 主进程调试
```bash
# 使用VSCode调试配置
# .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Electron Main",
  "program": "${workspaceFolder}/electron/main.js",
  "env": {
    "NODE_ENV": "development"
  }
}
```

### 渲染进程调试
```javascript
// 在开发模式下自动打开开发者工具
if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools();
}
```

### 单元测试
```bash
# 测试主进程逻辑
npm install --save-dev spectron
npm test

# 测试渲染进程（与Web测试相同）
cd web && pnpm test
```

## 📱 系统集成功能

### 1. 系统托盘
```javascript
// electron/main.js
const { Tray, Menu } = require('electron');

let tray;

function createTray() {
  tray = new Tray(path.join(__dirname, 'assets/tray-icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示', click: () => mainWindow.show() },
    { label: '退出', click: () => app.quit() }
  ]);
  
  tray.setToolTip('ZZ AI Chat');
  tray.setContextMenu(contextMenu);
}
```

### 2. 系统通知
```javascript
// electron/main.js
const { Notification } = require('electron');

ipcMain.handle('notification:show', async (event, { title, body }) => {
  new Notification({ title, body }).show();
});
```

### 3. 全局快捷键
```javascript
// electron/main.js
const { globalShortcut } = require('electron');

app.whenReady().then(() => {
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    mainWindow.show();
    mainWindow.focus();
  });
});
```

### 4. 自动更新
```javascript
// electron/main.js
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  // 通知用户有新版本
});
```

## 🚀 分发部署

### 1. 代码签名（macOS）
```bash
# 配置开发者证书
export CSC_IDENTITY_AUTO_DISCOVERY=false
export CSC_IDENTITY="Developer ID Application: Your Name"

# 构建并签名
pnpm run build:electron --mac
```

### 2. 代码签名（Windows）
```bash
# 使用证书文件
export CSC_LINK=path/to/certificate.p12
export CSC_KEY_PASSWORD=password

# 构建并签名
pnpm run build:electron --win
```

### 3. 自动发布
```json
// package.json
{
  "scripts": {
    "release": "electron-builder --publish always"
  },
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "your-org",
        "repo": "zz-ai-chat"
      }
    ]
  }
}
```

## 📁 目录结构

```
electron/
├── main.js              # 主进程入口
├── preload.js           # 预加载脚本
├── assets/              # 应用资源
│   ├── icon.ico        # Windows图标
│   ├── icon.icns       # macOS图标
│   └── icon.png        # Linux图标
└── test-messagebridge.js # MessageBridge测试

web/dist/                # Web应用构建产物
dist/                    # Electron应用构建产物
```

## 🚨 常见问题

### 1. Native依赖编译失败
```bash
# 重新编译native依赖
pnpm rebuild

# 或者使用electron-rebuild
npx electron-rebuild
```

### 2. 白屏问题
- 检查Web应用是否正确构建
- 确认文件路径配置正确
- 查看开发者工具的控制台错误

### 3. IPC通信失败
- 确认preload脚本正确加载
- 检查contextBridge API定义
- 验证主进程IPC处理器注册

### 4. 性能问题
```javascript
// 优化渲染进程
webPreferences: {
  backgroundThrottling: false,  // 禁用后台节流
  webgl: true,                  // 启用WebGL
  experimentalFeatures: true    // 启用实验性性能特性
}
```

## 📚 相关文档

- [Electron文档](https://www.electronjs.org/docs)
- [Electron Builder文档](https://www.electron.build/)
- [Electron安全指南](https://www.electronjs.org/docs/tutorial/security)
- [IPC通信指南](https://www.electronjs.org/docs/tutorial/ipc)