import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { sendMessage, stopGeneration, setError } from '@/store/chatSlice'; // 新增：添加 stopGeneration action
import MessageList from './components/MessageList';
import InputSender from './components/InputSender';
import ChatHeader from './components/ChatHeader';
import { useState, useEffect, useContext } from 'react';
import ChatContext from '@/contexts/chat/context';
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
  const autoScroll = useSelector((state: RootState) => state.chat.settings.autoScroll);

  // 使用 ChatContext 获取滚动函数和 refs
  const chatContext = useContext(ChatContext);
  if (!chatContext) {
    throw new Error('Chat must be used within ChatProvider');
  }
  const { messageListRef, scrollToBottom } = chatContext;

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

  // 在消息列表更新时自动滚动到底部
  useEffect(() => {
    // ✅ 新消息时始终滚动，不受用户设置影响
    if (chatData?.messages && chatData.messages.length > 0) {
      // 使用 requestAnimationFrame + setTimeout 确保 DOM 完全更新后再滚动
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToBottom();
        }, 50);
      });
    }
  }, [chatData?.messages?.length, scrollToBottom]);

  // 监听消息内容变化，包括流式更新
  useEffect(() => {
    // 🎛️ 基于用户设置控制流式更新时的自动滚动
    if (autoScroll && chatData?.messages) {
      const lastMessage = chatData.messages[chatData.messages.length - 1];
      if (lastMessage?.role === 'assistant') {
        // 当 assistant 消息内容变化时也滚动（用于流式生成）
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollToBottom();
          }, 20);
        });
      }
    }
  }, [chatData?.messages, scrollToBottom, autoScroll]);

  // 在生成状态变化时也尝试滚动
  useEffect(() => {
    // 🎛️ 基于用户设置控制生成状态变化时的自动滚动
    if (autoScroll && isGenerating) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToBottom();
        }, 50);
      });
    }
  }, [isGenerating, scrollToBottom, autoScroll]);

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
    
    // ✅ 发送消息后始终滚动，不受用户设置影响
    // 发送消息后立即尝试滚动到底部
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollToBottom();
      }, 20);
    });
  };

  // 停止生成函数
  const handleStop = () => {
    if (!currentChatId) return;
    console.log('[Chat] 停止生成:', currentChatId);
    dispatch(stopGeneration({ chatId: currentChatId }));
  };

  return (
    <div className="chat-page">
      <ChatHeader title={chatData?.info?.title || ''} />
      <div className="chat-content">
        <MessageList
          ref={messageListRef}
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
          onStop={() => {
            console.log('[Chat] onStop prop triggered');
            handleStop();
          }}
        />
      </div>
    </div>
  );
};
