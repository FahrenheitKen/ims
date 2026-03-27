import React, { useState } from 'react';
import { Card, Table, Tag, Typography, Spin, Descriptions, Space, Button } from 'antd';
import { EyeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getInvestorPortalContracts, getInvestorPortalContract } from '../../api/investor';
import { formatCurrency, formatDate, formatRate } from '../../utils/format';
import type { PayoutSchedule, PaymentAllocation, Contract } from '../../types';

const { Title, Text } = Typography;

const statusColor: Record<string, string> = {
  pending: 'blue', paid: 'green', partially_paid: 'orange', overdue: 'red', paid_in_advance: 'cyan',
  active: 'green', completed: 'blue', deactivated: 'orange', closed: 'red',
};

const InvestorContractsPage: React.FC = () => {
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['investor-portal-contracts'],
    queryFn: () => getInvestorPortalContracts().then(r => r.data),
  });

  const { data: contractDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['investor-portal-contract', selectedContractId],
    queryFn: () => getInvestorPortalContract(selectedContractId!).then(r => r.data),
    enabled: !!selectedContractId,
  });

  // Contract detail view
  if (selectedContractId) {
    if (detailLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

    const contract = contractDetail?.contract;
    const summary = contractDetail?.summary;
    if (!contract) return <Text>Contract not found</Text>;

    const schedules = contract.payout_schedules || [];
    const totalExpected = schedules.reduce((s: number, r: PayoutSchedule) => s + Number(r.expected_amount), 0);
    const totalPaid = schedules.reduce((s: number, r: PayoutSchedule) => s + Number(r.paid_amount), 0);
    const totalBalance = totalExpected - totalPaid;

    const columns = [
      { title: '#', key: 'index', width: 50, render: (_: unknown, __: unknown, i: number) => i + 1 },
      { title: 'Due Date', dataIndex: 'due_date', key: 'due_date', render: (d: string) => formatDate(d) },
      { title: 'Expected', dataIndex: 'expected_amount', key: 'expected_amount', render: (v: number) => formatCurrency(v) },
      { title: 'Paid', dataIndex: 'paid_amount', key: 'paid_amount', render: (v: number) => <span style={{ color: '#52c41a' }}>{formatCurrency(v)}</span> },
      {
        title: 'Balance', key: 'balance',
        render: (_: unknown, r: PayoutSchedule) => {
          const bal = Number(r.expected_amount) - Number(r.paid_amount);
          return <span style={{ color: bal > 0 ? '#ff4d4f' : '#52c41a' }}>{formatCurrency(bal)}</span>;
        },
      },
      { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor[s] || 'default'}>{s.replace('_', ' ').toUpperCase()}</Tag> },
    ];

    const expandedRowRender = (record: PayoutSchedule) => {
      const allocations = record.payment_allocations || [];
      if (allocations.length === 0) return <Text type="secondary">No payments recorded</Text>;
      return (
        <Table
          dataSource={allocations}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            { title: 'Payment Date', key: 'date', render: (_: unknown, a: PaymentAllocation) => a.payment?.payment_date ? formatDate(a.payment.payment_date) : '-' },
            { title: 'Reference', key: 'ref', render: (_: unknown, a: PaymentAllocation) => a.payment?.reference || '-' },
            { title: 'Amount', dataIndex: 'amount_allocated', key: 'amount', render: (v: number) => formatCurrency(v) },
          ]}
        />
      );
    };

    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => setSelectedContractId(null)} style={{ marginBottom: 16 }}>
          Back to Contracts
        </Button>

        <Card style={{ marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            {contract.contract_id}
            <Tag color={statusColor[contract.status] || 'default'} style={{ marginLeft: 12 }}>
              {contract.status.toUpperCase()}
            </Tag>
          </Title>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small" bordered>
            <Descriptions.Item label="Total Invested">{formatCurrency(summary?.total_invested ?? 0)}</Descriptions.Item>
            <Descriptions.Item label="Interest Rate">{formatRate(summary?.interest_rate ?? 0)}</Descriptions.Item>
            <Descriptions.Item label="Monthly Payout">{formatCurrency(summary?.monthly_payout ?? 0)}</Descriptions.Item>
            <Descriptions.Item label="Start Date">{formatDate(contract.start_date)}</Descriptions.Item>
            <Descriptions.Item label="End Date">{formatDate(contract.end_date)}</Descriptions.Item>
            <Descriptions.Item label="Total Expected">{formatCurrency(summary?.total_expected ?? 0)}</Descriptions.Item>
            <Descriptions.Item label="Total Paid"><span style={{ color: '#52c41a' }}>{formatCurrency(summary?.total_paid ?? 0)}</span></Descriptions.Item>
            <Descriptions.Item label="Total Overdue"><span style={{ color: '#ff4d4f' }}>{formatCurrency(summary?.total_overdue ?? 0)}</span></Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Payout Schedule">
          <Table
            columns={columns}
            dataSource={schedules}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: 600 }}
            expandable={{ expandedRowRender }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ fontWeight: 'bold', background: '#fafafa' }}>
                  <Table.Summary.Cell index={0} />
                  <Table.Summary.Cell index={1} />
                  <Table.Summary.Cell index={2}>Totals</Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>{formatCurrency(totalExpected)}</Table.Summary.Cell>
                  <Table.Summary.Cell index={4}><span style={{ color: '#52c41a' }}>{formatCurrency(totalPaid)}</span></Table.Summary.Cell>
                  <Table.Summary.Cell index={5}><span style={{ color: totalBalance > 0 ? '#ff4d4f' : '#52c41a' }}>{formatCurrency(totalBalance)}</span></Table.Summary.Cell>
                  <Table.Summary.Cell index={6} />
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Card>
      </div>
    );
  }

  // Contracts list view
  const listColumns = [
    {
      title: 'Action', key: 'action', width: 80,
      render: (_: unknown, r: Contract) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setSelectedContractId(r.id)}>View</Button>
      ),
    },
    { title: 'Contract ID', dataIndex: 'contract_id', key: 'contract_id', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Invested', dataIndex: 'total_invested', key: 'total_invested', render: (v: number) => formatCurrency(v) },
    { title: 'Rate', dataIndex: 'interest_rate', key: 'interest_rate', render: (v: number) => formatRate(v) },
    { title: 'Monthly Payout', dataIndex: 'monthly_payout', key: 'monthly_payout', render: (v: number) => formatCurrency(v) },
    { title: 'Period', key: 'period', render: (_: unknown, r: Contract) => `${formatDate(r.start_date)} — ${formatDate(r.end_date)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor[s] || 'default'}>{s.toUpperCase()}</Tag> },
  ];

  return (
    <div>
      <Title level={3}>My Contracts</Title>
      <Table
        columns={listColumns}
        dataSource={contracts}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        scroll={{ x: 700 }}
      />
    </div>
  );
};

export default InvestorContractsPage;
