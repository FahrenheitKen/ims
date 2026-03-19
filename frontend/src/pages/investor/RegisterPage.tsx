import React, { useState } from 'react';
import { Form, Input, InputNumber, Button, Steps, Checkbox, Modal, message, Typography, Result } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  HeartOutlined,
  BankOutlined,
  WalletOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { investorRegister } from '../../api/investor';

const { Title, Text, Paragraph } = Typography;

const formatKES = (n: number) => 'KES ' + n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const getRate = (amount: number) => {
  if (amount >= 500000) return 0.25;
  if (amount >= 150000) return 0.2308;
  if (amount >= 50000) return 0.175;
  return 0;
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [investAmount, setInvestAmount] = useState<number>(0);
  const [showTerms, setShowTerms] = useState(false);

  const rate = getRate(investAmount);
  const monthlyPayout = investAmount * rate;
  const totalPayout = monthlyPayout * 12;

  const fieldsByStep: string[][] = [
    ['prefix', 'first_name', 'second_name', 'last_name', 'id_number', 'email'],
    ['phone', 'other_phone', 'address', 'city', 'country'],
    ['next_of_kin_name', 'next_of_kin_phone'],
    ['bank_name', 'bank_account', 'bank_branch', 'tax_id'],
    ['initial_amount', 'terms'],
  ];

  const handleNext = () => {
    form.validateFields(fieldsByStep[currentStep])
      .then(() => setCurrentStep((s) => s + 1))
      .catch(() => {});
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await investorRegister(values);
      setSuccess(true);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors).flat()[0] as string;
        message.error(firstError || 'Validation failed');
      } else if (err.response?.data?.message) {
        message.error(err.response.data.message);
      } else if (err.errorFields) {
        // form validation error
      } else {
        message.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ maxWidth: 520, textAlign: 'center', padding: 40 }}>
          <Result
            icon={<CheckCircleFilled style={{ color: '#16a34a', fontSize: 64 }} />}
            title={<span style={{ fontWeight: 700, color: '#1a1a2e' }}>Registration Successful!</span>}
            subTitle={
              <Paragraph style={{ color: '#64748b', fontSize: 15, lineHeight: 1.7, maxWidth: 400, margin: '0 auto' }}>
                Your account has been created and is pending admin approval. You will receive an email with your login details once your account is approved.
              </Paragraph>
            }
            extra={
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/investor/login')}
                style={{ borderRadius: 10, height: 48, fontWeight: 600, background: '#6366f1' }}
              >
                Go to Login
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="register-container" style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Left Branding Panel */}
      <div
        className="register-branding"
        style={{
          flex: '0 0 380px',
          background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 36px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -80, right: -80, width: 250, height: 250, borderRadius: '50%', background: 'rgba(99,102,241,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(37,99,235,0.08)' }} />

        <div style={{ position: 'absolute', top: 32, left: 36 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, padding: '4px 0' }}
          >
            Back to Home
          </Button>
        </div>

        <Title level={2} style={{ color: '#fff', fontWeight: 700, margin: '0 0 16px', lineHeight: 1.3, fontSize: 28 }}>
          Start Your Investment Journey
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, display: 'block', marginBottom: 40, maxWidth: 320 }}>
          Create your account to access our investment platform. Your registration will be reviewed by our team.
        </Text>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { step: '1', title: 'Register', desc: 'Fill in your details and investment amount' },
            { step: '2', title: 'Send Funds', desc: 'Deposit via M-Pesa Paybill' },
            { step: '3', title: 'Admin Review', desc: 'Our team verifies and approves your account' },
            { step: '4', title: 'Get Started', desc: 'Receive login details via email and start earning' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(99,102,241,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#818cf8',
                  flexShrink: 0,
                }}
              >
                {item.step}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', bottom: 32, left: 36, right: 36 }}>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
            All Rights Reserved by Samawati Capital Investment Ltd.
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: '40px',
          overflow: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: 640 }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#6366f1', fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>
              Investor Registration
            </Text>
          </div>
          <Title level={3} style={{ textAlign: 'center', fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>
            Create Your Account
          </Title>
          <Text style={{ display: 'block', textAlign: 'center', color: '#94a3b8', marginBottom: 28, fontSize: 14 }}>
            Fill in your details below to get started
          </Text>

          <div className="reg-steps">
            <Steps
              current={currentStep}
              size="small"
              onChange={(step) => {
                if (step < currentStep) {
                  setCurrentStep(step);
                } else if (step === currentStep + 1) {
                  handleNext();
                }
              }}
              style={{ marginBottom: 28 }}
              items={[
                { title: 'Personal', icon: <UserOutlined /> },
                { title: 'Contact', icon: <PhoneOutlined /> },
                { title: 'Next of Kin', icon: <HeartOutlined /> },
                { title: 'Banking', icon: <BankOutlined /> },
                { title: 'Investment', icon: <WalletOutlined /> },
              ]}
            />
          </div>

          <Form form={form} layout="vertical" size="large">
            {/* Step 0: Personal */}
            <div className="reg-form-grid" style={{ display: currentStep === 0 ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="prefix" label="Prefix"><Input placeholder="Mr / Mrs / Dr" /></Form.Item>
              <Form.Item name="first_name" label="First Name" rules={[{ required: true, message: 'Required' }]}><Input /></Form.Item>
              <Form.Item name="second_name" label="Second Name" rules={[{ required: true, message: 'Required' }]}><Input /></Form.Item>
              <Form.Item name="last_name" label="Last Name"><Input /></Form.Item>
              <Form.Item name="id_number" label="ID Number" rules={[{ required: true, message: 'Required' }]}><Input /></Form.Item>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}><Input /></Form.Item>
              <Form.Item name="referral_code" label="Referral Code" style={{ gridColumn: '1 / -1' }}>
                <Input placeholder="Enter referral code (optional)" maxLength={10} style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </div>

            {/* Step 1: Contact */}
            <div className="reg-form-grid" style={{ display: currentStep === 1 ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="phone" label="Phone Number" rules={[{ required: true, message: 'Required' }]}><Input /></Form.Item>
              <Form.Item name="other_phone" label="Other Phone"><Input /></Form.Item>
              <Form.Item name="address" label="Address" rules={[{ required: true, message: 'Required' }]}><Input /></Form.Item>
              <Form.Item name="city" label="City" rules={[{ required: true, message: 'Required' }]}><Input /></Form.Item>
              <Form.Item name="country" label="Country" rules={[{ required: true, message: 'Required' }]}><Input /></Form.Item>
            </div>

            {/* Step 2: Next of Kin */}
            <div className="reg-form-grid" style={{ display: currentStep === 2 ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="next_of_kin_name" label="Full Name"><Input placeholder="Next of kin full name" /></Form.Item>
              <Form.Item name="next_of_kin_phone" label="Phone Number"><Input placeholder="Next of kin phone" /></Form.Item>
            </div>

            {/* Step 3: Banking */}
            <div className="reg-form-grid" style={{ display: currentStep === 3 ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="bank_name" label="Bank Name"><Input /></Form.Item>
              <Form.Item name="bank_account" label="Account Number"><Input /></Form.Item>
              <Form.Item name="bank_branch" label="Branch"><Input /></Form.Item>
              <Form.Item name="tax_id" label="Tax ID"><Input /></Form.Item>
            </div>

            {/* Step 4: Investment */}
            <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
              <Form.Item
                name="initial_amount"
                label="Investment Amount (KES)"
                rules={[
                  { required: true, message: 'Required' },
                  { type: 'number', min: 50000, message: 'Minimum investment is KES 50,000' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  min={50000}
                  step={10000}
                  placeholder="e.g. 100,000"
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => v!.replace(/,/g, '') as unknown as number}
                  onChange={(v) => setInvestAmount(Number(v) || 0)}
                />
              </Form.Item>

              {/* Payout Summary Card */}
              {investAmount >= 50000 && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #1a365d 0%, #1e40af 100%)',
                    borderRadius: 14,
                    padding: 24,
                    color: '#fff',
                    marginBottom: 20,
                  }}
                >
                  <div className="reg-payout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Interest Rate</div>
                      <div style={{ fontSize: 24, fontWeight: 800 }}>{(rate * 100).toFixed(2)}%</div>
                      <div style={{ fontSize: 11, opacity: 0.5 }}>per month</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Monthly Payout</div>
                      <div style={{ fontSize: 24, fontWeight: 800 }}>{formatKES(monthlyPayout)}</div>
                      <div style={{ fontSize: 11, opacity: 0.5 }}>every month</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Payout (12mo)</div>
                      <div style={{ fontSize: 24, fontWeight: 800 }}>{formatKES(totalPayout)}</div>
                      <div style={{ fontSize: 11, opacity: 0.5 }}>over contract period</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Details Card */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 14,
                  padding: 20,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 15, color: '#166534', marginBottom: 12 }}>
                  Payment Details
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 14, lineHeight: 1.6 }}>
                  Send your investment funds to the following M-Pesa details:
                </div>
                <div className="reg-payment-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>M-Pesa Paybill</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#166534' }}>303030</div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', border: '1px solid #dcfce7' }}>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Account Number</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#166534' }}>2043651148</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 12, fontStyle: 'italic' }}>
                  Please use your full name as the reference when making the payment.
                </div>
              </div>

              {/* Terms and Conditions */}
              <Form.Item
                name="terms"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value ? Promise.resolve() : Promise.reject(new Error('You must accept the terms and conditions')),
                  },
                ]}
                style={{ marginTop: 20, marginBottom: 0 }}
              >
                <Checkbox>
                  <span style={{ fontSize: 13, color: '#475569' }}>
                    I agree to the{' '}
                    <a
                      href="#terms"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTerms(true);
                      }}
                      style={{ color: '#6366f1', fontWeight: 600 }}
                    >
                      Terms and Conditions
                    </a>
                    {' '}and confirm that the information provided is accurate.
                  </span>
                </Checkbox>
              </Form.Item>
            </div>
          </Form>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <Button
              disabled={currentStep === 0}
              onClick={() => setCurrentStep((s) => s - 1)}
              style={{ borderRadius: 8 }}
            >
              Back
            </Button>
            <div style={{ display: 'flex', gap: 12 }}>
              {currentStep < 4 ? (
                <Button type="primary" onClick={handleNext} style={{ borderRadius: 8, background: '#6366f1' }}>
                  Next
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={loading}
                  style={{ borderRadius: 8, background: '#6366f1', fontWeight: 600 }}
                >
                  Submit Registration
                </Button>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>
              Already have an account?{' '}
              <a onClick={() => navigate('/investor/login')} style={{ color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}>
                Sign In
              </a>
            </Text>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .register-branding { display: none !important; }
          .register-container > div:nth-child(2) { padding: 24px 16px !important; }
          .register-container .ant-steps { overflow-x: auto; }
          .register-container .ant-steps-item-title { font-size: 12px !important; }
          .reg-steps { display: none !important; }
          .reg-form-grid { grid-template-columns: 1fr !important; }
          .reg-payout-grid { grid-template-columns: 1fr !important; }
          .reg-payment-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Terms and Conditions Modal */}
      <Modal
        title={<span style={{ fontWeight: 700 }}>Terms and Conditions</span>}
        open={showTerms}
        onCancel={() => setShowTerms(false)}
        footer={<Button type="primary" onClick={() => setShowTerms(false)} style={{ borderRadius: 8, background: '#6366f1' }}>I Understand</Button>}
        width={640}
        centered
      >
        <div style={{ maxHeight: 400, overflow: 'auto', fontSize: 14, color: '#475569', lineHeight: 1.8 }}>
          <p><strong>1. Investment Agreement</strong></p>
          <p>By registering as an investor with Samawati Capital Investment Ltd, you agree to enter into an investment contract for a period of 12 months from the date of account approval.</p>

          <p><strong>2. Returns and Payouts</strong></p>
          <p>Monthly interest payouts are calculated based on your investment tier and are paid according to the agreed schedule. Returns are not guaranteed and are subject to market conditions, though we employ rigorous risk management strategies.</p>

          <p><strong>3. Investment Amount</strong></p>
          <p>The minimum investment amount is KES 50,000. Your investment tier and corresponding interest rate are determined by the total amount invested.</p>

          <p><strong>4. Account Approval</strong></p>
          <p>All investor accounts are subject to admin review and approval. Your account will be activated only after your funds have been verified and your registration has been approved.</p>

          <p><strong>5. Password and Security</strong></p>
          <p>Upon approval, your login credentials will be sent to your registered email. You are required to change your password on first login. You are responsible for maintaining the confidentiality of your account credentials.</p>

          <p><strong>6. Early Withdrawal</strong></p>
          <p>Early withdrawal of invested funds before the contract period may be subject to penalties and processing fees as determined by the company.</p>

          <p><strong>7. Personal Information</strong></p>
          <p>All personal information provided during registration will be kept confidential and used solely for the purpose of managing your investment account.</p>

          <p><strong>8. Amendments</strong></p>
          <p>Samawati Capital Investment Ltd reserves the right to amend these terms and conditions. Investors will be notified of any changes through their registered email.</p>
        </div>
      </Modal>
    </div>
  );
};

export default RegisterPage;
