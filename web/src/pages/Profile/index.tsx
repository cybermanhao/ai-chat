import React from 'react';
import { Card, Avatar, Button, Descriptions } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import './styles.less';

const Profile = () => {
  return (
    <div className="profile-page">
      <Card className="profile-card">
        <div className="profile-header">
          <Avatar size={64} icon={<UserOutlined />} />
          <div className="profile-info">
            <h2>用户名</h2>
            <p>user@example.com</p>
          </div>
          <Button type="primary" icon={<EditOutlined />}>
            编辑资料
          </Button>
        </div>

        <Descriptions column={1} className="profile-details">
          <Descriptions.Item label="账号类型">
            个人用户
          </Descriptions.Item>
          <Descriptions.Item label="注册时间">
            2024-06-17
          </Descriptions.Item>
          <Descriptions.Item label="对话次数">
            128
          </Descriptions.Item>
          <Descriptions.Item label="API 密钥">
            <Button type="link" size="small">查看 API 密钥</Button>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="使用统计" className="stats-card">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">1,234</div>
            <div className="stat-label">总对话数</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">89%</div>
            <div className="stat-label">完成率</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">12.5h</div>
            <div className="stat-label">使用时长</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">4.8</div>
            <div className="stat-label">平均评分</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
