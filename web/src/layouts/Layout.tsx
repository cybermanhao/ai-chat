import React from 'react';
import AppSider from '@/components/AppSider';
import { Outlet } from 'react-router-dom';
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
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
