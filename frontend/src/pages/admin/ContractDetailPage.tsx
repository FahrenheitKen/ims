import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Button, Typography, Spin, Space, Modal, Form, InputNumber, Input, Select, DatePicker, message } from 'antd';
import { ArrowLeftOutlined, UserOutlined, DollarOutlined, PlusOutlined, FilePdfOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContract, createPayment, processTopUp, getPaymentSummary } from '../../api/admin';
import { formatCurrency, formatDate, formatRate } from '../../utils/format';
import type { PayoutSchedule, PaymentAllocation } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusColor: Record<string, string> = {
  pending: 'blue', paid: 'green', partially_paid: 'orange', overdue: 'red', paid_in_advance: 'cyan',
  active: 'green', completed: 'blue', deactivated: 'orange', closed: 'red',
};

const ContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const contractId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [payModal, setPayModal] = useState(false);
  const [topUpModal, setTopUpModal] = useState(false);
  const [payForm] = Form.useForm();
  const [topUpForm] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => getContract(contractId).then(r => r.data),
  });

  const contract = data?.contract;
  const summary = data?.summary;

  const { data: paymentSummary } = useQuery({
    queryKey: ['payment-summary-contract', contract?.investor_id, contractId],
    queryFn: () => getPaymentSummary(contract!.investor_id, contractId).then(r => r.data),
    enabled: payModal && !!contract,
  });

  const payMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => createPayment(contract!.investor_id, { ...values, contract_id: contractId }),
    onSuccess: () => {
      message.success('Payment recorded');
      setPayModal(false);
      payForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      queryClient.invalidateQueries({ queryKey: ['investor', contract?.investor_id] });
      queryClient.invalidateQueries({ queryKey: ['schedules', contract?.investor_id] });
      queryClient.invalidateQueries({ queryKey: ['payments', contract?.investor_id] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Payment failed'),
  });

  const topUpMutation = useMutation({
    mutationFn: (values: { amount: number; date?: string; note?: string }) =>
      processTopUp(contract!.investor_id, { ...values, contract_id: contractId } as any),
    onSuccess: () => {
      message.success('Top up processed');
      setTopUpModal(false);
      topUpForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      queryClient.invalidateQueries({ queryKey: ['investor', contract?.investor_id] });
      queryClient.invalidateQueries({ queryKey: ['schedules', contract?.investor_id] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Top up failed'),
  });

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!contract) return <Text>Contract not found</Text>;

  const schedules = contract.payout_schedules || [];

  const totalExpected = schedules.reduce((s: number, r: PayoutSchedule) => s + Number(r.expected_amount), 0);
  const totalPaid = schedules.reduce((s: number, r: PayoutSchedule) => s + Number(r.paid_amount), 0);
  const totalBalance = totalExpected - totalPaid;
  const today = dayjs().startOf('day');
  const totalDueToDate = schedules
    .filter((s: PayoutSchedule) => dayjs(s.due_date).isBefore(today) || dayjs(s.due_date).isSame(today, 'day'))
    .reduce((sum: number, s: PayoutSchedule) => sum + Math.max(0, Number(s.expected_amount) - Number(s.paid_amount)), 0);

  const investorName = contract.investor
    ? `${contract.investor.prefix || ''} ${contract.investor.first_name} ${contract.investor.second_name} ${contract.investor.last_name || ''}`.trim()
    : '';

  const exportLedgerPdf = () => {
    if (!schedules.length) return;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text('Contract Ledger', 14, 20);
    doc.setFontSize(10);
    doc.text(`Contract: ${contract.contract_id}`, 14, 28);
    doc.text(`Investor: ${investorName}${contract.investor ? ` (${contract.investor.investor_id})` : ''}`, 14, 34);
    doc.text(`Total Invested: ${formatCurrency(summary?.total_invested ?? 0)}  |  Rate: ${formatRate(summary?.interest_rate ?? 0)}  |  Monthly Payout: ${formatCurrency(summary?.monthly_payout ?? 0)}`, 14, 40);
    doc.text(`Period: ${formatDate(contract.start_date)} — ${formatDate(contract.end_date)}  |  Status: ${contract.status.toUpperCase()}`, 14, 46);

    // Table
    const tableBody: (string | number)[][] = [];
    schedules.forEach((s: PayoutSchedule, i: number) => {
      const allocations = s.payment_allocations || [];
      tableBody.push([
        i + 1,
        formatDate(s.due_date),
        formatCurrency(s.expected_amount),
        formatCurrency(s.paid_amount),
        formatCurrency(Number(s.expected_amount) - Number(s.paid_amount)),
        allocations.length === 0 ? '-' : '',
        allocations.length === 0 ? '-' : '',
        allocations.length === 0 ? '-' : '',
        s.status.replace('_', ' ').toUpperCase(),
      ]);
      allocations.forEach((a) => {
        tableBody.push([
          '', '', '', '', '',
          a.payment?.payment_date ? formatDate(a.payment.payment_date) : '-',
          a.payment?.reference || '-',
          formatCurrency(a.amount_allocated),
          '',
        ]);
      });
    });

    // Totals row
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
        if (data.section === 'body' && data.row.raw && Array.isArray(data.row.raw) && data.row.raw[0] === '') {
          data.cell.styles.fillColor = [245, 245, 245];
          data.cell.styles.fontStyle = 'italic';
          data.cell.styles.fontSize = 7;
        }
        const lastRowIndex = tableBody.length - 1;
        if (data.section === 'body' && data.row.index === lastRowIndex) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Generated on ${dayjs().format('DD MMM YYYY, HH:mm')}`, 14, doc.internal.pageSize.height - 10);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }

    doc.save(`ledger-${contract.contract_id}.pdf`);
  };

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
    if (allocations.length === 0) return <Text type="secondary">No payment allocations</Text>;
    return (
      <Table
        dataSource={allocations}
        rowKey="id"
        pagination={false}
        size="small"
        columns={[
          { title: 'Payment Date', key: 'date', render: (_: unknown, a: PaymentAllocation) => a.payment?.payment_date ? formatDate(a.payment.payment_date) : '-' },
          { title: 'Reference', key: 'ref', render: (_: unknown, a: PaymentAllocation) => a.payment?.reference || '-' },
          { title: 'Amount Allocated', dataIndex: 'amount_allocated', key: 'amount', render: (v: number) => formatCurrency(v) },
        ]}
      />
    );
  };

  return (
    <div>
      <div className="contract-header-actions" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/contracts')}>Back</Button>
          <Button icon={<UserOutlined />} onClick={() => navigate(`/admin/investors/${contract.investor_id}`)}>
            View Investor
          </Button>
        </Space>
        <Space wrap>
          <Button icon={<FilePdfOutlined />} onClick={exportLedgerPdf}>Export Ledger PDF</Button>
          <Button icon={<PlusOutlined />} onClick={() => setTopUpModal(true)}>Top Up</Button>
          <Button type="primary" icon={<DollarOutlined />} onClick={() => { payForm.setFieldValue('payment_date', dayjs()); setPayModal(true); }}>Record Payment</Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Contract: {contract.contract_id}
          <Tag color={statusColor[contract.status] || 'default'} style={{ marginLeft: 12 }}>
            {contract.status.toUpperCase()}
          </Tag>
        </Title>
        {contract.investor && (
          <Text type="secondary">
            {contract.investor.prefix ? contract.investor.prefix + ' ' : ''}
            {contract.investor.first_name} {contract.investor.second_name}
            {contract.investor.last_name ? ' ' + contract.investor.last_name : ''}
            {' '}({contract.investor.investor_id})
          </Text>
        )}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small" bordered>
          <Descriptions.Item label="Total Invested">{formatCurrency(summary?.total_invested ?? 0)}</Descriptions.Item>
          <Descriptions.Item label="Interest Rate">{formatRate(summary?.interest_rate ?? 0)}</Descriptions.Item>
          <Descriptions.Item label="Monthly Payout">{formatCurrency(summary?.monthly_payout ?? 0)}</Descriptions.Item>
          <Descriptions.Item label="Start Date">{formatDate(contract.start_date)}</Descriptions.Item>
          <Descriptions.Item label="End Date">{formatDate(contract.end_date)}</Descriptions.Item>
          <Descriptions.Item label="Remaining Months">{summary?.remaining_months ?? 0}</Descriptions.Item>
          <Descriptions.Item label="Total Expected">{formatCurrency(summary?.total_expected ?? 0)}</Descriptions.Item>
          <Descriptions.Item label="Total Paid"><span style={{ color: '#52c41a' }}>{formatCurrency(summary?.total_paid ?? 0)}</span></Descriptions.Item>
          <Descriptions.Item label="Total Overdue"><span style={{ color: '#ff4d4f' }}>{formatCurrency(summary?.total_overdue ?? 0)}</span></Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Payout Schedule" style={{ marginTop: 16 }}>
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

      {/* Record Payment Modal */}
      <Modal
        open={payModal}
        onCancel={() => setPayModal(false)}
        width={640}
        closable={false}
        footer={null}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '24px 28px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Record Payment</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
                Contract: {contract.contract_id}
              </div>
            </div>
            <Button type="text" onClick={() => setPayModal(false)} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, padding: '0 4px' }}>&times;</Button>
          </div>
          <div className="pay-modal-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18 }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Monthly Payout</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>{formatCurrency(paymentSummary?.monthly_payout ?? summary?.monthly_payout ?? 0)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Due to Date</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2, color: totalDueToDate > 0 ? '#fca5a5' : '#6ee7b7' }}>{formatCurrency(totalDueToDate)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Invested</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>{formatCurrency(summary?.total_invested ?? 0)}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 28px 20px' }}>
          <Form form={payForm} layout="vertical" initialValues={{ payment_date: dayjs() }} onFinish={(values) => {
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
                <DatePicker showTime style={{ width: '100%' }} size="large" defaultValue={dayjs()} />
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

        <div style={{ padding: '0 28px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button size="large" onClick={() => setPayModal(false)} style={{ borderRadius: 8, minWidth: 100 }}>Cancel</Button>
          <Button type="primary" size="large" onClick={() => payForm.submit()} loading={payMutation.isPending} style={{ borderRadius: 8, minWidth: 120, background: '#2563eb' }}>
            Save Payment
          </Button>
        </div>
      </Modal>

      {/* Top Up Modal */}
      <Modal title="Process Top Up" open={topUpModal} onCancel={() => setTopUpModal(false)} onOk={() => topUpForm.submit()} confirmLoading={topUpMutation.isPending}>
        <div style={{ marginBottom: 16, padding: 12, background: '#f0f5ff', borderRadius: 8, fontSize: 13 }}>
          Top up for contract <strong>{contract.contract_id}</strong>. Current invested: <strong>{formatCurrency(Number(contract.total_invested))}</strong>
        </div>
        <Form form={topUpForm} layout="vertical" onFinish={(values) => {
          topUpMutation.mutate({ ...values, date: values.date?.format('YYYY-MM-DD') });
        }}>
          <Form.Item name="amount" label="Top Up Amount (KES)" rules={[{ required: true }, { type: 'number', min: 50000, message: 'Minimum 50,000' }]}>
            <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v!.replace(/,/g, '') as unknown as number} />
          </Form.Item>
          <Form.Item name="date" label="Date"><DatePicker style={{ width: '100%' }} defaultValue={dayjs()} /></Form.Item>
          <Form.Item name="note" label="Note"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <style>{`
        @media (max-width: 768px) {
          .contract-header-actions {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .contract-header-actions .ant-space {
            flex-wrap: wrap !important;
          }
        }
        @media (max-width: 576px) {
          .pay-modal-summary { grid-template-columns: 1fr !important; gap: 8px !important; }
          .pay-modal-form-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default ContractDetailPage;
