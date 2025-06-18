
import { Form, Modal, Input } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { AIRole } from '@/store/roleStore';

interface RoleFormProps {
  visible: boolean;
  role: AIRole | null;
  onOk: () => void;
  onCancel: () => void;
}

export const RoleForm = ({
  visible,
  role,
  onOk,
  onCancel,
}: RoleFormProps) => {
  const [form] = Form.useForm();

  return (
    <Modal
      title={role ? '编辑角色' : '创建角色'}
      open={visible}
      onOk={async () => {
        await form.validateFields();
        onOk();
      }}
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


