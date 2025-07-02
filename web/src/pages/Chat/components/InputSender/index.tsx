import React, { useRef, useEffect } from 'react';
import { Input, Button } from 'antd';
import { 
  SendOutlined, 
  StopOutlined,
} from '@ant-design/icons';
import InputToolbar from '../InputToolbar';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { sendMessage } from '@/store/chatSlice';
import './styles.less';

interface InputSenderProps {
  value?: string;
  loading?: boolean;
  disabled?: boolean;
  isGenerating?: boolean;
  placeholder?: string;
  onInputChange?: (value: string) => void;
  onSend?: () => void;
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
  // 支持直接用 redux state
  const dispatch: AppDispatch = useDispatch();
  const currentChatId = useSelector((state: RootState) => state.chat.currentChatId);
  const reduxIsGenerating = useSelector((state: RootState) => state.chat.isGenerating[currentChatId || ''] || false);
  const [inputValue, setInputValue] = React.useState('');
  const isDisabled = loading || disabled;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log('[InputSender] Enter pressed');
      e.preventDefault();
      if (!isDisabled && (value ?? inputValue).trim()) {
        handleSend();
      }
    }
  };

  useEffect(() => {
    // Focus the textarea when the component mounts
    textAreaRef.current?.focus();
  }, []);

  const handleSend = () => {
    console.log('[InputSender] handleSend called', { currentChatId, value, inputValue });
    if (onSend) {
      console.log('[InputSender] onSend prop exists, calling onSend');
      onSend();
    } else if (currentChatId) {
      // 现有架构直接派发 sendMessage，同步到 middleware/taskLoop
      dispatch(sendMessage({ chatId: currentChatId, input: value ?? inputValue }));
      setInputValue('');
    }
  };

    return (    
    <div className="input-sender">
      <div className="sender-container">
        <div className="input-wrapper">
          <TextArea
            ref={textAreaRef}
            value={value !== undefined ? value : inputValue}
            disabled={isDisabled}
            placeholder={placeholder}
            onChange={e => {
              if (onInputChange) {
                onInputChange(e.target.value);
              } else {
                setInputValue(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            autoSize={{ minRows: 1, maxRows: 5 }}
            className="message-input"
          />
        </div>

        <div className="sender-footer">
          <InputToolbar loading={loading} />

          <div className="action-buttons">
            {(isGenerating ?? reduxIsGenerating) ? (
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
                disabled={!(value ?? inputValue).trim() || isDisabled}
                onClick={() => {
                  console.log('[InputSender] Send button clicked');
                  handleSend();
                }}
              >
                发送
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputSender;
