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

// 自动生成头像图片路径
function avatarIconUrl(name: string, size: number) {
  return `/avatar/${name}-${size}.png`;
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
  // 优先 src 其次 provider+size
  const imgSrc = src || avatarIconUrl(provider, size);
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
      {!loaded && (
        <div style={{ width: '80%', height: '80%', background: backgroundColor, borderRadius: 'inherit' }} />
      )}
      <img
        src={imgSrc}
        alt={provider}
        style={{ width: '80%', height: '80%', objectFit: 'contain', pointerEvents: 'none', display: loaded ? 'block' : 'none' }}
        draggable={false}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
      />
    </div>
  );
};

export default AvatarIcon;
