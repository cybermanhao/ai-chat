import React, { useState } from 'react';
import { Modal, List, Switch, Divider } from 'antd';
import { useMCPStore } from '@/store/mcpStore';
import type { Tool } from '@engine/service/mcpService';

interface ToolManagerModalProps {
  open: boolean;
  onClose: () => void;
}

const ToolManagerModal: React.FC<ToolManagerModalProps> = ({ open, onClose }) => {
  const { servers } = useMCPStore();
  const [selectedTool, setSelectedTool] = useState<{serverId: string, tool: Tool} | null>(null);

  // 工具开关切换逻辑（如需保存状态可扩展 store）
  const handleToolSwitch = (serverId: string, tool: Tool, checked: boolean) => {
    // 这里可扩展为实际的启用/禁用逻辑
  };

  return (
    <Modal
      title="MCP 工具管理"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      bodyStyle={{ minHeight: 480 }}
    >
      <div style={{ display: 'flex', gap: 32 }}>
        {/* 左侧：server-tool 二级列表 */}
        <div style={{ flex: 1, minWidth: 320, maxHeight: 500, overflowY: 'auto', borderRight: '1px solid #eee', paddingRight: 16 }}>
          {servers.length === 0 && <div style={{ color: '#888' }}>暂无服务器</div>}
          {servers.map(server => (
            <div key={server.id} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>{server.name}</div>
              {server.tools && server.tools.length > 0 ? (
                <List
                  size="small"
                  dataSource={server.tools}
                  renderItem={(tool: Tool) => (
                    <List.Item
                      style={{
                        background: selectedTool?.tool.name === tool.name && selectedTool?.serverId === server.id ? '#f0f5ff' : undefined,
                        cursor: 'pointer',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onClick={() => setSelectedTool({ serverId: server.id, tool })}
                    >
                      <span style={{ flex: 1 }}>{tool.name}</span>
                      <Switch
                        size="small"
                        defaultChecked
                        onClick={checked => handleToolSwitch(server.id, tool, checked)}
                        style={{ marginLeft: 8 }}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ color: '#bbb', fontSize: 12, marginLeft: 8 }}>无工具</div>
              )}
            </div>
          ))}
        </div>
        {/* 右侧：工具 meta 信息 */}
        <div style={{ flex: 2, minWidth: 320, paddingLeft: 16 }}>
          {selectedTool ? (
            <div>
              <h3 style={{ marginTop: 0 }}>{selectedTool.tool.title || selectedTool.tool.name}</h3>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ marginBottom: 8 }}><b>名称：</b>{selectedTool.tool.name}</div>
              <div style={{ marginBottom: 8 }}><b>类型：</b>{selectedTool.tool.type}</div>
              <div style={{ marginBottom: 8 }}><b>描述：</b>{selectedTool.tool.description || '无'}</div>
            </div>
          ) : (
            <div style={{ color: '#888', fontSize: 14 }}>请选择左侧工具查看详细信息</div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ToolManagerModal;
