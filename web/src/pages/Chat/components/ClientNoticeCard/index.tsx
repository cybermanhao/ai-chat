import React, { useState } from 'react';
import { InfoCircleOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Tooltip, Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { copyToClipboard } from '@/utils/markdown';
import './styles.less';

export interface ClientNoticeCardProps {
  id?: string; // ID is optional since we don't use it in the component
  content: string;
  noticeType: 'error' | 'warning' | 'info';
  errorCode?: string;
  timestamp: number;
}

/**
 * 客户端提示消息组件
 * 用于显示错误、警告和普通提示信息
 */
const ClientNoticeCard: React.FC<ClientNoticeCardProps> = ({
  content,
  noticeType = 'info',
  errorCode,
  timestamp,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  // 根据通知类型获取图标
  const getNoticeIcon = () => {
    switch (noticeType) {
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'info':
      default:
        return <InfoCircleOutlined style={{ color: '#1677ff' }} />;
    }
  };

  // 根据通知类型获取标题
  const getNoticeTitle = () => {
    switch (noticeType) {
      case 'error':
        return '错误';
      case 'warning':
        return '警告';
      case 'info':
      default:
        return '提示';
    }
  };

  return (
    <div className={`client-notice-card notice-${noticeType}`}>
      <div className="notice-header">
        <div className="notice-icon">{getNoticeIcon()}</div>
        <div className="notice-title">{getNoticeTitle()}</div>
        {errorCode && (
          <div className="notice-code">
            <Tooltip title="错误代码">
              <span>#{errorCode}</span>
            </Tooltip>
          </div>
        )}
        <div className="notice-actions">
          <Tooltip title={collapsed ? '展开详情' : '收起详情'}>
            <Button
              type="text"
              size="small"
              onClick={() => setCollapsed(c => !c)}
              style={{ fontSize: 12 }}
            >
              {collapsed ? '展开' : '收起'}
            </Button>
          </Tooltip>
          <Tooltip title="复制内容">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                copyToClipboard(content);
                message.success({
                  content: '已复制到剪贴板',
                  className: 'copy-success-message',
                });
              }}
            />
          </Tooltip>
        </div>
      </div>
      <div className="notice-content">
        <div
          className="notice-message"
          style={{
            maxHeight: collapsed ? 60 : 300,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            background: '#fff',
            borderRadius: 4,
            padding: 8,
            cursor: collapsed ? 'pointer' : 'auto',
            transition: 'max-height 0.2s',
          }}
          onClick={() => collapsed && setCollapsed(false)}
        >
          {content}
        </div>
        {timestamp && (
          <div className="notice-time">
            {new Date(timestamp).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientNoticeCard;
