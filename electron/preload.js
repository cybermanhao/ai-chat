// electron/preload.js
// 通过 contextBridge 暴露安全的 IPC API，支持流式通信

const { contextBridge, ipcRenderer } = require('electron');

// 存储流相关的回调函数，用于清理和管理
const streamCallbacks = new Map();

// 生成唯一的流ID
function generateStreamId() {
  return `stream_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

contextBridge.exposeInMainWorld('electronAPI', {
  // 基础通信方法
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  on: (channel, func) => {
    const subscription = (event, ...args) => func(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },

  // 流式通信方法 - 发送请求并创建流
  createStream: (channel, requestData) => {
    const streamId = generateStreamId();
    const callbacks = new Map();

    // 存储回调以便后续清理
    streamCallbacks.set(streamId, callbacks);

    // 发送初始请求，包含流ID
    ipcRenderer.send(channel, { ...requestData, streamId });

    // 返回流控制对象
    return {
      // 注册块数据回调
      onChunk: (callback) => {
        const chunkChannel = `${channel}:chunk:${streamId}`;
        const listener = (event, chunk) => callback(chunk);
        ipcRenderer.on(chunkChannel, listener);
        callbacks.set('chunk', { channel: chunkChannel, listener });
      },

      // 注册状态更新回调
      onStatus: (callback) => {
        const statusChannel = `${channel}:status:${streamId}`;
        const listener = (event, status) => callback(status);
        ipcRenderer.on(statusChannel, listener);
        callbacks.set('status', { channel: statusChannel, listener });
      },

      // 注册完成回调
      onDone: (callback) => {
        const doneChannel = `${channel}:done:${streamId}`;
        const listener = (event, result) => {
          callback(result);
          // 完成后自动清理
          cleanupStream(streamId);
        };
        ipcRenderer.on(doneChannel, listener);
        callbacks.set('done', { channel: doneChannel, listener });
      },

      // 注册错误回调
      onError: (callback) => {
        const errorChannel = `${channel}:error:${streamId}`;
        const listener = (event, error) => {
          callback(error);
          // 出错后自动清理
          cleanupStream(streamId);
        };
        ipcRenderer.on(errorChannel, listener);
        callbacks.set('error', { channel: errorChannel, listener });
      },

      // 注册中断回调
      onAbort: (callback) => {
        const abortChannel = `${channel}:abort:${streamId}`;
        const listener = (event) => {
          callback();
          // 中断后自动清理
          cleanupStream(streamId);
        };
        ipcRenderer.on(abortChannel, listener);
        callbacks.set('abort', { channel: abortChannel, listener });
      },

      // 主动中断流
      abort: () => {
        ipcRenderer.send(`${channel}:abort`, { streamId });
        cleanupStream(streamId);
      }
    };
  },

  // MCP相关方法
  mcp: {
    // 连接MCP服务器
    connect: (serverId, url) => {
      ipcRenderer.send('mcp:connect', { serverId, url });
    },
    
    // 断开MCP服务器
    disconnect: (serverId) => {
      ipcRenderer.send('mcp:disconnect', { serverId });
    },
    
    // 调用MCP工具
    callTool: (serverId, toolName, args, callId) => {
      ipcRenderer.send('mcp:call-tool', { serverId, toolName, args, callId });
    },
    
    // 监听连接结果
    onConnectResult: (serverId, callback) => {
      const channel = `mcp:connect-result:${serverId}`;
      const listener = (event, result) => callback(result);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
    
    // 监听断开结果
    onDisconnectResult: (serverId, callback) => {
      const channel = `mcp:disconnect-result:${serverId}`;
      const listener = (event, result) => callback(result);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
    
    // 监听工具调用结果
    onToolResult: (callId, callback) => {
      const channel = `mcp:tool-result:${callId}`;
      const listener = (event, result) => callback(result);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
    
    // 监听工具调用错误
    onToolError: (callId, callback) => {
      const channel = `mcp:tool-error:${callId}`;
      const listener = (event, error) => callback(error);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    }
  }
});

// 清理流相关的监听器
function cleanupStream(streamId) {
  const callbacks = streamCallbacks.get(streamId);
  if (!callbacks) return;

  // 移除所有监听器
  for (const { channel, listener } of callbacks.values()) {
    ipcRenderer.removeListener(channel, listener);
  }

  // 从映射中删除
  streamCallbacks.delete(streamId);
}

// 窗口关闭时清理所有流
ipcRenderer.on('window:closed', () => {
  for (const streamId of streamCallbacks.keys()) {
    cleanupStream(streamId);
  }
});
