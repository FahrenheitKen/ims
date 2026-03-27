import React, { useState } from 'react';
import { Table, Input, Select, Tag, Space, Typography, Button } from 'antd';
import { SearchOutlined, EyeOutlined, FileProtectOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getContracts } from '../../api/admin';
import { formatCurrency, formatDate, formatRate } from '../../utils/format';
import type { Contract } from '../../types';

const { Title } = Typography;

const statusColor: Record<string, string> = {
  active: 'green',
  completed: 'blue',
  deactivated: 'orange',
  closed: 'red',
};

const ContractsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['contracts', search, status, page],
    queryFn: () => getContracts({ search, status: status || undefined, page, per_page: 15 }).then(r => r.data),
  });

  const columns = [
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: Contract) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/admin/contracts/${record.id}`)}
        >
          View
        </Button>
      ),
    },
    {
      title: 'Contract ID',
      dataIndex: 'contract_id',
      key: 'contract_id',
      render: (text: string, record: Contract) => (
        <a onClick={() => navigate(`/admin/contracts/${record.id}`)} style={{ fontWeight: 700 }}>{text}</a>
      ),
    },
    {
      title: 'Investor',
      key: 'investor',
      render: (_: unknown, record: Contract) =>
        record.investor
          ? `${record.investor.prefix ? record.investor.prefix + ' ' : ''}${record.investor.first_name} ${record.investor.second_name}${record.investor.last_name ? ' ' + record.investor.last_name : ''}`
          : '-',
    },
    {
      title: 'Investor ID',
      key: 'investor_id_str',
      render: (_: unknown, record: Contract) => record.investor?.investor_id || '-',
      responsive: ['md'] as any,
    },
    {
      title: 'Invested',
      dataIndex: 'total_invested',
      key: 'total_invested',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'Rate',
      dataIndex: 'interest_rate',
      key: 'interest_rate',
      render: (v: number) => formatRate(v),
      responsive: ['lg'] as any,
    },
    {
      title: 'Monthly Payout',
      dataIndex: 'monthly_payout',
      key: 'monthly_payout',
      render: (v: number) => formatCurrency(v),
      responsive: ['md'] as any,
    },
    {
      title: 'Period',
      key: 'period',
      render: (_: unknown, record: Contract) => `${formatDate(record.start_date)} — ${formatDate(record.end_date)}`,
      responsive: ['lg'] as any,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={statusColor[s] || 'default'}>{s.toUpperCase()}</Tag>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}><FileProtectOutlined /> Contracts</Title>
      </div>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search contracts..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ width: 250 }}
          allowClear
        />
        <Select
          placeholder="Filter by status"
          value={status || undefined}
          onChange={v => { setStatus(v || ''); setPage(1); }}
          allowClear
          style={{ width: 160 }}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
            { value: 'deactivated', label: 'Deactivated' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={data?.data || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: data?.current_page || 1,
          total: data?.total || 0,
          pageSize: data?.per_page || 15,
          onChange: setPage,
          showSizeChanger: false,
        }}
        scroll={{ x: 800 }}
        size="small"
      />
    </div>
  );
};

export default ContractsPage;
