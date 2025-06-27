import { 
  RobotOutlined, 
  ToolOutlined,
  PicCenterOutlined,
  FireOutlined,
  DatabaseOutlined,
  AndroidOutlined
} from '@ant-design/icons';
import { Button, Divider, Slider, Select, Popover, Tooltip } from 'antd';
import type { ButtonProps } from 'antd';
import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUserModel } from '@/store/llmConfigSlice';
import { llms } from '@engine/utils/llms';
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

const EMPTY_OBJECT = {};

const InputToolbar: React.FC<InputToolbarProps> = () => {
  const dispatch = useDispatch();
  const llmConfig = useSelector((state: any) => state.llmConfig);
  const availableLLMs = llms;
  const activeLLM = availableLLMs.find(llm => llm.id === llmConfig.activeLLMId);
  const currentConfig = llmConfig;
  const config = useSelector((state: any) => state.chat?.chatData?.[state.chat?.currentChatId || '']?.settings || EMPTY_OBJECT);

  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [showTemperature, setShowTemperature] = useState(false);
  const [showContextBalance, setShowContextBalance] = useState(false);
  const [isHoveringSystemPrompt, setIsHoveringSystemPrompt] = useState(false);
  const [multiCallEnabled, setMultiCallEnabled] = useState(false);

  const iconStyle = { fontSize: 18 };
  
  const handleModelChange = useCallback((value: string) => {
    dispatch(setUserModel(value));
  }, [dispatch]);

  const handleTemperatureChange = useCallback((value: number) => {
    // updateTemperature(value);
  }, []);

  const handleContextBalanceChange = useCallback((value: number) => {
    // updateContextBalance(value);
  }, []);

  const handleSystemPromptChange = useCallback((value: string) => {
    // updateSystemPrompt(value);
  }, []);

  const handleMultiCallToggle = () => {
    setMultiCallEnabled(!multiCallEnabled);
  };

  return (
    <div className="input-toolbar">
      {/* 1. 模型选择 */}
      <Select
        value={currentConfig?.userModel || ''}
        onChange={handleModelChange}
        style={{ width: 120 }}
        // loading={configLoading?.model}
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
          // loading={configLoading.systemPrompt}
          onMouseEnter={() => setIsHoveringSystemPrompt(true)}
          onMouseLeave={() => setIsHoveringSystemPrompt(false)}
        />
      </Tooltip>

      {/* 3. 工具 */}
      <Tooltip title="工具">
        <Button
          icon={<ToolOutlined style={iconStyle} />}
          onClick={() => setIsToolsModalOpen(true)}
          type={(config?.enabledTools?.length ?? 0) > 0 ? 'primary' : 'text'}
          // loading={configLoading.enabledTools}
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
            value={config?.temperature ?? 1}
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
            // loading={configLoading.temperature}
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
            value={config?.contextBalance ?? 10}
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
            // loading={configLoading.contextBalance}
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
        value={config?.systemPrompt ?? ''}
        // loading={configLoading.systemPrompt}
      />
      
      <ToolsModal
        open={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
      />
    </div>
  );
};

export default InputToolbar;
