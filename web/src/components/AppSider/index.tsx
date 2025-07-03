import React, { useState } from 'react';
import { Layout } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  MessageOutlined,
  RobotOutlined,
  AppstoreOutlined,
  BugOutlined
} from '@ant-design/icons';
import { MCP } from '@lobehub/icons';
import './styles.less';

const { Sider } = Layout;

interface AppSiderProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

// [插件系统已禁用] - 注释掉插件面板类型，但保留UI结构
// type PanelType = 'chat' | 'settings' | 'mcp' | 'profile' | 'roles' | 'plugins';
type PanelType = 'chat' | 'settings' | 'mcp' | 'profile' | 'roles' | 'debug';

// 创建一个 PanelContent 映射
const PanelContent = {
  chat: React.lazy(() => import('@/pages/ChatList')),
  roles: React.lazy(() => import('@/pages/RoleList')),
  profile: React.lazy(() => import('@/pages/Profile')),
  settings: React.lazy(() => import('@/pages/Settings')),
  mcp: React.lazy(() => import('@/pages/Mcp')),
  debug: React.lazy(() => import('@/pages/Debug')),
  // [插件系统已禁用] - 注释掉插件页面导入
  // plugins: React.lazy(() => import('@/pages/Plugins')),
};

const AppSider = ({ collapsed, onCollapse }: AppSiderProps) => {
  const [activePanel, setActivePanel] = useState<PanelType>('chat');

  const handleToolClick = (panel: PanelType) => {
    if (activePanel !== panel) {
      setActivePanel(panel);
      onCollapse(false);
    }
  };

  const ActivePanelComponent = PanelContent[activePanel];

  return (
    <div className="app-sider-container">
      <div className="app-toolbar">
        <div className="toolbar-top">
          <div
            className={`toolbar-item ${activePanel === 'chat' ? 'active' : ''}`}
            onClick={() => handleToolClick('chat')}
          >
            <MessageOutlined />
          </div>
          <div
            className={`toolbar-item ${activePanel === 'roles' ? 'active' : ''}`}
            onClick={() => handleToolClick('roles')}
          >
            <RobotOutlined />
          </div>
          <div
            className={`toolbar-item ${activePanel === 'settings' ? 'active' : ''}`}
            onClick={() => handleToolClick('settings')}
          >
            <SettingOutlined />
          </div>
          <div
            className={`toolbar-item ${activePanel === 'mcp' ? 'active' : ''}`}
            onClick={() => handleToolClick('mcp')}
          >
            <MCP />
          </div>
          <div
            className={`toolbar-item ${activePanel === 'debug' ? 'active' : ''}`}
            onClick={() => handleToolClick('debug')}
          >
            <BugOutlined />
          </div>
          {/* [插件系统已禁用] - 注释掉插件工具栏按钮，但保留UI结构 */}
          {/* <div
            className={`toolbar-item ${activePanel === 'plugins' ? 'active' : ''}`}
            onClick={() => handleToolClick('plugins')}
          >
            <AppstoreOutlined />
          </div> */}
        </div>
        <div className="toolbar-bottom">
          <div
            className={`toolbar-item ${activePanel === 'profile' ? 'active' : ''}`}
            onClick={() => handleToolClick('profile')}
          >
            <UserOutlined />
          </div>
        </div>
      </div>

      {!collapsed && (
        <Sider
          width={360}
          className="app-sider"
          style={{ 
            height: '100%',
            background: 'var(--sider-panel-bg)',
            borderRight: '1px solid var(--border-color-split)'
          }}
        >
          <React.Suspense fallback={<div>Loading...</div>}>
            <ActivePanelComponent />
          </React.Suspense>
        </Sider>
      )}
    </div>
  );
};

export default AppSider;
