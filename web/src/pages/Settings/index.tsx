import { Form, Switch, Select, Button, Divider, Input, Tooltip, Card } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { toggleTheme, setDMMode } from '@/store/themeStore';
import { setActiveLLMId, setApiKey, setUserModel } from '@/store/llmConfigSlice';
import { useMemo, useEffect } from 'react';
import './styles.less';
import { llms } from '@engine/utils/llms';

const Settings = () => {
  const dispatch: AppDispatch = useDispatch();
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const dmMode = useSelector((state: RootState) => state.theme.dmMode);
  const llmConfig = useSelector((state: RootState) => state.llmConfig);
  const [form] = Form.useForm();

  // 获取所有可用 LLM
  const availableLLMs = llms;
  // 当前 activeLLM
  const activeLLM = availableLLMs.find(llm => llm.id === llmConfig.activeLLMId);
  // 当前配置
  const currentConfig = llmConfig;

  // 选择 LLM
  const handleLLMChange = (llmId: string) => {
    dispatch(setActiveLLMId(llmId));
  };
  // 修改模型
  const handleModelChange = (userModel: string) => {
    dispatch(setUserModel(userModel));
  };
  // 修改 API key
  const handleApiKeyChange = (llmId: string, value: string) => {
    dispatch(setApiKey({ llmId, apiKey: value }));
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

  // 保证表单内容和 store 实时同步
  useEffect(() => {
    form.setFieldsValue({
      apiKey: currentConfig.apiKeys?.[currentConfig.activeLLMId] || '',
      model: currentConfig.userModel,
      llm: activeLLM?.id,
      darkMode: isDarkMode,
      dmMode: dmMode,
    });
  }, [currentConfig.apiKeys, currentConfig.userModel, activeLLM?.id, isDarkMode, dmMode, form]);

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
            apiKey: currentConfig?.apiKeys?.[currentConfig.activeLLMId] || '',
            dmMode: dmMode,
          }}
        >
          <Form.Item label="界面设置" className="section-title" />
          <Form.Item label="深色模式" name="darkMode">
            <Switch checked={isDarkMode} onChange={() => dispatch(toggleTheme())} />
          </Form.Item>
          <Form.Item label="自动保存对话" name="autoSave">
            <Switch />
          </Form.Item>
          <Form.Item label="DM模式" name="dmMode">
            <Switch checked={dmMode} onChange={v => dispatch(setDMMode(v))} />
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
              value={currentConfig.apiKeys?.[currentConfig.activeLLMId] || ''}
              onChange={e => handleApiKeyChange(currentConfig.activeLLMId, e.target.value)}
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
              value={currentConfig.userModel}
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
