import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tabs, Table, Tag, Button, Modal, Form, InputNumber, Input, Select, DatePicker, Upload, Space, Spin, message, Typography, Timeline } from 'antd';
import { UploadOutlined, PlusOutlined, FilePdfOutlined, EditOutlined, DeleteOutlined, FileProtectOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvestor, getStatement, getPayments, getDocuments, getActivities, updatePayment, deletePayment, uploadDocument, deleteDocument, renewContract, updateInvestor, getInvestorReferrals, getInvestorContracts, createContract } from '../../api/admin';
import { formatCurrency, formatDate, formatDateTime, formatRate } from '../../utils/format';
import type { PaymentAllocation, Document as DocType, Activity, Contract } from '../../types';
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
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'statement');
  const [stmtRange, setStmtRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editPayModal, setEditPayModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [newContractModal, setNewContractModal] = useState(false);
  const [editForm] = Form.useForm();
  const [editPayForm] = Form.useForm();
  const [newContractForm] = Form.useForm();
  const navigate = useNavigate();

  const { data: investorData, isLoading } = useQuery({
    queryKey: ['investor', investorId],
    queryFn: () => getInvestor(investorId).then(r => r.data),
  });

  const stmtFrom = stmtRange?.[0]?.format('YYYY-MM-DD');
  const stmtTo = stmtRange?.[1]?.format('YYYY-MM-DD');
  const { data: stmtData, isLoading: stmtLoading } = useQuery({
    queryKey: ['statement', investorId, stmtFrom, stmtTo],
    queryFn: () => getStatement(investorId, stmtFrom, stmtTo).then(r => r.data),
    enabled: activeTab === 'statement',
  });

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

  const { data: contractsData } = useQuery({
    queryKey: ['investor-contracts', investorId],
    queryFn: () => getInvestorContracts(investorId).then(r => r.data),
    enabled: activeTab === 'contracts',
  });

  const newContractMutation = useMutation({
    mutationFn: (values: { amount: number; start_date?: string; custom_interest_rate?: number }) => createContract(investorId, values),
    onSuccess: () => {
      message.success('New contract created');
      setNewContractModal(false);
      newContractForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['investor-contracts', investorId] });
      queryClient.invalidateQueries({ queryKey: ['investor', investorId] });
      queryClient.invalidateQueries({ queryKey: ['schedules', investorId] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Failed to create contract'),
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

  const exportStatementPdf = () => {
    if (!stmtData) return;
    const doc = new jsPDF();
    const blue: [number, number, number] = [22, 119, 255];
    const grey: [number, number, number] = [240, 240, 240];
    let y = 20;

    const addSectionTitle = (title: string) => {
      const currentY = (doc as any).lastAutoTable?.finalY ?? y;
      if (currentY > doc.internal.pageSize.height - 40) { doc.addPage(); y = 20; } else { y = currentY + 12; }
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(title, 14, y);
      y += 6;
    };

    // Header
    doc.setFontSize(16);
    doc.text('Investor Statement', 14, y);
    doc.setFontSize(10);
    y += 8;
    doc.text(`Investor: ${investor.prefix || ''} ${investor.first_name} ${investor.second_name} ${investor.last_name || ''}`.trim(), 14, y);
    y += 6;
    doc.text(`Investor ID: ${investor.investor_id}`, 14, y);
    y += 6;
    const rangeTxt = stmtFrom && stmtTo ? `${formatDate(stmtFrom)} — ${formatDate(stmtTo)}` : 'All Time';
    doc.text(`Period: ${rangeTxt}`, 14, y);
    y += 10;

    // Summary totals
    const t = stmtData.totals;
    autoTable(doc, {
      startY: y,
      head: [['Total Invested', 'Total Top-Ups', 'Total Expected', 'Total Paid', 'Balance']],
      body: [[formatCurrency(t.total_invested), formatCurrency(t.total_topups), formatCurrency(t.total_expected), formatCurrency(t.total_paid), formatCurrency(t.total_balance)]],
      styles: { fontSize: 9, halign: 'center' },
      headStyles: { fillColor: blue },
    });

    // Contracts
    if (stmtData.contracts?.length) {
      addSectionTitle('Contracts');
      autoTable(doc, {
        startY: y,
        head: [['Contract ID', 'Invested', 'Rate', 'Monthly Payout', 'Start', 'End', 'Status']],
        body: stmtData.contracts.map((c: any) => [
          c.contract_id, formatCurrency(c.total_invested), formatRate(c.interest_rate),
          formatCurrency(c.monthly_payout), formatDate(c.start_date), formatDate(c.end_date), c.status.toUpperCase(),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: blue },
      });
    }

    // Top-ups
    const topups = stmtData.transactions?.filter((tx: any) => tx.type === 'topup') || [];
    if (topups.length) {
      addSectionTitle('Top-Ups');
      autoTable(doc, {
        startY: y,
        head: [['Date', 'Contract', 'Amount', 'Note']],
        body: topups.map((tx: any) => [
          formatDate(tx.date), tx.contract?.contract_id || '-', formatCurrency(tx.amount), tx.note || '-',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: blue },
      });
    }

    // Payout Schedule (with payments embedded)
    if (stmtData.schedules?.length) {
      addSectionTitle('Payout Schedule');
      const schedBody: (string | number)[][] = [];
      stmtData.schedules.forEach((s: any, i: number) => {
        const allocs = s.payment_allocations || [];
        schedBody.push([
          i + 1, s.contract?.contract_id || '-', formatDate(s.due_date),
          formatCurrency(s.expected_amount), formatCurrency(s.paid_amount),
          formatCurrency(Number(s.expected_amount) - Number(s.paid_amount)),
          allocs.length === 0 ? '-' : '',
          allocs.length === 0 ? '-' : '',
          allocs.length === 0 ? '-' : '',
          s.status.replace('_', ' ').toUpperCase(),
        ]);
        allocs.forEach((a: any) => {
          schedBody.push([
            '', '', '', '', '', '',
            a.payment?.payment_date ? formatDate(a.payment.payment_date) : '-',
            a.payment?.reference || '-',
            formatCurrency(a.amount_allocated),
            '',
          ]);
        });
      });
      const schTotalExp = stmtData.schedules.reduce((sum: number, s: any) => sum + Number(s.expected_amount), 0);
      const schTotalPaid = stmtData.schedules.reduce((sum: number, s: any) => sum + Number(s.paid_amount), 0);
      schedBody.push(['', '', 'Totals', formatCurrency(schTotalExp), formatCurrency(schTotalPaid), formatCurrency(schTotalExp - schTotalPaid), '', '', '', '']);
      const lastIdx = schedBody.length - 1;
      autoTable(doc, {
        startY: y,
        head: [['#', 'Contract', 'Due Date', 'Expected', 'Paid', 'Balance', 'Payment Date', 'Reference', 'Amount', 'Status']],
        body: schedBody,
        styles: { fontSize: 7 },
        headStyles: { fillColor: blue },
        didParseCell: (data) => {
          // Style payment sub-rows
          if (data.section === 'body' && data.row.raw && Array.isArray(data.row.raw) && data.row.raw[0] === '' && data.row.index !== lastIdx) {
            data.cell.styles.fillColor = [245, 245, 245];
            data.cell.styles.fontStyle = 'italic';
            data.cell.styles.fontSize = 6;
          }
          // Style totals row
          if (data.section === 'body' && data.row.index === lastIdx) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = grey;
          }
        },
      });
    }

    // Commissions
    if (stmtData.commissions?.length) {
      addSectionTitle('Commissions');
      autoTable(doc, {
        startY: y,
        head: [['Referred Investor', 'Amount', 'Payment Date', 'Status']],
        body: stmtData.commissions.map((c: any) => [
          c.referred ? `${c.referred.first_name} ${c.referred.second_name}` : '-',
          formatCurrency(c.commission_amount), formatDate(c.payment_date), c.status.toUpperCase(),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: blue },
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

    doc.save(`statement-${investor.investor_id}.pdf`);
  };

  const paymentColumns = [
    { title: 'Date', dataIndex: 'payment_date', key: 'payment_date', render: (v: string) => formatDateTime(v) },
    { title: 'Reference', dataIndex: 'reference', key: 'reference' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => formatCurrency(v) },
    { title: 'Method', dataIndex: 'method', key: 'method', render: (v: string) => <Tag>{v.toUpperCase()}</Tag> },
    {
      title: 'Contract', key: 'contract',
      render: (_: unknown, record: any) => {
        const contractIds = [...new Set(
          (record.allocations || [])
            .map((a: any) => a.payout_schedule?.contract?.contract_id)
            .filter(Boolean)
        )];
        return contractIds.length > 0 ? contractIds.join(', ') : '-';
      },
    },
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
          <Descriptions.Item label="Next of Kin">{investor.next_of_kin_name || '-'} ({investor.next_of_kin_relationship || '-'}) - {investor.next_of_kin_phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Bank">{investor.bank_name || '-'} - {investor.bank_account || '-'} ({investor.bank_branch || '-'})</Descriptions.Item>
          <Descriptions.Item label="Status"><Tag color={investor.status === 'active' ? 'green' : 'orange'}>{investor.status.toUpperCase()}</Tag></Descriptions.Item>
          <Descriptions.Item label="Total Invested"><Text strong>{formatCurrency(summary?.total_invested ?? 0)}</Text></Descriptions.Item>
          <Descriptions.Item label="Interest Rate">{formatRate(summary?.interest_rate ?? 0)}</Descriptions.Item>
          <Descriptions.Item label="Monthly Payout"><Text strong>{formatCurrency(summary?.monthly_payout ?? 0)}</Text></Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab} className="investor-tabs" tabBarGutter={24} items={[
        {
          key: 'statement',
          label: 'Statement',
          children: (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <DatePicker.RangePicker
                  value={stmtRange}
                  onChange={(dates) => setStmtRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                  allowClear
                  style={{ minWidth: 260 }}
                  placeholder={['From', 'To']}
                />
                <Button icon={<FilePdfOutlined />} onClick={exportStatementPdf} disabled={!stmtData} style={{ borderRadius: 6 }}>
                  Export PDF
                </Button>
              </div>

              {stmtLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
              ) : stmtData ? (
                <>
                  {/* Summary Cards */}
                  <div className="stmt-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Total Invested', value: stmtData.totals.total_invested, color: '#1677ff' },
                      { label: 'Total Top-Ups', value: stmtData.totals.total_topups, color: '#722ed1' },
                      { label: 'Total Expected', value: stmtData.totals.total_expected, color: '#1677ff' },
                      { label: 'Total Paid', value: stmtData.totals.total_paid, color: '#52c41a' },
                      { label: 'Balance', value: stmtData.totals.total_balance, color: stmtData.totals.total_balance > 0 ? '#ff4d4f' : '#52c41a' },
                    ].map((item) => (
                      <div key={item.label} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontSize: 11, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: item.color }}>{formatCurrency(item.value)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Contracts Summary */}
                  {stmtData.contracts?.length > 0 && (
                    <Card size="small" title="Contracts" style={{ marginBottom: 16 }}>
                      <Table
                        dataSource={stmtData.contracts}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        scroll={{ x: 600 }}
                        columns={[
                          { title: 'Contract ID', dataIndex: 'contract_id', key: 'cid', render: (v: string) => <Text strong>{v}</Text> },
                          { title: 'Invested', dataIndex: 'total_invested', key: 'inv', render: (v: number) => formatCurrency(v) },
                          { title: 'Rate', dataIndex: 'interest_rate', key: 'rate', render: (v: number) => formatRate(v) },
                          { title: 'Monthly Payout', dataIndex: 'monthly_payout', key: 'mp', render: (v: number) => formatCurrency(v) },
                          { title: 'Period', key: 'period', render: (_: unknown, r: any) => `${formatDate(r.start_date)} — ${formatDate(r.end_date)}` },
                          { title: 'Status', dataIndex: 'status', key: 'st', render: (s: string) => <Tag color={s === 'active' ? 'green' : s === 'completed' ? 'blue' : 'orange'}>{s.toUpperCase()}</Tag> },
                        ]}
                      />
                    </Card>
                  )}

                  {/* Top-Ups */}
                  {stmtData.transactions?.filter((tx: any) => tx.type === 'topup').length > 0 && (
                    <Card size="small" title="Top-Ups" style={{ marginBottom: 16 }}>
                      <Table
                        dataSource={stmtData.transactions.filter((tx: any) => tx.type === 'topup')}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        scroll={{ x: 500 }}
                        columns={[
                          { title: 'Date', dataIndex: 'date', key: 'date', render: (v: string) => formatDate(v) },
                          { title: 'Contract', key: 'contract', render: (_: unknown, r: any) => r.contract?.contract_id || '-' },
                          { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => <Text type="success" strong>{formatCurrency(v)}</Text> },
                          { title: 'Note', dataIndex: 'note', key: 'note', render: (v: string) => v || '-' },
                        ]}
                      />
                    </Card>
                  )}

                  {/* Payout Schedule (with payments embedded) */}
                  {stmtData.schedules?.length > 0 && (
                    <Card size="small" title="Payout Schedule" style={{ marginBottom: 16 }}>
                      <Table
                        dataSource={stmtData.schedules}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        scroll={{ x: 700 }}
                        expandable={{
                          expandedRowRender: (record: any) => {
                            const allocs = record.payment_allocations || [];
                            if (!allocs.length) return <Text type="secondary">No payments recorded for this period.</Text>;
                            return (
                              <Table dataSource={allocs} rowKey="id" pagination={false} size="small" columns={[
                                { title: 'Payment Date', key: 'dt', render: (_: unknown, a: PaymentAllocation) => a.payment?.payment_date ? formatDate(a.payment.payment_date) : '-' },
                                { title: 'Reference', key: 'ref', render: (_: unknown, a: PaymentAllocation) => a.payment?.reference || '-' },
                                { title: 'Amount Paid', key: 'amt', render: (_: unknown, a: PaymentAllocation) => <Text type="success">{formatCurrency(a.amount_allocated)}</Text> },
                                { title: 'Method', key: 'method', render: (_: unknown, a: PaymentAllocation) => a.payment?.method ? <Tag>{a.payment.method.toUpperCase()}</Tag> : '-' },
                              ]} />
                            );
                          },
                        }}
                        columns={[
                          { title: 'Due Date', dataIndex: 'due_date', key: 'dd', render: (v: string) => formatDate(v) },
                          { title: 'Contract', key: 'ct', render: (_: unknown, r: any) => r.contract?.contract_id || '-' },
                          { title: 'Expected', dataIndex: 'expected_amount', key: 'exp', render: (v: number) => formatCurrency(v) },
                          { title: 'Paid', dataIndex: 'paid_amount', key: 'pd', render: (v: number) => <Text type="success">{formatCurrency(v)}</Text> },
                          {
                            title: 'Balance', key: 'bal',
                            render: (_: unknown, r: any) => {
                              const bal = Number(r.expected_amount) - Number(r.paid_amount);
                              return <Text type={bal > 0 ? 'danger' : undefined}>{formatCurrency(bal)}</Text>;
                            },
                          },
                          {
                            title: 'Payments', key: 'pay_count',
                            render: (_: unknown, r: any) => {
                              const count = r.payment_allocations?.length || 0;
                              if (count === 0) return <Text type="secondary">-</Text>;
                              return <Tag color={r.status === 'partially_paid' ? 'orange' : 'green'}>{count} payment{count > 1 ? 's' : ''}</Tag>;
                            },
                          },
                          { title: 'Status', dataIndex: 'status', key: 'st', render: (s: string) => <Tag color={statusColor[s]}>{s.replace('_', ' ').toUpperCase()}</Tag> },
                        ]}
                        summary={() => {
                          const tExp = stmtData.schedules.reduce((s: number, r: any) => s + Number(r.expected_amount), 0);
                          const tPd = stmtData.schedules.reduce((s: number, r: any) => s + Number(r.paid_amount), 0);
                          const tBal = tExp - tPd;
                          return (
                            <Table.Summary fixed>
                              <Table.Summary.Row style={{ background: '#fafafa' }}>
                                <Table.Summary.Cell index={0} />
                                <Table.Summary.Cell index={1}><Text strong>Totals</Text></Table.Summary.Cell>
                                <Table.Summary.Cell index={2} />
                                <Table.Summary.Cell index={3}><Text strong>{formatCurrency(tExp)}</Text></Table.Summary.Cell>
                                <Table.Summary.Cell index={4}><Text strong type="success">{formatCurrency(tPd)}</Text></Table.Summary.Cell>
                                <Table.Summary.Cell index={5}><Text strong type={tBal > 0 ? 'danger' : undefined}>{formatCurrency(tBal)}</Text></Table.Summary.Cell>
                                <Table.Summary.Cell index={6} />
                                <Table.Summary.Cell index={7} />
                              </Table.Summary.Row>
                            </Table.Summary>
                          );
                        }}
                      />
                    </Card>
                  )}

                  {/* Commissions */}
                  {stmtData.commissions?.length > 0 && (
                    <Card size="small" title="Commissions" style={{ marginBottom: 16 }}>
                      <Table
                        dataSource={stmtData.commissions}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        scroll={{ x: 500 }}
                        columns={[
                          { title: 'Referred Investor', key: 'ref', render: (_: unknown, r: any) => r.referred ? `${r.referred.first_name} ${r.referred.second_name}` : '-' },
                          { title: 'Amount', dataIndex: 'commission_amount', key: 'amt', render: (v: number) => <Text type="success" strong>{formatCurrency(v)}</Text> },
                          { title: 'Payment Date', dataIndex: 'payment_date', key: 'dt', render: (v: string) => formatDate(v) },
                          { title: 'Status', dataIndex: 'status', key: 'st', render: (s: string) => <Tag color={s === 'paid' ? 'green' : 'gold'}>{s.toUpperCase()}</Tag> },
                        ]}
                      />
                    </Card>
                  )}
                </>
              ) : null}
            </>
          ),
        },
        {
          key: 'payment',
          label: 'Payments',
          children: <Table columns={paymentColumns} dataSource={paymentsData?.data} rowKey="id" size="small" scroll={{ x: 600 }} pagination={{ total: paymentsData?.total, pageSize: 15 }} />,
        },
        {
          key: 'contracts',
          label: <span><FileProtectOutlined /> Contracts</span>,
          children: (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewContractModal(true)}>
                  New Contract
                </Button>
              </div>
              <Table
                columns={[
                  {
                    title: 'Action', key: 'action', width: 70, fixed: 'left' as const,
                    render: (_: unknown, record: Contract) => (
                      <Button type="link" size="small" onClick={() => navigate(`/admin/contracts/${record.id}`)}>View</Button>
                    ),
                  },
                  { title: 'Contract ID', dataIndex: 'contract_id', key: 'contract_id', render: (v: string) => <strong>{v}</strong> },
                  { title: 'Invested', dataIndex: 'total_invested', key: 'total_invested', render: (v: number) => formatCurrency(v) },
                  { title: 'Rate', dataIndex: 'interest_rate', key: 'interest_rate', render: (v: number) => formatRate(v) },
                  { title: 'Monthly Payout', dataIndex: 'monthly_payout', key: 'monthly_payout', render: (v: number) => formatCurrency(v) },
                  { title: 'Start', dataIndex: 'start_date', key: 'start_date', render: (v: string) => formatDate(v) },
                  { title: 'End', dataIndex: 'end_date', key: 'end_date', render: (v: string) => formatDate(v) },
                  {
                    title: 'Status', dataIndex: 'status', key: 'status',
                    render: (s: string) => <Tag color={s === 'active' ? 'green' : s === 'completed' ? 'blue' : s === 'deactivated' ? 'orange' : 'red'}>{s.toUpperCase()}</Tag>,
                  },
                ]}
                dataSource={contractsData || []}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 700 }}
                locale={{ emptyText: 'No contracts yet' }}
              />
            </>
          ),
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
                parser={v => v!.replace(/,/g, '') as unknown as 0.01}
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
            <Form.Item name="next_of_kin_relationship" label="Relationship">
              <Select placeholder="Select relationship" allowClear options={[
                { value: 'Spouse', label: 'Spouse' },
                { value: 'Parent', label: 'Parent' },
                { value: 'Child', label: 'Child' },
                { value: 'Sibling', label: 'Sibling' },
                { value: 'Guardian', label: 'Guardian' },
                { value: 'Friend', label: 'Friend' },
                { value: 'Other', label: 'Other' },
              ]} />
            </Form.Item>
            <Form.Item name="bank_name" label="Bank Name"><Input /></Form.Item>
            <Form.Item name="bank_account" label="Account Number"><Input /></Form.Item>
            <Form.Item name="bank_branch" label="Branch"><Input /></Form.Item>
          </div>
        </Form>
      </Modal>

      {/* New Contract Modal */}
      <Modal
        title="Create New Contract"
        open={newContractModal}
        onCancel={() => setNewContractModal(false)}
        onOk={() => newContractForm.submit()}
        confirmLoading={newContractMutation.isPending}
        okText="Create Contract"
      >
        <div style={{ marginBottom: 16, padding: 12, background: '#f0f5ff', borderRadius: 8, fontSize: 13 }}>
          This creates a new parallel contract for <strong>{investor.first_name} {investor.second_name}</strong>.
          It will run alongside any existing active contracts.
        </div>
        <Form form={newContractForm} layout="vertical" onFinish={(values) => {
          newContractMutation.mutate({
            amount: values.amount,
            start_date: values.start_date?.format('YYYY-MM-DD'),
            custom_interest_rate: values.custom_interest_rate,
          });
        }}>
          <Form.Item name="amount" label="Investment Amount (KES)" rules={[{ required: true, message: 'Enter amount' }, { type: 'number', min: 50000, message: 'Minimum KES 50,000' }]}>
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              placeholder="0.00"
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => Number(v!.replace(/,/g, ''))}
            />
          </Form.Item>
          <Form.Item name="start_date" label="Start Date">
            <DatePicker style={{ width: '100%' }} placeholder="Defaults to today" />
          </Form.Item>
          <Form.Item name="custom_interest_rate" label="Custom Interest Rate (%)" extra="Leave blank for auto-calculated rate based on amount">
            <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.01} placeholder="Auto" />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        @media (max-width: 992px) {
          .stmt-summary-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .stmt-summary-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .referral-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .edit-modal-grid { grid-template-columns: 1fr !important; }
          .pay-modal-form-row { grid-template-columns: 1fr !important; }
          .investor-tabs > .ant-tabs-nav { margin-bottom: 12px !important; }
          .investor-tabs .ant-tabs-nav-list {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 4px 0 !important;
            row-gap: 6px !important;
          }
          .investor-tabs .ant-tabs-tab {
            padding: 6px 14px !important;
            margin: 0 4px 0 0 !important;
            font-size: 13px !important;
            border: 1px solid #d9d9d9 !important;
            border-radius: 6px !important;
            background: #fafafa !important;
          }
          .investor-tabs .ant-tabs-tab-active {
            background: #e6f4ff !important;
            border-color: #1677ff !important;
          }
          .investor-tabs .ant-tabs-ink-bar { display: none !important; }
          .investor-tabs .ant-tabs-nav::before { display: none !important; }
        }
        @media (max-width: 576px) {
          .stmt-summary-grid { grid-template-columns: 1fr !important; }
          .referral-stats-grid { grid-template-columns: 1fr !important; }
          .investor-tabs .ant-tabs-tab {
            padding: 5px 10px !important;
            font-size: 12px !important;
          }
          .ant-descriptions-item-label { font-size: 12px !important; }
          .ant-descriptions-item-content { font-size: 12px !important; }
          .ant-table { font-size: 12px !important; }
        }
      `}</style>
    </div>
  );
};

export default InvestorDetailPage;
