import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSider from '@/components/AppSider';
import { Chat } from './Chat';
import './Home.less';

const Home = () => {
  const [siderCollapsed, setSiderCollapsed] = useState(false);

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

export default Home;