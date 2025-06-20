import { PlusOutlined } from '@ant-design/icons';
import { Modal, Input, Button, List, message } from 'antd';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import scrollIntoView from 'scroll-into-view-if-needed';
import { useChatStore } from '@/store/chatStore';
import ChatItem from './components/ChatItem';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import './styles.less';

const ChatList: React.FC = () => {
  const navigate = useNavigate();  
  const { chatId: currentChatId } = useParams<{ chatId: string }>();
  const { 
    chats: chatList, 
    createChat,
    deleteChat, 
    renameChat,
    setCurrentId: switchChat
  } = useChatStore();
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // 创建一个 ref 对象来存储活动聊天项的引用
  const activeChatRef = useRef<HTMLDivElement>(null);
  // 当 currentChatId 改变时滚动到对应项
  useEffect(() => {
    if (currentChatId && activeChatRef.current) {
      scrollIntoView(activeChatRef.current, {
        scrollMode: 'if-needed',
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [currentChatId, activeChatRef]);

  const handleNewChat = async () => {
    const id = await createChat();
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
  const handleExport = (id: string) => {
    message.info('导出功能开发中');
    console.log(`Exporting chat with ID: ${id}`);
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
        locale={{ emptyText: '暂无对话，点击上方按钮创建新对话' }}        renderItem={chat => (
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
      />      <Modal
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
    </div>
  );
};

export default ChatList;
