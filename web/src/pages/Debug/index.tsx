import React, { useState } from 'react';
import { Button, Card, Space, Typography, Input, Select, message, InputNumber, Switch } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { BugOutlined, PlusOutlined, SendOutlined, DeleteOutlined, ToolOutlined, LoadingOutlined } from '@ant-design/icons';
import type { RootState } from '@/store';
import type { MessageRole } from '@engine/types/chat';
import type { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';
import { addMessage, clearMessages, updateLastAssistantMessage } from '@/store/chatSlice';
import { showLoading, hideLoading } from '@/store/globalUIStore';
import './styles.less';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Debug: React.FC = () => {
  const dispatch = useDispatch();
  const chatData = useSelector((state: RootState) => state.chat.chatData);
  const currentChatId = useSelector((state: RootState) => state.chat.currentChatId);
  const globalUIState = useSelector((state: RootState) => state.globalUI);
  
  // MCP 相关状态
  const mcpState = useSelector((state: RootState) => state.mcp);
  const mcpServers = mcpState.servers;
  const connectedServers = mcpServers.filter(s => s.isConnected);
  const availableTools = mcpServers.reduce((acc, server) => acc + server.tools.length, 0);

  const [toolMessageContent, setToolMessageContent] = useState('这是一个测试工具消息，用于调试UI交互功能。');
  const [selectedMessageType, setSelectedMessageType] = useState<MessageRole>('tool');
  
  // 工具调用相关状态
  const [toolName, setToolName] = useState('query_website');
  const [toolArguments, setToolArguments] = useState('{"url": "https://www.example.com", "query": "获取网站标题和描述"}');
  const [toolStatus, setToolStatus] = useState<'calling' | 'success' | 'error'>('success');
  const [toolDelay, setToolDelay] = useState(10); // 工具完成延迟时间（秒）
  const [isToolCollapsed, setIsToolCollapsed] = useState(true);
  const [toolContent, setToolContent] = useState('网站查询完成！\n\n网站标题：Example Domain\n网站描述：This domain is for use in illustrative examples in documents.\n响应时间：8.2秒\n状态码：200');
  const [showCallingState, setShowCallingState] = useState(true); // 是否显示调用中状态
  
  // 动画控制状态
  const [useBackgroundPulse, setUseBackgroundPulse] = useState(false); // 是否使用背景脉冲
  const [animationPhaseCounter, setAnimationPhaseCounter] = useState(0); // 动画相位计数器
  
  // 全局加载状态
  const [memoryLoadingDuration, setMemoryLoadingDuration] = useState(3); // 内存加载持续时间（秒）

  // 添加测试消息到当前聊天
  const handleAddTestMessage = () => {
    if (!currentChatId) {
      message.error('请先选择或创建一个聊天');
      return;
    }

    const baseMessage = {
      id: `test-${Date.now()}`,
      content: toolMessageContent,
      timestamp: Date.now(),
    };

    let testMessage;

    switch (selectedMessageType) {
      case 'user':
        testMessage = {
          ...baseMessage,
          role: 'user' as const,
        };
        break;
      case 'assistant':
        testMessage = {
          ...baseMessage,
          role: 'assistant' as const,
          reasoning_content: '这是一个测试的思考过程内容，用于验证reasoning功能的显示效果。',
        };
        break;
      case 'tool':
        testMessage = {
          ...baseMessage,
          role: 'tool' as const,
          tool_call_id: `tool_call_${Date.now()}`,
        };
        break;
      case 'client-notice':
        testMessage = {
          ...baseMessage,
          role: 'client-notice' as const,
          noticeType: 'info' as const,
        };
        break;
      default:
        testMessage = {
          ...baseMessage,
          role: 'assistant' as const,
        };
    }

    // 直接添加消息到Redux状态
    dispatch(addMessage({
      chatId: currentChatId,
      message: testMessage
    }));

    console.log('[Debug] 添加测试消息:', testMessage);
    message.success(`成功添加${selectedMessageType}消息`);
  };

  // 清空当前聊天的所有消息
  const handleClearMessages = () => {
    if (!currentChatId) {
      message.error('请先选择或创建一个聊天');
      return;
    }

    dispatch(clearMessages({ chatId: currentChatId }));

    message.success('已清空当前聊天的所有消息');
  };

  // 触发全局内存加载
  const handleTriggerMemoryLoading = () => {
    const duration = memoryLoadingDuration * 1000; // 转换为毫秒
    
    // 开始加载
    dispatch(showLoading());
    message.info(`启动全局内存加载，持续 ${memoryLoadingDuration} 秒...`);
    
    // 模拟加载过程
    setTimeout(() => {
      dispatch(hideLoading());
      message.success('全局内存加载完成！');
    }, duration);
  };

  // 快速触发多次加载（测试叠加效果）
  const handleTriggerMultipleLoading = () => {
    const count = 3;
    message.info(`启动 ${count} 个并发内存加载任务...`);
    
    for (let i = 0; i < count; i++) {
      dispatch(showLoading());
      
      setTimeout(() => {
        dispatch(hideLoading());
        if (i === count - 1) {
          message.success('所有内存加载任务完成！');
        }
      }, (i + 1) * 2000); // 每个任务持续2秒，但错开结束时间
    }
  };

  // 模拟流式更新
  const handleSimulateStreaming = () => {
    if (!currentChatId) {
      message.error('请先选择或创建一个聊天');
      return;
    }

    const baseMessage = {
      id: `streaming-test-${Date.now()}`,
      content: '',
      role: 'assistant' as const,
      timestamp: Date.now(),
      reasoning_content: '正在思考如何回答这个问题...',
    };

    // 添加空消息
    dispatch(addMessage({
      chatId: currentChatId,
      message: baseMessage
    }));

    // 模拟流式更新
    const fullText = '这是一个模拟的流式更新测试。文本会逐步显示，就像真实的AI回复一样。可以用来测试UI的流式更新效果。';
    let currentText = '';
    let index = 0;

    const interval = setInterval(() => {
      if (index < fullText.length) {
        currentText += fullText[index];
        
        dispatch(updateLastAssistantMessage({
          chatId: currentChatId,
          message: { content: currentText }
        }));
        
        index++;
      } else {
        clearInterval(interval);
        message.success('流式更新模拟完成');
      }
    }, 100);
  };

  // 添加工具消息到最后一条消息
  const handleAddToolToLastMessage = () => {
    if (!currentChatId) {
      message.error('请先选择或创建一个聊天');
      return;
    }

    const currentMessages = chatData[currentChatId]?.messages || [];
    if (currentMessages.length === 0) {
      message.error('当前聊天没有消息，请先发送一条消息');
      return;
    }

    const toolMessage = {
      id: `tool-${Date.now()}`,
      content: toolMessageContent,
      role: 'tool' as const,
      tool_call_id: `tool_call_${Date.now()}`,
      timestamp: Date.now(),
    };

    dispatch(addMessage({
      chatId: currentChatId,
      message: toolMessage
    }));

    message.success('成功在最后添加工具消息');
  };

  // 添加带有工具调用的助手消息
  const handleAddAssistantWithToolCall = () => {
    if (!currentChatId) {
      message.error('请先选择或创建一个聊天');
      return;
    }

    // 计算当前动画相位（每次添加递增，创建错开的动画效果）
    const currentPhase = (animationPhaseCounter % 3) / 3; // 0, 0.33, 0.67
    setAnimationPhaseCounter(prev => prev + 1);

    // 只添加一个完整的工具调用消息，包含所有信息和自动状态变化
    const toolMessage = {
      id: `tool-complete-${Date.now()}`,
      content: toolDelay > 0 ? '正在调用工具...' : (toolStatus === 'error' ? '工具调用失败：模拟错误' : toolContent),
      role: 'tool' as const,
      tool_call_id: `call_${Date.now()}`,
      timestamp: Date.now(),
      // 工具调用相关信息
      toolName: toolName,
      toolArguments: toolArguments,
      toolStatus: toolDelay > 0 ? 'calling' as const : toolStatus,
      // 调试配置
      debugConfig: {
        autoStatusChange: toolDelay > 0 ? {
          delay: toolDelay * 1000,
          finalStatus: toolStatus,
          finalContent: toolStatus === 'error' ? '工具调用失败：模拟错误' : toolContent,
        } : undefined,
        animationPhase: currentPhase,
        useBackgroundPulse: useBackgroundPulse,
      }
    };

    dispatch(addMessage({
      chatId: currentChatId,
      message: toolMessage
    }));

    message.success(`成功添加完整工具调用流程 (相位: ${currentPhase.toFixed(2)}, ${useBackgroundPulse ? '背景脉冲' : '底边脉冲'})`);
  };

  // 仅添加工具调用（不添加结果）
  const handleAddToolCallOnly = () => {
    if (!currentChatId) {
      message.error('请先选择或创建一个聊天');
      return;
    }

    const toolCall: ChatCompletionMessageToolCall = {
      id: `call_${Date.now()}`,
      type: 'function',
      function: {
        name: toolName,
        arguments: toolArguments,
      },
    };

    const assistantMessage = {
      id: `assistant-tool-only-${Date.now()}`,
      content: '我需要调用工具来帮助您。',
      role: 'assistant' as const,
      tool_calls: [toolCall],
      timestamp: Date.now(),
    };

    dispatch(addMessage({
      chatId: currentChatId,
      message: assistantMessage
    }));

    message.success('成功添加工具调用（仅显示调用中状态）');
    console.log('[Debug] 工具调用ID:', toolCall.id, '- 可用于后续添加结果');
  };

  const currentMessages = currentChatId ? (chatData[currentChatId]?.messages || []) : [];

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <BugOutlined style={{ marginRight: 8 }} />
        <Title level={4} style={{ margin: 0 }}>调试模式</Title>
      </div>

      <div className="debug-content">
        <Card title="消息测试" size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>消息类型：</Text>
              <Select
                value={selectedMessageType}
                onChange={setSelectedMessageType}
                style={{ width: '100%', marginTop: 4 }}
              >
                <Option value="user">� User 消息</Option>
                <Option value="assistant">🤖 Assistant 消息</Option>
                <Option value="tool">🔧 Tool 消息</Option>
                <Option value="client-notice">� Client Notice 消消息</Option>
              </Select>
            </div>
            
            <div>
              <Text strong>消息内容：</Text>
              <TextArea
                value={toolMessageContent}
                onChange={(e) => setToolMessageContent(e.target.value)}
                placeholder="输入测试消息内容..."
                rows={3}
                style={{ marginTop: 4 }}
              />
            </div>

            <Space wrap>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddTestMessage}
              >
                添加测试消息
              </Button>
              
              <Button
                icon={<PlusOutlined />}
                onClick={handleAddToolToLastMessage}
              >
                在最后添加Tool消息
              </Button>
            </Space>
          </Space>
        </Card>

        <Card title="工具调用测试" size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>工具名称：</Text>
              <Input
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                placeholder="例如：search_web, get_weather"
                style={{ marginTop: 4 }}
              />
            </div>

            <div>
              <Text strong>工具参数 (JSON)：</Text>
              <TextArea
                value={toolArguments}
                onChange={(e) => setToolArguments(e.target.value)}
                placeholder='{"query": "测试查询"}'
                rows={2}
                style={{ marginTop: 4 }}
              />
            </div>

            <div>
              <Text strong>工具状态：</Text>
              <Select
                value={toolStatus}
                onChange={setToolStatus}
                style={{ width: '100%', marginTop: 4 }}
              >
                <Option value="calling">🔄 调用中</Option>
                <Option value="success">✅ 成功</Option>
                <Option value="error">❌ 失败</Option>
              </Select>
            </div>

            <div>
              <Text strong>完成延迟 (秒)：</Text>
              <InputNumber
                value={toolDelay}
                onChange={(value) => setToolDelay(value || 0)}
                min={0}
                max={10}
                style={{ width: '100%', marginTop: 4 }}
                placeholder="0表示立即完成"
              />
            </div>
            <div>
              <Text strong>默认折叠状态：</Text>
              <Switch
                checked={isToolCollapsed}
                onChange={setIsToolCollapsed}
                style={{ marginLeft: 8 }}
              />
            </div>

            <div>
              <Text strong>显示调用中状态：</Text>
              <Switch
                checked={showCallingState}
                onChange={setShowCallingState}
                style={{ marginLeft: 8 }}
              />
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                开启后会先显示工具调用状态，然后显示结果
              </Text>
            </div>

            <div>
              <Text strong>工具调用结果内容：</Text>
              <TextArea
                value={toolContent}
                onChange={(e) => setToolContent(e.target.value)}
                placeholder="工具调用的返回结果内容..."
                rows={3}
                style={{ marginTop: 4 }}
              />
            </div>

            <div>
              <Text strong>脉冲动画类型：</Text>
              <Switch
                checked={useBackgroundPulse}
                onChange={setUseBackgroundPulse}
                style={{ marginLeft: 8 }}
              />
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                {useBackgroundPulse ? '背景脉冲' : '底边脉冲'}
              </Text>
            </div>

            <div>
              <Text strong>动画相位计数：</Text>
              <Text code style={{ marginLeft: 8 }}>{animationPhaseCounter}</Text>
              <Button 
                size="small" 
                onClick={() => setAnimationPhaseCounter(0)}
                style={{ marginLeft: 8 }}
              >
                重置
              </Button>
            </div>

            <Space wrap>
              <Button
                type="primary"
                icon={<ToolOutlined />}
                onClick={handleAddAssistantWithToolCall}
              >
                添加完整工具调用流程
              </Button>
              
              <Button
                icon={<ToolOutlined />}
                onClick={handleAddToolCallOnly}
              >
                仅添加工具调用（调用中状态）
              </Button>
            </Space>
          </Space>
        </Card>

        <Card title="流式更新测试" size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Paragraph type="secondary" style={{ margin: 0 }}>
              模拟AI回复的流式更新效果，测试UI的实时更新表现。
            </Paragraph>
            <Button
              type="default"
              icon={<SendOutlined />}
              onClick={handleSimulateStreaming}
            >
              开始流式更新模拟
            </Button>
          </Space>
        </Card>

        <Card title="聊天管理" size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>当前聊天ID：</Text>
              <Text code>{currentChatId || '未选择'}</Text>
            </div>
            <div>
              <Text strong>消息数量：</Text>
              <Text>{currentMessages.length}</Text>
            </div>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleClearMessages}
            >
              清空当前聊天消息
            </Button>
          </Space>
        </Card>

        <Card title="全局UI状态" size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>当前加载计数：</Text>
              <Text code style={{ marginLeft: 8 }}>{globalUIState.loadingCount}</Text>
              {globalUIState.loadingCount > 0 && (
                <LoadingOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
              )}
            </div>
            <div>
              <Text strong>DM模式：</Text>
              <Text code style={{ marginLeft: 8 }}>{globalUIState.dmMode ? '开启' : '关闭'}</Text>
            </div>
            
            <div>
              <Text strong>内存加载持续时间（秒）：</Text>
              <InputNumber
                value={memoryLoadingDuration}
                onChange={(value) => setMemoryLoadingDuration(value || 1)}
                min={1}
                max={30}
                style={{ width: '100%', marginTop: 4 }}
              />
            </div>

            <Space wrap>
              <Button
                type="primary"
                icon={<LoadingOutlined />}
                onClick={handleTriggerMemoryLoading}
              >
                触发内存加载
              </Button>
              
              <Button
                onClick={handleTriggerMultipleLoading}
              >
                触发多重加载
              </Button>
              
              <Button
                danger
                onClick={() => {
                  // 强制重置加载计数
                  const currentCount = globalUIState.loadingCount;
                  for (let i = 0; i < currentCount; i++) {
                    dispatch(hideLoading());
                  }
                  message.success('已强制重置加载状态');
                }}
              >
                重置加载状态
              </Button>
            </Space>
          </Space>
        </Card>

        <Card title="MCP 服务器测试" size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>MCP 实时状态：</Text>
              <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                <div><Text>服务器总数：<Text code>{mcpServers.length}</Text></Text></div>
                <div><Text>已连接服务器：<Text code>{connectedServers.length}</Text></Text></div>
                <div><Text>可用工具数：<Text code>{availableTools}</Text></Text></div>
                <div><Text>活跃服务器：<Text code>{mcpState.activeServerId || '无'}</Text></Text></div>
              </div>
            </div>

            <div>
              <Text strong>MCP 消息提示测试：</Text>
              <Space wrap style={{ marginTop: 8 }}>
                <Button 
                  size="small"
                  onClick={() => {
                    import('@/services/mcpNotificationService').then(({ mcpNotificationService }) => {
                      mcpNotificationService.showServerConnected('测试服务器', 5);
                    });
                  }}
                >
                  连接成功
                </Button>
                <Button 
                  size="small"
                  onClick={() => {
                    import('@/services/mcpNotificationService').then(({ mcpNotificationService }) => {
                      mcpNotificationService.showServerConnectionFailed('测试服务器', '连接超时');
                    });
                  }}
                >
                  连接失败
                </Button>
                <Button 
                  size="small"
                  onClick={() => {
                    import('@/services/mcpNotificationService').then(({ mcpNotificationService }) => {
                      mcpNotificationService.showServerDisconnected('测试服务器');
                    });
                  }}
                >
                  断开连接
                </Button>
              </Space>
            </div>

            <div>
              <Text strong>重连测试：</Text>
              <Space wrap style={{ marginTop: 8 }}>
                <Button 
                  size="small"
                  onClick={() => {
                    import('@/services/mcpNotificationService').then(({ mcpNotificationService }) => {
                      mcpNotificationService.showReconnectCompleted({
                        successCount: 3,
                        failureCount: 0,
                        totalCount: 3
                      });
                    });
                  }}
                >
                  全部成功
                </Button>
                <Button 
                  size="small"
                  onClick={() => {
                    import('@/services/mcpNotificationService').then(({ mcpNotificationService }) => {
                      mcpNotificationService.showReconnectCompleted({
                        successCount: 2,
                        failureCount: 1,
                        totalCount: 3
                      });
                    });
                  }}
                >
                  部分成功
                </Button>
                <Button 
                  size="small"
                  onClick={() => {
                    import('@/services/mcpNotificationService').then(({ mcpNotificationService }) => {
                      mcpNotificationService.showReconnectCompleted({
                        successCount: 0,
                        failureCount: 3,
                        totalCount: 3
                      });
                    });
                  }}
                >
                  全部失败
                </Button>
              </Space>
            </div>

            <div>
              <Text strong>工具调用测试：</Text>
              <Space wrap style={{ marginTop: 8 }}>
                <Button 
                  size="small"
                  onClick={() => {
                    import('@/services/mcpNotificationService').then(({ mcpNotificationService }) => {
                      mcpNotificationService.showToolCallSuccess('search_web', '测试服务器');
                    });
                  }}
                >
                  工具成功
                </Button>
                <Button 
                  size="small"
                  onClick={() => {
                    import('@/services/mcpNotificationService').then(({ mcpNotificationService }) => {
                      mcpNotificationService.showToolCallFailed('search_web', '测试服务器', '网络超时');
                    });
                  }}
                >
                  工具失败
                </Button>
              </Space>
            </div>

            <div>
              <Text strong>实际重连功能：</Text>
              <Space wrap style={{ marginTop: 8 }}>
                <Button 
                  type="primary"
                  size="small"
                  onClick={() => {
                    import('@/test/mcpReconnectTest').then(({ testMCPReconnect }) => {
                      testMCPReconnect();
                    });
                  }}
                >
                  测试实际重连
                </Button>
                <Button 
                  size="small"
                  onClick={() => {
                    import('@/test/mcpReconnectTest').then(({ testReconnectMessage }) => {
                      testReconnectMessage();
                    });
                  }}
                >
                  测试重连消息
                </Button>
              </Space>
            </div>

            <div>
              <Text strong>MCP 状态信息：</Text>
              <div style={{ marginTop: 8 }}>
                <Button 
                  size="small"
                  onClick={() => {
                    import('@/store').then(({ store }) => {
                      const state = store.getState();
                      const servers = state.mcp.servers;
                      const connectedServers = servers.filter(s => s.isConnected);
                      console.log('MCP 服务器状态:', {
                        总数: servers.length,
                        已连接: connectedServers.length,
                        服务器列表: servers.map(s => ({
                          id: s.id,
                          名称: s.name,
                          连接状态: s.isConnected ? '已连接' : '未连接',
                          工具数量: s.tools.length
                        }))
                      });
                      message.info(`MCP 状态：${servers.length} 个服务器，${connectedServers.length} 个已连接`);
                    });
                  }}
                >
                  查看 MCP 状态
                </Button>
                <Button 
                  size="small"
                  onClick={() => {
                    import('@/store').then(({ store }) => {
                      import('@/store/mcpStore').then(({ reconnectServers }) => {
                        store.dispatch(reconnectServers());
                      });
                    });
                  }}
                >
                  手动触发重连
                </Button>
              </div>
            </div>

            <div>
              <Text strong>调试工具：</Text>
              <div style={{ marginTop: 8 }}>
                <Button 
                  size="small"
                  onClick={() => {
                    // 创建一个模拟的 MCP 服务器用于测试
                    import('@/store').then(({ store }) => {
                      import('@/store/mcpStore').then(({ addServer }) => {
                        const testServer = {
                          name: '调试测试服务器',
                          url: 'http://localhost:3999'
                        };
                        store.dispatch(addServer(testServer));
                        message.success('已添加测试服务器到 MCP 列表');
                      });
                    });
                  }}
                >
                  添加测试服务器
                </Button>
                <Button 
                  size="small"
                  onClick={() => {
                    // 清理所有 MCP 连接
                    import('@/store').then(({ store }) => {
                      import('@/store/mcpStore').then(({ clearAllConnections }) => {
                        store.dispatch(clearAllConnections());
                        message.success('已清理所有 MCP 连接');
                      });
                    });
                  }}
                >
                  清理所有连接
                </Button>
              </div>
            </div>
          </Space>
        </Card>

        <Card title="开发者工具" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              onClick={() => {
                console.log('当前Redux状态:', (window as any).__REDUX_STORE__?.getState());
              }}
            >
              打印Redux状态到控制台
            </Button>
            
            <Button
              onClick={() => {
                // 简化的调试工具注入
                (window as any).debugTools = {
                  addToolMessage: (content = '调试工具消息') => {
                    console.log('添加工具消息:', content);
                  },
                  clearMessages: () => {
                    console.log('清理消息');
                  }
                };
                console.log('调试工具已加载到 window.debugTools');
                message.success('调试工具已注入到控制台');
              }}
            >
              注入控制台调试工具
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default Debug;
