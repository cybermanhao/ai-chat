import React, { useState } from 'react';
import { Button, Card, Input, Select, message, Typography, Space, Row, Col } from 'antd';
import { ModelAdapterManager, ModelAdapterType, type UnifiedLLMParams } from '@engine/adapters';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface TestResult {
  adapterType: ModelAdapterType;
  messages: any[];
  tools: any[];
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export default function AdapterTest() {
  const [model, setModel] = useState('deepseek-chat');
  const [provider, setProvider] = useState('deepseek');
  const [baseUrl, setBaseUrl] = useState('https://api.deepseek.com/v1');
  const [testMessage, setTestMessage] = useState('你好，请介绍一下你自己');
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testAdapter = async () => {
    setLoading(true);
    try {
      // 构建LLM配置
      const llmConfig = {
        id: provider,
        provider: provider,
        baseUrl: baseUrl,
        isOpenAICompatible: provider !== 'deepseek',
        models: [model],
        userModel: model
      };

      // 构建测试消息
      const testMessages = [
        {
          id: 'test-1',
          role: 'user' as const,
          content: testMessage,
          timestamp: Date.now(),
          chatId: 'test-chat'
        }
      ];

      // 构建统一参数
      const unifiedParams: UnifiedLLMParams = {
        llmConfig: llmConfig as any,
        model,
        messages: testMessages,
        tools: [], // 暂时不测试工具
        temperature: 0.7,
        maxTokens: 2000,
        parallelToolCalls: true
      };

      // 检测适配器类型
      const adapterType = ModelAdapterManager.detectAdapterType(llmConfig as any, model);
      
      // 转换消息
      const convertedMessages = ModelAdapterManager.convertMessages(unifiedParams);
      
      // 转换工具
      const convertedTools = ModelAdapterManager.convertTools(unifiedParams);
      
      // 验证参数
      const validation = ModelAdapterManager.validateParams(unifiedParams);

      setResult({
        adapterType,
        messages: convertedMessages,
        tools: convertedTools,
        validation
      });

      message.success('适配器测试完成！');
    } catch (error) {
      console.error('适配器测试失败:', error);
      message.error('适配器测试失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>模型适配器测试</Title>
      <Paragraph type="secondary">
        测试新的模型适配器系统，验证不同模型的消息格式转换和参数验证功能。
      </Paragraph>

      <Row gutter={24}>
        <Col span={12}>
          <Card title="配置参数" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>模型提供商:</Text>
                <Select 
                  value={provider} 
                  onChange={setProvider}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  <Option value="deepseek">DeepSeek</Option>
                  <Option value="openai">OpenAI</Option>
                  <Option value="openai-compatible">OpenAI兼容</Option>
                </Select>
              </div>

              <div>
                <Text strong>模型名称:</Text>
                <Input 
                  value={model} 
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="如: deepseek-chat, gpt-4"
                  style={{ marginTop: '8px' }}
                />
              </div>

              <div>
                <Text strong>API基础URL:</Text>
                <Input 
                  value={baseUrl} 
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="API基础URL"
                  style={{ marginTop: '8px' }}
                />
              </div>

              <div>
                <Text strong>测试消息:</Text>
                <TextArea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={3}
                  placeholder="输入要测试的消息内容"
                  style={{ marginTop: '8px' }}
                />
              </div>

              <Space>
                <Button type="primary" onClick={testAdapter} loading={loading}>
                  测试适配器
                </Button>
                <Button onClick={clearResult}>
                  清除结果
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col span={12}>
          {result && (
            <Card title="测试结果">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>检测到的适配器类型: </Text>
                  <Text code>{result.adapterType}</Text>
                </div>

                <div>
                  <Text strong>验证结果:</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Text type={result.validation.isValid ? 'success' : 'danger'}>
                      {result.validation.isValid ? '✅ 验证通过' : '❌ 验证失败'}
                    </Text>
                    {result.validation.errors.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <Text type="danger">错误:</Text>
                        <ul>
                          {result.validation.errors.map((error, index) => (
                            <li key={index}><Text type="danger">{error}</Text></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.validation.warnings.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <Text type="warning">警告:</Text>
                        <ul>
                          {result.validation.warnings.map((warning, index) => (
                            <li key={index}><Text type="warning">{warning}</Text></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Text strong>转换后的消息:</Text>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '12px', 
                    borderRadius: '6px',
                    fontSize: '12px',
                    maxHeight: '300px',
                    overflow: 'auto',
                    marginTop: '8px'
                  }}>
                    {JSON.stringify(result.messages, null, 2)}
                  </pre>
                </div>

                {result.tools.length > 0 && (
                  <div>
                    <Text strong>转换后的工具:</Text>
                    <pre style={{ 
                      background: '#f5f5f5', 
                      padding: '12px', 
                      borderRadius: '6px',
                      fontSize: '12px',
                      maxHeight: '200px',
                      overflow: 'auto',
                      marginTop: '8px'
                    }}>
                      {JSON.stringify(result.tools, null, 2)}
                    </pre>
                  </div>
                )}
              </Space>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}