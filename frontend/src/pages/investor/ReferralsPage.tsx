import React from 'react';
import { Card, Table, Tag, Typography, Button, message, Statistic, Row, Col } from 'antd';
import { CopyOutlined, GiftOutlined, TeamOutlined, DollarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getInvestorReferrals } from '../../api/investor';
import { formatCurrency, formatDate } from '../../utils/format';

const { Title, Text, Paragraph } = Typography;

const ReferralsPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['investor-referrals'],
    queryFn: () => getInvestorReferrals().then((r) => r.data),
  });

  const copyCode = () => {
    if (data?.referral_code) {
      navigator.clipboard.writeText(data.referral_code);
      message.success('Referral code copied!');
    }
  };

  const referralColumns = [
    {
      title: 'Investor',
      key: 'name',
      render: (_: unknown, record: any) =>
        record.referred
          ? `${record.referred.first_name} ${record.referred.second_name}`
          : '-',
    },
    {
      title: 'Investor ID',
      key: 'investor_id',
      render: (_: unknown, record: any) => record.referred?.investor_id || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'approved' ? 'green' : status === 'pending' ? 'gold' : 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Date Referred',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => formatDate(v),
    },
  ];

  const commissionColumns = [
    {
      title: 'Referred Investor',
      key: 'referred',
      render: (_: unknown, record: any) => record.referred_id,
    },
    {
      title: 'Commission',
      dataIndex: 'commission_amount',
      key: 'commission_amount',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'Payment Date',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'paid' ? 'green' : 'gold'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Referrals</Title>

      {/* Referral Code Card */}
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
              {data?.referral_code || '--------'}
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

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="Total Referrals"
              value={data?.stats?.total_referrals || 0}
              prefix={<TeamOutlined style={{ color: '#6366f1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="Approved"
              value={data?.stats?.approved_referrals || 0}
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="Earned"
              value={data?.stats?.total_earned || 0}
              prefix={<DollarOutlined style={{ color: '#16a34a' }} />}
              precision={2}
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="Pending"
              value={data?.stats?.total_pending || 0}
              prefix={<ClockCircleOutlined style={{ color: '#d97706' }} />}
              precision={2}
              valueStyle={{ color: '#d97706' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Referrals Table */}
      <Card title="My Referrals" style={{ marginBottom: 24, borderRadius: 12 }}>
        <Table
          columns={referralColumns}
          dataSource={data?.referrals}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 500 }}
          pagination={false}
          locale={{ emptyText: 'No referrals yet. Share your code to start earning!' }}
        />
      </Card>

      {/* Commissions Table */}
      <Card title="Commission History" style={{ borderRadius: 12 }}>
        <Table
          columns={commissionColumns}
          dataSource={data?.commissions}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 500 }}
          pagination={false}
          locale={{ emptyText: 'No commissions yet.' }}
        />
      </Card>
    </div>
  );
};

export default ReferralsPage;
