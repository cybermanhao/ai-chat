// ========================================
// [插件系统已禁用] - 插件系统尚未完善，暂时停止开发
// 本文件保留所有UI控件和代码结构，但注释掉所有插件相关的业务逻辑
// 如需恢复插件功能，请取消相关注释并完善插件系统实现
// ========================================

import { useState } from 'react';
import { Button, Empty, Modal, Form, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
// [插件系统已禁用] - 注释掉插件相关的redux导入
// import { useSelector, useDispatch } from 'react-redux';
// import type { RootState, AppDispatch } from '@/store';
// import { addPlugin, removePlugin, enablePlugin, disablePlugin, updatePluginConfig } from '@/store/pluginStore';
// import type { Plugin } from '@engine/types/plugin';

import PluginCard from '@/components/PluginCard';
import './styles.less';

// [插件系统已禁用] - 保留类型定义，但注释掉实际使用
/*
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
*/

const Plugins = () => {
  // [插件系统已禁用] - 注释掉插件相关的状态管理
  // const plugins = useSelector((state: RootState) => state.plugin.plugins);
  // const configs = useSelector((state: RootState) => state.plugin.configs);
  // const dispatch: AppDispatch = useDispatch();
  const [isModalVisible, setIsModalVisible] = useState(false);
  // const [selectedPlugin, setSelectedPlugin] = useState<PluginWithSchema | null>(null);

  // [插件系统已禁用] - 注释掉插件安装逻辑
  const handleInstallDemo = () => {
    // const demoPlugins: PluginWithSchema[] = [];
    // 只添加不存在的插件
    // demoPlugins.forEach((plugin: PluginWithSchema) => {
    //   if (!plugins.some((p: PluginWithSchema) => p.id === plugin.id)) {
    //     dispatch(addPlugin(plugin));
    //   }
    // });
    console.log('[插件系统已禁用] 插件安装功能已停用');
  };

  // [插件系统已禁用] - 注释掉插件开关逻辑
  const handleTogglePlugin = (id: string, enabled: boolean) => {
    // if (enabled) {
    //   dispatch(enablePlugin(id));
    // } else {
    //   dispatch(disablePlugin(id));
    // }
    console.log(`[插件系统已禁用] 插件开关功能已停用: ${id} -> ${enabled}`);
  };

  // [插件系统已禁用] - 注释掉插件配置逻辑
  const showConfigModal = (plugin: any) => {
    // setSelectedPlugin(plugin);
    // setIsModalVisible(true);
    console.log('[插件系统已禁用] 插件配置功能已停用');
  };

  const handleConfigSave = (values: Record<string, string | number | boolean | null>) => {
    // if (selectedPlugin) {
    //   dispatch(updatePluginConfig({ id: selectedPlugin.id, config: values }));
    // }
    // setIsModalVisible(false);
    console.log('[插件系统已禁用] 插件配置保存功能已停用');
  };

  // [插件系统已禁用] - 使用模拟数据展示UI
  const mockPlugins: any[] = [];
  const mockConfigs: Record<string, any> = {};

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
      </div>
      <div className="plugins-content">
        {mockPlugins.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description="暂无安装的插件"
          />
        ) : (
          <div className="plugins-grid">
            {mockPlugins.map((plugin: any) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                enabled={Boolean(mockConfigs[plugin.id]?.enabled)}
                onToggle={(enabled) => handleTogglePlugin(plugin.id, enabled)}
                onConfigure={plugin.configSchema ? () => showConfigModal(plugin) : undefined}
                onDelete={() => console.log('[插件系统已禁用] 插件删除功能已停用')}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        title={`配置插件: 插件名称`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        {/* [插件系统已禁用] - 注释掉插件配置表单 */}
        {/* {selectedPlugin?.configSchema && (
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
        )} */}
        <div>[插件系统已禁用] 配置功能已停用</div>
      </Modal>
    </div>
  );
};

export default Plugins;
