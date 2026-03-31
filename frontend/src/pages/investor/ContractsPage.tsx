import React, { useState } from 'react';
import { Card, Table, Tag, Typography, Spin, Descriptions, Space, Button, Modal, Form, InputNumber, Input, message, Alert, Tooltip } from 'antd';
import { EyeOutlined, ArrowLeftOutlined, PlusCircleOutlined, ClockCircleOutlined, FileAddOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvestorPortalContracts, getInvestorPortalContract, requestContractTopup, getMyTopupRequests, requestNewContract, getMyNewContractRequests, getPublicInvestmentPackages } from '../../api/investor';
import { formatCurrency, formatDate, formatRate } from '../../utils/format';
import type { PayoutSchedule, PaymentAllocation, Contract, ContractTopupRequest, NewContractRequest } from '../../types';

const { Title, Text } = Typography;

const statusColor: Record<string, string> = {
  pending: 'blue', paid: 'green', partially_paid: 'orange', overdue: 'red', paid_in_advance: 'cyan',
  active: 'green', completed: 'blue', deactivated: 'orange', closed: 'red',
  approved: 'green', rejected: 'red',
};

const InvestorContractsPage: React.FC = () => {
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [topupModal, setTopupModal] = useState<{ open: boolean; contractId: number | null; contractLabel: string }>({
    open: false, contractId: null, contractLabel: '',
  });
  const [newContractModalOpen, setNewContractModalOpen] = useState(false);
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);
  const [submittedAmount, setSubmittedAmount] = useState(0);
  const [paymentDetailsType, setPaymentDetailsType] = useState<'topup' | 'new_contract'>('new_contract');
  const [topupForm] = Form.useForm();
  const [newContractForm] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['investor-portal-contracts'],
    queryFn: () => getInvestorPortalContracts().then(r => r.data),
  });

  const { data: rawPackages } = useQuery({
    queryKey: ['public-investment-packages'],
    queryFn: () => getPublicInvestmentPackages().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const activePackages: Array<{ min_amount: number; max_amount: number | null; interest_rate: number }> =
    Array.isArray(rawPackages)
      ? (rawPackages as any[]).filter(p => p.is_active).sort((a, b) => a.sort_order - b.sort_order)
      : [];

  const getRate = (amount: number): number => {
    if (activePackages.length === 0) {
      if (amount >= 500000) return 0.25;
      if (amount >= 150000) return 0.2308;
      return 0.175;
    }
    const sorted = [...activePackages].sort((a, b) => b.min_amount - a.min_amount);
    const match = sorted.find(p => amount >= p.min_amount && (p.max_amount == null || amount <= p.max_amount));
    return Number(match ? match.interest_rate : sorted[sorted.length - 1].interest_rate);
  };

  const { data: contractDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['investor-portal-contract', selectedContractId],
    queryFn: () => getInvestorPortalContract(selectedContractId!).then(r => r.data),
    enabled: !!selectedContractId,
  });

  const { data: topupRequests } = useQuery({
    queryKey: ['investor-topup-requests'],
    queryFn: () => getMyTopupRequests().then(r => r.data),
  });

  const { data: newContractRequests } = useQuery({
    queryKey: ['investor-new-contract-requests'],
    queryFn: () => getMyNewContractRequests().then(r => r.data),
  });

  const topupMutation = useMutation({
    mutationFn: (values: { amount: number; note?: string }) =>
      requestContractTopup(topupModal.contractId!, values),
    onSuccess: (_, variables) => {
      setSubmittedAmount(variables.amount);
      setPaymentDetailsType('topup');
      setTopupModal({ open: false, contractId: null, contractLabel: '' });
      topupForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['investor-topup-requests'] });
      setPaymentDetailsOpen(true);
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Failed to submit request'),
  });

  const newContractMutation = useMutation({
    mutationFn: (values: { amount: number; note?: string }) =>
      requestNewContract(values),
    onSuccess: (_, variables) => {
      setSubmittedAmount(variables.amount);
      setPaymentDetailsType('new_contract');
      setNewContractModalOpen(false);
      newContractForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['investor-new-contract-requests'] });
      setPaymentDetailsOpen(true);
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Failed to submit request'),
  });

  const openTopupModal = (contract: Contract) => {
    setTopupModal({ open: true, contractId: contract.id, contractLabel: contract.contract_id });
  };

  // Eligibility for new contract
  const now = new Date();
  const allContracts: Contract[] = contracts || [];
  const activeContracts = allContracts.filter(c => c.status === 'active');
  const hasNoActive = activeContracts.length === 0;
  const activeOver6Months = activeContracts.some(c => {
    const start = new Date(c.start_date);
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return diffMonths >= 6;
  });
  const canRequestNewContract = hasNoActive || activeOver6Months;
  const hasPendingNewContractRequest = (newContractRequests || []).some(
    (r: NewContractRequest) => r.status === 'pending'
  );

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

    const contractTopupReqs: ContractTopupRequest[] = (topupRequests || []).filter(
      (r: ContractTopupRequest) => r.contract_id === contract.id
    );

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => setSelectedContractId(null)}>
            Back to Contracts
          </Button>
          {contract.status === 'active' && (
            <Button type="primary" icon={<PlusCircleOutlined />} onClick={() => openTopupModal(contract)}>
              Top Up
            </Button>
          )}
        </div>

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

        {contractTopupReqs.length > 0 && (
          <Card title={<span><ClockCircleOutlined style={{ marginRight: 8 }} />Top-Up Requests</span>} style={{ marginBottom: 16 }}>
            <Table
              dataSource={contractTopupReqs}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: 'Date', dataIndex: 'created_at', key: 'created_at', render: (v: string) => formatDate(v) },
                { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => formatCurrency(v) },
                { title: 'Note', dataIndex: 'note', key: 'note', render: (v: string) => v || '-' },
                {
                  title: 'Status', dataIndex: 'status', key: 'status',
                  render: (s: string) => <Tag color={statusColor[s] || 'default'}>{s.toUpperCase()}</Tag>,
                },
                { title: 'Admin Note', dataIndex: 'admin_note', key: 'admin_note', render: (v: string) => v || '-' },
              ]}
            />
          </Card>
        )}

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

        <TopupModal
          open={topupModal.open}
          contractLabel={topupModal.contractLabel}
          form={topupForm}
          loading={topupMutation.isPending}
          onCancel={() => { setTopupModal({ open: false, contractId: null, contractLabel: '' }); topupForm.resetFields(); }}
          onSubmit={(values) => topupMutation.mutate(values)}
        />

        <PaymentDetailsModal
          open={paymentDetailsOpen}
          amount={submittedAmount}
          requestType={paymentDetailsType}
          onClose={() => setPaymentDetailsOpen(false)}
        />
      </div>
    );
  }

  // Contracts list view
  const pendingRequests: ContractTopupRequest[] = (topupRequests || []).filter(
    (r: ContractTopupRequest) => r.status === 'pending'
  );

  const listColumns = [
    {
      title: 'Action', key: 'action', width: 80,
      render: (_: unknown, r: Contract) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setSelectedContractId(r.id)}>View</Button>
      ),
    },
    { title: 'Contract ID', dataIndex: 'contract_id', key: 'contract_id', render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Invested', dataIndex: 'total_invested', key: 'total_invested', render: (v: number) => formatCurrency(v) },
    { title: 'Rate', dataIndex: 'interest_rate', key: 'interest_rate', render: (v: number) => formatRate(v) },
    { title: 'Monthly Payout', dataIndex: 'monthly_payout', key: 'monthly_payout', render: (v: number) => formatCurrency(v) },
    { title: 'Period', key: 'period', render: (_: unknown, r: Contract) => `${formatDate(r.start_date)} — ${formatDate(r.end_date)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor[s] || 'default'}>{s.toUpperCase()}</Tag> },
  ];

  const newContractDisabledReason = hasPendingNewContractRequest
    ? 'You already have a pending new contract request'
    : !canRequestNewContract
    ? 'You can only request a new contract if you have no active contract or your active contract is at least 6 months old'
    : undefined;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Title level={3} style={{ margin: 0 }}>My Contracts</Title>
        <Tooltip title={newContractDisabledReason}>
          <Button
            type="primary"
            icon={<FileAddOutlined />}
            disabled={!canRequestNewContract || hasPendingNewContractRequest}
            onClick={() => setNewContractModalOpen(true)}
          >
            New Contract
          </Button>
        </Tooltip>
      </div>

      {pendingRequests.length > 0 && (
        <Alert
          type="info"
          icon={<ClockCircleOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
          message={`You have ${pendingRequests.length} pending top-up request${pendingRequests.length > 1 ? 's' : ''} awaiting admin approval.`}
        />
      )}

      {hasPendingNewContractRequest && (
        <Alert
          type="warning"
          icon={<FileAddOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
          message="Your new contract request is pending approval."
        />
      )}

      <Table
        columns={listColumns}
        dataSource={contracts}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        scroll={{ x: 700 }}
      />

      {(newContractRequests || []).length > 0 && (
        <Card title={<span><FileAddOutlined style={{ marginRight: 8 }} />New Contract Requests</span>} style={{ marginTop: 24 }}>
          <Table
            dataSource={newContractRequests}
            rowKey="id"
            pagination={false}
            size="small"
            columns={[
              { title: 'Date', dataIndex: 'created_at', key: 'created_at', render: (v: string) => formatDate(v) },
              { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => formatCurrency(v) },
              { title: 'Proposed Start', dataIndex: 'proposed_start_date', key: 'proposed_start_date', render: (v: string) => v ? formatDate(v) : '-' },
              { title: 'Note', dataIndex: 'note', key: 'note', render: (v: string) => v || '-' },
              {
                title: 'Status', dataIndex: 'status', key: 'status',
                render: (s: string) => <Tag color={statusColor[s] || 'default'}>{s.toUpperCase()}</Tag>,
              },
              { title: 'Admin Note', dataIndex: 'admin_note', key: 'admin_note', render: (v: string) => v || '-' },
            ]}
          />
        </Card>
      )}

      <TopupModal
        open={topupModal.open}
        contractLabel={topupModal.contractLabel}
        form={topupForm}
        loading={topupMutation.isPending}
        onCancel={() => { setTopupModal({ open: false, contractId: null, contractLabel: '' }); topupForm.resetFields(); }}
        onSubmit={(values) => topupMutation.mutate(values)}
      />

      <NewContractModal
        open={newContractModalOpen}
        form={newContractForm}
        loading={newContractMutation.isPending}
        getRate={getRate}
        onCancel={() => { setNewContractModalOpen(false); newContractForm.resetFields(); }}
        onSubmit={(values) => newContractMutation.mutate(values)}
      />

      <PaymentDetailsModal
        open={paymentDetailsOpen}
        amount={submittedAmount}
        requestType={paymentDetailsType}
        onClose={() => setPaymentDetailsOpen(false)}
      />
    </div>
  );
};

interface TopupModalProps {
  open: boolean;
  contractLabel: string;
  form: any;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: { amount: number; note?: string }) => void;
}

const TopupModal: React.FC<TopupModalProps> = ({ open, contractLabel, form, loading, onCancel, onSubmit }) => (
  <Modal
    open={open}
    title={`Request Top-Up${contractLabel ? ` — ${contractLabel}` : ''}`}
    onCancel={onCancel}
    onOk={() => form.validateFields().then(onSubmit)}
    okText="Submit Request"
    confirmLoading={loading}
    destroyOnClose
  >
    <Alert
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
      message="Your top-up request will be reviewed by the admin before it takes effect. Minimum top-up amount is KES 30,000."
    />
    <Form form={form} layout="vertical">
      <Form.Item
        name="amount"
        label="Top-Up Amount (KES)"
        rules={[
          { required: true, message: 'Please enter an amount' },
          { type: 'number', min: 30000, message: 'Minimum top-up is KES 30,000' },
        ]}
      >
        <InputNumber
          style={{ width: '100%' }}
          min={30000}
          step={10000}
          formatter={v => `KES ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={v => Number(v!.replace(/KES\s?|(,*)/g, '')) as unknown as 30000}
          placeholder="e.g. 100,000"
        />
      </Form.Item>
      <Form.Item name="note" label="Note (optional)">
        <Input.TextArea rows={3} maxLength={500} placeholder="Any additional information..." />
      </Form.Item>
    </Form>
  </Modal>
);

interface NewContractModalProps {
  open: boolean;
  form: any;
  loading: boolean;
  getRate: (amount: number) => number;
  onCancel: () => void;
  onSubmit: (values: { amount: number; note?: string }) => void;
}

const MONTHS = 12;

const NewContractModal: React.FC<NewContractModalProps> = ({ open, form, loading, getRate, onCancel, onSubmit }) => {
  const amountValue: number | undefined = Form.useWatch('amount', form);
  const amount = amountValue && amountValue >= 50000 ? amountValue : 0;
  const rate = amount > 0 ? getRate(amount) : 0;
  const totalInterest = amount * rate * MONTHS;
  const monthlyPayout = amount > 0 ? (amount + totalInterest) / MONTHS : 0;
  const totalReturns = totalInterest;
  const totalValue = monthlyPayout * MONTHS;

  const fmtKES = (n: number) => 'KES ' + n.toLocaleString('en-KE', { maximumFractionDigits: 0 });

  return (
    <Modal
      open={open}
      title="Request New Contract"
      onCancel={onCancel}
      onOk={() => form.validateFields().then(onSubmit)}
      okText="Submit Request"
      confirmLoading={loading}
      destroyOnClose
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Your request will be reviewed by the admin. The contract start date will be set to the date of admin approval."
      />
      <Form form={form} layout="vertical">
        <Form.Item
          name="amount"
          label="Investment Amount (KES)"
          rules={[
            { required: true, message: 'Please enter an amount' },
            { type: 'number', min: 50000, message: 'Minimum investment is KES 50,000' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={50000}
            step={10000}
            formatter={v => `KES ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={v => Number(v!.replace(/KES\s?|(,*)/g, '')) as unknown as 50000}
            placeholder="e.g. 150,000"
          />
        </Form.Item>

        {amount > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #1a365d 0%, #1e40af 100%)',
            borderRadius: 14,
            padding: '20px 24px',
            marginBottom: 16,
            color: '#fff',
          }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 14 }}>
              Estimated Returns — 12-month contract
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: '1 1 110px' }}>
                <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 3 }}>Monthly Interest Rate</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{(rate * 100).toFixed(2)}%</div>
              </div>
              <div style={{ flex: '1 1 110px' }}>
                <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 3 }}>Monthly Payout</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{fmtKES(monthlyPayout)}</div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 14, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ flex: '1 1 90px' }}>
                <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 3 }}>Principal</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{fmtKES(amount)}</div>
              </div>
              <div style={{ flex: '1 1 90px' }}>
                <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 3 }}>Total Returns</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#6ee7b7' }}>{fmtKES(totalReturns)}</div>
              </div>
              <div style={{ flex: '1 1 90px' }}>
                <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 3 }}>Total Value</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fde68a' }}>{fmtKES(totalValue)}</div>
              </div>
            </div>
          </div>
        )}

        <Form.Item name="note" label="Note (optional)">
          <Input.TextArea rows={3} maxLength={500} placeholder="Any additional information..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const PaymentDetailsModal: React.FC<{ open: boolean; amount: number; requestType: 'topup' | 'new_contract'; onClose: () => void }> = ({ open, amount, requestType, onClose }) => (
  <Modal
    open={open}
    title={null}
    footer={null}
    onCancel={onClose}
    centered
    width={460}
  >
    {/* Success banner */}
    <div style={{
      background: 'linear-gradient(135deg, #065f46, #059669)',
      borderRadius: 12,
      padding: '24px 28px',
      textAlign: 'center',
      marginBottom: 24,
    }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
      <Text strong style={{ fontSize: 18, color: '#fff', display: 'block', marginBottom: 4 }}>
        Request Submitted!
      </Text>
      <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
        Your {requestType === 'topup' ? 'top-up request' : 'new contract request'} for{' '}
        <strong>KES {Number(amount).toLocaleString('en-KE')}</strong>{' '}
        is awaiting admin approval.
      </Text>
    </div>

    {/* M-Pesa payment details */}
    <Text strong style={{ fontSize: 15, color: '#1e293b', display: 'block', marginBottom: 6 }}>
      Send Your {requestType === 'topup' ? 'Top-Up' : 'Investment'} via M-Pesa
    </Text>
    <Text style={{ fontSize: 13, color: '#64748b', display: 'block', marginBottom: 16 }}>
      Make payment to the details below.{' '}
      {requestType === 'topup'
        ? 'Your top-up will take effect once the admin confirms receipt and approves your request.'
        : 'Your contract will start once the admin confirms receipt and approves your request.'}
    </Text>

    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
      <div style={{
        flex: '1 1 140px',
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: 12,
        padding: '16px 18px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>M-Pesa Paybill</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#065f46', letterSpacing: 2 }}>303030</div>
      </div>
      <div style={{
        flex: '1 1 140px',
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: 12,
        padding: '16px 18px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Account Number</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#065f46', letterSpacing: 2 }}>2043651148</div>
      </div>
    </div>

    <div style={{
      background: '#fffbeb',
      border: '1px solid #fde68a',
      borderRadius: 10,
      padding: '12px 16px',
      marginBottom: 24,
    }}>
      <Text style={{ fontSize: 13, color: '#92400e' }}>
        <strong>Important:</strong> Use your full name as the M-Pesa payment reference. Send exactly{' '}
        <strong>KES {Number(amount).toLocaleString('en-KE')}</strong>.
      </Text>
    </div>

    <Button type="primary" block size="large" onClick={onClose} style={{ borderRadius: 10, height: 46, fontWeight: 600 }}>
      Done
    </Button>
  </Modal>
);

export default InvestorContractsPage;
