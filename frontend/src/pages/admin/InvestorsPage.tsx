import React, { useState } from 'react';
import { Table, Button, Input, Space, Dropdown, Tag, Modal, Form, InputNumber, Select, Steps, DatePicker, message, Typography } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DownOutlined,
  ExportOutlined,
  DollarOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  BankOutlined,
  HeartOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getInvestors, createInvestor, deleteInvestor, deactivateInvestor, reactivateInvestor, approveInvestor, rejectInvestor } from '../../api/admin';
import { formatCurrency } from '../../utils/format';
import type { Investor } from '../../types';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const { Title } = Typography;

const InvestorsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['investors', search, status, page],
    queryFn: () => getInvestors({ search, status: status || undefined, page, per_page: 15 }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => createInvestor(values),
    onSuccess: () => {
      message.success('Investor created successfully');
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['investors'] });
    },
    onError: (err: any) => {
      const data = err.response?.data;
      if (data?.errors) {
        const firstError = Object.values(data.errors).flat()[0] as string;
        message.error(firstError || data.message || 'Validation failed');
      } else {
        message.error(data?.message || 'Error creating investor');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInvestor,
    onSuccess: () => {
      message.success('Investor deleted');
      queryClient.invalidateQueries({ queryKey: ['investors'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Cannot delete'),
  });

  const handleAction = (key: string, investor: Investor) => {
    switch (key) {
      case 'view': navigate(`/admin/investors/${investor.id}`); break;
      case 'pay': navigate(`/admin/investors/${investor.id}?tab=payment`); break;
      case 'edit': navigate(`/admin/investors/${investor.id}?tab=edit`); break;
      case 'delete':
        Modal.confirm({
          title: 'Delete investor?',
          content: 'This will soft-delete the investor record.',
          onOk: () => deleteMutation.mutate(investor.id),
        });
        break;
      case 'deactivate':
        deactivateInvestor(investor.id).then(() => {
          message.success('Investor deactivated');
          queryClient.invalidateQueries({ queryKey: ['investors'] });
        });
        break;
      case 'reactivate':
        reactivateInvestor(investor.id).then(() => {
          message.success('Investor reactivated');
          queryClient.invalidateQueries({ queryKey: ['investors'] });
        });
        break;
      case 'approve':
        Modal.confirm({
          title: 'Approve investor registration?',
          content: `This will activate ${investor.first_name} ${investor.second_name}'s account.`,
          okText: 'Approve',
          onOk: () => approveInvestor(investor.id).then(() => {
            message.success('Investor approved');
            queryClient.invalidateQueries({ queryKey: ['investors'] });
          }),
        });
        break;
      case 'reject':
        Modal.confirm({
          title: 'Reject investor registration?',
          content: `This will permanently delete ${investor.first_name} ${investor.second_name}'s registration.`,
          okText: 'Reject',
          okButtonProps: { danger: true },
          onOk: () => rejectInvestor(investor.id).then(() => {
            message.success('Investor rejected');
            queryClient.invalidateQueries({ queryKey: ['investors'] });
          }),
        });
        break;
    }
  };

  const exportToExcel = () => {
    if (!data?.data) return;
    const exportData = data.data.map(inv => ({
      'ID': inv.investor_id,
      'First Name': inv.first_name,
      'Last Name': inv.second_name,
      'Phone': inv.phone,
      'Email': inv.email,
      'Sum Invested': inv.total_invested,
      'Monthly Payout': inv.monthly_payout,
      'Status': inv.status,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Investors');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), 'investors.xlsx');
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'active': return 'green';
      case 'pending': return 'gold';
      case 'deactivated': return 'orange';
      case 'completed': return 'blue';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Investor) => {
        const isPending = record.status === 'pending';
        const items = isPending
          ? [
              { key: 'approve', label: 'Approve', icon: <CheckCircleOutlined style={{ color: '#16a34a' }} /> },
              { key: 'view', label: 'View', icon: <EyeOutlined style={{ color: '#2563eb' }} /> },
              { type: 'divider' as const },
              { key: 'reject', label: 'Reject', icon: <DeleteOutlined />, danger: true },
            ]
          : [
              { key: 'pay', label: 'Pay', icon: <DollarOutlined style={{ color: '#16a34a' }} /> },
              { key: 'view', label: 'View', icon: <EyeOutlined style={{ color: '#2563eb' }} /> },
              { key: 'edit', label: 'Edit', icon: <EditOutlined style={{ color: '#d97706' }} /> },
              { type: 'divider' as const },
              record.status === 'active'
                ? { key: 'deactivate', label: 'Deactivate', icon: <StopOutlined style={{ color: '#dc2626' }} /> }
                : { key: 'reactivate', label: 'Reactivate', icon: <CheckCircleOutlined style={{ color: '#16a34a' }} /> },
              { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true },
            ];
        return (
          <Dropdown menu={{
            items,
            onClick: ({ key }) => handleAction(key, record),
          }}>
            <Button type="primary" size="small" style={{ borderRadius: 6 }}>
              Actions <DownOutlined style={{ fontSize: 10 }} />
            </Button>
          </Dropdown>
        );
      },
    },
    { title: 'ID', dataIndex: 'investor_id', key: 'investor_id', width: 110 },
    { title: 'First Name', dataIndex: 'first_name', key: 'first_name' },
    { title: 'Last Name', dataIndex: 'second_name', key: 'second_name' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Sum Invested', dataIndex: 'total_invested', key: 'total_invested', render: (v: number) => formatCurrency(v) },
    { title: 'Monthly Payout', dataIndex: 'monthly_payout', key: 'monthly_payout', render: (v: number) => formatCurrency(v) },
    { title: 'Referred By', dataIndex: 'referred_by_code', key: 'referred_by_code', render: (v: string) => v ? <Tag color="purple">{v}</Tag> : '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor(s)}>{s.toUpperCase()}</Tag> },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Title level={3} style={{ margin: 0 }}>Investors</Title>
        <Space wrap>
          <Input placeholder="Search..." prefix={<SearchOutlined />} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} allowClear style={{ width: 200 }} />
          <Select placeholder="Status" value={status || undefined} onChange={v => { setStatus(v || ''); setPage(1); }} allowClear style={{ width: 130 }} options={[
            { value: 'pending', label: 'Pending' },
            { value: 'active', label: 'Active' },
            { value: 'deactivated', label: 'Deactivated' },
            { value: 'completed', label: 'Completed' },
            { value: 'closed', label: 'Closed' },
          ]} />
          <Button icon={<ExportOutlined />} onClick={exportToExcel}>Export</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} style={{ borderRadius: 6 }}>Add Investor</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          total: data?.total,
          pageSize: data?.per_page,
          onChange: setPage,
          showSizeChanger: false,
        }}
        scroll={{ x: 1100 }}
      />

      <Modal
        title="Add New Investor"
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); setCurrentStep(0); }}
        width={680}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button disabled={currentStep === 0} onClick={() => setCurrentStep(s => s - 1)}>
              Back
            </Button>
            <Space>
              <Button onClick={() => { setIsModalOpen(false); form.resetFields(); setCurrentStep(0); }}>
                Cancel
              </Button>
              {currentStep < 4 ? (
                <Button
                  type="primary"
                  onClick={() => {
                    const fieldsByStep: string[][] = [
                      ['prefix', 'first_name', 'second_name', 'last_name', 'id_number', 'email'],
                      ['phone', 'other_phone', 'address', 'city', 'country'],
                      ['next_of_kin_name', 'next_of_kin_phone'],
                      ['bank_name', 'bank_account', 'bank_branch', 'tax_id'],
                      ['initial_amount', 'start_date', 'custom_interest_rate'],
                    ];
                    form.validateFields(fieldsByStep[currentStep]).then(() => setCurrentStep(s => s + 1)).catch(() => {});
                  }}
                  style={{ borderRadius: 6 }}
                >
                  Next
                </Button>
              ) : (
                <Button type="primary" onClick={() => form.submit()} loading={createMutation.isPending} style={{ borderRadius: 6 }}>
                  Create Investor
                </Button>
              )}
            </Space>
          </div>
        }
      >
        <Steps
          current={currentStep}
          size="small"
          onChange={(step) => {
            if (step < currentStep) {
              setCurrentStep(step);
            } else {
              const fieldsByStep: string[][] = [
                ['prefix', 'first_name', 'second_name', 'last_name', 'id_number', 'email'],
                ['phone', 'other_phone', 'address', 'city', 'country'],
                ['next_of_kin_name', 'next_of_kin_phone'],
                ['bank_name', 'bank_account', 'bank_branch', 'tax_id'],
                ['initial_amount', 'start_date', 'custom_interest_rate'],
              ];
              form.validateFields(fieldsByStep[currentStep]).then(() => setCurrentStep(step)).catch(() => {});
            }
          }}
          style={{ marginBottom: 24 }}
          items={[
            { title: 'Personal', icon: <UserOutlined /> },
            { title: 'Contact', icon: <PhoneOutlined /> },
            { title: 'Next of Kin', icon: <HeartOutlined /> },
            { title: 'Banking', icon: <BankOutlined /> },
            { title: 'Investment', icon: <WalletOutlined /> },
          ]}
        />
        <Form form={form} layout="vertical" onFinish={(values) => {
          const payload = {
            ...values,
            start_date: values.start_date?.format('YYYY-MM-DD') || undefined,
            custom_interest_rate: values.custom_interest_rate || undefined,
          };
          createMutation.mutate(payload);
        }}>
          {/* Step 0: Personal Info */}
          <div style={{ display: currentStep === 0 ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="prefix" label="Prefix"><Input placeholder="Mr / Mrs / Dr" /></Form.Item>
            <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="second_name" label="Second Name" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="last_name" label="Last Name"><Input /></Form.Item>
            <Form.Item name="id_number" label="ID Number" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          </div>

          {/* Step 1: Contact & Address */}
          <div style={{ display: currentStep === 1 ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="phone" label="Phone Number" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="other_phone" label="Other Phone"><Input /></Form.Item>
            <Form.Item name="address" label="Address" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="city" label="City" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="country" label="Country" rules={[{ required: true }]}><Input /></Form.Item>
          </div>

          {/* Step 2: Next of Kin */}
          <div style={{ display: currentStep === 2 ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="next_of_kin_name" label="Full Name"><Input /></Form.Item>
            <Form.Item name="next_of_kin_phone" label="Phone Number"><Input /></Form.Item>
          </div>

          {/* Step 3: Banking */}
          <div style={{ display: currentStep === 3 ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="bank_name" label="Bank Name"><Input /></Form.Item>
            <Form.Item name="bank_account" label="Account Number"><Input /></Form.Item>
            <Form.Item name="bank_branch" label="Branch"><Input /></Form.Item>
            <Form.Item name="tax_id" label="Tax ID"><Input /></Form.Item>
          </div>

          {/* Step 4: Investment */}
          <div style={{ display: currentStep === 4 ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="initial_amount" label="Initial Investment Amount (Ksh)" rules={[{ required: true }, { type: 'number', min: 50000, message: 'Minimum KES 50,000' }]} style={{ gridColumn: '1 / -1' }}>
              <InputNumber style={{ width: '100%' }} size="large" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v!.replace(/,/g, '') as unknown as number} />
            </Form.Item>
            <Form.Item name="start_date" label="Contract Start Date" help="Leave blank to use today's date">
              <DatePicker style={{ width: '100%' }} size="large" />
            </Form.Item>
            <Form.Item name="custom_interest_rate" label="Custom Interest Rate (%)" help="Leave blank to use the default bracket rate">
              <InputNumber style={{ width: '100%' }} size="large" min={0} max={100} step={0.01} precision={2} placeholder="e.g. 23.08" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default InvestorsPage;
