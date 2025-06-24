import React from 'react';
import { List, Button, Dropdown } from 'antd';
import { EditOutlined, ExportOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { ChatInfo } from '@/types/chat';
import './styles.less';

interface ChatItemProps {
  chat: ChatInfo;
  active?: boolean;
  onSelect: (chatId: string) => void;
  onRename: (chatId: string, oldTitle: string) => void;
  onDelete: (chatId: string) => void;
  onExport?: (chatId: string) => void;
}

const ChatItem: React.FC<ChatItemProps> = ({
  chat,
  active,
  onSelect,
  onRename,
  onDelete,
  onExport
}) => {

  const items: MenuProps['items'] = [
    {
      key: 'rename',
      icon: <EditOutlined />,
      label: '重命名',
      onClick: (e) => {
        e.domEvent.stopPropagation();
        onRename(chat.id, chat.title);
      }
    },
    {
      key: 'export',
      icon: <ExportOutlined />,
      label: '导出对话',
      onClick: (e) => {
        e.domEvent.stopPropagation();
        onExport?.(chat.id);
      }
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除对话',
      danger: true,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        onDelete(chat.id);
      }
    }
  ];

  return (
    <div className={`chat-item-wrapper ${active ? 'active' : ''}`}>
      <List.Item 
        className={`chat-item ${active ? 'active' : ''}`}
        onClick={() => onSelect(chat.id)}
      >
        <div className="chat-item-content">
          <div className="chat-item-title">{chat.title}</div>
          <div className="chat-item-description">
            {chat.messageCount}条消息 · {new Date(chat.updateTime).toLocaleString()}
          </div>
          <div className="chat-item-id">{chat.id}</div>
        </div>
        <Dropdown 
          menu={{ items }} 
          trigger={['click']} 
          placement="bottomRight"
        >
          <Button 
            type="text" 
            icon={<MoreOutlined />}
            className="chat-item-more"
            onClick={e => e.stopPropagation()}
          />
        </Dropdown>
      </List.Item>
    </div>
  );
};

export default ChatItem;
