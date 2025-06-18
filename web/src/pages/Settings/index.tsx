import { Form, Switch, Select, Button, Divider, Input, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useLLMStore } from '@/store/llmStore';
import { useModelSelection } from '@/hooks/useModelSelection';
import { useThemeStore } from '@/store/themeStore';
import { llms } from '@/utils/llms/llms';
import './styles.less';

const Settings = () => {
  const { selectedLLM, selectedModel, handleModelChange, handleLLMChange } = useModelSelection();
  const { tokens, setToken } = useLLMStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [form] = Form.useForm();

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
            llm: selectedLLM?.id,
            model: selectedModel,
            token: tokens[selectedLLM?.id || ''] || '',
            darkMode: isDarkMode,
            autoSave: true,
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
            extra={selectedLLM?.description}
          >
            <Select
              options={llms.map(llm => ({
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
            name="token"
          >
            <Input.Password 
              placeholder="输入 API 密钥"
              onChange={(e) => selectedLLM && setToken(selectedLLM.id, e.target.value)}
            />
          </Form.Item>

          <Form.Item 
            label="模型" 
            name="model"
            tooltip="选择要使用的具体模型"
          >
            <Select
              options={selectedLLM?.models.map((model: string) => ({
                label: model,
                value: model,
              }))}
              onChange={handleModelChange}
              disabled={!selectedLLM}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary">保存设置</Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Settings;
