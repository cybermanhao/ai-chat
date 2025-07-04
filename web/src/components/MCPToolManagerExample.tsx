// web/src/components/MCPToolManagerExample.tsx
import { useState } from 'react';
import { Button } from 'antd';
import { useMCP } from '../hooks/useMCP';
import ToolManagerModal from './Modal/ToolManagerModal';

/**
 * MCP工具管理器使用示例
 * 演示如何集成和使用改进后的ToolManagerModal
 */
export function MCPToolManagerExample() {
  const { servers, connectedServers, availableTools } = useMCP();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">MCP工具管理器示例</h1>
        <div className="flex gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-blue-600">服务器总数</div>
            <div className="text-xl font-bold text-blue-800">{servers.length}</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-green-600">已连接</div>
            <div className="text-xl font-bold text-green-800">{connectedServers.length}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-sm text-purple-600">可用工具</div>
            <div className="text-xl font-bold text-purple-800">{availableTools.length}</div>
          </div>
        </div>
        <Button 
          type="primary" 
          onClick={() => setModalOpen(true)}
          size="large"
        >
          打开工具管理器
        </Button>
      </div>

      <ToolManagerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        themeColor="#1890ff"
      />
    </div>
  );
}

export default MCPToolManagerExample;
