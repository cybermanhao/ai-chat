import React from 'react';

// 简单的测试组件来验证图片加载
const AvatarTest: React.FC = () => {
  const testUrls = [
    '/avatar/chatgpt-32.png',
    '/avatar/deepseek-32.png',
    './avatar/chatgpt-32.png',
    'avatar/chatgpt-32.png',
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h3>头像加载测试</h3>
      {testUrls.map((url, index) => (
        <div key={index} style={{ marginBottom: '10px' }}>
          <p>测试路径: {url}</p>
          <img 
            src={url} 
            alt={`test-${index}`}
            style={{ width: '32px', height: '32px', border: '1px solid #ccc' }}
            onLoad={() => console.log(`✅ 成功加载: ${url}`)}
            onError={() => console.error(`❌ 加载失败: ${url}`)}
          />
        </div>
      ))}
      
      <h4>直接访问测试</h4>
      <p>尝试直接在浏览器地址栏访问:</p>
      <ul>
        <li><a href="/avatar/chatgpt-32.png" target="_blank">http://localhost:3000/avatar/chatgpt-32.png</a></li>
        <li><a href="/avatar/deepseek-32.png" target="_blank">http://localhost:3000/avatar/deepseek-32.png</a></li>
      </ul>
    </div>
  );
};

export default AvatarTest;
