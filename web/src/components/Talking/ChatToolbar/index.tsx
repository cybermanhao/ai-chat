import { 
  RobotOutlined, 
  ToolOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  FireOutlined
} from '@ant-design/icons';
import { Button, Divider, Flex, Slider, Select, Popover, Tooltip, message } from 'antd';
import React, { useState, useCallback } from 'react';
import type { ButtonProps } from 'antd';
import { useLLMStore } from '@/store/llmStore';
import { useModelConfigStore } from '@/store/modelConfigStore';
import { modelConfigService } from '@/services/modelConfigService';
import type { ModelConfig, ModelLoadingKey } from '@/types/model';
import { llms } from '@/utils/llms/llms';
import SystemPromptModal from './SystemPromptModal';
import ToolsModal from './ToolsModal';
import './styles.less';

interface ToolbarButtonProps extends ButtonProps {
  style?: React.CSSProperties;
}

interface ChatToolbarProps {
  components: {
    SendButton: React.ComponentType<ToolbarButtonProps>;
    LoadingButton: React.ComponentType<ToolbarButtonProps>;
    SpeechButton: React.ComponentType<ToolbarButtonProps>;
  };
  loading?: boolean;
}

type ConfigUpdateValue = Partial<ModelConfig> | ((prev: ModelConfig) => Partial<ModelConfig>);

const ChatToolbar: React.FC<ChatToolbarProps> = ({ 
  components, 
  loading = false,
}) => {
  const { selectedLLM, selectedModel, setSelectedLLM, setSelectedModel } = useLLMStore();
  const { config, loading: configLoading, setConfig, setLoading } = useModelConfigStore();

  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [showTemperature, setShowTemperature] = useState(false);
  const [showContextBalance, setShowContextBalance] = useState(false);
  
  const { SendButton, LoadingButton, SpeechButton } = components;

  const iconStyle = { fontSize: 18 };

  // Model selection handlers
  const handleModelChange = useCallback(async (model: string) => {
    if (selectedLLM && !selectedLLM.models.includes(model)) {
      const targetLLM = llms.find(llm => llm.models.includes(model));
      if (targetLLM) {
        setSelectedLLM(targetLLM.id);
      }
    }
    setSelectedModel(model);
  }, [selectedLLM, setSelectedLLM, setSelectedModel]);

  // Config update handlers with loading states
  const updateConfigWithLoading = useCallback(async (
    key: ModelLoadingKey,
    action: Promise<{ success: boolean; error?: string }>,
    updateValue: ConfigUpdateValue
  ) => {
    setLoading(key, true);
    const result = await action;
    if (result.success) {
      setConfig(updateValue);
    } else {
      message.error(result.error || `Failed to update ${key}`);
    }
    setLoading(key, false);
  }, [setConfig, setLoading]);

  const handleTemperatureChange = useCallback(async (value: number) => {
    await updateConfigWithLoading(
      'temperature',
      modelConfigService.updateTemperature(value),
      { temperature: value }
    );
  }, [updateConfigWithLoading]);

  const handleContextBalanceChange = useCallback(async (value: number) => {
    await updateConfigWithLoading(
      'contextBalance',
      modelConfigService.updateContextBalance(value),
      { contextBalance: value }
    );
  }, [updateConfigWithLoading]);

  const handleSystemPromptChange = useCallback(async (value: string) => {
    await updateConfigWithLoading(
      'systemPrompt',
      modelConfigService.updateSystemPrompt(value),
      { systemPrompt: value }
    );
    setIsSystemPromptOpen(false);
  }, [updateConfigWithLoading]);

  const handleMultiToolsToggle = useCallback(async (enabled: boolean) => {
    await updateConfigWithLoading(
      'multiTools',
      modelConfigService.toggleMultiTools(enabled),
      { multiToolsEnabled: enabled }
    );
  }, [updateConfigWithLoading]);

  const handleToolToggle = useCallback(async (toolId: string, enabled: boolean) => {
    await updateConfigWithLoading(
      'tools',
      modelConfigService.toggleTool({ toolId, enabled }),
      (prev: ModelConfig) => ({
        enabledTools: enabled
          ? [...prev.enabledTools, toolId]
          : prev.enabledTools.filter((id: string) => id !== toolId)
      })
    );
  }, [updateConfigWithLoading]);

  const formatContextBalance = (value?: number) => {
    if (typeof value !== 'number') return '';
    const labels = ['精确', '平衡', '创意'];
    return labels[Math.round(value)];
  };

  // UI elements
  const temperatureContent = (
    <div style={{ width: 200 }}>
      <Slider
        min={0}
        max={1}
        step={0.1}
        value={config.temperature}
        onChange={handleTemperatureChange}
        tooltip={{ formatter: value => `${value}` }}
      />
    </div>
  );

  const contextBalanceContent = (
    <div style={{ width: 200 }}>
      <Slider
        min={0}
        max={2}
        step={1}
        value={config.contextBalance}
        onChange={handleContextBalanceChange}
        marks={{
          0: '精确',
          1: '平衡',
          2: '创意'
        }}
        tooltip={{ formatter: formatContextBalance }}
      />
    </div>
  );

  return (
    <Flex justify="space-between" align="center" className="chat-toolbar">
      <Flex gap="small" align="center" className="toolbar-left">
        <Select
          value={selectedModel}
          onChange={handleModelChange}
          options={selectedLLM?.models.map(model => ({
            label: model,
            value: model,
          }))}
          style={{ width: 160 }}
          disabled={!selectedLLM}
        />

        <Divider type="vertical" />
        
        <Tooltip title="系统提示词">
          <Button 
            type="text" 
            className={isSystemPromptOpen ? 'active' : ''}
            icon={<RobotOutlined />}
            onClick={() => setIsSystemPromptOpen(true)}
            loading={configLoading.systemPrompt}
          />
        </Tooltip>

        <Divider type="vertical" />

        <Tooltip title="可用工具">
          <Button 
            type="text"
            className={isToolsModalOpen ? 'active' : ''}
            icon={<ToolOutlined />}
            onClick={() => setIsToolsModalOpen(true)}
            loading={configLoading.tools}
          />
        </Tooltip>

        <Divider type="vertical" />

        <Tooltip title="允许AI连续调用工具">
          <Button 
            type="text"
            className={config.multiToolsEnabled ? 'active' : ''}
            icon={<ThunderboltOutlined />}
            onClick={() => handleMultiToolsToggle(!config.multiToolsEnabled)}
            loading={configLoading.multiTools}
          />
        </Tooltip>

        <Divider type="vertical" />

        <Tooltip title="温度（影响回答的随机性）">
          <Popover 
            content={temperatureContent}
            trigger="click"
            open={showTemperature}
            onOpenChange={setShowTemperature}
            placement="bottom"
          >
            <Button 
              type="text"
              className={showTemperature ? 'active' : ''}
              loading={configLoading.temperature}
            >
              <FireOutlined style={{ transform: `scale(${0.8 + config.temperature * 0.4})` }} />
              <span className="button-value">{config.temperature.toFixed(1)}</span>
            </Button>
          </Popover>
        </Tooltip>

        <Divider type="vertical" />

        <Tooltip title="上下文平衡（影响回答的严谨程度）">
          <Popover 
            content={contextBalanceContent}
            trigger="click"
            open={showContextBalance}
            onOpenChange={setShowContextBalance}
            placement="bottom"
          >
            <Button 
              type="text"
              className={showContextBalance ? 'active' : ''}
              loading={configLoading.contextBalance}
            >
              <ApartmentOutlined rotate={config.contextBalance * 45} />
              <span className="button-value">{formatContextBalance(config.contextBalance)}</span>
            </Button>
          </Popover>
        </Tooltip>
      </Flex>

      <Flex align="center" className="toolbar-right">
        <SpeechButton style={iconStyle} />
        <Divider type="vertical" />
        {loading ? (
          <LoadingButton type="default" />
        ) : (
          <SendButton type="primary" disabled={loading} />
        )}
      </Flex>

      <SystemPromptModal 
        open={isSystemPromptOpen}
        onClose={() => setIsSystemPromptOpen(false)}
        value={config.systemPrompt}
        onChange={handleSystemPromptChange}
      />

      <ToolsModal 
        open={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
        tools={[]}
        onToolToggle={handleToolToggle}
      />
    </Flex>
  );
};

export default ChatToolbar;
