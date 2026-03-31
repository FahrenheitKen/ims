import React from 'react';
import { Card, Statistic, Row, Col, Typography, Button, message, Table, Tag } from 'antd';
import { CopyOutlined, GiftOutlined, TeamOutlined, DollarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getInvestorDashboard, getInvestorReferrals, getInvestorPortalContracts } from '../../api/investor';
import { formatCurrency, formatRate, formatDate } from '../../utils/format';
import type { Contract } from '../../types';

const { Title, Text, Paragraph } = Typography;

const InvestorDashboardPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['investor-dashboard'],
    queryFn: () => getInvestorDashboard().then(r => r.data),
  });

  const { data: referralData } = useQuery({
    queryKey: ['investor-referrals'],
    queryFn: () => getInvestorReferrals().then(r => r.data),
  });

  const { data: contracts } = useQuery({
    queryKey: ['investor-portal-contracts'],
    queryFn: () => getInvestorPortalContracts().then(r => r.data),
  });

  if (isLoading) return <div>Loading...</div>;

  const summary = data?.summary;

  const copyCode = () => {
    if (referralData?.referral_code) {
      navigator.clipboard.writeText(referralData.referral_code);
      message.success('Referral code copied!');
    }
  };

  return (
    <div>
      {/* 1. Referral Section */}
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #1a365d 0%, #1e40af 100%)',
          border: 'none',
          borderRadius: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <GiftOutlined style={{ color: '#fbbf24', fontSize: 22 }} />
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                Your Referral Code
              </Text>
            </div>
            <div style={{ fontSize: 'clamp(20px, 5vw, 32px)', fontWeight: 800, color: '#fff', letterSpacing: 'clamp(2px, 1vw, 4px)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {referralData?.referral_code || '--------'}
            </div>
            <Paragraph style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8, marginBottom: 0 }}>
              Share this code with friends. When they register and get approved, you earn a commission from their total annual payout.
            </Paragraph>
          </div>
          <Button
            icon={<CopyOutlined />}
            size="large"
            onClick={copyCode}
            style={{ borderRadius: 10, fontWeight: 600, height: 44, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            Copy Code
          </Button>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="Total Referrals"
              value={referralData?.stats?.total_referrals || 0}
              prefix={<TeamOutlined style={{ color: '#6366f1' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="Approved"
              value={referralData?.stats?.approved_referrals || 0}
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="Earned"
              value={referralData?.stats?.total_earned || 0}
              prefix={<DollarOutlined style={{ color: '#16a34a' }} />}
              precision={2}
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="Pending"
              value={referralData?.stats?.total_pending || 0}
              prefix={<ClockCircleOutlined style={{ color: '#d97706' }} />}
              precision={2}
              valueStyle={{ color: '#d97706' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 2. Investment Stats */}
      <Title level={4}>My Investment Dashboard</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Total Invested" value={summary?.total_invested ?? 0} formatter={v => formatCurrency(v as number)} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Monthly Payout" value={summary?.monthly_payout ?? 0} formatter={v => formatCurrency(v as number)} valueStyle={{ color: '#3f8600' }} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Total Due to Date" value={summary?.total_due_to_date ?? 0} formatter={v => formatCurrency(v as number)} valueStyle={{ color: (summary?.total_due_to_date ?? 0) > 0 ? '#cf1322' : '#3f8600' }} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Amount Paid" value={summary?.total_paid ?? 0} formatter={v => formatCurrency(v as number)} valueStyle={{ color: '#3f8600' }} /></Card>
        </Col>
      </Row>

      {/* 3. Contracts */}
      <Card title="Contracts">
        <Table
          columns={[
            { title: 'Contract ID', dataIndex: 'contract_id', key: 'contract_id', render: (v: string) => <Text strong>{v}</Text> },
            { title: 'Invested', dataIndex: 'total_invested', key: 'total_invested', render: (v: number) => formatCurrency(v) },
            { title: 'Rate', dataIndex: 'interest_rate', key: 'interest_rate', render: (v: number) => formatRate(v) },
            { title: 'Monthly Payout', dataIndex: 'monthly_payout', key: 'monthly_payout', render: (v: number) => formatCurrency(v) },
            { title: 'Period', key: 'period', render: (_: unknown, r: Contract) => `${formatDate(r.start_date)} — ${formatDate(r.end_date)}` },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : s === 'completed' ? 'blue' : 'default'}>{s.toUpperCase()}</Tag> },
          ]}
          dataSource={contracts}
          rowKey="id"
          pagination={false}
          scroll={{ x: 700 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default InvestorDashboardPage;
