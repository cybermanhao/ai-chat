import { PlusOutlined } from '@ant-design/icons';
import { Modal, Input, Button, List, message } from 'antd';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import scrollIntoView from 'scroll-into-view-if-needed';
import { useStore } from 'zustand';
import { useChatStore } from '@/store/chatStore';
import { useChatList } from '@/hooks/useChatList';
import ChatItem from './components/ChatItem';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import { useGlobalLoading } from '@/store/globalLoading';
import MemeLoading from '@/components/memeLoading/MemeLoading';
import './styles.less';

const ChatList: React.FC = () => {
  const navigate = useNavigate();  
  const { chatId: currentChatId } = useParams<{ chatId: string }>();
  // 使用 useChatList 以确保持久化和 currentId 逻辑一致
  const { chatList, currentChatId: persistedChatId, setActiveChat, addChat } = useChatList();
  const deleteChat = useStore(useChatStore, state => state.deleteChat);
  const renameChat = useStore(useChatStore, state => state.renameChat);
  const switchChat = useStore(useChatStore, state => state.setCurrentId);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { show, hide } = useGlobalLoading();

  // 创建一个 ref 对象来存储活动聊天项的引用
  const activeChatRef = useRef<HTMLDivElement>(null);
  // 当 currentChatId 改变时滚动到对应项
  useEffect(() => {
    if (currentChatId && activeChatRef.current) {
      scrollIntoView(activeChatRef.current, {
        scrollMode: 'if-needed',
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [currentChatId, activeChatRef]);

  // 自动加载聊天列表并跳转到上次聊天或新建
  useEffect(() => {
    (async () => {
      show();
      const hasLocal = !!localStorage.getItem('chat_list');
      if (!hasLocal && (!chatList || chatList.length === 0)) {
        // 只有本地没有才新建
        const id = await addChat('新对话');
        setActiveChat(id);
        navigate(`/chat/${id}`);
      } else if (!currentChatId && persistedChatId) {
        // 有聊天但未选中，跳转到上次聊天
        navigate(`/chat/${persistedChatId}`);
      } 
      hide();
    })();
  }, [chatList, currentChatId, persistedChatId, addChat, setActiveChat, navigate, show, hide]);

  const handleNewChat = async () => {
    const id = await addChat('新对话');
    navigate(`/chat/${id}`);
  };

  const handleSelect = (id: string) => {
    switchChat(id);
    navigate(`/chat/${id}`);
  };  const handleRename = (id: string, oldTitle: string) => {
    setSelectedChatId(id);
    setNewTitle(oldTitle);
    setIsRenameModalVisible(true);
  };
  
  const handleDelete = (chatId: string) => {
    // 打开删除确认对话框
    setSelectedChatId(chatId);
    setIsDeleteModalVisible(true);
  };
    const handleConfirmDelete = async (chatId: string) => {
    try {
      // 找到下一个可用的聊天ID
      const nextChat = chatList.find(chat => chat.id !== chatId);
      const navigateTarget = nextChat ? `/chat/${nextChat.id}` : '/chat';
      
      // 如果删除的是当前打开的聊天，先导航到下一个聊天
      if (currentChatId === chatId) {
        navigate(navigateTarget);
      }      // 执行删除操作
      await deleteChat(chatId);
      message.success('删除成功');
    } catch (error) {
      console.error('Failed to delete chat:', error);
      message.error('删除失败');
    } finally {
      // 关闭对话框
      setIsDeleteModalVisible(false);
      setSelectedChatId(null);
    }
  };
  const handleExport = () => {
    message.info('导出功能开发中');
  };
  const confirmRename = () => {
    if (selectedChatId && newTitle) {
      renameChat(selectedChatId, newTitle);
      setIsRenameModalVisible(false);
      setNewTitle('');
      setSelectedChatId(null);
    }
  };

  return (
    <div className="chat-list">
      {/* 全局加载遮罩移除，统一由 App 根组件全局引入 */}
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
        renderItem={chat => (
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
      
      {/* 删除确认对话框 */}
      <DeleteConfirmModal 
        visible={isDeleteModalVisible}
        chatId={selectedChatId}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setSelectedChatId(null);
        }}
      />
      <MemeLoading />
    </div>
  );
};

export default ChatList;
