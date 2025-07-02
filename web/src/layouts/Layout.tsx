import React from 'react';
import AppSider from '@/components/AppSider';
import { Outlet } from 'react-router-dom';
import { ChatProvider } from '@/contexts/chat/ChatContext';
import './styles.less';

const Layout = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="app-container">
      <div className="app-tools">
        <AppSider 
          collapsed={collapsed}
          onCollapse={setCollapsed}
        />
      </div>
      <div className="app-chat">
        <ChatProvider>
          <Outlet />
        </ChatProvider>
      </div>
    </div>
  );
};

export default Layout;
