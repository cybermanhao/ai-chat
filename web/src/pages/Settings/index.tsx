import { Form, Switch, Select, Button, Divider, Input, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useThemeStore } from '@/store/themeStore';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import './styles.less';

const Settings = () => {
  const { 
    activeLLM,
    currentConfig,
    availableLLMs,
    selectLLM,
    updateLLMConfig
  } = useLLMConfig();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [form] = Form.useForm();

  const handleLLMChange = (llmId: string) => {
    selectLLM(llmId);
  };

  const handleModelChange = (model: string) => {
    updateLLMConfig({ model });
  };

  const handleApiKeyChange = (value: string) => {
    updateLLMConfig({ apiKey: value });
  };

  const handleSubmit = () => {
    form.validateFields()      .then(() => {
        // Theme settings are handled by toggleTheme directly
        // LLM settings are handled by individual handlers
      });
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>设置</h2>
      </div>
      <div className="settings-content">
        <Form 
          layout="vertical" 
          form={form}
          initialValues={{
            darkMode: isDarkMode,
            autoSave: true,
            llm: activeLLM?.id,
            model: currentConfig?.model,
            apiKey: currentConfig?.apiKey,
          }}
        >
          <Form.Item label="界面设置" className="section-title" />
          <Form.Item label="深色模式" name="darkMode">
            <Switch checked={isDarkMode} onChange={toggleTheme} />
          </Form.Item>
          <Form.Item label="自动保存对话" name="autoSave">
            <Switch />
          </Form.Item>

          <Divider />

          <Form.Item label="AI 服务设置" className="section-title" />
          <Form.Item 
            label="服务商" 
            name="llm"
            extra={activeLLM?.description}
          >
            <Select
              options={availableLLMs.map(llm => ({
                label: llm.name,
                value: llm.id,
                description: llm.description,
              }))}
              onChange={handleLLMChange}
            />
          </Form.Item>

          <Form.Item 
            label={
              <span>
                API 密钥 
                <Tooltip title="访问服务商网站获取 API 密钥">
                  <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </span>
            }
            name="apiKey"
          >
            <Input.Password 
              placeholder="输入 API 密钥"
              onChange={(e) => handleApiKeyChange(e.target.value)}
            />
          </Form.Item>

          <Form.Item 
            label="模型" 
            name="model"
            tooltip="选择要使用的具体模型"
          >
            <Select
              options={activeLLM?.models.map((model: string) => ({
                label: model,
                value: model,
              }))}
              onChange={handleModelChange}
              disabled={!activeLLM}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" onClick={handleSubmit}>保存设置</Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Settings;
