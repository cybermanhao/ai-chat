import React from 'react';
import { DownOutlined, RightOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { markdownToHtml } from '@engine/utils/markdown';
import AnimatedContainer from '../AnimatedContainer';
import PulseBackground from '../PulseBackground';
import { useDebugAnimation, type DebugAnimationConfig } from './useDebugAnimation';
import './styles.less';

// ============================================================================
// ToolCallCard 组件 Props
// ============================================================================
export interface ToolCallCardProps {
  id: string;
  toolName: string;
  content: string; // 工具调用结果
  status: 'calling' | 'success' | 'error';
  collapsed?: boolean;
  onToggle?: (id: string, collapsed: boolean) => void;
  toolArguments?: string; // 工具输入参数
  
  // ============================================================================
  // 调试模式专用参数 (生产环境中应该移除)
  // 这些参数仅用于Debug页面测试，真实场景下状态应该由外部task-loop控制
  // ============================================================================
  debugConfig?: DebugAnimationConfig;
}

const ToolCallCard: React.FC<ToolCallCardProps> = ({
  id,
  toolName,
  content,
  status,
  collapsed = true,
  onToggle,
  toolArguments,
  debugConfig = {}
}) => {
  // ============================================================================
  // 调试模式状态管理 (仅用于Debug页面)
  // 在生产环境中，这些状态应该由外部的 task-loop 控制
  // ============================================================================
  const {
    currentStatus,
    currentContent,
    isCollapsed,
    animationActive,
    showCompletionFlash,
    setIsCollapsed,
    updateState
  } = useDebugAnimation({
    id,
    status,
    content,
    collapsed,
    config: debugConfig
  });

  // ============================================================================
  // 用户交互处理
  // ============================================================================
  const handleToggle = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onToggle?.(id, newCollapsed);
    updateState();
  };

  // ============================================================================
  // 状态渲染工具函数
  // ============================================================================
  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'calling':
        return <LoadingOutlined className="status-icon calling" />;
      case 'success':
        return <CheckCircleOutlined className="status-icon success" />;
      case 'error':
        return <CheckCircleOutlined className="status-icon error" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'calling':
        return '调用中...';
      case 'success':
        return '调用成功';
      case 'error':
        return '调用失败';
      default:
        return '';
    }
  };

  // ============================================================================
  // 组件渲染
  // ============================================================================
  return (
    <AnimatedContainer
      className={`tool-call-card ${currentStatus}`}
      animationActive={animationActive}
      animationPhase={debugConfig.animationPhase || 0}
      useBackgroundPulse={debugConfig.useBackgroundPulse || false}
      showCompletionFlash={showCompletionFlash}
      onCompletionFlashEnd={() => {
        // 完成动画结束后的回调可以在这里处理
      }}
    >
      {/* 工具调用头部 */}
      <PulseBackground
        className="tool-call-header"
        onClick={handleToggle}
      >
        <div className="tool-call-title">
          <span className="toggle-icon">
            {isCollapsed ? <RightOutlined /> : <DownOutlined />}
          </span>
          <span className="tool-icon">🔧</span>
          <span className="tool-name">{toolName}</span>
        </div>
        
        <div className="tool-call-status">
          {getStatusIcon()}
          <span className="status-text">{getStatusText()}</span>
        </div>
      </PulseBackground>

      {/* 工具调用内容（展开时显示） */}
      {!isCollapsed && (
        <div className="tool-call-content">
          {/* 工具输入参数 */}
          {toolArguments && (
            <div className="tool-call-input">
              <div className="input-header">
                <span className="input-label">输入参数：</span>
              </div>
              <div 
                className="input-content"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(toolArguments) }}
              />
            </div>
          )}
          
          {/* 工具调用结果 */}
          <div className="tool-call-result">
            <div className="result-header">
              <span className="result-label">
                {currentStatus === 'calling' ? '调用中...' : currentStatus === 'error' ? '调用失败：' : '调用结果：'}
              </span>
            </div>
            <div 
              className="result-content"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(currentContent) }}
            />
          </div>
        </div>
      )}
    </AnimatedContainer>
  );
};

export default ToolCallCard;
