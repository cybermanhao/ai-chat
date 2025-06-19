import { PlusOutlined } from '@ant-design/icons';
import { App, Modal, Input, Button, List } from 'antd';
import React, { useState } from 'react';
import { useChatList } from '@/hooks/useChatList';
import { useNavigate, useParams } from 'react-router-dom';
import ChatItem from './components/ChatItem';
import './styles.less';

const ChatList: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  const { chatList, createChat, deleteChat, updateChatInfo, switchChat } = useChatList();
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const handleNewChat = async () => {
    const id = await createChat();
    navigate(`/chat/${id}`);
  };

  const handleSelect = (id: string) => {
    switchChat(id);
    navigate(`/chat/${id}`);
  };

  const handleRename = (id: string, oldTitle: string) => {
    setSelectedChatId(id);
    setNewTitle(oldTitle);
    setIsRenameModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个对话吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await deleteChat(id);
        message.success('删除成功');
        if (chatId === id) {
          // 如果删除的是当前聊天，跳转到首页
          navigate('/chat');
        }
      },
    });
  };

  const handleExport = (id: string) => {
    message.info('导出功能开发中');
  };

  const confirmRename = () => {
    if (selectedChatId && newTitle) {
      updateChatInfo(selectedChatId, { title: newTitle });
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
        renderItem={chat => (
          <ChatItem
            key={chat.id}
            chat={chat}
            active={chat.id === chatId}
            onSelect={handleSelect}
            onRename={handleRename}
            onDelete={handleDelete}
            onExport={handleExport}
          />
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
    </div>
  );
};

export default ChatList;
