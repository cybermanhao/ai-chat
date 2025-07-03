import React, { useEffect } from 'react';
import './styles.less';

// ============================================================================
// 通用动画容器组件
// 提供脉冲动画、完成动画等通用动画效果
// ============================================================================

export interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  
  // 动画控制参数
  animationActive?: boolean; // 是否激活动画
  animationPhase?: number; // 动画相位偏移（0-1）
  useBackgroundPulse?: boolean; // 是否使用背景脉冲（false为底边脉冲）
  showCompletionFlash?: boolean; // 是否显示完成动画
  
  // 动画状态回调
  onAnimationEnd?: () => void;
  onCompletionFlashEnd?: () => void;
}

const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  className = '',
  style,
  animationActive = false,
  animationPhase = 0,
  useBackgroundPulse = false,
  showCompletionFlash = false,
  onCompletionFlashEnd
}) => {
  // ============================================================================
  // 动画样式配置
  // ============================================================================
  const animationStyle = {
    '--animation-delay': `${animationPhase * 2}s`,
    ...style
  } as React.CSSProperties;

  // ============================================================================
  // 动画事件监听
  // TODO: 修复showCompletionFlash状态变化时动画不播放的问题
  // 问题：尽管showCompletionFlash为true，但CSS动画可能因为时序问题没有触发
  // ============================================================================
  useEffect(() => {
    if (showCompletionFlash) {
      const timer = setTimeout(() => {
        onCompletionFlashEnd?.();
      }, 600); // 完成动画持续时间
      return () => clearTimeout(timer);
    }
  }, [showCompletionFlash, onCompletionFlashEnd]);

  // ============================================================================
  // 组件渲染
  // TODO: 修复completion-flash类名添加后动画不生效的问题
  // 调试发现：类名正确添加到DOM，但动画选择器可能有问题
  // ============================================================================
  const containerClassName = [
    'animated-container',
    useBackgroundPulse ? 'background-pulse' : 'border-pulse',
    animationActive ? 'animated' : '',
    showCompletionFlash ? 'completion-flash' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClassName} style={animationStyle}>
      {children}
      
      {/* 底部边框动画 (仅在不使用背景脉冲时显示) */}
      {!useBackgroundPulse && (
        <div className={`pulse-border ${animationActive ? 'animated' : ''}`}>
          <div className="border-line">
            <div className="pulse-highlight"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimatedContainer;
