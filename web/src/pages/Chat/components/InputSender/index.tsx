import React from 'react';
import { Sender } from '@ant-design/x';
import { Button, Flex } from 'antd';
import { SendOutlined, LoadingOutlined } from '@ant-design/icons';
import InputToolbar from '../InputToolbar';
import './styles.less';

interface InputSenderProps {
  value: string;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  onAbort?: () => void;
}

const InputSender: React.FC<InputSenderProps> = ({
  value,
  loading,
  disabled,
  placeholder,
  onChange,
  onSubmit,
  onCancel,
  onAbort,
}) => {
  const isDisabled = loading || disabled;

  return (    
    <div className="input-sender">
      {onAbort && (
        <Button 
          type="link" 
          danger 
          onClick={onAbort}
          className="abort-button"
        >
          停止生成
        </Button>
      )}
      <Sender
        loading={isDisabled}
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        autoSize={{ minRows: 1, maxRows: 6 }}
        placeholder={placeholder}
        footer={
          <Flex className="sender-footer" justify="space-between" align="center" gap={8}>
            <div className="toolbar-container">
              <InputToolbar />
            </div>
            <Button
              type="primary"
              onClick={onSubmit}
              disabled={isDisabled}
              icon={loading ? <LoadingOutlined /> : <SendOutlined />}
              style={{ flexShrink: 0 }}
            />
          </Flex>
        }
        actions={false}
        onCancel={onCancel}
      />
    </div>
  );
};

export default InputSender;
