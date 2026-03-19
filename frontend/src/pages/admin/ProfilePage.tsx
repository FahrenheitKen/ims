import React from 'react';
import { Card, Form, Input, Button, Tabs, message, Typography, Avatar } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { updateAdminProfile, changeAdminPassword } from '../../api/admin';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
  const { adminUser, setAdminUser } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const profileMutation = useMutation({
    mutationFn: updateAdminProfile,
    onSuccess: (res) => {
      setAdminUser(res.data.user);
      message.success('Profile updated successfully');
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Update failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: changeAdminPassword,
    onSuccess: () => {
      message.success('Password changed successfully');
      passwordForm.resetFields();
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Password change failed'),
  });

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Avatar size={72} icon={<UserOutlined />} style={{ background: '#6366f1', marginBottom: 12 }} />
        <Title level={4} style={{ margin: 0 }}>{adminUser?.name}</Title>
        <Text type="secondary">{adminUser?.email}</Text>
      </div>

      <Tabs
        items={[
          {
            key: 'profile',
            label: (
              <span><UserOutlined style={{ marginRight: 6 }} />Edit Profile</span>
            ),
            children: (
              <Card bordered={false} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderRadius: 12 }}>
                <Form
                  form={profileForm}
                  layout="vertical"
                  initialValues={{ name: adminUser?.name, email: adminUser?.email }}
                  onFinish={(values) => profileMutation.mutate(values)}
                >
                  <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Name is required' }]}>
                    <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} size="large" />
                  </Form.Item>
                  <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}>
                    <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} size="large" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={profileMutation.isPending} style={{ borderRadius: 6 }}>
                      Save Changes
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: 'password',
            label: (
              <span><LockOutlined style={{ marginRight: 6 }} />Change Password</span>
            ),
            children: (
              <Card bordered={false} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderRadius: 12 }}>
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={(values) => passwordMutation.mutate(values)}
                >
                  <Form.Item name="current_password" label="Current Password" rules={[{ required: true, message: 'Enter your current password' }]}>
                    <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} size="large" />
                  </Form.Item>
                  <Form.Item name="new_password" label="New Password" rules={[{ required: true, min: 8, message: 'Minimum 8 characters' }]}>
                    <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} size="large" />
                  </Form.Item>
                  <Form.Item
                    name="new_password_confirmation"
                    label="Confirm New Password"
                    dependencies={['new_password']}
                    rules={[
                      { required: true, message: 'Confirm your new password' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                          return Promise.reject(new Error('Passwords do not match'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} size="large" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={passwordMutation.isPending} style={{ borderRadius: 6 }}>
                      Update Password
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ProfilePage;
