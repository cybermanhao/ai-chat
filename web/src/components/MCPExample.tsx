// web/src/components/MCPExample.tsx
import { useState } from 'react';
import { useMCP } from '../hooks/useMCP';

/**
 * MCP使用示例组件
 * 演示如何使用useMCP Hook管理MCP连接和工具调用
 */
export function MCPExample() {
  const {
    servers,
    activeServer,
    connectedServers,
    availableTools,
    addServer,
    removeServer,
    connectServer,
    disconnectServer,
    setActiveServer,
    clearServerError,
    toggleToolEnabled,
    callTool
  } = useMCP();

  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');
  const [toolArgs, setToolArgs] = useState('{}');

  const handleAddServer = () => {
    if (newServerName && newServerUrl) {
      addServer(newServerName, newServerUrl);
      setNewServerName('');
      setNewServerUrl('');
    }
  };

  const handleConnectServer = async (serverId: string, url: string) => {
    try {
      await connectServer(serverId, url);
      console.log('服务器连接成功');
    } catch (error) {
      console.error('服务器连接失败:', error);
    }
  };

  const handleCallTool = async (serverId: string, toolName: string) => {
    try {
      const args = JSON.parse(toolArgs);
      const result = await callTool(serverId, toolName, args);
      console.log('工具调用结果:', result);
      alert(`工具调用成功: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error('工具调用失败:', error);
      alert(`工具调用失败: ${error}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">MCP 服务管理</h1>

      {/* 添加服务器 */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">添加服务器</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="服务器名称"
            value={newServerName}
            onChange={(e) => setNewServerName(e.target.value)}
            className="px-3 py-2 border rounded flex-1"
          />
          <input
            type="text"
            placeholder="服务器URL"
            value={newServerUrl}
            onChange={(e) => setNewServerUrl(e.target.value)}
            className="px-3 py-2 border rounded flex-1"
          />
          <button
            onClick={handleAddServer}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            添加
          </button>
        </div>
      </div>

      {/* 服务器列表 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">服务器列表</h2>
        {servers.length === 0 ? (
          <p className="text-gray-500">暂无服务器</p>
        ) : (
          <div className="space-y-3">
            {servers.map((server) => (
              <div key={server.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{server.name}</h3>
                    <p className="text-sm text-gray-600">{server.url}</p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        server.isConnected
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {server.isConnected ? '已连接' : '未连接'}
                    </span>
                    {server.loading && (
                      <span className="px-2 py-1 rounded text-sm bg-yellow-100 text-yellow-800">
                        加载中...
                      </span>
                    )}
                  </div>
                </div>

                {server.error && (
                  <div className="mb-2 p-2 bg-red-100 text-red-800 rounded text-sm">
                    错误: {server.error}
                    <button
                      onClick={() => clearServerError(server.id)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      清除
                    </button>
                  </div>
                )}

                <div className="flex gap-2 mb-3">
                  {!server.isConnected ? (
                    <button
                      onClick={() => handleConnectServer(server.id, server.url)}
                      disabled={server.loading}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                      连接
                    </button>
                  ) : (
                    <button
                      onClick={() => disconnectServer(server.id)}
                      disabled={server.loading}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      断开
                    </button>
                  )}
                  <button
                    onClick={() => setActiveServer(server.id)}
                    className={`px-3 py-1 rounded ${
                      activeServer?.id === server.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    设为活跃
                  </button>
                  <button
                    onClick={() => removeServer(server.id)}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    删除
                  </button>
                </div>

                {/* 工具列表 */}
                {server.tools.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">可用工具 ({server.tools.length})</h4>
                    <div className="space-y-2">
                      {server.tools.map((tool) => (
                        <div key={tool.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{tool.title || tool.name}</span>
                              <label className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={tool.enabled}
                                  onChange={(e) => toggleToolEnabled(server.id, tool.name, e.target.checked)}
                                />
                                <span className="text-sm">启用</span>
                              </label>
                            </div>
                            <p className="text-sm text-gray-600">{tool.description}</p>
                          </div>
                          <button
                            onClick={() => handleCallTool(server.id, tool.name)}
                            disabled={!tool.enabled || !server.isConnected}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            调用
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 工具调用参数 */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">工具调用参数</h2>
        <textarea
          value={toolArgs}
          onChange={(e) => setToolArgs(e.target.value)}
          placeholder='{"key": "value"}'
          className="w-full px-3 py-2 border rounded h-20"
        />
        <p className="text-sm text-gray-600 mt-1">JSON格式的工具参数</p>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800">总服务器数</h3>
          <p className="text-2xl font-bold text-blue-600">{servers.length}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-800">已连接服务器</h3>
          <p className="text-2xl font-bold text-green-600">{connectedServers.length}</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-medium text-purple-800">可用工具数</h3>
          <p className="text-2xl font-bold text-purple-600">{availableTools.length}</p>
        </div>
      </div>
    </div>
  );
}

export default MCPExample;
