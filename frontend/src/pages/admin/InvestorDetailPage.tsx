import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, Descriptions, Tabs, Table, Tag, Button, Modal, Form, InputNumber, Input, Select, DatePicker, Upload, Space, message, Typography, Timeline } from 'antd';
import { UploadOutlined, DollarOutlined, PlusOutlined, FilePdfOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvestor, getSchedules, getPayments, getDocuments, getActivities, getPaymentSummary, createPayment, updatePayment, deletePayment, processTopUp, uploadDocument, deleteDocument, renewContract, updateInvestor, getInvestorReferrals } from '../../api/admin';
import { formatCurrency, formatDate, formatDateTime, formatRate } from '../../utils/format';
import type { PayoutSchedule, PaymentAllocation, Document as DocType, Activity } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusColor: Record<string, string> = {
  pending: 'blue', paid: 'green', partially_paid: 'orange', overdue: 'red', paid_in_advance: 'cyan',
};

const InvestorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const investorId = Number(id);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'ledger');
  const [payModal, setPayModal] = useState(false);
  const [topUpModal, setTopUpModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editPayModal, setEditPayModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [payForm] = Form.useForm();
  const [topUpForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editPayForm] = Form.useForm();

  const { data: investorData, isLoading } = useQuery({
    queryKey: ['investor', investorId],
    queryFn: () => getInvestor(investorId).then(r => r.data),
  });

  const { data: schedulesData } = useQuery({
    queryKey: ['schedules', investorId],
    queryFn: () => getSchedules(investorId).then(r => r.data),
    enabled: activeTab === 'ledger',
  });

  const schedules = schedulesData?.schedules;
  const ledgerCommissions = schedulesData?.commissions;

  const { data: paymentsData } = useQuery({
    queryKey: ['payments', investorId],
    queryFn: () => getPayments(investorId).then(r => r.data),
    enabled: activeTab === 'payment',
  });

  const { data: documents } = useQuery({
    queryKey: ['documents', investorId],
    queryFn: () => getDocuments(investorId).then(r => r.data),
    enabled: activeTab === 'documents',
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['activities', investorId],
    queryFn: () => getActivities(investorId).then(r => r.data),
    enabled: activeTab === 'activities',
  });

  const { data: referralsData } = useQuery({
    queryKey: ['investor-referrals', investorId],
    queryFn: () => getInvestorReferrals(investorId).then(r => r.data),
    enabled: activeTab === 'referrals',
  });

  const { data: paymentSummary } = useQuery({
    queryKey: ['payment-summary', investorId],
    queryFn: () => getPaymentSummary(investorId).then(r => r.data),
    enabled: payModal,
  });

  const payMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => createPayment(investorId, values),
    onSuccess: () => {
      message.success('Payment recorded');
      setPayModal(false);
      payForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['investor', investorId] });
      queryClient.invalidateQueries({ queryKey: ['schedules', investorId] });
      queryClient.invalidateQueries({ queryKey: ['payments', investorId] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Payment failed'),
  });

  const topUpMutation = useMutation({
    mutationFn: (values: { amount: number; date?: string; note?: string }) => processTopUp(investorId, values),
    onSuccess: () => {
      message.success('Top up processed');
      setTopUpModal(false);
      topUpForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['investor', investorId] });
      queryClient.invalidateQueries({ queryKey: ['schedules', investorId] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Top up failed'),
  });

  const editMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => updateInvestor(investorId, values),
    onSuccess: () => {
      message.success('Investor updated');
      setEditModal(false);
      queryClient.invalidateQueries({ queryKey: ['investor', investorId] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Update failed'),
  });

  const renewMutation = useMutation({
    mutationFn: () => renewContract(investorId),
    onSuccess: () => {
      message.success('Contract renewed');
      queryClient.invalidateQueries({ queryKey: ['investor', investorId] });
    },
  });

  const editPayMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => updatePayment(investorId, editingPayment?.id, values),
    onSuccess: () => {
      message.success('Payment updated');
      setEditPayModal(false);
      setEditingPayment(null);
      editPayForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['payments', investorId] });
      queryClient.invalidateQueries({ queryKey: ['schedules', investorId] });
      queryClient.invalidateQueries({ queryKey: ['investor', investorId] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Update failed'),
  });

  const deletePayMutation = useMutation({
    mutationFn: (paymentId: number) => deletePayment(investorId, paymentId),
    onSuccess: () => {
      message.success('Payment deleted');
      queryClient.invalidateQueries({ queryKey: ['payments', investorId] });
      queryClient.invalidateQueries({ queryKey: ['schedules', investorId] });
      queryClient.invalidateQueries({ queryKey: ['investor', investorId] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Delete failed'),
  });

  const investor = investorData?.investor;
  const summary = investorData?.summary;

  if (isLoading || !investor) return <div>Loading...</div>;

  const openEditPayModal = (payment: any) => {
    setEditingPayment(payment);
    editPayForm.setFieldsValue({
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
      payment_date: payment.payment_date ? dayjs(payment.payment_date) : null,
      note: payment.note,
    });
    setEditPayModal(true);
  };

  const openEditModal = () => {
    editForm.setFieldsValue(investor);
    setEditModal(true);
  };

  const exportLedgerPdf = () => {
    if (!schedules?.length) return;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text('Payout Schedule / Ledger', 14, 20);
    doc.setFontSize(10);
    doc.text(`Investor: ${investor.prefix || ''} ${investor.first_name} ${investor.second_name} ${investor.last_name || ''}`.trim(), 14, 28);
    doc.text(`Investor ID: ${investor.investor_id}`, 14, 34);
    doc.text(`Total Invested: ${formatCurrency(summary?.total_invested ?? 0)}  |  Rate: ${formatRate(summary?.interest_rate ?? 0)}  |  Monthly Payout: ${formatCurrency(summary?.monthly_payout ?? 0)}`, 14, 40);
    doc.text(`Contract: ${formatDate(investor.start_date)} — ${formatDate(investor.end_date)}`, 14, 46);

    // Table
    const tableBody: (string | number)[][] = [];
    schedules.forEach((s: PayoutSchedule, i: number) => {
      const allocations = s.payment_allocations || [];
      // Main schedule row
      tableBody.push([
        i + 1,
        formatDate(s.due_date),
        formatCurrency(s.expected_amount),
        formatCurrency(s.paid_amount),
        formatCurrency(s.expected_amount - s.paid_amount),
        allocations.length === 0 ? '-' : '',
        allocations.length === 0 ? '-' : '',
        allocations.length === 0 ? '-' : '',
        s.status.replace('_', ' ').toUpperCase(),
      ]);
      // Sub-rows for each payment allocation
      allocations.forEach((a) => {
        tableBody.push([
          '',
          '',
          '',
          '',
          '',
          a.payment?.payment_date ? formatDate(a.payment.payment_date) : '-',
          a.payment?.reference || '-',
          formatCurrency(a.amount_allocated),
          '',
        ]);
      });
    });

    // Totals row
    const totalExpected = schedules.reduce((sum: number, s: PayoutSchedule) => sum + Number(s.expected_amount), 0);
    const totalPaid = schedules.reduce((sum: number, s: PayoutSchedule) => sum + Number(s.paid_amount), 0);
    const totalBalance = totalExpected - totalPaid;
    tableBody.push([
      '', 'Totals', formatCurrency(totalExpected), formatCurrency(totalPaid), formatCurrency(totalBalance), '', '', '', '',
    ]);

    autoTable(doc, {
      startY: 54,
      head: [['#', 'Due Date', 'Expected', 'Paid', 'Balance', 'Payment Date', 'Reference', 'Amount', 'Status']],
      body: tableBody,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 119, 255] },
      didParseCell: (data) => {
        // Style allocation sub-rows with lighter background
        if (data.section === 'body' && data.row.raw && Array.isArray(data.row.raw) && data.row.raw[0] === '') {
          data.cell.styles.fillColor = [245, 245, 245];
          data.cell.styles.fontStyle = 'italic';
          data.cell.styles.fontSize = 7;
        }
        // Style totals row
        const lastRowIndex = tableBody.length - 1;
        if (data.section === 'body' && data.row.index === lastRowIndex) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
    });

    // Commissions section
    if (ledgerCommissions && ledgerCommissions.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 60;
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Approved Commissions', 14, finalY + 14);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Referred Investor', 'Commission Amount', 'Payment Date', 'Status']],
        body: ledgerCommissions.map((c: any) => [
          c.referred ? `${c.referred.first_name} ${c.referred.second_name}` : '-',
          formatCurrency(c.commission_amount),
          formatDate(c.payment_date),
          c.status.toUpperCase(),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 119, 255] },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Generated on ${dayjs().format('DD MMM YYYY, HH:mm')}`, 14, doc.internal.pageSize.height - 10);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }

    doc.save(`ledger-${investor.investor_id}.pdf`);
  };

  const scheduleColumns = [
    { title: 'Due Date', dataIndex: 'due_date', key: 'due_date', render: (v: string) => formatDate(v) },
    { title: 'Expected', dataIndex: 'expected_amount', key: 'expected_amount', render: (v: number) => formatCurrency(v) },
    { title: 'Paid', dataIndex: 'paid_amount', key: 'paid_amount', render: (v: number) => <Text type={v > 0 ? 'success' : undefined}>{formatCurrency(v)}</Text> },
    {
      title: 'Balance', key: 'balance',
      render: (_: unknown, r: PayoutSchedule) => {
        const bal = r.expected_amount - r.paid_amount;
        return <Text type={bal > 0 ? 'danger' : undefined} strong={bal > 0}>{formatCurrency(bal)}</Text>;
      },
    },
    {
      title: 'Payments', key: 'payments_count',
      render: (_: unknown, r: PayoutSchedule) => {
        const count = r.payment_allocations?.length || 0;
        if (count === 0) return <Text type="secondary">-</Text>;
        return <Tag color={r.status === 'partially_paid' ? 'orange' : 'green'}>{count} payment{count > 1 ? 's' : ''}</Tag>;
      },
    },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor[s]}>{s.replace('_', ' ').toUpperCase()}</Tag> },
  ];

  const expandedScheduleRow = (record: PayoutSchedule) => {
    const allocations = record.payment_allocations || [];
    if (allocations.length === 0) return <Text type="secondary">No payments recorded for this period.</Text>;
    return (
      <Table
        dataSource={allocations}
        rowKey="id"
        pagination={false}
        size="small"
        style={{ margin: 0 }}
        columns={[
          { title: 'Payment Date', key: 'date', render: (_: unknown, a: PaymentAllocation) => a.payment?.payment_date ? formatDate(a.payment.payment_date) : '-' },
          { title: 'Reference', key: 'ref', render: (_: unknown, a: PaymentAllocation) => a.payment?.reference || '-' },
          { title: 'Amount Paid', key: 'amount', render: (_: unknown, a: PaymentAllocation) => <Text type="success">{formatCurrency(a.amount_allocated)}</Text> },
          { title: 'Method', key: 'method', render: (_: unknown, a: PaymentAllocation) => a.payment?.method ? <Tag>{a.payment.method.toUpperCase()}</Tag> : '-' },
        ]}
      />
    );
  };

  const paymentColumns = [
    { title: 'Date', dataIndex: 'payment_date', key: 'payment_date', render: (v: string) => formatDateTime(v) },
    { title: 'Reference', dataIndex: 'reference', key: 'reference' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => formatCurrency(v) },
    { title: 'Method', dataIndex: 'method', key: 'method', render: (v: string) => <Tag>{v.toUpperCase()}</Tag> },
    { title: 'Note', dataIndex: 'note', key: 'note' },
    {
      title: 'Action', key: 'action', width: 100,
      render: (_: unknown, record: any) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditPayModal(record)} />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Delete Payment',
                content: `Are you sure you want to delete this payment of ${formatCurrency(record.amount)}? This will reverse all allocations to the ledger.`,
                okText: 'Delete',
                okButtonProps: { danger: true },
                onOk: () => deletePayMutation.mutate(record.id),
              });
            }}
          />
        </Space>
      ),
    },
  ];

  const documentColumns = [
    { title: 'File Name', dataIndex: 'file_name', key: 'file_name' },
    { title: 'Uploaded', dataIndex: 'uploaded_at', key: 'uploaded_at', render: (v: string) => formatDateTime(v) },
    {
      title: 'Action', key: 'action',
      render: (_: unknown, record: DocType) => (
        <Space>
          <Button size="small" danger onClick={() => deleteDocument(record.id).then(() => {
            message.success('Deleted');
            queryClient.invalidateQueries({ queryKey: ['documents', investorId] });
          })}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Title level={3} style={{ margin: 0 }}>{investor.prefix} {investor.first_name} {investor.second_name} {investor.last_name}</Title>
        <Space wrap>
          <Button onClick={openEditModal}>Edit</Button>
          <Button icon={<PlusOutlined />} onClick={() => setTopUpModal(true)}>Top Up</Button>
          <Button type="primary" icon={<DollarOutlined />} onClick={() => setPayModal(true)}>Record Payment</Button>
          {investor.status === 'completed' && (
            <Button onClick={() => renewMutation.mutate()} loading={renewMutation.isPending}>Renew Contract</Button>
          )}
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
          <Descriptions.Item label="Investor ID">{investor.investor_id}</Descriptions.Item>
          <Descriptions.Item label="Email">{investor.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{investor.phone}</Descriptions.Item>
          <Descriptions.Item label="Address">{investor.address}, {investor.city}, {investor.country}</Descriptions.Item>
          <Descriptions.Item label="ID Number">{investor.id_number}</Descriptions.Item>
          <Descriptions.Item label="Tax ID">{investor.tax_id || '-'}</Descriptions.Item>
          <Descriptions.Item label="Next of Kin">{investor.next_of_kin_name || '-'} ({investor.next_of_kin_phone || '-'})</Descriptions.Item>
          <Descriptions.Item label="Bank">{investor.bank_name || '-'} - {investor.bank_account || '-'} ({investor.bank_branch || '-'})</Descriptions.Item>
          <Descriptions.Item label="Status"><Tag color={investor.status === 'active' ? 'green' : 'orange'}>{investor.status.toUpperCase()}</Tag></Descriptions.Item>
          <Descriptions.Item label="Total Invested"><Text strong>{formatCurrency(summary?.total_invested ?? 0)}</Text></Descriptions.Item>
          <Descriptions.Item label="Interest Rate">{formatRate(summary?.interest_rate ?? 0)}</Descriptions.Item>
          <Descriptions.Item label="Monthly Payout"><Text strong>{formatCurrency(summary?.monthly_payout ?? 0)}</Text></Descriptions.Item>
          <Descriptions.Item label="Contract Start">{formatDate(investor.start_date)}</Descriptions.Item>
          <Descriptions.Item label="Contract End">{formatDate(investor.end_date)}</Descriptions.Item>
          <Descriptions.Item label="Remaining Months">{summary?.remaining_months}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'ledger',
          label: 'Ledger',
          children: (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <Button icon={<FilePdfOutlined />} onClick={exportLedgerPdf} style={{ borderRadius: 6 }}>
                  Export PDF
                </Button>
              </div>
              <Table
                columns={scheduleColumns}
                dataSource={schedules}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 700 }}
                expandable={{
                  expandedRowRender: expandedScheduleRow,
                  rowExpandable: (record) => (record.payment_allocations?.length || 0) > 0,
                }}
                summary={() => {
                  if (!schedules?.length) return null;
                  const totalExpected = schedules.reduce((sum: number, s: PayoutSchedule) => sum + Number(s.expected_amount), 0);
                  const totalPaid = schedules.reduce((sum: number, s: PayoutSchedule) => sum + Number(s.paid_amount), 0);
                  const totalBalance = totalExpected - totalPaid;
                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row style={{ background: '#fafafa' }}>
                        <Table.Summary.Cell index={0} />
                        <Table.Summary.Cell index={1}><Text strong>Totals</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={2}><Text strong>{formatCurrency(totalExpected)}</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={3}><Text strong type="success">{formatCurrency(totalPaid)}</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={4}><Text strong type={totalBalance > 0 ? 'danger' : undefined}>{formatCurrency(totalBalance)}</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={5} />
                        <Table.Summary.Cell index={6} />
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
              {ledgerCommissions && ledgerCommissions.length > 0 && (
                <>
                  <Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>Approved Commissions</Title>
                  <Table
                    columns={[
                      { title: 'Referred Investor', key: 'referred', render: (_: unknown, r: any) => r.referred ? `${r.referred.first_name} ${r.referred.second_name}` : '-' },
                      { title: 'Commission Amount', dataIndex: 'commission_amount', key: 'amount', render: (v: number) => <Text type="success" strong>{formatCurrency(v)}</Text> },
                      { title: 'Payment Date', dataIndex: 'payment_date', key: 'date', render: (v: string) => formatDate(v) },
                      { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'paid' ? 'green' : 'gold'}>{s.toUpperCase()}</Tag> },
                    ]}
                    dataSource={ledgerCommissions}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    scroll={{ x: 500 }}
                  />
                </>
              )}
            </>
          ),
        },
        {
          key: 'payment',
          label: 'Payments',
          children: <Table columns={paymentColumns} dataSource={paymentsData?.data} rowKey="id" size="small" scroll={{ x: 600 }} pagination={{ total: paymentsData?.total, pageSize: 15 }} />,
        },
        {
          key: 'referrals',
          label: `Referrals (${referralsData?.stats?.total_referrals ?? 0})`,
          children: (
            <>
              <div className="referral-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                <div style={{ background: 'linear-gradient(135deg, #1a365d, #2563eb)', borderRadius: 12, padding: '16px 18px', color: '#fff' }}>
                  <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Referral Code</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 3 }}>{referralsData?.referral_code || '-'}</div>
                </div>
                <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '16px 18px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Approved</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>{referralsData?.stats?.approved ?? 0}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>of {referralsData?.stats?.total_referrals ?? 0} referrals</div>
                </div>
                <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '16px 18px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Commission Earned</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{formatCurrency(referralsData?.stats?.total_earned ?? 0)}</div>
                </div>
                <div style={{ background: '#fffbeb', borderRadius: 12, padding: '16px 18px', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Commission Pending</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706' }}>{formatCurrency(referralsData?.stats?.total_pending ?? 0)}</div>
                </div>
              </div>
              <Table
                columns={[
                  { title: 'Investor ID', key: 'investor_id', render: (_: unknown, r: any) => r.referred?.investor_id || '-' },
                  { title: 'Name', key: 'name', render: (_: unknown, r: any) => r.referred ? `${r.referred.first_name} ${r.referred.second_name}` : '-' },
                  { title: 'Phone', key: 'phone', render: (_: unknown, r: any) => r.referred?.phone || '-' },
                  { title: 'Invested', key: 'invested', render: (_: unknown, r: any) => formatCurrency(r.referred?.total_invested ?? 0) },
                  { title: 'Monthly Payout', key: 'payout', render: (_: unknown, r: any) => formatCurrency(r.referred?.monthly_payout ?? 0) },
                  { title: 'Referral Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'approved' ? 'green' : s === 'pending' ? 'gold' : 'red'}>{s.toUpperCase()}</Tag> },
                  { title: 'Date', dataIndex: 'created_at', key: 'created_at', render: (v: string) => formatDate(v) },
                ]}
                dataSource={referralsData?.referrals}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 700 }}
                locale={{ emptyText: 'No referrals yet' }}
              />
              {referralsData?.commissions?.length > 0 && (
                <>
                  <Title level={5} style={{ marginTop: 24 }}>Commission History</Title>
                  <Table
                    columns={[
                      { title: 'Amount', dataIndex: 'commission_amount', key: 'amount', render: (v: number) => formatCurrency(v) },
                      { title: 'Payment Date', dataIndex: 'payment_date', key: 'date', render: (v: string) => formatDate(v) },
                      { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'paid' ? 'green' : 'gold'}>{s.toUpperCase()}</Tag> },
                    ]}
                    dataSource={referralsData.commissions}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    scroll={{ x: 400 }}
                  />
                </>
              )}
            </>
          ),
        },
        {
          key: 'documents',
          label: 'Documents',
          children: (
            <>
              <Upload
                customRequest={({ file, onSuccess }) => {
                  uploadDocument(investorId, file as File).then(() => {
                    onSuccess?.({});
                    message.success('Document uploaded');
                    queryClient.invalidateQueries({ queryKey: ['documents', investorId] });
                  });
                }}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />} style={{ marginBottom: 16 }}>Upload Document</Button>
              </Upload>
              <Table columns={documentColumns} dataSource={documents} rowKey="id" pagination={false} size="small" scroll={{ x: 500 }} />
            </>
          ),
        },
        {
          key: 'activities',
          label: 'Activities',
          children: (
            <Timeline items={activitiesData?.data?.map((a: Activity) => ({
              children: (
                <div>
                  <Text strong>{a.action}</Text> - {a.details}
                  <br />
                  <Text type="secondary">{formatDateTime(a.performed_at)} by {a.user?.name || 'System'}</Text>
                </div>
              ),
            })) || []} />
          ),
        },
      ]} />

      {/* Payment Modal */}
      <Modal
        open={payModal}
        onCancel={() => setPayModal(false)}
        width={640}
        closable={false}
        footer={null}
        styles={{ body: { padding: 0 } }}
      >
        {/* Dark header banner */}
        <div className="pay-modal-header" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '24px 28px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Record Payment</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
                {investor.prefix} {investor.first_name} {investor.second_name} {investor.last_name}
              </div>
            </div>
            <Button type="text" onClick={() => setPayModal(false)} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, padding: '0 4px' }}>&times;</Button>
          </div>
          {/* Summary mini-cards */}
          <div className="pay-modal-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18 }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Monthly Payout</div>
              <div className="pay-modal-summary-value" style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>{formatCurrency(summary?.monthly_payout ?? 0)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Due</div>
              <div className="pay-modal-summary-value" style={{ fontSize: 17, fontWeight: 700, marginTop: 2, color: (paymentSummary?.total_overdue ?? 0) > 0 ? '#fca5a5' : '#6ee7b7' }}>{formatCurrency(paymentSummary?.total_overdue ?? 0)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Invested</div>
              <div className="pay-modal-summary-value" style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>{formatCurrency(summary?.total_invested ?? 0)}</div>
            </div>
          </div>
        </div>

        {/* Form body */}
        <div className="pay-modal-body" style={{ padding: '24px 28px 20px' }}>
          <Form form={payForm} layout="vertical" onFinish={(values) => {
            payMutation.mutate({ ...values, payment_date: values.payment_date?.format('YYYY-MM-DD HH:mm:ss') });
          }} requiredMark={false}>
            <div className="pay-modal-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="amount" label={<Text strong style={{ fontSize: 13 }}>Amount (KES)</Text>} rules={[{ required: true, message: 'Enter amount' }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  min={0.01}
                  placeholder="0.00"
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => Number(v!.replace(/,/g, ''))}
                />
              </Form.Item>
              <Form.Item name="payment_date" label={<Text strong style={{ fontSize: 13 }}>Payment Date</Text>} rules={[{ required: true, message: 'Select date' }]}>
                <DatePicker showTime style={{ width: '100%' }} size="large" />
              </Form.Item>
            </div>
            <div className="pay-modal-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Form.Item name="method" label={<Text strong style={{ fontSize: 13 }}>Payment Method</Text>} rules={[{ required: true, message: 'Select method' }]}>
                <Select size="large" placeholder="Select method" options={[
                  { value: 'mpesa', label: 'M-Pesa' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'cheque', label: 'Cheque' },
                  { value: 'cash', label: 'Cash' },
                ]} />
              </Form.Item>
              <Form.Item name="reference" label={<Text strong style={{ fontSize: 13 }}>Reference Number</Text>}>
                <Input size="large" placeholder="Auto-generated if blank" />
              </Form.Item>
            </div>
            <Form.Item name="note" label={<Text strong style={{ fontSize: 13 }}>Note</Text>} style={{ marginBottom: 0 }}>
              <Input.TextArea rows={3} placeholder="Optional payment note..." />
            </Form.Item>
          </Form>
        </div>

        {/* Footer */}
        <div className="pay-modal-footer" style={{ padding: '0 28px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button size="large" onClick={() => setPayModal(false)} style={{ borderRadius: 8, minWidth: 100 }}>Cancel</Button>
          <Button type="primary" size="large" onClick={() => payForm.submit()} loading={payMutation.isPending} style={{ borderRadius: 8, minWidth: 120, background: '#2563eb' }}>
            Save Payment
          </Button>
        </div>
      </Modal>

      {/* Edit Payment Modal */}
      <Modal
        title="Edit Payment"
        open={editPayModal}
        onCancel={() => { setEditPayModal(false); setEditingPayment(null); }}
        onOk={() => editPayForm.submit()}
        confirmLoading={editPayMutation.isPending}
        width={540}
      >
        <Form form={editPayForm} layout="vertical" onFinish={(values) => {
          editPayMutation.mutate({ ...values, payment_date: values.payment_date?.format('YYYY-MM-DD HH:mm:ss') });
        }} requiredMark={false}>
          <div className="pay-modal-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="amount" label="Amount (KES)" rules={[{ required: true, message: 'Enter amount' }]}>
              <InputNumber
                style={{ width: '100%' }}
                min={0.01}
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => Number(v!.replace(/,/g, ''))}
              />
            </Form.Item>
            <Form.Item name="payment_date" label="Payment Date" rules={[{ required: true, message: 'Select date' }]}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div className="pay-modal-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="method" label="Payment Method" rules={[{ required: true, message: 'Select method' }]}>
              <Select placeholder="Select method" options={[
                { value: 'mpesa', label: 'M-Pesa' },
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'cheque', label: 'Cheque' },
                { value: 'cash', label: 'Cash' },
              ]} />
            </Form.Item>
            <Form.Item name="reference" label="Reference Number">
              <Input placeholder="Auto-generated if blank" />
            </Form.Item>
          </div>
          <Form.Item name="note" label="Note">
            <Input.TextArea rows={3} placeholder="Optional payment note..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Top Up Modal */}
      <Modal title="Process Top Up" open={topUpModal} onCancel={() => setTopUpModal(false)} onOk={() => topUpForm.submit()} confirmLoading={topUpMutation.isPending}>
        <Form form={topUpForm} layout="vertical" onFinish={(values) => {
          topUpMutation.mutate({ ...values, date: values.date?.format('YYYY-MM-DD') });
        }}>
          <Form.Item name="amount" label="Top Up Amount (Ksh)" rules={[{ required: true }, { type: 'number', min: 50000, message: 'Minimum 50,000' }]}>
            <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v!.replace(/,/g, '') as unknown as number} />
          </Form.Item>
          <Form.Item name="date" label="Date"><DatePicker style={{ width: '100%' }} defaultValue={dayjs()} /></Form.Item>
          <Form.Item name="note" label="Note"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal title="Edit Investor" open={editModal} onCancel={() => setEditModal(false)} onOk={() => editForm.submit()} confirmLoading={editMutation.isPending} width={700}>
        <Form form={editForm} layout="vertical" onFinish={(values) => editMutation.mutate(values)}>
          <div className="edit-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="prefix" label="Prefix"><Input /></Form.Item>
            <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="second_name" label="Second Name" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="last_name" label="Last Name"><Input /></Form.Item>
            <Form.Item name="phone" label="Phone" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="id_number" label="ID Number" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="other_phone" label="Other Phone"><Input /></Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
            <Form.Item name="address" label="Address" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="city" label="City" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="country" label="Country" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="tax_id" label="Tax ID"><Input /></Form.Item>
            <Form.Item name="next_of_kin_name" label="Next of Kin Name"><Input /></Form.Item>
            <Form.Item name="next_of_kin_phone" label="Next of Kin Phone"><Input /></Form.Item>
            <Form.Item name="bank_name" label="Bank Name"><Input /></Form.Item>
            <Form.Item name="bank_account" label="Account Number"><Input /></Form.Item>
            <Form.Item name="bank_branch" label="Branch"><Input /></Form.Item>
          </div>
        </Form>
      </Modal>

      <style>{`
        @media (max-width: 768px) {
          .referral-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .edit-modal-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .referral-stats-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 576px) {
          .pay-modal-header { padding: 18px 16px !important; }
          .pay-modal-summary { grid-template-columns: 1fr !important; gap: 8px !important; }
          .pay-modal-summary-value { font-size: 15px !important; }
          .pay-modal-body { padding: 18px 16px 14px !important; }
          .pay-modal-form-row { grid-template-columns: 1fr !important; }
          .pay-modal-footer { padding: 0 16px 18px !important; flex-direction: column !important; }
          .pay-modal-footer .ant-btn { width: 100% !important; min-width: unset !important; }
        }
      `}</style>
    </div>
  );
};

export default InvestorDetailPage;
