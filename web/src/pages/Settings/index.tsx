import { Form, Switch, Select, Button, Divider, Input, Tooltip, Card } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useThemeStore } from '@/store/themeStore';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import { useMemo } from 'react';
import './styles.less';

const Settings = () => {
  const { 
    activeLLM,
    currentConfig,
    availableLLMs,
    selectLLM,
    updateLLMConfig
  } = useLLMConfig();
  const { isDarkMode, toggleTheme, dmMode, setDMMode } = useThemeStore();
  const [form] = Form.useForm();

  const handleLLMChange = (llmId: string) => {
    selectLLM(llmId);
  };

  const handleModelChange = (userModel: string) => {
    updateLLMConfig({ userModel });
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

  // 检查当前 activeLLM 是否为 deepseek，否则报错卡片
  const llmError = useMemo(() => {
    if (activeLLM && activeLLM.id !== 'deepseek') {
      return (
        <Card type="inner" title="仅支持 DeepSeek" style={{ marginBottom: 16 }}>
          当前仅支持 DeepSeek LLM，选择其他 LLM 时无法正常调用。
        </Card>
      );
    }
    return null;
  }, [activeLLM]);

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>设置</h2>
      </div>
      {llmError}
      <div className="settings-content">
        <Form 
          layout="vertical" 
          form={form}
          initialValues={{
            darkMode: isDarkMode,
            autoSave: true,
            llm: activeLLM?.id,
            model: currentConfig?.userModel,
            apiKey: currentConfig?.apiKey,
            dmMode: dmMode,
          }}
        >
          <Form.Item label="界面设置" className="section-title" />
          <Form.Item label="深色模式" name="darkMode">
            <Switch checked={isDarkMode} onChange={toggleTheme} />
          </Form.Item>
          <Form.Item label="自动保存对话" name="autoSave">
            <Switch />
          </Form.Item>
          <Form.Item label="DM模式（弹幕彩蛋）" name="dmMode">
            <Switch checked={dmMode} onChange={setDMMode} />
          </Form.Item>

          <Divider />

          <Form.Item label="AI 服务设置" className="section-title" />
          <Form.Item 
            label="服务商" 
            name="llm"
            extra={activeLLM?.description}
          >
            <Select
              options={Array.isArray(availableLLMs) ? availableLLMs.map(llm => ({
                label: llm.name,
                value: llm.id,
                description: llm.description,
              })) : []}
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
              options={Array.isArray(activeLLM?.models) ? activeLLM.models.map((model: string) => ({
                label: model,
                value: model,
              })) : []}
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
