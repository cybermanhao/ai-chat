
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { List, Card, Tag, Button } from 'antd';
import { useRoleStore } from '@/store/roleStore';
import type { AIRole } from '@/store/roleStore';
import { SelectableList } from '@/components/Selection/SelectableList';
import { EditableItem } from '@/components/Editing/EditableItem';
import { ModalStateProvider } from '@/components/Modal/ModalStateProvider';
import { RoleForm } from './RoleForm';
import './styles.less';

export const RoleList = () => {
  const { roles, selectedRole, setSelectedRole, addRole, deleteRole, updateRole } = useRoleStore();

  return (
    <div className="role-list">
      <SelectableList<AIRole> 
        items={roles}
        initialSelection={selectedRole}
        onChange={([selected]) => setSelectedRole(selected || null)}
      >
        {({ isSelected, toggleSelection }) => (
          <EditableItem<AIRole>
            onChange={(role) => {
              if (role) {
                if (role.id.startsWith('new-')) {
                  addRole(role);
                } else {
                  updateRole(role.id, role);
                }
              }
            }}
          >
            {({ startNew, startEditing }) => (
              <ModalStateProvider<AIRole>>
                {({ state: { visible, data: editingRole }, show, hide }) => (
                  <>
                    <div className="role-list-header">
                      <h2>角色列表</h2>
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={() => {
                          startNew();
                          show();
                        }}
                      >
                        添加角色
                      </Button>
                    </div>
                    <List
                      grid={{ gutter: 16, column: 3 }}
                      dataSource={roles}
                      renderItem={role => (
                        <List.Item>
                          <Card
                            hoverable
                            className={isSelected(role) ? 'selected' : ''}
                            onClick={() => toggleSelection(role)}
                            actions={[
                              <Button
                                icon={<EditOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(role);
                                  show(role);
                                }}
                              />,
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRole(role.id);
                                }}
                              />,
                            ]}
                          >
                            <Card.Meta
                              title={role.name}
                              description={role.description}
                            />
                            <div className="role-tags">
                              {role.tags.map(tag => (
                                <Tag key={tag}>{tag}</Tag>
                              ))}
                            </div>
                          </Card>
                        </List.Item>
                      )}
                    />
                    <RoleForm
                      visible={visible}
                      role={editingRole}
                      onOk={hide}
                      onCancel={hide}
                    />
                  </>
                )}
              </ModalStateProvider>
            )}
          </EditableItem>
        )}
      </SelectableList>
    </div>
  );
};
