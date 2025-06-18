import React from 'react';
import { Form, Input } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { OpenAIEndpoint } from '@/types/openai';

interface EndpointFormProps {
  form: FormInstance;
  initialValues?: OpenAIEndpoint | null;
}

const EndpointForm: React.FC<EndpointFormProps> = ({
  form,
  initialValues,
}) => {
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues || undefined}
    >
      <Form.Item
        name="name"
        label="名称"
        rules={[{ required: true, message: '请输入端点名称' }]}
      >
        <Input placeholder="请输入端点名称" />
      </Form.Item>
      <Form.Item
        name="baseURL"
        label="API 地址"
        rules={[
          { required: true, message: '请输入 API 地址' },
          { type: 'url', message: '请输入有效的 URL' }
        ]}
      >
        <Input placeholder="例如：https://api.openai.com/v1" />
      </Form.Item>
      <Form.Item
        name="apiKey"
        label="API 密钥"
        rules={[{ required: true, message: '请输入 API 密钥' }]}
      >
        <Input.Password placeholder="请输入 API 密钥" />
      </Form.Item>
    </Form>
  );
};

export default EndpointForm;
