import React, { useState } from 'react';
import { Form, Input, Button, message, Modal, Typography } from 'antd';
import {
  LockOutlined,
  MailOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  RiseOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { investorLogin, changePassword, forgotPassword } from '../../api/investor';
import { useAuth } from '../../contexts/AuthContext';

const { Text, Title, Link } = Typography;

const InvestorLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setInvestorUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [pwForm] = Form.useForm();
  const [forgotForm] = Form.useForm();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await investorLogin(values.email, values.password);
      setInvestorUser(data.investor);
      if (!data.password_changed) {
        setShowPasswordChange(true);
      } else {
        message.success('Login successful');
        navigate('/investor');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async (values: { current_password: string; new_password: string; new_password_confirmation: string }) => {
    try {
      await changePassword(values);
      message.success('Password changed. Welcome!');
      setShowPasswordChange(false);
      navigate('/investor');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Error changing password');
    }
  };

  const onForgotPassword = async (values: { email: string }) => {
    setForgotLoading(true);
    try {
      const { data } = await forgotPassword(values.email);
      message.success(data.message);
      setShowForgotPassword(false);
      forgotForm.resetFields();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Left Panel - Branding */}
      <div
        className="login-branding"
        style={{
          flex: '0 0 45%',
          background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 250, height: 250, borderRadius: '50%', background: 'rgba(99,102,241,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(37,99,235,0.08)' }} />

        {/* Back to home */}
        <div style={{ position: 'absolute', top: 32, left: 40 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, padding: '4px 0' }}
          >
            Back to Home
          </Button>
        </div>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6366f1, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BankOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>Zig Capital</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' }}>Investment Ltd</div>
          </div>
        </div>

        {/* Tagline */}
        <Title level={2} style={{ color: '#fff', fontWeight: 700, margin: '0 0 16px', lineHeight: 1.3, fontSize: 32 }}>
          Welcome to Your<br />Investor Portal
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.7, display: 'block', marginBottom: 40, maxWidth: 380 }}>
          Monitor your investments, track payouts, and access your financial documents — all in one place.
        </Text>

        {/* Feature bullets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { icon: <RiseOutlined />, title: 'Track Returns', desc: 'View your monthly payouts and investment growth in real time.' },
            { icon: <SafetyCertificateOutlined />, title: 'Secure Access', desc: 'Your data is protected with enterprise-grade security.' },
            { icon: <BankOutlined />, title: 'Full Transparency', desc: 'Access your payment schedules, history, and documents anytime.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(99,102,241,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  color: '#818cf8',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: 32, left: 48, right: 48 }}>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
            All Rights Reserved by Zig Capital Investment Ltd.
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: '40px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo (hidden on desktop via inline check) */}
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#6366f1', fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>
              Investor Portal
            </Text>
          </div>
          <Title level={3} style={{ textAlign: 'center', fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px' }}>
            Sign in to your account
          </Title>
          <Text style={{ display: 'block', textAlign: 'center', color: '#94a3b8', marginBottom: 32, fontSize: 14 }}>
            Enter your credentials to access your portfolio
          </Text>

          <Form name="investor-login" onFinish={onFinish} layout="vertical" size="large">
            <Form.Item
              name="email"
              label={<span style={{ fontWeight: 500, color: '#475569' }}>Email Address</span>}
              rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                placeholder="you@example.com"
                style={{ borderRadius: 10, height: 48 }}
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={<span style={{ fontWeight: 500, color: '#475569' }}>Password</span>}
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                placeholder="Enter your password"
                style={{ borderRadius: 10, height: 48 }}
              />
            </Form.Item>

            <div style={{ textAlign: 'right', marginBottom: 20, marginTop: -8 }}>
              <Link
                onClick={() => setShowForgotPassword(true)}
                style={{ fontSize: 13, color: '#6366f1' }}
              >
                Forgot password?
              </Link>
            </div>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  borderRadius: 10,
                  height: 48,
                  fontWeight: 600,
                  fontSize: 15,
                  background: '#6366f1',
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div
            style={{
              textAlign: 'center',
              marginTop: 24,
              padding: '16px 0',
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>
              Don't have an account?{' '}
              <a onClick={() => navigate('/investor/register')} style={{ color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}>
                Sign Up
              </a>
            </Text>
          </div>

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Text style={{ color: '#cbd5e1', fontSize: 12 }}>
              Developed by Bluechange Technology
            </Text>
          </div>
        </div>
      </div>

      {/* First Login Password Change Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LockOutlined style={{ color: '#d97706', fontSize: 16 }} />
            </div>
            <span style={{ fontWeight: 600 }}>Change Your Password</span>
          </div>
        }
        open={showPasswordChange}
        footer={null}
        closable={false}
        centered
        styles={{ body: { paddingTop: 16 } }}
      >
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 13,
            color: '#92400e',
            lineHeight: 1.6,
          }}
        >
          For your security, you must change your password on first login. Your current password is your ID number.
        </div>
        <Form form={pwForm} layout="vertical" onFinish={onChangePassword} size="large">
          <Form.Item
            name="current_password"
            label={<span style={{ fontWeight: 500 }}>Current Password (ID Number)</span>}
            rules={[{ required: true, message: 'Enter your current password' }]}
          >
            <Input.Password style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item
            name="new_password"
            label={<span style={{ fontWeight: 500 }}>New Password</span>}
            rules={[{ required: true, min: 8, message: 'Minimum 8 characters' }]}
          >
            <Input.Password style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item
            name="new_password_confirmation"
            label={<span style={{ fontWeight: 500 }}>Confirm New Password</span>}
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={{ borderRadius: 10, height: 48, fontWeight: 600, background: '#6366f1' }}
            >
              Change Password & Continue
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MailOutlined style={{ color: '#6366f1', fontSize: 16 }} />
            </div>
            <span style={{ fontWeight: 600 }}>Reset Password</span>
          </div>
        }
        open={showForgotPassword}
        onCancel={() => { setShowForgotPassword(false); forgotForm.resetFields(); }}
        footer={null}
        centered
        styles={{ body: { paddingTop: 16 } }}
      >
        <Text style={{ display: 'block', marginBottom: 20, color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
          Enter your registered email address and we'll send you a link to reset your password.
        </Text>
        <Form form={forgotForm} layout="vertical" onFinish={onForgotPassword} size="large">
          <Form.Item
            name="email"
            label={<span style={{ fontWeight: 500 }}>Email Address</span>}
            rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
              placeholder="you@example.com"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={forgotLoading}
              block
              style={{ borderRadius: 10, height: 48, fontWeight: 600, background: '#6366f1' }}
            >
              Send Reset Link
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        @media (max-width: 768px) {
          .login-branding { display: none !important; }
          .login-container > div:nth-child(2) { padding: 24px 16px !important; }
        }
      `}</style>
    </div>
  );
};

export default InvestorLoginPage;
