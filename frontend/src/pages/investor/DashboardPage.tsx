import React from 'react';
import { Card, Descriptions, Statistic, Row, Col, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getInvestorDashboard } from '../../api/investor';
import { formatCurrency, formatDate, formatRate } from '../../utils/format';

const { Title } = Typography;

const InvestorDashboardPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['investor-dashboard'],
    queryFn: () => getInvestorDashboard().then(r => r.data),
  });

  if (isLoading) return <div>Loading...</div>;

  const inv = data?.investor;
  const summary = data?.summary;

  return (
    <div>
      <Title level={3}>My Investment Dashboard</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Total Invested" value={summary?.total_invested ?? 0} formatter={v => formatCurrency(v as number)} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Monthly Payout" value={summary?.monthly_payout ?? 0} formatter={v => formatCurrency(v as number)} valueStyle={{ color: '#3f8600' }} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Interest Rate" value={formatRate(summary?.interest_rate ?? 0)} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Remaining Months" value={summary?.remaining_months ?? 0} /></Card>
        </Col>
      </Row>

      <Card title="Personal Details">
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
          <Descriptions.Item label="Name">{inv?.prefix} {inv?.first_name} {inv?.second_name} {inv?.last_name}</Descriptions.Item>
          <Descriptions.Item label="Email">{inv?.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{inv?.phone}</Descriptions.Item>
          <Descriptions.Item label="Address">{inv?.address}, {inv?.city}, {inv?.country}</Descriptions.Item>
          <Descriptions.Item label="Contract Start">{formatDate(summary?.contract_start)}</Descriptions.Item>
          <Descriptions.Item label="Contract End">{formatDate(summary?.contract_end)}</Descriptions.Item>
          <Descriptions.Item label="Total Paid to Date">{formatCurrency(summary?.total_paid ?? 0)}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default InvestorDashboardPage;
