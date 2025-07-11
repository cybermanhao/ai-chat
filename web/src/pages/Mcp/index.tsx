import { useState } from 'react';
import { List, Button, Modal, Form, Input, Collapse, Switch, message as antdMessage } from 'antd';
import { PlusOutlined, ApiOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { addServer, removeServer, setActiveServer, connectServer, disconnectServer } from '@/store/mcpStore';
import './styles.less';
import ToolManagerModal from '@/components/Modal/ToolManagerModal';
import type { MCPTool } from '@/services/mcpService';

interface ServerFormData {
  name: string;
  url: string;
}

const Mcp = () => {
  const servers = useSelector((state: RootState) => state.mcp.servers);
  const activeServerId = useSelector((state: RootState) => state.mcp.activeServerId);
  const isLoading = useSelector((state: RootState) => state.mcp.isLoading);
  const dispatch: AppDispatch = useDispatch();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm<ServerFormData>();
  const [messageApi, contextHolder] = antdMessage.useMessage();

  const handleAddServer = async () => {
    try {
      const values = await form.validateFields();
      dispatch(addServer({ name: values.name, url: values.url }));
      setIsModalVisible(false);
      form.resetFields();
      messageApi.success('服务器添加成功');
    } catch {
      // Form validation error, no need to handle
    }
  };

  const handleToggleConnection = async (serverId: string, connected: boolean) => {
    try {
      if (connected) {
        // 连接服务器
        const server = servers.find(s => s.id === serverId);
        if (server) {
          await dispatch(connectServer({ serverId, url: server.url })).unwrap();
          messageApi.success('服务器连接成功');
        }
      } else {
        // 断开服务器连接
        await dispatch(disconnectServer(serverId)).unwrap();
        messageApi.success('服务器已断开连接');
      }
    } catch (error) {
      messageApi.error(`操作失败: ${error}`);
    }
  };

  // connectServer/disconnectServer 相关逻辑如为异步 thunk，可后续补充
  // const handleServerAction = async (serverId: string, isConnected: boolean) => {
  //   if (isConnected) {
  //     dispatch(disconnectServer(serverId));
  //   } else {
  //     await dispatch(connectServer(serverId));
  //   }
  // };

  const [isToolModalVisible, setIsToolModalVisible] = useState(false);

  return (
    <>
      {contextHolder}
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
                onClick={() => dispatch(setActiveServer(server.id))}
                actions={[
                  <div key="connection-control" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch
                      checked={server.isConnected}
                      loading={server.loading}
                      onChange={(checked) => handleToggleConnection(server.id, checked)}
                      checkedChildren="已连接"
                      unCheckedChildren="已断开"
                      size="small"
                    />
                    <Button
                      key="remove"
                      danger
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(removeServer(server.id));
                      }}
                    >
                      删除
                    </Button>
                  </div>
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
                  description={
                    <>
                      <span>{server.url}</span>
                      {server.error && (
                        <span style={{ color: '#ff4d4f', marginLeft: 8 }}>
                          连接失败：{server.error}）
                        </span>
                      )}
                    </>
                  }
                />
                {/* 连接失败时的额外提示和断开按钮 */}
                {server.error && (
                  <div style={{ color: '#ff4d4f', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    连接失败：{server.error}
                    {/*
                    {server.isConnected && (
                      <Button
                        size="small"
                        icon={<DisconnectOutlined />}
                        onClick={e => {
                          e.stopPropagation();
                          dispatch(disconnectServer(server.id));
                        }}
                        style={{ marginLeft: 8 }}
                      >
                        断开连接
                      </Button>
                    )}
                    */}
                  </div>
                )}
                {server.isConnected && Array.isArray(server.tools) && server.tools.length > 0 && (
                  <Collapse 
                    ghost 
                    className="server-tools"
                    items={[
                      {
                        key: '1',
                        label: `工具列表 (${server.tools.length})`,
                        children: (
                          <>
                            {/* 调试：打印工具列表 */}
                            <pre style={{ display: 'none' }}>{JSON.stringify(server.tools, null, 2)}</pre>
                            <List
                              size="small"
                              dataSource={server.tools as MCPTool[]}
                              renderItem={(_tool, toolIndex: number) => {
                                const toolData = (server.tools as MCPTool[])[toolIndex];
                                // 也可在此处调试
                                console.log('工具项:', toolData);
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
                          </>
                        )
                      }
                    ]}
                  />
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
    </>
  );
};

export default Mcp;
