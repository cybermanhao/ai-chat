import React from 'react';

// ============================================================================
// 背景脉冲头部组件
// 为子元素提供背景脉冲动画效果
// ============================================================================

export interface PulseBackgroundProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  active?: boolean; // 是否激活脉冲动画
  onClick?: () => void;
}

const PulseBackground: React.FC<PulseBackgroundProps> = ({
  children,
  className = '',
  style,
  active = false,
  onClick
}) => {
  const containerClassName = [
    'pulse-background',
    active ? 'active' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={containerClassName} 
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default PulseBackground;
