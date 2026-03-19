import React from 'react';
import { Table, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getInvestorDocuments } from '../../api/investor';
import { formatDateTime } from '../../utils/format';

const { Title } = Typography;

const DocumentsPage: React.FC = () => {
  const { data: documents, isLoading } = useQuery({
    queryKey: ['investor-documents'],
    queryFn: () => getInvestorDocuments().then(r => r.data),
  });

  const columns = [
    { title: 'File Name', dataIndex: 'file_name', key: 'file_name' },
    { title: 'Uploaded', dataIndex: 'uploaded_at', key: 'uploaded_at', render: (v: string) => formatDateTime(v) },
  ];

  return (
    <div>
      <Title level={3}>Documents</Title>
      <Table columns={columns} dataSource={documents} rowKey="id" loading={isLoading} pagination={false} scroll={{ x: 400 }} />
    </div>
  );
};

export default DocumentsPage;
