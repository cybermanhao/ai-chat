import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppSider from '@/components/AppSider';
import Chat from '@/pages/Chat';
import './styles.less';

const Layout = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    navigate('/chats');
  }, [navigate]);

  return (
    <div className="app-container">
      <div className="app-tools">
        <AppSider 
          collapsed={collapsed}
          onCollapse={setCollapsed}
        />
      </div>
      <div className="app-chat">
        <Chat />
      </div>
    </div>
  );
};

export default Layout;
