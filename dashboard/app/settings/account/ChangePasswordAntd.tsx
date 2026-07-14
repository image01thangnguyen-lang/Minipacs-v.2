"use client";

import React, { useState } from 'react';
import { Form, Input, Button, App, Card } from 'antd';
import { changeMyPasswordAction } from './actions';
import { KeyOutlined } from '@ant-design/icons';

export function ChangePasswordAntd() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message, modal } = App.useApp();

  const handleSubmit = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Mật khẩu mới không khớp');
      return;
    }
    
    setLoading(true);
    try {
      await changeMyPasswordAction(values.currentPassword, values.newPassword);
      modal.success({
        title: 'Thành công',
        content: 'Mật khẩu đã được thay đổi. Vui lòng đăng xuất để áp dụng trên mọi thiết bị.',
      });
      form.resetFields();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi thay đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      size="small" 
      title={<div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}><KeyOutlined /> Đổi mật khẩu</div>}
      style={{ maxWidth: '400px' }}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item 
          name="currentPassword" 
          label="Mật khẩu hiện tại" 
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
        >
          <Input.Password />
        </Form.Item>
        
        <Form.Item 
          name="newPassword" 
          label="Mật khẩu mới" 
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
            { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' }
          ]}
        >
          <Input.Password />
        </Form.Item>
        
        <Form.Item 
          name="confirmPassword" 
          label="Xác nhận mật khẩu mới" 
          rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu' }]}
        >
          <Input.Password />
        </Form.Item>
        
        <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Đổi mật khẩu
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
