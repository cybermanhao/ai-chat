import React, { useRef, useEffect } from 'react';
import { Input, Button } from 'antd';
import { 
  SendOutlined, 
  StopOutlined,
} from '@ant-design/icons';
import InputToolbar from '../InputToolbar';
import './styles.less';

interface InputSenderProps {
  value: string;
  loading?: boolean;
  disabled?: boolean;
  isGenerating?: boolean;
  placeholder?: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
}

const { TextArea } = Input;

const InputSender: React.FC<InputSenderProps> = ({
  value,
  loading,
  disabled,
  isGenerating,
  placeholder = '发送消息...',
  onInputChange,
  onSend,
  onStop,
}) => {
  const isDisabled = loading || disabled;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isDisabled && value.trim()) {
        onSend();
      }
    }
  };

  useEffect(() => {
    // Focus the textarea when the component mounts
    textAreaRef.current?.focus();
  }, []);
  
  return (    
    <div className="input-sender">
      <div className="sender-header">
      </div>

      <div className="input-wrapper">
        <TextArea
          ref={textAreaRef}
          value={value}
          disabled={isDisabled}
          placeholder={placeholder}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoSize={{ minRows: 1, maxRows: 5 }}
          className="message-input"
        />
      </div>

      <div className="sender-footer">
        <InputToolbar loading={loading} />

        <div className="action-buttons">
          {isGenerating ? (
            <Button
              type="primary"
              danger
              icon={<StopOutlined />}
              onClick={onStop}
            >
              停止生成
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<SendOutlined />}
              disabled={!value.trim() || isDisabled}
              onClick={onSend}
            >
              发送
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputSender;
