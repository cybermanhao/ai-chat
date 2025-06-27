import { PlusOutlined } from '@ant-design/icons';
import { Modal, Input, Button, List, message } from 'antd';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import scrollIntoView from 'scroll-into-view-if-needed';
import { useSelector, useDispatch } from 'react-redux';
import { type AppDispatch, type RootState } from '@/store';
import { addChat, deleteChat, renameChat, setCurrentChat } from '@/store/chatSlice';
import type { ChatInfo } from '@engine/types/chat';
import ChatItem from './components/ChatItem';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import './styles.less';

const ChatList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const { chatId: currentUrlChatId } = useParams<{ chatId: string }>();

  const { chatList, currentChatId } = useSelector((state: RootState) => state.chat);

  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const activeChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentChatId && activeChatRef.current) {
      scrollIntoView(activeChatRef.current, {
        scrollMode: 'if-needed',
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentChatId, activeChatRef]);

  useEffect(() => {
    // 如果没有聊天，则创建一个新聊天
    if (chatList.length === 0) {
      dispatch(addChat('新对话'));
    }
  }, [chatList, dispatch]);

  useEffect(() => {
    // 当 Redux store 中的 currentChatId 变化时，自动导航
    if (currentChatId && currentUrlChatId !== currentChatId) {
      navigate(`/chat/${currentChatId}`);
    }
  }, [currentChatId, currentUrlChatId, navigate]);


  const handleNewChat = () => {
    dispatch(addChat('新对话'));
  };

  const handleSelect = (id: string) => {
    dispatch(setCurrentChat(id));
    navigate(`/chat/${id}`);
  };

  const handleRename = (id: string, oldTitle: string) => {
    setSelectedChatId(id);
    setNewTitle(oldTitle);
    setIsRenameModalVisible(true);
  };

  const handleDelete = (chatId: string) => {
    setSelectedChatId(chatId);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async (chatId: string) => {
    try {
      // 找到下一个可用的聊天ID
      const currentIndex = chatList.findIndex(chat => chat.id === chatId);
      let nextChatId: string | null = null;
      if (chatList.length > 1) {
        nextChatId = currentIndex === 0 
          ? chatList[1].id 
          : chatList[currentIndex - 1].id;
      }
      
      // 如果删除的是当前打开的聊天，先导航到下一个聊天
      if (currentChatId === chatId && nextChatId) {
        navigate(`/chat/${nextChatId}`);
      } else if (currentChatId === chatId && !nextChatId) {
        navigate('/chat');
      }
      
      dispatch(deleteChat(chatId));
      message.success('删除成功');
    } catch (error) {
      console.error('Failed to delete chat:', error);
      message.error('删除失败');
    } finally {
      setIsDeleteModalVisible(false);
      setSelectedChatId(null);
    }
  };

  const handleExport = () => {
    message.info('导出功能开发中');
  };

  const confirmRename = () => {
    if (selectedChatId && newTitle) {
      dispatch(renameChat({ id: selectedChatId, title: newTitle }));
      setIsRenameModalVisible(false);
      setNewTitle('');
      setSelectedChatId(null);
    }
  };

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleNewChat}
        >
          新建对话
        </Button>
      </div>
      <List
        className="chat-list-content"
        dataSource={chatList}
        locale={{ emptyText: '暂无对话，点击上方按钮创建新对话' }}
        renderItem={(chat: ChatInfo) => (
          <div ref={chat.id === currentChatId ? activeChatRef : null}>
            <ChatItem
              key={chat.id}
              chat={chat}
              active={chat.id === currentChatId}
              onSelect={handleSelect}
              onRename={handleRename}
              onDelete={handleDelete}
              onExport={handleExport}
            />
          </div>
        )}
      />
      <Modal
        title="重命名对话"
        open={isRenameModalVisible}
        onOk={confirmRename}
        onCancel={() => {
          setIsRenameModalVisible(false);
          setNewTitle('');
          setSelectedChatId(null);
        }}
        okText="确认"
        cancelText="取消"
      >
        <Input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="请输入新的对话名称"
          autoFocus
        />
      </Modal>
      
      <DeleteConfirmModal 
        visible={isDeleteModalVisible}
        chatId={selectedChatId}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setSelectedChatId(null);
        }}
      />
    </div>
  );
};

export default ChatList;
