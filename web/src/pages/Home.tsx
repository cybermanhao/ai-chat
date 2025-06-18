import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSider from '@/components/AppSider';
import Chat from './Chat';
import { useChatStore } from '@/store/chatStore';
import './Home.less';

const Home = () => {
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const { messages, addMessage } = useChatStore();
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    setLoading(true);

    try {
      // 添加用户消息
      addMessage({
        content,
        role: 'user'
      });

      // TODO: 实现大模型请求
      const reply = "这里是大模型回复";

      // 添加助手回复
      addMessage({
        content: reply,
        role: 'assistant'
      });
    } catch (error) {
      console.error('Failed to process message:', error);
      addMessage({
        content: `抱歉，处理消息时出现错误: ${error instanceof Error ? error.message : '未知错误'}`,
        role: 'assistant'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="app-tools">
        <AppSider 
          collapsed={siderCollapsed} 
          onCollapse={setSiderCollapsed} 
        />
      </div>
      <div className="app-workspace">
        <Outlet />
      </div>
      <div className="app-chat">
        <Chat 
          messages={messages}
          loading={loading}
          onSend={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default Home;