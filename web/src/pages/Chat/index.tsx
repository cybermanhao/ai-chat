import { useEffect, useRef, useState } from 'react';
import { WebChatSession } from '@/chat/WebChatSession'; // 单会话业务对象
import { WebLLMAdapter } from '@/chat/WebLLMAdapter';   // Web 端 LLM 服务适配器
import MessageList from './components/MessageList';
import InputSender from './components/InputSender';
import ChatHeader from './components/ChatHeader';
import { Card } from 'antd';
import { useGlobalUIStore } from '@/store/globalUIStore';
import './styles.less';

// 聊天页面组件，UI 只与 WebChatSession 交互
export const Chat = () => {
  // 实例化 WebChatSession（只实例化一次，注入 WebLLMAdapter）
  const chatSessionRef = useRef<WebChatSession>(null);
  if (!chatSessionRef.current) {
    chatSessionRef.current = new WebChatSession({ llmService: new WebLLMAdapter() });
  }
  const chatSession = chatSessionRef.current;

  // 本地 UI 状态
  const [inputValue, setInputValue] = useState('');
  const messageListRef = useRef<HTMLDivElement>(null);
  const { showLoading, hideLoading } = useGlobalUIStore();

  // 订阅 chatSession 状态变化，自动刷新 UI 并自动保存
  useEffect(() => {
    const unsubscribe = chatSession.subscribe(() => {
      chatSession.save();
    });
    return () => unsubscribe();
  }, [chatSession]);

  // 发送消息
  const handleSend = async (input: string) => {
    showLoading();
    await chatSession.handleSend(input);
    setInputValue('');
    hideLoading();
  };

  // 停止流式
  const handleStop = () => {
    chatSession.handleStop();
  };

  // 渲染部分
  return (
    <div className="chat-page">
      {chatSession.getError() && (
        <Card type="inner" style={{ marginBottom: 16, borderColor: '#ff4d4f' }}>
          {chatSession.getError()}
        </Card>
      )}
      <ChatHeader title={''} />
      <div className="chat-content">
        <MessageList
          messages={chatSession.getMessages()}
          isGenerating={chatSession.getIsGenerating()}
          ref={messageListRef}
        />
        <InputSender
          value={inputValue}
          disabled={chatSession.getIsGenerating()}
          isGenerating={chatSession.getIsGenerating()}
          onInputChange={setInputValue}
          onSend={() => handleSend(inputValue)}
          onStop={handleStop}
        />
      </div>
    </div>
  );
};
