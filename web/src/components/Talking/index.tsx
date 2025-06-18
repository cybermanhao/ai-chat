import React, { useState} from 'react';
import { Bubble, Sender } from '@ant-design/x';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import Markdown from '@/components/Markdown';
import ChatToolbar from './ChatToolbar';
import { useLLMStore } from '@/store/llmStore';
import './styles.less';

export interface TalkingMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

interface TalkingProps {
  messages: TalkingMessage[];
  loading?: boolean;
  onSend?: (value: string) => void;
  disabled?: boolean;
}

const userAvatar: React.CSSProperties = {
  color: '#fff',
  backgroundColor: '#1890ff',
};

const assistantAvatar: React.CSSProperties = {
  color: '#fff',
  backgroundColor: '#52c41a',
};

const Talking: React.FC<TalkingProps> = ({ messages, loading = false, onSend, disabled }) => {
  const [value, setValue] = useState('');
  const { selectedLLM } = useLLMStore();

  const handleSubmit = () => {
    if (!value.trim() || !onSend) return;
    onSend(value.trim());
    setValue('');
  };

  return (
    <div className="talking">
      <div className="talking-inner">
        {messages.map(({ id, content, role }) => (
          <Bubble
            key={id}
            placement={role === 'user' ? 'end' : 'start'}
            content={role === 'assistant' ? <Markdown content={content} /> : content}
            avatar={{ 
              icon: role === 'user' ? <UserOutlined /> : <RobotOutlined />,
              style: role === 'user' ? userAvatar : assistantAvatar
            }}
          />
        ))}
      </div>
      <div className="input-area">
        <Sender
          loading={loading || disabled || !selectedLLM}
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          autoSize={{ minRows: 1, maxRows: 6 }}
          placeholder={selectedLLM ? "输入消息..." : "请先在设置中选择模型..."}
          footer={({ components }) => (
            <ChatToolbar components={components} loading={loading} />
          )}
          actions={false}
        />
      </div>
    </div>
  );
};

export default Talking;
