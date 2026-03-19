import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Upload, message, Typography, Avatar, Spin } from 'antd';
import { SettingOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { updateSettings } from '../../api/admin';
import { useSettings } from '../../contexts/SettingsContext';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text } = Typography;

const SettingsPage: React.FC = () => {
  const { appName, logoUrl, loading, refresh } = useSettings();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  useEffect(() => {
    form.setFieldsValue({ app_name: appName });
    setPreviewUrl(logoUrl);
    setRemoveLogo(false);
    setFileList([]);
  }, [appName, logoUrl, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const formData = new FormData();
      formData.append('app_name', values.app_name);

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

  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
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
    </div>
  );
};

export default SettingsPage;
