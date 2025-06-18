import React from 'react';
import { Bubble } from '@ant-design/x';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
// import Markdown from '@/components/Markdown';
import type { ChatRole } from '@/types';
import './styles.less';

interface MessageCardProps {
  id: string;
  content: string;
  role: ChatRole;
}

const userAvatar: React.CSSProperties = {
  color: '#fff',
  backgroundColor: '#1890ff',
};

const assistantAvatar: React.CSSProperties = {
  color: '#fff',
  backgroundColor: '#52c41a',
};

const MessageCard: React.FC<MessageCardProps> = ({ id, content, role }) => {
  const isUser = role === 'user';
  // const isAssistant = role === 'assistant';

  return (
    <Bubble
      key={id}
      placement={isUser ? 'end' : 'start'}
      content={ content}
      // content={isAssistant ? <Markdown content={content} /> : content}
      avatar={{ 
        icon: isUser ? <UserOutlined /> : <RobotOutlined />,
        style: isUser ? userAvatar : assistantAvatar
      }}
    />
  );
};

export default MessageCard;
