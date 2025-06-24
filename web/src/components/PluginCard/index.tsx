import { Button, Switch } from 'antd';
import { DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import type { Plugin } from '@engine/types/plugin';
import './styles.less';

interface PluginCardProps {
  plugin: Plugin;
  enabled?: boolean;
  onToggle: (enabled: boolean) => void;
  onConfigure?: () => void;
  onDelete: () => void;
}

const PluginCard = ({ plugin, enabled, onToggle, onConfigure, onDelete }: PluginCardProps) => {
  return (
    <div className="plugin-card">
      <div className="plugin-header">
        <div className="plugin-title-row">
          <h3 className="plugin-title">{plugin.name}</h3>
          <Switch checked={enabled} onChange={onToggle} />
        </div>
        <p className="plugin-description">{plugin.description}</p>
        <div className="plugin-meta">
          <span>版本: {plugin.version}</span>
          <span>作者: {plugin.author}</span>
        </div>
      </div>
      <div className="plugin-actions">
        {plugin.configSchema && (
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={onConfigure}
          >
            配置
          </Button>
        )}
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={onDelete}
        >
          删除
        </Button>
      </div>
    </div>
  );
};

export default PluginCard;
