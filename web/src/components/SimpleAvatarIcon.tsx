import React from 'react';

// 简化版的 AvatarIcon 用于调试
const SimpleAvatarIcon: React.FC<{ provider: string; size: number }> = ({ provider, size }) => {
  const imgSrc = `/avatar/${provider}-${size}.png`;
  
  console.log(`SimpleAvatarIcon: ${imgSrc}`);
  
  return (
    <div style={{ 
      width: size, 
      height: size, 
      border: '1px solid red',
      background: '#f0f0f0',
      position: 'relative'
    }}>
      <img 
        src={imgSrc} 
        alt={provider}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain' 
        }}
        onLoad={() => console.log(`✅ Simple loaded: ${imgSrc}`)}
        onError={(e) => console.error(`❌ Simple failed: ${imgSrc}`, e)}
      />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,255,0,0.3)',
        pointerEvents: 'none',
        fontSize: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        TEST
      </div>
    </div>
  );
};

export default SimpleAvatarIcon;
