import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Result } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../api/investor';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  if (!token || !email) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
        <Result
          status="error"
          title="Invalid Reset Link"
          subTitle="This password reset link is invalid. Please request a new one."
          extra={<Button type="primary" onClick={() => navigate('/investor/login')}>Back to Login</Button>}
        />
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
        <Result
          status="success"
          title="Password Reset Successful"
          subTitle="Your password has been reset. You can now log in with your new password."
          extra={<Button type="primary" onClick={() => navigate('/investor/login')}>Go to Login</Button>}
        />
      </div>
    );
  }

  const onFinish = async (values: { password: string; password_confirmation: string }) => {
    setLoading(true);
    try {
      await resetPassword({ token, email, ...values });
      setSuccess(true);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card title="Set New Password" style={{ width: 400 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="password" label="New Password" rules={[{ required: true, min: 8, message: 'Minimum 8 characters' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="New password" size="large" />
          </Form.Item>
          <Form.Item
            name="password_confirmation"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
