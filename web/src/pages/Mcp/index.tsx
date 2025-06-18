import React, { useState } from 'react';
import { List, Button, Modal, Form, Input, Collapse, message } from 'antd';
import { PlusOutlined, ApiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useMCPStore } from '@/store/mcpStore';
import './styles.less';

const { Panel } = Collapse;

interface ServerFormData {
  name: string;
  url: string;
}

const Mcp = () => {
  const { 
    servers,
    activeServerId,
    isLoading,
    addServer,
    removeServer,
    connectServer,
    disconnectServer,
    setActiveServer,
  } = useMCPStore();

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
                title={server.name}
                description={server.url}
              />
              {server.error && (
                <div className="error-message">
                  连接失败：{server.error}
                </div>
              )}
              {server.isConnected && server.tools.length > 0 && (
                <Collapse ghost className="server-tools">
                  <Panel header={`工具列表 (${server.tools.length})`} key="1">
                    <List
                      size="small"
                      dataSource={server.tools}
                      renderItem={(tool) => (
                        <List.Item>
                          <List.Item.Meta
                            title={tool.name}
                            description={tool.description}
                          />
                        </List.Item>
                      )}
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
    </div>
  );
};

export default Mcp;
