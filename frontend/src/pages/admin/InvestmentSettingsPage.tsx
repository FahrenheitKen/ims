import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Switch,
  Space, Popconfirm, message, Typography, Tag, Card,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInvestmentPackages, createInvestmentPackage,
  updateInvestmentPackage, deleteInvestmentPackage,
} from '../../api/admin';

interface InvestmentPackage {
  id: number;
  name: string;
  min_amount: number;
  max_amount: number | null;
  interest_rate: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

const { Title, Text } = Typography;

const fmtKES = (v: number) => `KES ${Number(v).toLocaleString('en-KE')}`;

const InvestmentSettingsPage: React.FC = () => {
  const [modal, setModal] = useState<{ open: boolean; editing: InvestmentPackage | null }>({
    open: false, editing: null,
  });
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: packages, isLoading } = useQuery({
    queryKey: ['investment-packages-admin'],
    queryFn: () => getInvestmentPackages().then(r => r.data),
  });

  const openAdd = () => {
    setModal({ open: true, editing: null });
    form.resetFields();
    form.setFieldsValue({
      is_active: true,
      sort_order: (packages?.length ?? 0) + 1,
      features: ['Monthly interest payouts', '12-month contract', 'Investor portal access'],
    });
  };

  const openEdit = (pkg: InvestmentPackage) => {
    setModal({ open: true, editing: pkg });
    form.setFieldsValue({
      name: pkg.name,
      min_amount: pkg.min_amount,
      max_amount: pkg.max_amount ?? undefined,
      interest_rate: parseFloat((Number(pkg.interest_rate) * 100).toFixed(4)),
      features: pkg.features || [],
      is_active: pkg.is_active,
      sort_order: pkg.sort_order,
    });
  };

  const closeModal = () => {
    setModal({ open: false, editing: null });
    form.resetFields();
  };

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      modal.editing
        ? updateInvestmentPackage(modal.editing.id, values)
        : createInvestmentPackage(values),
    onSuccess: () => {
      message.success(modal.editing ? 'Package updated' : 'Package created');
      queryClient.invalidateQueries({ queryKey: ['investment-packages-admin'] });
      closeModal();
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteInvestmentPackage(id),
    onSuccess: () => {
      message.success('Package deleted');
      queryClient.invalidateQueries({ queryKey: ['investment-packages-admin'] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Failed to delete'),
  });

  const handleSubmit = async () => {
    const values = await form.validateFields();
    saveMutation.mutate(values);
  };

  const columns = [
    { title: '#', dataIndex: 'sort_order', key: 'sort_order', width: 50 },
    {
      title: 'Package',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, r: InvestmentPackage) => (
        <div>
          <Text strong>{v}</Text>
          {!r.is_active && <Tag style={{ marginLeft: 8 }} color="default">Inactive</Tag>}
        </div>
      ),
    },
    {
      title: 'Min Amount',
      dataIndex: 'min_amount',
      key: 'min_amount',
      render: (v: number) => fmtKES(v),
    },
    {
      title: 'Max Amount',
      dataIndex: 'max_amount',
      key: 'max_amount',
      render: (v: number | null) =>
        v != null ? fmtKES(v) : <Text type="secondary">No limit</Text>,
    },
    {
      title: 'Monthly Rate',
      dataIndex: 'interest_rate',
      key: 'interest_rate',
      render: (v: number) => (
        <Tag color="blue" style={{ fontWeight: 700, fontSize: 13 }}>
          {(Number(v) * 100).toFixed(2)}%
        </Tag>
      ),
    },
    {
      title: 'Features',
      dataIndex: 'features',
      key: 'features',
      render: (v: string[]) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {(v || []).map((f, i) => (
            <span key={i} style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckOutlined style={{ color: '#22c55e', fontSize: 10 }} /> {f}
            </span>
          ))}
        </div>
      ),
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      render: (_: unknown, record: InvestmentPackage) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Delete this package?"
            description="This affects rate selection for future contracts."
            onConfirm={() => deleteMutation.mutate(record.id)}
            okButtonProps={{ danger: true }}
            okText="Delete"
          >
            <Button type="text" icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="investment-settings-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Investment Settings</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Manage investment packages. Rate changes apply to future contracts only.
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          New Package
        </Button>
      </div>

      <Card>
        <Table
          dataSource={packages || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        open={modal.open}
        title={modal.editing ? `Edit Package — ${modal.editing.name}` : 'New Investment Package'}
        onCancel={closeModal}
        onOk={handleSubmit}
        okText={modal.editing ? 'Save Changes' : 'Create Package'}
        confirmLoading={saveMutation.isPending}
        width={620}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div className="investment-pkg-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="name" label="Package Name" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="e.g. Starter" />
            </Form.Item>
            <Form.Item name="sort_order" label="Display Order">
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
            <Form.Item name="min_amount" label="Min Amount (KES)" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={10000}
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => Number(v!.replace(/,/g, ''))}
              />
            </Form.Item>
            <Form.Item
              name="max_amount"
              label="Max Amount (KES)"
              extra="Leave blank for no upper limit"
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={10000}
                formatter={v => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                parser={v => Number(v!.replace(/,/g, ''))}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="interest_rate"
            label="Monthly Interest Rate (%)"
            rules={[
              { required: true, message: 'Required' },
              { type: 'number', min: 0, max: 100, message: 'Must be between 0–100' },
            ]}
            extra="e.g. enter 17.5 for 17.5% monthly returns"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              step={0.01}
              precision={4}
              addonAfter="%"
            />
          </Form.Item>

          <Form.Item label="Features">
            <Form.List name="features">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        name={name}
                        rules={[{ required: true, message: 'Enter feature text' }]}
                        style={{ margin: 0, flex: 1 }}
                      >
                        <Input placeholder="Feature description" style={{ width: '100%', minWidth: 0 }} />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      />
                    </Space>
                  ))}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add('')}
                    style={{ width: '100%' }}
                  >
                    Add Feature
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item name="is_active" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        @media (max-width: 768px) {
          .investment-settings-header {
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }
        @media (max-width: 576px) {
          .investment-pkg-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default InvestmentSettingsPage;
