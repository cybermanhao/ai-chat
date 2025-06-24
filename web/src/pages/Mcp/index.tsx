import { useState } from 'react';
import { List, Button, Modal, Form, Input, Collapse, message } from 'antd';
import { PlusOutlined, ApiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useStore } from 'zustand';
import { useMCPStore } from '@/store/mcpStore';
import './styles.less';
import ToolManagerModal from '@/components/Modal/ToolManagerModal';

const { Panel } = Collapse;

interface ServerFormData {
  name: string;
  url: string;
}

const Mcp = () => {
  const servers = useStore(useMCPStore, state => state.servers);
  const activeServerId = useStore(useMCPStore, state => state.activeServerId);
  const isLoading = useStore(useMCPStore, state => state.isLoading);
  const addServer = useStore(useMCPStore, state => state.addServer);
  const removeServer = useStore(useMCPStore, state => state.removeServer);
  const connectServer = useStore(useMCPStore, state => state.connectServer);
  const disconnectServer = useStore(useMCPStore, state => state.disconnectServer);
  const setActiveServer = useStore(useMCPStore, state => state.setActiveServer);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm<ServerFormData>();
  const handleAddServer = async () => {
    try {
      const values = await form.validateFields();
      addServer(values.name, values.url);
      setIsModalVisible(false);
      form.resetFields();
      message.success('服务器添加成功');
    } catch {
      // Form validation error, no need to handle
    }
  };

  const handleServerAction = async (serverId: string, isConnected: boolean) => {
    if (isConnected) {
      disconnectServer(serverId);
    } else {
      await connectServer(serverId);
    }
  };

  const [isToolModalVisible, setIsToolModalVisible] = useState(false);

  return (
    <div className="mcp-page">
      <div className="mcp-header">
        <h2>MCP服务器</h2>
        <Button 
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          添加服务器
        </Button>
        <Button
          style={{ marginLeft: 16 }}
          icon={<ApiOutlined />}
          onClick={() => setIsToolModalVisible(true)}
        >
          工具管理
        </Button>
      </div>

      <div className="mcp-content">
        <List
          itemLayout="vertical"
          dataSource={servers}
          loading={isLoading}
          renderItem={(server) => (
            <List.Item
              key={server.id}
              className={`server-item ${activeServerId === server.id ? 'active' : ''}`}
              onClick={() => setActiveServer(server.id)}
              actions={[
                <Button
                  key="connect"
                  type={server.isConnected ? 'default' : 'primary'}
                  icon={server.isConnected ? <DisconnectOutlined /> : <ApiOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleServerAction(server.id, server.isConnected);
                  }}
                  loading={isLoading}
                >
                  {server.isConnected ? '断开连接' : '连接'}
                </Button>,
                <Button
                  key="remove"
                  danger
                  onClick={(e) => {
                    e.stopPropagation();
                    removeServer(server.id);
                  }}
                >
                  删除
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  server.isConnected ? (
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#52c41a', marginRight: 8 }} />
                  ) : server.error ? (
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#ff4d4f', marginRight: 8 }} />
                  ) : null
                }
                title={server.name}
                description={server.url}
              />
              {server.error && (
                <div className="error-message" style={{ color: '#ff4d4f', marginTop: 4 }}>
                  连接失败：{server.error}
                </div>
              )}
              {server.isConnected && server.tools.length > 0 && (
                <Collapse ghost className="server-tools">
                  <Panel header={`工具列表 (${server.tools.length})`} key="1">
                    <List
                      size="small"
                      dataSource={server.tools}
                      renderItem={(_tool, toolIndex: number) => {
                        const toolData = server.tools?.[toolIndex];
                        return (
                          <List.Item>
                            <List.Item.Meta
                              title={toolData?.name || ''}
                              description={toolData?.description || ''}
                            />
                          </List.Item>
                        );
                      }}
                    />
                  </Panel>
                </Collapse>
              )}
            </List.Item>
          )}
        />
      </div>

      <Modal
        title="添加 MCP 服务器"
        open={isModalVisible}
        onOk={handleAddServer}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
      >
        <Form 
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="服务器名称"
            rules={[{ required: true, message: '请输入服务器名称' }]}
          >
            <Input placeholder="请输入服务器名称" />
          </Form.Item>
          <Form.Item
            name="url"
            label="服务器地址"
            rules={[
              { required: true, message: '请输入服务器地址' },
              { type: 'url', message: '请输入有效的URL地址' },
            ]}
          >
            <Input placeholder="例如: http://localhost:8000" />
          </Form.Item>
        </Form>
      </Modal>

      <ToolManagerModal
        open={isToolModalVisible}
        onClose={() => setIsToolModalVisible(false)}
      />
    </div>
  );
};

export default Mcp;
