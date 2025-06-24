import React, { useState } from 'react';

interface ToolCallMessageProps {
  toolName: string;
  functionName?: string;
  status: 'loading' | 'done' | 'error';
  result?: string;
  error?: string;
  args?: object;
}

const statusMap: Record<string, string> = {
  loading: '调用中',
  done: '已完成',
  error: '失败',
};

const ToolCallMessage: React.FC<ToolCallMessageProps> = ({ toolName, functionName, status, result, error, args }) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className={`tool-call-message tool-call-message-${status}`} style={{ margin: '8px 0', border: '1px solid #eee', borderRadius: 6, background: '#fafbfc' }}>
      <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '6px 12px' }} onClick={() => setCollapsed(c => !c)}>
        <span style={{ fontWeight: 500, color: status === 'error' ? '#ff4d4f' : '#555' }}>
          [{statusMap[status] || status}] {functionName ? `${functionName} @ ` : ''}{toolName}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888' }}>{collapsed ? '展开详情 ▼' : '收起 ▲'}</span>
      </div>
      {!collapsed && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid #eee', background: '#fff' }}>
          {status === 'loading' && <div style={{ color: '#888' }}>工具正在调用中...</div>}
          {status === 'error' && <div style={{ color: '#ff4d4f' }}>错误：{error}</div>}
          {args && <pre style={{ background: '#f6f8fa', padding: 8, borderRadius: 4, fontSize: 13, margin: '8px 0' }}>参数: {JSON.stringify(args, null, 2)}</pre>}
          {status === 'done' && result && <div style={{ color: '#222' }}>结果：{result}</div>}
        </div>
      )}
    </div>
  );
};

export default ToolCallMessage;
