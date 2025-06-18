import React from 'react';
import AppSider from '@/components/AppSider';
import Chat from '@/pages/Chat';
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
      </div>      <div className="app-chat">
        <Chat messages={[]} loading={false} />
      </div>
    </div>
  );
};

export default Layout;
