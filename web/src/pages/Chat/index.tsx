import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { addMessage, setIsGenerating, setError, sendMessageAsync } from '@/store/chatSlice';
import MessageList from './components/MessageList';
import InputSender from './components/InputSender';
import ChatHeader from './components/ChatHeader';
import { Card } from 'antd';
import { useState } from 'react';
import './styles.less';
import type { MessageStatus } from '@engine/types/chat';

// 聊天页面组件，UI 只与 WebChatSession 交互
export const Chat = () => {
  const dispatch: AppDispatch = useDispatch();
  const currentChatId = useSelector((state: RootState) => state.chat.currentChatId);
  const EMPTY_ARRAY: any[] = [];
  const chatData = useSelector((state: RootState) => state.chat.chatData[currentChatId || '']);
  const isGenerating = useSelector((state: RootState) => state.chat.isGenerating);
  const error = useSelector((state: RootState) => state.chat.error);

  const [inputValue, setInputValue] = useState('');

  const handleSend = async () => {
    if (!currentChatId) return;
    dispatch(sendMessageAsync({ chatId: currentChatId, input: inputValue }));
    setInputValue('');
  };

  return (
    <div className="chat-page">
      {error && (
        <Card type="inner" style={{ marginBottom: 16, borderColor: '#ff4d4f' }}>
          {error}
        </Card>
      )}
      <ChatHeader title={chatData?.info?.title || ''} />
      <div className="chat-content">
        <MessageList
          messages={chatData?.messages || EMPTY_ARRAY}
          isGenerating={isGenerating}
        />
        <InputSender
          value={inputValue}
          disabled={isGenerating}
          isGenerating={isGenerating}
          onInputChange={setInputValue}
          onSend={handleSend}
          onStop={() => {/* 停止流式生成逻辑 */}}
        />
      </div>
    </div>
  );
};
