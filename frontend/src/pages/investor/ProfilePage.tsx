import React from 'react';
import { Card, Row, Col, Form, Input, Button, Tag, message, Typography, Avatar } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  RiseOutlined,
  DollarOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { changePassword } from '../../api/investor';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate, formatRate } from '../../utils/format';

const { Title, Text } = Typography;

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0' }}>
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: '#f4f5f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        color: '#6366f1',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', lineHeight: 1.2 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: 500 }}>{value}</Text>
    </div>
  </div>
);

interface StatCardProps {
  label: string;
  value: string;
  accent: string;
  bg: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, accent, bg }) => (
  <div
    style={{
      background: bg,
      borderRadius: 12,
      padding: '20px 16px',
      textAlign: 'center',
      borderLeft: `3px solid ${accent}`,
    }}
  >
    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</Text>
    <Text strong style={{ fontSize: 18, color: accent }}>{value}</Text>
  </div>
);

const InvestorProfilePage: React.FC = () => {
  const { investorUser } = useAuth();
  const [form] = Form.useForm();

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      message.success('Password changed successfully');
      form.resetFields();
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Password change failed'),
  });

  if (!investorUser) return null;

  const initials = `${investorUser.first_name?.[0] || ''}${investorUser.second_name?.[0] || ''}`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Profile Banner */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          marginBottom: 20,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 100%)',
            padding: '36px 32px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <Avatar
            size={80}
            style={{
              background: '#6366f1',
              fontSize: 28,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}
          >
            {initials}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
              {investorUser.prefix} {investorUser.first_name} {investorUser.second_name} {investorUser.last_name}
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
              <Tag style={{ borderRadius: 6, fontSize: 12 }}>{investorUser.investor_id}</Tag>
              <Tag
                color={investorUser.status === 'active' ? 'green' : 'orange'}
                style={{ borderRadius: 6, fontSize: 12 }}
              >
                {investorUser.status.toUpperCase()}
              </Tag>
              <Text type="secondary" style={{ fontSize: 13 }}>{investorUser.email}</Text>
            </div>
          </div>
        </div>

        {/* Investment Stats */}
        <div style={{ padding: '20px 32px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <StatCard
                label="Total Invested"
                value={formatCurrency(investorUser.total_invested)}
                accent="#0d9488"
                bg="#ecfdf5"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <StatCard
                label="Interest Rate"
                value={formatRate(investorUser.interest_rate)}
                accent="#6366f1"
                bg="#f0f0ff"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <StatCard
                label="Monthly Payout"
                value={formatCurrency(investorUser.monthly_payout)}
                accent="#2563eb"
                bg="#eff6ff"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <StatCard
                label="Contract Ends"
                value={formatDate(investorUser.end_date)}
                accent="#d97706"
                bg="#fffbeb"
              />
            </Col>
          </Row>
        </div>
      </Card>

      <Row gutter={[20, 20]}>
        {/* Personal Details */}
        <Col xs={24} md={14}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            styles={{ header: { borderBottom: '1px solid #f0f0f0' } }}
            title={
              <span style={{ fontWeight: 600 }}>
                <UserOutlined style={{ marginRight: 8, color: '#6366f1' }} />
                Personal Information
              </span>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <InfoItem icon={<MailOutlined />} label="Email" value={investorUser.email} />
              <InfoItem icon={<PhoneOutlined />} label="Phone" value={investorUser.phone} />
              <InfoItem icon={<IdcardOutlined />} label="ID Number" value={investorUser.id_number} />
              <InfoItem
                icon={<PhoneOutlined />}
                label="Other Phone"
                value={investorUser.other_phone || '—'}
              />
              <InfoItem
                icon={<EnvironmentOutlined />}
                label="Address"
                value={`${investorUser.address}, ${investorUser.city}`}
              />
              <InfoItem icon={<EnvironmentOutlined />} label="Country" value={investorUser.country} />
              <InfoItem
                icon={<CalendarOutlined />}
                label="Contract Start"
                value={formatDate(investorUser.start_date)}
              />
              <InfoItem
                icon={<CalendarOutlined />}
                label="Contract End"
                value={formatDate(investorUser.end_date)}
              />
            </div>
          </Card>
        </Col>

        {/* Change Password */}
        <Col xs={24} md={10}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            styles={{ header: { borderBottom: '1px solid #f0f0f0' } }}
            title={
              <span style={{ fontWeight: 600 }}>
                <LockOutlined style={{ marginRight: 8, color: '#6366f1' }} />
                Change Password
              </span>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={(values) => passwordMutation.mutate(values)}
            >
              <Form.Item
                name="current_password"
                label="Current Password"
                rules={[{ required: true, message: 'Enter your current password' }]}
              >
                <Input.Password size="large" />
              </Form.Item>
              <Form.Item
                name="new_password"
                label="New Password"
                rules={[{ required: true, min: 8, message: 'Minimum 8 characters' }]}
              >
                <Input.Password size="large" />
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
                <Input.Password size="large" />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={passwordMutation.isPending}
                  block
                  size="large"
                  style={{ borderRadius: 8 }}
                >
                  Update Password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InvestorProfilePage;
