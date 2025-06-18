import { Layout } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import './styles.less';

const { Header } = Layout;

interface AppHeaderProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const AppHeader = ({ collapsed, onCollapsedChange }: AppHeaderProps) => {
  return (
    <Header className="app-header">
      <div className="trigger">
        {collapsed ? (
          <MenuUnfoldOutlined onClick={() => onCollapsedChange(false)} />
        ) : (
          <MenuFoldOutlined onClick={() => onCollapsedChange(true)} />
        )}
      </div>
    </Header>
  );
};

export default AppHeader;
