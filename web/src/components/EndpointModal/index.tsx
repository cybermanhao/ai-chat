import React from 'react';
import { Form, Modal, message } from 'antd';
import type { OpenAIEndpoint, OpenAIEndpointCreate } from '@/types/openai';
import { useOpenAIEndpoint } from '@/hooks/useOpenAIEndpoint';
import { ModalStateProvider } from '../Modal/ModalStateProvider';
import EndpointForm from './EndpointForm';

export const EndpointModal: React.FC = () => {
  const {
    createEndpoint,
    updateEndpoint,
  } = useOpenAIEndpoint();

  const [form] = Form.useForm<OpenAIEndpointCreate>();

  const handleSubmit = async (editingEndpoint: OpenAIEndpoint | null) => {
    try {
      const values = await form.validateFields();
      if (editingEndpoint) {
        await updateEndpoint(editingEndpoint.id, values);
      } else {
        await createEndpoint(values);
      }
      form.resetFields();
      message.success(`${editingEndpoint ? '更新' : '创建'}成功`);
      return true;
    } catch {
      message.error(`${editingEndpoint ? '更新' : '创建'}失败`);
      return false;
    }
  };

  return (
    <ModalStateProvider<OpenAIEndpoint>>
      {({ state: { visible, data: editingEndpoint }, hide }) => (
        <Modal
          title={editingEndpoint ? "编辑端点" : "添加端点"}
          open={visible}
          onOk={() => handleSubmit(editingEndpoint)}
          onCancel={hide}
          okText={editingEndpoint ? "保存" : "创建"}
          cancelText="取消"
        >
          <EndpointForm 
            form={form}
            initialValues={editingEndpoint}
          />
        </Modal>
      )}
    </ModalStateProvider>
  );
};
