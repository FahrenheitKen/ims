import React from 'react';
import { Table, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getInvestorSchedules } from '../../api/investor';
import { formatCurrency, formatDate } from '../../utils/format';
import type { PayoutSchedule } from '../../types';

const { Title } = Typography;

const statusColor: Record<string, string> = {
  pending: 'blue', paid: 'green', partially_paid: 'orange', overdue: 'red', paid_in_advance: 'cyan',
};

const SchedulesPage: React.FC = () => {
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['investor-schedules'],
    queryFn: () => getInvestorSchedules().then(r => r.data),
  });

  const columns = [
    { title: 'Due Date', dataIndex: 'due_date', key: 'due_date', render: (v: string) => formatDate(v) },
    { title: 'Expected', dataIndex: 'expected_amount', key: 'expected_amount', render: (v: number) => formatCurrency(v) },
    { title: 'Paid', dataIndex: 'paid_amount', key: 'paid_amount', render: (v: number) => formatCurrency(v) },
    { title: 'Balance', key: 'balance', render: (_: unknown, r: PayoutSchedule) => formatCurrency(r.expected_amount - r.paid_amount) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor[s]}>{s.replace('_', ' ').toUpperCase()}</Tag> },
  ];

  return (
    <div>
      <Title level={3}>Payment Schedule</Title>
      <Table columns={columns} dataSource={schedules} rowKey="id" loading={isLoading} pagination={false} scroll={{ x: 600 }} />
    </div>
  );
};

export default SchedulesPage;
