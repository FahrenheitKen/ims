import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Upload, message, Typography, Avatar, Spin, InputNumber } from 'antd';
import { SettingOutlined, UploadOutlined, DeleteOutlined, WhatsAppOutlined, GiftOutlined } from '@ant-design/icons';
import { updateSettings, updateCommissionSettings } from '../../api/admin';
import { useSettings } from '../../contexts/SettingsContext';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text } = Typography;

const SettingsPage: React.FC = () => {
  const { appName, logoUrl, whatsappNumber, commissionRate, loading, refresh } = useSettings();
  const [form] = Form.useForm();
  const [commissionForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [savingCommission, setSavingCommission] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  useEffect(() => {
    form.setFieldsValue({ app_name: appName, whatsapp_number: whatsappNumber });
    setPreviewUrl(logoUrl);
    setRemoveLogo(false);
    setFileList([]);
  }, [appName, logoUrl, whatsappNumber, form]);

  useEffect(() => {
    commissionForm.setFieldsValue({ commission_rate: commissionRate });
  }, [commissionRate, commissionForm]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const formData = new FormData();
      formData.append('app_name', values.app_name);
      formData.append('whatsapp_number', values.whatsapp_number || '');

      if (removeLogo) {
        formData.append('remove_logo', '1');
      } else if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('app_logo', fileList[0].originFileObj);
      }

      await updateSettings(formData);
      message.success('Settings updated successfully');
      await refresh();
    } catch {
      message.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLogo = () => {
    setRemoveLogo(true);
    setPreviewUrl(null);
    setFileList([]);
  };

  const handleSaveCommission = async () => {
    try {
      const values = await commissionForm.validateFields();
      setSavingCommission(true);
      await updateCommissionSettings(values.commission_rate);
      message.success('Commission rate updated. Applies to future commissions only.');
      await refresh();
    } catch {
      message.error('Failed to update commission rate');
    } finally {
      setSavingCommission(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 4px' }}>
      <div style={{ marginBottom: 28 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Settings</Title>
        <Text type="secondary" style={{ fontSize: 13 }}>Manage your application settings</Text>
      </div>

      <Card
        style={{ borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        styles={{ header: { borderBottom: '1px solid #f1f5f9', padding: '20px 24px' }, body: { padding: 24 } }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontSize: 18 }}>
              <SettingOutlined />
            </div>
            <div>
              <Text strong style={{ fontSize: 16 }}>General Settings</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>App name and branding</Text>
            </div>
          </div>
        }
      >
        <Form form={form} layout="vertical" style={{ maxWidth: 480 }}>
          {/* Logo Section */}
          <div style={{ marginBottom: 32 }}>
            <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>App Logo</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 16,
                  background: previewUrl ? '#fff' : '#f1f5f9',
                  border: '2px dashed #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                ) : (
                  <Avatar size={48} style={{ background: '#6366f1', fontSize: 20, fontWeight: 700 }}>
                    {appName.charAt(0)}
                  </Avatar>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Upload
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  maxCount={1}
                  fileList={fileList}
                  beforeUpload={(file) => {
                    const isValid = file.size / 1024 / 1024 < 2;
                    if (!isValid) {
                      message.error('Logo must be less than 2MB');
                      return Upload.LIST_IGNORE;
                    }
                    setFileList([file as unknown as UploadFile]);
                    setPreviewUrl(URL.createObjectURL(file));
                    setRemoveLogo(false);
                    return false;
                  }}
                  onRemove={() => {
                    setFileList([]);
                    setPreviewUrl(logoUrl);
                    setRemoveLogo(false);
                  }}
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />} size="small">
                    Upload Logo
                  </Button>
                </Upload>
                {(previewUrl || logoUrl) && (
                  <Button
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                    type="text"
                    onClick={handleRemoveLogo}
                  >
                    Remove Logo
                  </Button>
                )}
                <Text type="secondary" style={{ fontSize: 11 }}>
                  PNG, JPG, SVG or WebP. Max 2MB.
                </Text>
              </div>
            </div>
          </div>

          {/* App Name */}
          <Form.Item
            name="app_name"
            label={<Text strong>App Name</Text>}
            rules={[{ required: true, message: 'App name is required' }]}
          >
            <Input size="large" placeholder="e.g. KAP IMS" />
          </Form.Item>

          {/* WhatsApp Number */}
          <Form.Item
            name="whatsapp_number"
            label={<Text strong><WhatsAppOutlined style={{ color: '#25d366', marginRight: 6 }} />WhatsApp Number</Text>}
            extra="Include country code, e.g. 254712345678. This enables the WhatsApp chat button on the landing page."
          >
            <Input size="large" placeholder="e.g. 254712345678" />
          </Form.Item>

          <Button
            type="primary"
            size="large"
            onClick={handleSave}
            loading={saving}
            style={{ borderRadius: 8, marginTop: 8 }}
          >
            Save Settings
          </Button>
        </Form>
      </Card>

      {/* Commission Settings */}
      <Card
        style={{ borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginTop: 24 }}
        styles={{ header: { borderBottom: '1px solid #f1f5f9', padding: '20px 24px' }, body: { padding: 24 } }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', fontSize: 18 }}>
              <GiftOutlined />
            </div>
            <div>
              <Text strong style={{ fontSize: 16 }}>Commission Settings</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>Referral commission rate for approved investors</Text>
            </div>
          </div>
        }
      >
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
          Changes to the commission rate only apply to <strong>future commissions</strong>. Existing pending or paid commissions are not affected.
        </div>
        <Form form={commissionForm} layout="vertical" style={{ maxWidth: 360 }}>
          <Form.Item
            name="commission_rate"
            label={<Text strong>Commission Rate (%)</Text>}
            rules={[
              { required: true, message: 'Commission rate is required' },
              { type: 'number', min: 0, max: 100, message: 'Must be between 0 and 100' },
            ]}
            extra="Percentage of the referred investor's total annual payout. e.g. 1 = 1%"
          >
            <InputNumber
              size="large"
              min={0}
              max={100}
              step={0.5}
              precision={2}
              addonAfter="%"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Button
            type="primary"
            size="large"
            onClick={handleSaveCommission}
            loading={savingCommission}
            style={{ borderRadius: 8, marginTop: 8 }}
          >
            Save Commission Rate
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default SettingsPage;
