import React from 'react';
import { Table, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getInvestorPayments } from '../../api/investor';
import { formatCurrency, formatDateTime } from '../../utils/format';

const { Title } = Typography;

const PaymentsPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['investor-payments'],
    queryFn: () => getInvestorPayments().then(r => r.data),
  });

  const columns = [
    { title: 'Date', dataIndex: 'payment_date', key: 'payment_date', render: (v: string) => formatDateTime(v) },
    { title: 'Reference', dataIndex: 'reference', key: 'reference' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => formatCurrency(v) },
    { title: 'Method', dataIndex: 'method', key: 'method', render: (v: string) => <Tag>{v.toUpperCase()}</Tag> },
    { title: 'Note', dataIndex: 'note', key: 'note' },
  ];

  return (
    <div>
      <Title level={3}>Payment History</Title>
      <Table columns={columns} dataSource={data?.data} rowKey="id" loading={isLoading} scroll={{ x: 600 }} pagination={{ total: data?.total, pageSize: 15 }} />
    </div>
  );
};

export default PaymentsPage;
