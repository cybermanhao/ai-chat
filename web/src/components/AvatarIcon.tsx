import React, { useState } from 'react';
import styles from './AvatarIcon.module.css';

export interface AvatarIconProps {
  /** 头像背景色 */
  backgroundColor?: string;
  /** 边框形状：circle/square/rounded */
  shape?: 'circle' | 'square' | 'rounded';
  /** 尺寸，像素 */
  size?: number;
  /** 服务商类型（决定图片） */
  provider?: 'chatgpt' | 'deepseek' | string;
  /** 自定义图片路径（优先级高于 provider） */
  src?: string;
  /** 边框色 */
  borderColor?: string;
  /** 边框宽度 */
  borderWidth?: number;
  /** 额外 className */
  className?: string;
}

// 自动生成头像图片路径，添加回退机制
function avatarIconUrl(name: string, size: number) {
  // 先尝试精确尺寸的图片
  const exactSize = `/avatar/${name}-${size}.png`;
  
  // 如果是常见尺寸，直接返回
  const commonSizes = [32, 48, 64, 96, 128];
  if (commonSizes.includes(size)) {
    return exactSize;
  }
  
  // 对于非常见尺寸，选择最接近的较大尺寸
  const largerSize = commonSizes.find(s => s >= size) || 128;
  return `/avatar/${name}-${largerSize}.png`;
}

const AvatarIcon: React.FC<AvatarIconProps> = ({
  backgroundColor = '#fff',
  shape = 'circle',
  size = 40,
  provider = 'chatgpt',
  src,
  borderColor = 'transparent',
  borderWidth = 0,
  className = '',
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  // 优先 src 其次 provider+size
  const imgSrc = src || avatarIconUrl(provider, size);
  
  // 重置状态当 imgSrc 变化时
  React.useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [imgSrc]);
  
  // 调试信息（开发环境下）
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Avatar: ${imgSrc}, state: loaded=${loaded}, error=${error}`);
    }
  }, [imgSrc, loaded, error]);
  let borderRadius = '50%';
  if (shape === 'square') borderRadius = '0';
  if (shape === 'rounded') borderRadius = '12px';

  return (
    <div
      className={`avatar-icon ${styles['avatar-icon']} ${className}`}
      style={{
        width: size,
        height: size,
        background: backgroundColor,
        borderRadius,
        border: `${borderWidth}px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {!loaded && !error && (
        <div style={{ 
          width: '80%', 
          height: '80%', 
          background: '#f0f0f0', 
          borderRadius: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.3,
          color: '#999'
        }}>
          {provider?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      {error && (
        <div style={{ 
          width: '80%', 
          height: '80%', 
          background: '#f5f5f5', 
          borderRadius: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.3,
          color: '#999'
        }}>
          {provider?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      <img
        src={imgSrc}
        alt={provider}
        style={{ 
          width: '80%', 
          height: '80%', 
          objectFit: 'contain', 
          pointerEvents: 'none', 
          display: (loaded && !error) ? 'block' : 'none' 
        }}
        draggable={false}
        onLoad={() => {
          console.log(`Avatar loaded successfully: ${imgSrc}`);
          setLoaded(true);
          setError(false);
        }}
        onError={(e) => {
          console.error(`Avatar failed to load: ${imgSrc}`, e);
          setLoaded(false);
          setError(true);
        }}
      />
    </div>
  );
};

export default AvatarIcon;
