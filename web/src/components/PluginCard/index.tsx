// ========================================
// [插件系统已禁用] - 插件系统尚未完善，暂时停止开发
// 本文件保留所有UI控件和代码结构，但注释掉所有插件相关的交互逻辑
// 如需恢复插件功能，请取消相关注释并完善插件系统实现
// ========================================

import { Button, Switch } from 'antd';
import { DeleteOutlined, SettingOutlined } from '@ant-design/icons';
// [插件系统已禁用] - 注释掉插件类型导入
// import type { Plugin } from '@engine/types/plugin';
import './styles.less';

// [插件系统已禁用] - 保留接口定义，但注释掉实际使用
/*
interface PluginCardProps {
  plugin: Plugin;
  enabled?: boolean;
  onToggle: (enabled: boolean) => void;
  onConfigure?: () => void;
  onDelete: () => void;
}
*/

const PluginCard = ({ plugin, enabled, onToggle, onConfigure, onDelete }: any) => {
  // [插件系统已禁用] - 注释掉实际的交互逻辑，保留UI展示
  const handleToggle = (checked: boolean) => {
    // onToggle(checked);
    console.log(`[插件系统已禁用] 插件开关已停用: ${plugin?.id} -> ${checked}`);
  };

  const handleConfigure = () => {
    // onConfigure?.();
    console.log('[插件系统已禁用] 插件配置已停用');
  };

  const handleDelete = () => {
    // onDelete();
    console.log('[插件系统已禁用] 插件删除已停用');
  };

  return (
    <div className="plugin-card">
      <div className="plugin-header">
        <div className="plugin-title-row">
          <h3 className="plugin-title">{plugin?.name || '插件名称'}</h3>
          <Switch checked={enabled} onChange={handleToggle} />
        </div>
        <p className="plugin-description">{plugin?.description || '插件描述'}</p>
        <div className="plugin-meta">
          <span>版本: {plugin?.version || '1.0.0'}</span>
          <span>作者: {plugin?.author || '作者'}</span>
        </div>
      </div>
      <div className="plugin-actions">
        {plugin?.configSchema && (
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={handleConfigure}
          >
            配置
          </Button>
        )}
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={handleDelete}
        >
          删除
        </Button>
      </div>
    </div>
  );
};

export default PluginCard;
