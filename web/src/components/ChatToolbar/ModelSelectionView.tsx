import React from 'react';
import { Select, Slider, Switch, Button, Tooltip, Popover } from 'antd';
import {
  RobotOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  ToolOutlined,
  FireOutlined,
} from '@ant-design/icons';
import type { LLM } from '@/types/llm';
import type { Tool } from '@/types/tool';
import type { ModelConfig } from '@/types/model';
import { SystemPromptModal } from './SystemPromptModal';
import { ToolsModal } from './ToolsModal';
import { useModelSelectionView } from './useModelSelectionView';
import './styles.less';

export interface ModelSelectionViewProps {
  selectedLLM: string | null;
  selectedModel: string;
  modelConfig: ModelConfig & { systemPrompt: string };
  loading: {
    temperature: boolean;
    contextBalance: boolean;
    systemPrompt: boolean;
    multiTools: boolean;
    tools: boolean;
  };
  availableLLMs: LLM[];
  availableTools: Tool[];
  onModelChange: (model: string) => void;
  onLLMChange: (llmId: string) => void;
  onTemperatureChange: (value: number) => Promise<void>;
  onContextBalanceChange: (value: number) => Promise<void>;
  onSystemPromptChange: (value: string) => Promise<void>;
  onMultiToolsToggle: (enabled: boolean) => Promise<void>;
  onToolToggle: (toolId: string, enabled: boolean) => Promise<void>;
}

export const ModelSelectionView: React.FC<ModelSelectionViewProps> = ({
  selectedLLM,
  selectedModel,
  modelConfig,
  loading,
  availableLLMs,
  availableTools,
  onModelChange,
  onLLMChange,
  onTemperatureChange,
  onContextBalanceChange,
  onSystemPromptChange,
  onMultiToolsToggle,
  onToolToggle,
}) => {  const {
    isSystemPromptOpen,
    setIsSystemPromptOpen,
    isToolsModalOpen,
    setIsToolsModalOpen,
    showTemperature,
    setShowTemperature,
    showContextBalance,
    setShowContextBalance,
  } = useModelSelectionView();

  const currentLLM = availableLLMs.find(llm => llm.id === selectedLLM);
  const availableModels = currentLLM?.models || [];

  return (
    <div className="model-selection">
      <Select
        value={selectedLLM}
        onChange={onLLMChange}
        options={availableLLMs.map(llm => ({
          label: llm.name,
          value: llm.id,
        }))}
        placeholder="选择服务商"
      />

      <Select
        value={selectedModel}
        onChange={onModelChange}
        options={availableModels.map(model => ({
          label: model,
          value: model,
        }))}
        placeholder="选择模型"
      />

      <Popover
        content={
          <Slider
            value={modelConfig.temperature}
            min={0}
            max={2}
            step={0.1}
            onChange={onTemperatureChange}
          />
        }
        trigger="click"
        open={showTemperature}
        onOpenChange={setShowTemperature}
      >
        <Button
          icon={<FireOutlined />}
          loading={loading.temperature}
        />
      </Popover>

      <Popover
        content={
          <Slider
            value={modelConfig.contextBalance}
            min={0}
            max={1}
            step={0.1}
            onChange={onContextBalanceChange}
          />
        }
        trigger="click"
        open={showContextBalance}
        onOpenChange={setShowContextBalance}
      >
        <Button
          icon={<ApartmentOutlined />}
          loading={loading.contextBalance}
        />
      </Popover>

      <Tooltip title="系统提示词">
        <Button
          icon={<RobotOutlined />}
          onClick={() => setIsSystemPromptOpen(true)}
          loading={loading.systemPrompt}
        />
      </Tooltip>

      <Tooltip title="工具箱">
        <Button
          icon={<ToolOutlined />}
          onClick={() => setIsToolsModalOpen(true)}
          loading={loading.tools}
        />
      </Tooltip>

      <Tooltip title="多工具模式">
        <Switch
          checked={modelConfig.multiToolsEnabled}
          onChange={onMultiToolsToggle}
          loading={loading.multiTools}
        />
      </Tooltip>

      <SystemPromptModal
        open={isSystemPromptOpen}
        onClose={() => setIsSystemPromptOpen(false)}
        value={modelConfig.systemPrompt}
        onChange={onSystemPromptChange}
      />

      <ToolsModal
        open={isToolsModalOpen}
        onClose={() => setIsToolsModalOpen(false)}
        tools={availableTools.map(tool => ({
          ...tool,
          enabled: modelConfig.enabledTools.includes(tool.id),
        }))}
        onToolToggle={onToolToggle}
      />
    </div>
  );
};
