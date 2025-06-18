export { RoleList } from './RoleList';
export { RoleForm } from './RoleForm';
export type { AIRole } from '@/store/roleStore';



const RoleList: React.FC = () => {
  const { roles, selectedRole, setSelectedRole, addRole, deleteRole, updateRole } = useRoleStore();  const { visible, data: editingRole, setVisible } = useModalState<AIRole>();
  const { confirm } = useConfirmation();
  const [form] = Form.useForm();
    onSubmit: (roleData: AIRole) => {
      if (editingItem) {
        updateRole(editingItem.id, roleData);
      } else {
        addRole(roleData);
      }
      hideModal();
    },
    transform: (values: FormValues): AIRole => ({
      id: editingItem?.id || Date.now().toString(),
      name: values.name,
      description: values.description,
      systemPrompt: values.systemPrompt,
      tags: values.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      isCustom: true,
    }),
  });
  const { isSelected } = useListSelection<AIRole>({
    defaultSelected: selectedRole,
    onChange: setSelectedRole,
  });

  const handleCreateOrEdit = () => {
    handleCreate();
    showModal();
  };

  const handleEditRole = (role: AIRole) => {
    handleEdit(role);
    showModal();
  };

  const handleDeleteRole = async (role: AIRole) => {
    const confirmed = await confirm({
      title: '确认删除',
      content: `确定要删除角色"${role.name}"吗？`,
      okText: '删除',
    });

    if (confirmed) {
      deleteRole(role.id);
    }
  };

  return (
    <div className="role-list">
      <div className="role-list-header">
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreateOrEdit}
        >
          创建角色
        </Button>
      </div>
      <List
        grid={{ column: 1 }}
        dataSource={roles}
        renderItem={(role) => (
          <List.Item>
            <Card
              className={selectedRole?.id === role.id ? 'selected' : ''}
              hoverable
              onClick={() => setSelectedRole(role)}
              actions={role.isCustom ? [
                <EditOutlined key="edit" onClick={(e) => {
                  e.stopPropagation();
                  handleEditRole(role);
                }} />,
                <DeleteOutlined key="delete" onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRole(role);
                }} />
              ] : undefined}
            >
              <Card.Meta
                avatar={
                  <div className="role-avatar">
                    {role.avatar ? (
                      <img src={role.avatar} alt={role.name} />
                    ) : (
                      <div className="role-avatar-placeholder">
                        {role.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                }
                title={role.name}
                description={
                  <>
                    <div className="role-description">{role.description}</div>
                    <Space size={[0, 8]} wrap className="role-tags">
                      {role.tags.map(tag => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </Space>
                  </>
                }
              />
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title={editingItem ? "编辑角色" : "创建角色"}
        open={isVisible}
        onOk={handleSubmit}
        onCancel={hideModal}
        okText={editingItem ? "保存" : "创建"}
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={editingItem ?? {}}
        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="角色描述"
            rules={[{ required: true, message: '请输入角色描述' }]}
          >
            <Input.TextArea placeholder="请输入角色描述" />
          </Form.Item>
          <Form.Item
            name="systemPrompt"
            label="系统提示词"
            rules={[{ required: true, message: '请输入系统提示词' }]}
          >
            <Input.TextArea
              placeholder="请输入系统提示词"
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Form.Item>
          <Form.Item
            name="tags"
            label="标签"
            rules={[{ required: true, message: '请输入标签' }]}
            help="多个标签请用英文逗号分隔"
            initialValue={editingItem?.tags.join(', ')}
          >
            <Input placeholder="例如: 编程,技术" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );

  return (
    <div className="role-list">
      <div className="role-list-header">
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleCreateOrEdit}
        >
          创建角色
        </Button>
      </div>
      <List
        grid={{ column: 1 }}
        dataSource={roles}
        renderItem={(role) => (
          <List.Item>            <Card
              className={selectedRole?.id === role.id ? 'selected' : ''}
              hoverable
              onClick={() => setSelectedRole(role)}
              actions={role.isCustom ? [
                <EditOutlined key="edit" onClick={(e) => {
                  e.stopPropagation();
                  handleEditRole(role);
                }} />,
                <DeleteOutlined key="delete" onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRole(role);
                }} />
              ] : undefined}
            >
              <Card.Meta
                avatar={
                  <div className="role-avatar">
                    {role.avatar ? (
                      <img src={role.avatar} alt={role.name} />
                    ) : (
                      <div className="role-avatar-placeholder">
                        {role.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                }
                title={role.name}
                description={
                  <>
                    <div className="role-description">{role.description}</div>
                    <Space size={[0, 8]} wrap className="role-tags">                      {role.tags.map(tag => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </Space>
                  </>
                }
              />
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title={editingRole ? "编辑角色" : "创建角色"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        okText={editingRole ? "保存" : "创建"}
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={editingRole || {}}
        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="角色描述"
            rules={[{ required: true, message: '请输入角色描述' }]}
          >
            <Input.TextArea placeholder="请输入角色描述" />
          </Form.Item>
          <Form.Item
            name="systemPrompt"
            label="系统提示词"
            rules={[{ required: true, message: '请输入系统提示词' }]}
          >
            <Input.TextArea
              placeholder="请输入系统提示词"
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Form.Item>
          <Form.Item
            name="tags"
            label="标签"
            rules={[{ required: true, message: '请输入标签' }]}
            help="多个标签请用英文逗号分隔"
            initialValue={editingRole?.tags.join(', ')}
          >
            <Input placeholder="例如: 编程,技术" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleList;
