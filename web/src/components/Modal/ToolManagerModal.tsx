import React, { useState } from 'react';
import { Modal, List, Switch, Divider, Tag, Tooltip } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { toggleToolEnabled } from '@/store/mcpStore';
import type { MCPTool } from '@/store/mcpStore';

interface ToolManagerModalProps {
  open: boolean;
  onClose: () => void;
  themeColor?: string;
}

const ToolManagerModal: React.FC<ToolManagerModalProps> = ({ open, onClose, themeColor = 'var(--primary-color)' }) => {
  const servers = useSelector((state: RootState) => state.mcp.servers);
  const dispatch: AppDispatch = useDispatch();
  const [selectedTool, setSelectedTool] = useState<{serverId: string, tool: MCPTool} | null>(null);

  // 工具开关切换逻辑，支持启用/禁用工具
  const handleToolSwitch = (serverId: string, tool: MCPTool, checked: boolean) => {
    dispatch(toggleToolEnabled({ serverId, toolName: tool.name, enabled: checked }));
  };

  // 计算统计信息
  const connectedServers = servers.filter(s => s.isConnected);
  const totalTools = servers.reduce((acc, server) => acc + (server.tools?.length || 0), 0);
  const enabledTools = servers.reduce((acc, server) => 
    acc + (server.tools?.filter(tool => tool.enabled)?.length || 0), 0
  );

  return (
    <Modal
      title="MCP 工具管理"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      styles={{ body: { minHeight: 480 } }}
    >
      {/* 统计信息头部 */}
      <div style={{ 
        marginBottom: 16, 
        padding: '12px 16px', 
        background: 'var(--background-tertiary)', 
        borderRadius: 6,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid var(--border-color-split)'
      }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <span style={{ color: 'var(--text-color-secondary)', fontSize: 12 }}>服务器总数</span>
            <div style={{ fontSize: 18, fontWeight: 600, color: themeColor }}>
              {servers.length}
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-color-secondary)', fontSize: 12 }}>已连接</span>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--success-color, #52c41a)' }}>
              {connectedServers.length}
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-color-secondary)', fontSize: 12 }}>工具总数</span>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--info-color, #1890ff)' }}>
              {totalTools}
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-color-secondary)', fontSize: 12 }}>已启用工具</span>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--warning-color, #722ed1)' }}>
              {enabledTools}
            </div>
          </div>
        </div>
        {selectedTool && (
          <Tag color="blue">
            已选择: {selectedTool.tool.title || selectedTool.tool.name}
          </Tag>
        )}
      </div>

      <div style={{ display: 'flex', gap: 32 }}>
        {/* 左侧：server-tool 二级列表 */}
        <div style={{ flex: 1, minWidth: 320, maxHeight: 500, overflowY: 'auto', borderRight: '1px solid var(--border-color-split)', paddingRight: 16 }}>
          {servers.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: 'var(--text-color-secondary)',
              marginTop: 60,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{ fontSize: 48, opacity: 0.3 }}>🌐</div>
              <div>暂无MCP服务器</div>
              <div style={{ fontSize: 12, color: 'var(--text-color-tertiary)' }}>请先添加并连接MCP服务器</div>
            </div>
          ) : (
            servers.map(server => {
              return (
                <div key={server.id} style={{ marginBottom: 16 }}>
                  <div style={{ 
                    fontWeight: 500, 
                    marginBottom: 4, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    color: 'var(--text-color)'
                  }}>
                    <span>{server.name}</span>
                    <Tag color={server.isConnected ? 'green' : 'default'}>
                      {server.isConnected ? '已连接' : '未连接'}
                    </Tag>
                    {server.loading && <Tag color="orange">连接中...</Tag>}
                  </div>
                  {server.error && (
                    <div style={{ color: 'var(--error-color, #ff4d4f)', fontSize: 12, marginBottom: 4 }}>
                      错误: {server.error}
                    </div>
                  )}
                  {(server.tools?.length || 0) > 0 ? (
                    <List
                      size="small"
                      dataSource={server.tools || []}
                      renderItem={(tool: MCPTool) => {
                        const isActive = selectedTool?.tool.name === tool.name && selectedTool?.serverId === server.id;
                        return (
                          <List.Item
                            style={{
                              background: isActive ? themeColor + '20' : 'var(--background-secondary)',
                              border: isActive ? `1.5px solid ${themeColor}` : '1.5px solid var(--border-color-split)',
                              cursor: 'pointer',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'all 0.2s',
                              opacity: server.isConnected ? 1 : 0.6,
                            }}
                            onClick={() => setSelectedTool({ serverId: server.id, tool })}
                          >
                            <Tooltip title={server.isConnected ? tool.description : '服务器未连接'}>
                              <span style={{ 
                                flex: 1, 
                                color: isActive ? themeColor : 'var(--text-color)' 
                              }}>
                                {tool.title || tool.name}
                              </span>
                            </Tooltip>
                            <Switch
                              size="small"
                              checked={tool.enabled}
                              disabled={!server.isConnected}
                              onChange={checked => handleToolSwitch(server.id, tool, checked)}
                              style={{ marginLeft: 8 }}
                            />
                          </List.Item>
                        );
                      }}
                    />
                  ) : (
                    <div style={{ color: 'var(--text-color-tertiary)', fontSize: 12, marginLeft: 8 }}>
                      {server.isConnected ? '无可用工具' : '请先连接服务器'}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        {/* 右侧：工具详细信息 */}
        <div style={{ flex: 2, minWidth: 320, paddingLeft: 16 }}>
          {selectedTool ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <h3 style={{ margin: 0, color: 'var(--text-color)' }}>
                  {selectedTool.tool.title || selectedTool.tool.name}
                </h3>
                <Tag color={selectedTool.tool.enabled ? 'green' : 'default'}>
                  {selectedTool.tool.enabled ? '已启用' : '已禁用'}
                </Tag>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              
              <div style={{ marginBottom: 12 }}>
                <b style={{ color: 'var(--text-color)' }}>服务器：</b>
                <span style={{ marginLeft: 8, color: 'var(--text-color)' }}>
                  {servers.find(s => s.id === selectedTool.serverId)?.name || '未知'}
                </span>
                <Tag 
                  color={servers.find(s => s.id === selectedTool.serverId)?.isConnected ? 'green' : 'red'} 
                  style={{ marginLeft: 8 }}
                >
                  {servers.find(s => s.id === selectedTool.serverId)?.isConnected ? '已连接' : '未连接'}
                </Tag>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <b style={{ color: 'var(--text-color)' }}>工具名称：</b>
                <span style={{ 
                  marginLeft: 8, 
                  fontFamily: 'monospace', 
                  background: 'var(--background-tertiary)', 
                  color: 'var(--text-color)', 
                  padding: '2px 4px', 
                  borderRadius: 3,
                  border: '1px solid var(--border-color-split)'
                }}>
                  {selectedTool.tool.name}
                </span>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <b style={{ color: 'var(--text-color)' }}>类型：</b>
                <Tag style={{ marginLeft: 8 }}>{String(selectedTool.tool.type || 'function')}</Tag>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <b style={{ color: 'var(--text-color)' }}>描述：</b>
                <div style={{ 
                  marginTop: 4, 
                  padding: '8px 12px', 
                  background: 'var(--background-secondary)', 
                  color: 'var(--text-color)',
                  borderRadius: 4, 
                  border: '1px solid var(--border-color-split)',
                  lineHeight: 1.5
                }}>
                  {selectedTool.tool.description || '暂无描述'}
                </div>
              </div>

              {/* 工具状态和操作 */}
              <div style={{ 
                marginTop: 16, 
                padding: '12px', 
                background: 'var(--background-tertiary)', 
                borderRadius: 4,
                border: '1px solid var(--border-color-split)'
              }}>
                <div style={{ marginBottom: 8 }}>
                  <b style={{ color: 'var(--text-color)' }}>工具状态：</b>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Switch
                    checked={selectedTool.tool.enabled}
                    disabled={!servers.find(s => s.id === selectedTool.serverId)?.isConnected}
                    onChange={checked => handleToolSwitch(selectedTool.serverId, selectedTool.tool, checked)}
                  />
                  <span style={{ fontSize: 14, color: 'var(--text-color)' }}>
                    {selectedTool.tool.enabled ? '启用此工具' : '禁用此工具'}
                  </span>
                </div>
                {!servers.find(s => s.id === selectedTool.serverId)?.isConnected && (
                  <div style={{ fontSize: 12, color: 'var(--text-color-tertiary)', marginTop: 4 }}>
                    需要先连接服务器才能切换工具状态
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              color: 'var(--text-color-secondary)', 
              fontSize: 14,
              marginTop: 100,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{ fontSize: 48, opacity: 0.3 }}>🔧</div>
              <div>请从左侧选择一个工具查看详细信息</div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ToolManagerModal;
