import { Form, Modal, Input } from 'antd';
import type { AIRole } from '@/store/roleStore';

interface RoleFormProps {
  visible: boolean;
  role: AIRole | null;
  onCancel: () => void;
  onChange: (role: AIRole) => void;
}

export const RoleForm = ({
  visible,
  role,
  onCancel,
  onChange,
}: RoleFormProps) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedRole: AIRole = {
        id: role?.id || `new-${Date.now()}`,
        name: values.name,
        description: values.description,
        systemPrompt: values.systemPrompt,
        tags: values.tags
          .split(',')
          .map((tag: string) => tag.trim())
          .filter(Boolean),
        isCustom: true,
      };
      onChange(formattedRole);
    } catch (error) {
      // Form validation failed
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={role ? '编辑角色' : '创建角色'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText={role ? '保存' : '创建'}
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: role?.name || '',
          description: role?.description || '',
          systemPrompt: role?.systemPrompt || '',
          tags: role?.tags?.join(', ') || '',
        }}
      >
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入角色名称' }]}
        >
          <Input placeholder="请输入角色名称" />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
          rules={[{ required: true, message: '请输入角色描述' }]}
        >
          <Input.TextArea placeholder="请输入角色描述" />
        </Form.Item>

        <Form.Item
          name="systemPrompt"
          label="系统提示词"
          rules={[{ required: true, message: '请输入系统提示词' }]}
        >
          <Input.TextArea placeholder="请输入系统提示词" rows={4} />
        </Form.Item>

        <Form.Item
          name="tags"
          label="标签"
          rules={[{ required: true, message: '请输入标签' }]}
        >
          <Input placeholder="使用逗号分隔多个标签" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
