import { useState } from 'react';
import { Button, Empty, Modal, Form, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
// 修正导入，使用 web/src/store/pluginStore
import { usePluginStore } from '@/store/pluginStore';
import type { Plugin } from '@engine/types/plugin';

import PluginCard from '@/components/PluginCard';
import './styles.less';

interface PluginSchema {
  type: string;
  properties: Record<string, {
    type: string;
    description: string;
    default?: unknown;
  }>;
}

interface PluginWithSchema extends Plugin {
  configSchema?: PluginSchema;
}

const Plugins = () => {
  const { plugins, addPlugin, removePlugin, enablePlugin, disablePlugin, configs, updatePluginConfig } = usePluginStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginWithSchema | null>(null);  const handleInstallDemo = () => {
    const demoPlugins: PluginWithSchema[] = [];
    // 只添加不存在的插件
    demoPlugins.forEach((plugin: PluginWithSchema) => {
      if (!plugins.some((p: PluginWithSchema) => p.id === plugin.id)) {
        addPlugin(plugin);
      }
    });
  };

  const handleTogglePlugin = (id: string, enabled: boolean) => {
    if (enabled) {
      enablePlugin(id);
    } else {
      disablePlugin(id);
    }
  };

  const showConfigModal = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setIsModalVisible(true);
  };

  const handleConfigSave = (values: Record<string, string | number | boolean | null>) => {
    if (selectedPlugin) {
      updatePluginConfig(selectedPlugin.id, values);
    }
    setIsModalVisible(false);
  };

  return (
    <div className="plugins-page">
      <div className="plugins-header">
        <h2>插件市场</h2>
        <Button 
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleInstallDemo}
        >
          安装示例插件
        </Button>
      </div>      <div className="plugins-content">
        {plugins.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description="暂无安装的插件"
          />
        ) : (
          <div className="plugins-grid">
            {plugins.map((plugin: PluginWithSchema) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                enabled={Boolean(configs[plugin.id]?.enabled)}
                onToggle={(enabled) => handleTogglePlugin(plugin.id, enabled)}
                onConfigure={plugin.configSchema ? () => showConfigModal(plugin) : undefined}
                onDelete={() => removePlugin(plugin.id)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        title={`配置插件: ${selectedPlugin?.name}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        {selectedPlugin?.configSchema && (
          <Form
            layout="vertical"
            initialValues={configs[selectedPlugin.id]}
            onFinish={handleConfigSave}
          >
            {Object.entries(selectedPlugin.configSchema.properties).map(([key, schema]) => (
              <Form.Item
                key={key}
                label={schema.description}
                name={key}
                initialValue={schema.default}
              >
                <Input />
              </Form.Item>
            ))}
            <Form.Item>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default Plugins;
