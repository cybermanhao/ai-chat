import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { sendMessage, setError } from '@/store/chatSlice'; // 新增：只引入 sendMessage action
import MessageList from './components/MessageList';
import InputSender from './components/InputSender';
import ChatHeader from './components/ChatHeader';
import { useState, useEffect } from 'react';
import './styles.less';

const EMPTY_ARRAY: any[] = []; // 移到组件外部，避免每次渲染重新创建

// 聊天页面组件，UI 只与 WebChatSession 交互
export const Chat = () => {
  const dispatch: AppDispatch = useDispatch();
  const currentChatId = useSelector((state: RootState) => state.chat.currentChatId);
  const chatData = useSelector((state: RootState) => state.chat.chatData[currentChatId || '']);
  const isGenerating = useSelector(
    (state: RootState) => state.chat.isGenerating[currentChatId || ''] ?? false
  );
  const error = useSelector((state: RootState) => state.chat.error);

  // 将错误输出到 console 而不是 UI，但只在错误变化时输出一次
  useEffect(() => {
    if (error) {
      console.error('[Chat] Redux Error:', error);
      // 清除错误状态，避免重复显示
      setTimeout(() => {
        dispatch(setError(null));
      }, 100);
    }
  }, [error, dispatch]);

  const [inputValue, setInputValue] = useState('');

  // const handleSend = async () => {
  //   console.log('[Chat] handleSend called');
  //   if (!currentChatId) return;
  //   dispatch(sendMessageAsync({ chatId: currentChatId, input: inputValue }));
  //   setInputValue('');
  // };
  // 新实现：只派发 sendMessage 事件
  const handleSend = () => {
    if (!currentChatId) return;
    dispatch(sendMessage({ chatId: currentChatId, input: inputValue }));
    setInputValue('');
  };

  return (
    <div className="chat-page">
      <ChatHeader title={chatData?.info?.title || ''} />
      <div className="chat-content">
        <MessageList
          messages={(chatData?.messages || EMPTY_ARRAY)}
          isGenerating={isGenerating}
        />
        <InputSender
          value={inputValue}
          disabled={isGenerating}
          isGenerating={isGenerating}
          onInputChange={setInputValue}
          onSend={() => {
            console.log('[Chat] onSend prop triggered');
            handleSend();
          }}
          onStop={() => {/* 停止流式生成逻辑 */}}
        />
      </div>
    </div>
  );
};
