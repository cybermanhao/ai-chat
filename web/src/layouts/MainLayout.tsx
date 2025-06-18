import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSider from '@/components/AppSider';
import Chat from '@/pages/Chat';
import './MainLayout.less';

const MainLayout = () => {
  const [siderCollapsed, setSiderCollapsed] = React.useState(false);

  return (
    <div className="app-container">
      <div className="app-tools">
        <AppSider 
          collapsed={siderCollapsed} 
          onCollapse={setSiderCollapsed} 
        />
      </div>
      <div className="app-workspace">
        <Outlet />
      </div>
      <div className="app-chat">
        <Chat />
      </div>
    </div>
  );
};

export default MainLayout;
