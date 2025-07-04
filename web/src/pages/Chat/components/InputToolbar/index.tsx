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
import { useAppDispatch, useAppSelector, useCurrentChat } from '@/store/hooks';
import { setUserModel } from '@/store/llmConfigSlice';
import { updateChatSettings } from '@/store/chatSlice';
import { llms } from '@engine/utils/llms';
import SystemPromptModal from '@/components/Modal/SystemPromptModal';
import ToolsModal from '@/components/Modal/ToolsModal';
import './styles.less';

import type { ChatSetting } from '@engine/types/chat';

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

const EMPTY_OBJECT: Partial<ChatSetting> = {};

const InputToolbar: React.FC<InputToolbarProps> = () => {
  const dispatch = useAppDispatch();
  const llmConfig = useAppSelector((state) => state.llmConfig);
  const { currentChatId, chatData } = useCurrentChat();
  const availableLLMs = llms;
  const activeLLM = availableLLMs.find(llm => llm.id === llmConfig.activeLLMId);
  const currentConfig = llmConfig;
  // 从 chatSlice.settings 获取聊天配置
  const chatSettings = chatData?.settings || EMPTY_OBJECT;

  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [showTemperature, setShowTemperature] = useState(false);
  const [showContextBalance, setShowContextBalance] = useState(false);
  const [isHoveringSystemPrompt, setIsHoveringSystemPrompt] = useState(false);

  const iconStyle = { fontSize: 18 };
  
  const handleModelChange = useCallback((value: string) => {
    // 同时更新全局配置和当前聊天配置
    dispatch(setUserModel(value));
    if (currentChatId) {
      dispatch(updateChatSettings({ 
        chatId: currentChatId, 
        settings: { userModel: value } 
      }));
    }
  }, [dispatch, currentChatId]);

  const handleTemperatureChange = useCallback((value: number) => {
    if (currentChatId) {
      dispatch(updateChatSettings({ 
        chatId: currentChatId, 
        settings: { temperature: value } 
      }));
    }
  }, [dispatch, currentChatId]);

  const handleContextBalanceChange = useCallback((value: number) => {
    if (currentChatId) {
      dispatch(updateChatSettings({ 
        chatId: currentChatId, 
        settings: { contextLength: value } 
      }));
    }
  }, [dispatch, currentChatId]);

  const handleSystemPromptChange = useCallback((value: string) => {
    if (currentChatId) {
      dispatch(updateChatSettings({ 
        chatId: currentChatId, 
        settings: { systemPrompt: value } 
      }));
    }
    setIsSystemPromptOpen(false);
  }, [dispatch, currentChatId]);

  const handleMultiCallToggle = useCallback(() => {
    if (currentChatId) {
      dispatch(updateChatSettings({ 
        chatId: currentChatId, 
        settings: { parallelToolCalls: !chatSettings.parallelToolCalls } 
      }));
    }
  }, [dispatch, currentChatId, chatSettings.parallelToolCalls]);

  return (
    <div className="input-toolbar">
      {/* 1. 模型选择 */}
      <Select
        value={chatSettings?.userModel || currentConfig?.userModel || ''}
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
          type={(chatSettings?.enableTools?.length ?? 0) > 0 ? 'primary' : 'text'}
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
            value={chatSettings?.temperature ?? 0.6}
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
          <div>
            <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>
              上下文长度: {chatSettings?.contextLength ?? 4} (对应 {((chatSettings?.contextLength ?? 4) * 1000).toLocaleString()} tokens)
            </div>
            <Slider
              min={1}
              max={20}
              step={1}
              value={chatSettings?.contextLength ?? 4}
              onChange={handleContextBalanceChange}
              style={{ width: 200 }}
            />
          </div>
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
          type={chatSettings?.parallelToolCalls ? 'primary' : 'text'}
          onClick={handleMultiCallToggle}
        />
      </Tooltip>

      <SystemPromptModal
        open={isSystemPromptOpen}
        onCancel={() => setIsSystemPromptOpen(false)}
        onOk={handleSystemPromptChange}
        value={chatSettings?.systemPrompt ?? ''}
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
