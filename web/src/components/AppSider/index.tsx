import React, { useState } from 'react';
import { Layout, Button } from 'antd';
import { useNavigate, useOutlet } from 'react-router-dom';
import {
  UserOutlined,
  SettingOutlined,
  MessageOutlined,  MenuFoldOutlined,
  RobotOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { MCP } from '@lobehub/icons';
import './styles.less';

const { Sider } = Layout;

interface AppSiderProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

type PanelType = 'chat' | 'settings' | 'mcp' | 'profile' | 'roles' | 'plugins';

const AppSider = ({ collapsed, onCollapse }: AppSiderProps) => {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<PanelType>('chat');
  const outlet = useOutlet();

  const handleToolClick = (panel: PanelType) => {
    if (activePanel !== panel) {
      setActivePanel(panel);
      onCollapse(false);
    }

    switch (panel) {
      case 'chat':
        navigate('/chats');
        break;
      case 'roles':
        navigate('/roles');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;      case 'mcp':
        navigate('/mcp');
        break;
      case 'plugins':
        navigate('/plugins');
        break;
    }
  };

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
            className={`toolbar-item ${activePanel === 'plugins' ? 'active' : ''}`}
            onClick={() => handleToolClick('plugins')}
          >
            <AppstoreOutlined />
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
        <Sider className="app-panel" width={300}>
          <div className="panel-header">
            <span className="panel-title">              {activePanel === 'chat' && '聊天'}
              {activePanel === 'roles' && 'AI 角色'}
              {activePanel === 'plugins' && '插件市场'}
              {activePanel === 'settings' && '设置'}
              {activePanel === 'mcp' && 'MCP服务器'}
              {activePanel === 'profile' && '个人信息'}
            </span>
            <Button 
              type="text" 
              icon={<MenuFoldOutlined />}
              onClick={() => onCollapse(true)}
              className="collapse-btn"
            />
          </div>
          <div className="panel-content">
            {outlet}
          </div>
        </Sider>
      )}
    </div>
  );
};

export default AppSider;
