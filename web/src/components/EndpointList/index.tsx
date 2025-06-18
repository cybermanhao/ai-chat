import React, { useCallback } from 'react';
import { List, Card, Button, Space, Modal, message } from 'antd';
import { EditOutlined, DeleteOutlined, LinkOutlined, DisconnectOutlined } from '@ant-design/icons';
import type { OpenAIEndpoint } from '@/types/openai';
import { useOpenAIEndpoint } from '@/hooks/store/useOpenAIEndpoint';
import { useModalState } from '@/hooks/ui/useModalState';
import { EndpointModal } from '../EndpointModal';

export const EndpointList: React.FC = () => {
  const {
    endpoints,
    activeEndpointId,
    removeEndpoint,
    setActiveEndpoint,
    connectEndpoint,
    disconnectEndpoint,
  } = useOpenAIEndpoint();

  const { setVisible: setModalVisible } = useModalState<OpenAIEndpoint>();

  const handleEdit = useCallback((endpoint: OpenAIEndpoint) => {
    setModalVisible(true, endpoint);
  }, [setModalVisible]);

  const handleDelete = useCallback((endpoint: OpenAIEndpoint) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除端点"${endpoint.name}"吗？`,
      okText: '删除',
      okType: 'danger',
      onOk: async () => {
        try {
          removeEndpoint(endpoint.id);
          message.success('删除成功');
        } catch {
          message.error('删除失败');
        }
      },
    });
  }, [removeEndpoint]);

  const handleConnect = useCallback(async (endpoint: OpenAIEndpoint) => {
    try {
      await connectEndpoint(endpoint.id);
      message.success('连接成功');
    } catch {
      message.error('连接失败');
    }
  }, [connectEndpoint]);

  return (
    <>
      <List<OpenAIEndpoint>
        grid={{ gutter: 16, column: 1 }}
        dataSource={endpoints}
        renderItem={(endpoint) => (
          <List.Item>
            <Card
              hoverable
              className={activeEndpointId === endpoint.id ? 'selected' : ''}
              onClick={() => setActiveEndpoint(endpoint.id)}
            >
              <Card.Meta
                title={endpoint.name}
                description={endpoint.baseURL}
              />
              <Space className="card-actions">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(endpoint);
                  }}
                >
                  编辑
                </Button>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(endpoint);
                  }}
                >
                  删除
                </Button>
                <Button
                  type={endpoint.isConnected ? 'primary' : 'default'}
                  icon={endpoint.isConnected ? <DisconnectOutlined /> : <LinkOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (endpoint.isConnected) {
                      disconnectEndpoint(endpoint.id);
                    } else {
                      handleConnect(endpoint);
                    }
                  }}
                >
                  {endpoint.isConnected ? '断开' : '连接'}
                </Button>
              </Space>
            </Card>
          </List.Item>
        )}
      />
      <EndpointModal />
    </>
  );
};
