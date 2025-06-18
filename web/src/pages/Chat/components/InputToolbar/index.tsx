import { 
  RobotOutlined, 
  ToolOutlined,
  PicCenterOutlined,
  FireOutlined,
  DatabaseOutlined,
  AndroidOutlined
} from '@ant-design/icons';
import { Button, Divider, Slider, Select, Popover, Tooltip, message } from 'antd';
import type { ButtonProps } from 'antd';
import React, { useState, useCallback } from 'react';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import { useModelConfig } from '@/hooks/useModelConfig';
import { llms } from '@/utils/llms/llms';
import SystemPromptModal from '@/components/Modal/SystemPromptModal';
import ToolsModal from '@/components/Modal/ToolsModal';
import './styles.less';

interface ToolbarButtonProps extends ButtonProps {
  style?: React.CSSProperties;
}

interface ActionsComponents {
  SendButton: React.ComponentType<ToolbarButtonProps>;
  LoadingButton: React.ComponentType<ToolbarButtonProps>;
  SpeechButton: React.ComponentType<ToolbarButtonProps>;
}

interface InputToolbarProps {
  components?: ActionsComponents;
  loading?: boolean;
}

const InputToolbar: React.FC<InputToolbarProps> = () => {
  const { activeLLM, currentConfig, selectLLM, updateLLMConfig } = useLLMConfig();
  const { 
    config, 
    loading: configLoading,
    updateTemperature,
    updateContextBalance,
    updateSystemPrompt,
    updateEnabledTools
  } = useModelConfig();

  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [showTemperature, setShowTemperature] = useState(false);
  const [showContextBalance, setShowContextBalance] = useState(false);
  const [isHoveringSystemPrompt, setIsHoveringSystemPrompt] = useState(false);
  const [multiCallEnabled, setMultiCallEnabled] = useState(false);

  const iconStyle = { fontSize: 18 };
  
  const handleModelChange = useCallback((model: string) => {
    if (activeLLM && !activeLLM.models.includes(model)) {
      const targetLLM = llms.find(llm => llm.models.includes(model));
      if (targetLLM) {
        selectLLM(targetLLM.id);
      }
    }
    updateLLMConfig({ model });
  }, [activeLLM, selectLLM, updateLLMConfig]);

  const handleTemperatureChange = useCallback(async (value: number) => {
    const success = await updateTemperature(value);
    if (!success) {
      message.error('Failed to update temperature');
    }
  }, [updateTemperature]);

  const handleContextBalanceChange = useCallback(async (value: number) => {
    const success = await updateContextBalance(value);
    if (!success) {
      message.error('Failed to update context balance');
    }
  }, [updateContextBalance]);

  const handleSystemPromptChange = useCallback(async (value: string) => {
    const success = await updateSystemPrompt(value);
    if (success) {
      setIsSystemPromptOpen(false);
    } else {
      message.error('Failed to update system prompt');
    }
  }, [updateSystemPrompt]);

  const handleToolsToggle = useCallback(async (toolId: string, enabled: boolean) => {
    const newEnabledTools = enabled 
      ? [...config.enabledTools, toolId]
      : config.enabledTools.filter(id => id !== toolId);
    
    const success = await updateEnabledTools(newEnabledTools);
    if (!success) {
      message.error('Failed to update tools');
    }
  }, [config.enabledTools, updateEnabledTools]);

  const handleMultiCallToggle = () => {
    setMultiCallEnabled(!multiCallEnabled);
  };

  return (
    <div className="input-toolbar">
      {/* 1. 模型选择 */}
      <Select
        value={currentConfig?.model}
        onChange={handleModelChange}
        style={{ width: 120 }}
        loading={configLoading.model}
        disabled={!activeLLM}
      >
        {activeLLM?.models.map(model => (
          <Select.Option key={model} value={model}>
            {model}
          </Select.Option>
        ))}
      </Select>

      <Divider type="vertical" />

      {/* 2. 系统提示词 */}
      <Tooltip title="系统提示词">
        <Button
          icon={<RobotOutlined style={iconStyle} />}
          onClick={() => setIsSystemPromptOpen(true)}
          type={(isSystemPromptOpen || isHoveringSystemPrompt) ? 'primary' : 'text'}
          loading={configLoading.systemPrompt}
          onMouseEnter={() => setIsHoveringSystemPrompt(true)}
          onMouseLeave={() => setIsHoveringSystemPrompt(false)}
        />
      </Tooltip>

      {/* 3. 工具 */}
      <Tooltip title="工具">
        <Button
          icon={<ToolOutlined style={iconStyle} />}
          onClick={() => setIsToolsModalOpen(true)}
          type={config.enabledTools.length > 0 ? 'primary' : 'text'}
          loading={configLoading.enabledTools}
        />
      </Tooltip>

      {/* 4. 知识库选择 */}
      <Tooltip title="知识库">
        <Button
          icon={<DatabaseOutlined style={iconStyle} />}
          type="text"
          // 知识库功能待实现，暂时禁用
          disabled
        />
      </Tooltip>

      {/* 5. 温度 */}
      <Popover
        content={
          <Slider
            min={0}
            max={2}
            step={0.1}
            value={config.temperature}
            onChange={handleTemperatureChange}
            style={{ width: 200 }}
          />
        }
        title="温度"
        trigger="click"
        open={showTemperature}
        onOpenChange={setShowTemperature}
      >
        <Tooltip title="温度">
          <Button 
            icon={<FireOutlined style={iconStyle} />}
            type={showTemperature ? 'primary' : 'text'}
            loading={configLoading.temperature}
          />
        </Tooltip>
      </Popover>

      {/* 6. 上下文长度 */}
      <Popover
        content={
          <Slider
            min={5}
            max={20}
            step={1}
            value={config.contextBalance}
            onChange={handleContextBalanceChange}
            style={{ width: 200 }}
          />
        }
        title="上下文长度"
        trigger="click"
        open={showContextBalance}
        onOpenChange={setShowContextBalance}
      >
        <Tooltip title="上下文长度">
          <Button 
            icon={<PicCenterOutlined style={iconStyle} />}
            type={showContextBalance ? 'primary' : 'text'}
            loading={configLoading.contextBalance}
          />
        </Tooltip>
      </Popover>

      {/* 7. 多次调用开关 */}
      <Tooltip title="多次调用">
        <Button
          icon={<AndroidOutlined style={iconStyle} />}
          type={multiCallEnabled ? 'primary' : 'text'}
          onClick={handleMultiCallToggle}
        />
      </Tooltip>

      <SystemPromptModal
        open={isSystemPromptOpen}
        onCancel={() => setIsSystemPromptOpen(false)}
        onOk={handleSystemPromptChange}
        value={config.systemPrompt}
        loading={configLoading.systemPrompt}
      />
      
      <ToolsModal
        open={isToolsModalOpen}
        loading={configLoading.enabledTools}
        enabledTools={config.enabledTools}
        onClose={() => setIsToolsModalOpen(false)}
        onToggle={handleToolsToggle}
      />
    </div>
  );
};

export default InputToolbar;
