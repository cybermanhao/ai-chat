import { PlusOutlined } from '@ant-design/icons';
import { List, Button, Modal } from 'antd';
import { useRoleStore } from '@/store/roleStore';
import type { AIRole } from '@/store/roleStore';
import { useState } from 'react';
import RoleCard from './components/RoleCard';
import { RoleForm } from './components/RoleForm';
import './styles.less';

const RoleList: React.FC = () => {
  const {roles, selectedRole, setSelectedRole, addRole, deleteRole, updateRole } = useRoleStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<AIRole | null>(null);

  const handleAdd = () => {
    setEditingRole(null);
    setModalVisible(true);
  };

  const handleEdit = (role: AIRole, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRole(role);
    setModalVisible(true);
  };

  const handleDelete = (role: AIRole, e: React.MouseEvent) => {
    e.stopPropagation();
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除角色"${role.name}"吗？`,
      okText: '删除',
      cancelText: '取消',
      onOk: () => {
        deleteRole(role.id);
        if (selectedRole?.id === role.id) {
          setSelectedRole(null);
        }
      }
    });
  };

  const handleRoleSelect = (role: AIRole) => {
    setSelectedRole(selectedRole?.id === role.id ? null : role);
  };

  const handleRoleChange = (role: AIRole) => {
    if (role.id.startsWith('new-')) {
      addRole(role);
    } else {
      updateRole(role.id, role);
    }
    setModalVisible(false);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  return (
    <div className="role-list">
      <div className="role-list-header">
        <h2>角色列表</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          添加角色
        </Button>
      </div>      <List
        className="list-container"
        dataSource={roles}
        renderItem={(role: AIRole) => (
          <List.Item>
            <div className="card-wrapper">
              <RoleCard
                role={role}
                selected={selectedRole?.id === role.id}
                onSelect={handleRoleSelect}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </List.Item>
        )}
      /><RoleForm
        visible={modalVisible}
        role={editingRole}
        onCancel={handleModalCancel}
        onChange={handleRoleChange}
      />
    </div>
  );
};

export default RoleList;
