import { DeleteOutlined, EditOutlined, ExportOutlined } from '@ant-design/icons';
import { Conversations } from '@ant-design/x';
import type { ConversationsProps } from '@ant-design/x';
import { App, Modal, Input, theme } from 'antd';
import React, { useState } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useNavigate } from 'react-router-dom';
import './styles.less';

const ChatList: React.FC = () => {
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const { chats, deleteChat, renameChat, exportChat } = useChatStore();
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const items = chats.map(chat => ({
    key: chat.id,
    label: chat.title || '新对话',
    disabled: false,
  }));

  const handleRename = () => {
    if (selectedChatId && newTitle) {
      renameChat(selectedChatId, newTitle);
      setIsRenameModalVisible(false);
      setNewTitle('');
      setSelectedChatId(null);
    }
  };

  const menuConfig: ConversationsProps['menu'] = (conversation) => ({
    items: [
      {
        label: '重命名',
        key: 'rename',
        icon: <EditOutlined />,
      },
      {
        label: '导出对话',
        key: 'export',
        icon: <ExportOutlined />,
      },
      {
        label: '删除对话',
        key: 'delete',
        icon: <DeleteOutlined />,
        danger: true,
      },
    ],
    onClick: async (menuInfo) => {
      menuInfo.domEvent.stopPropagation();
      const chatId = conversation.key;

      switch (menuInfo.key) {
        case 'rename':
          setSelectedChatId(chatId);
          setNewTitle(chats.find(chat => chat.id === chatId)?.title || '');
          setIsRenameModalVisible(true);
          break;
        case 'export':
          await exportChat(chatId);
          message.success('导出成功');
          break;
        case 'delete':
          Modal.confirm({
            title: '确认删除',
            content: '确定要删除这个对话吗？此操作不可恢复。',
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
              await deleteChat(chatId);
              message.success('删除成功');
            },
          });
          break;
      }
    },
  });

  const style = {
    width: '100%',
    height: '100%',
    background: token.colorBgContainer,
    borderRadius: token.borderRadius,
  };

  return (
    <div className="chat-list">      <Conversations
        style={style}
        defaultActiveKey={chats[0]?.id}
        items={items}
        menu={menuConfig}
        onChange={key => navigate(`/chat/${key}`)}
      />

      <Modal
        title="重命名对话"
        open={isRenameModalVisible}
        onOk={handleRename}
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
