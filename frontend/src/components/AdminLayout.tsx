import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Drawer, theme, Badge, Popover } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  FileProtectOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  UserAddOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  FundOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { adminLogout, getAdminNotifications } from '../api/admin';

const { Header, Sider, Content, Footer } = Layout;

const typeIcon: Record<string, React.ReactNode> = {
  investor_pending: <UserAddOutlined style={{ color: '#f59e0b' }} />,
  topup_pending: <RiseOutlined style={{ color: '#6366f1' }} />,
  new_contract_pending: <FileProtectOutlined style={{ color: '#059669' }} />,
};

const typeColor: Record<string, string> = {
  investor_pending: '#fef3c7',
  topup_pending: '#eef2ff',
  new_contract_pending: '#ecfdf5',
};

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [notifOpen, setNotifOpen] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>(
    location.pathname.startsWith('/admin/settings') ? ['settings-sub'] : []
  );
  const { adminUser, setAdminUser } = useAuth();
  const { appName, logoUrl } = useSettings();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: notifications } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => getAdminNotifications().then(r => r.data),
    refetchInterval: 30000,
    retry: false,
  });

  const totalNotifs = notifications?.total ?? 0;

  const handleLogout = async () => {
    await adminLogout();
    setAdminUser(null);
    navigate('/admin/login');
  };

  const menuItems = [
    { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/admin/investors', icon: <TeamOutlined />, label: 'Investors' },
    { key: '/admin/contracts', icon: <FileProtectOutlined />, label: 'Contracts' },
    { key: '/admin/reports', icon: <FileTextOutlined />, label: 'Reports' },
    {
      key: 'settings-sub',
      icon: <SettingOutlined />,
      label: 'Settings',
      children: [
        { key: '/admin/settings', icon: <AppstoreOutlined />, label: 'General' },
        { key: '/admin/settings/investment', icon: <FundOutlined />, label: 'Investment' },
      ],
    },
  ];

  const siderContent = (
    <>
      <div style={{ height: 40, margin: '16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden' }}>
        {logoUrl ? (
          <img src={logoUrl} alt={appName} style={{ height: 32, objectFit: 'contain', flexShrink: 0 }} />
        ) : null}
        {(!isMobile ? !collapsed : true) && (
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {appName}
          </span>
        )}
        {!isMobile && collapsed && !logoUrl && (
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
            {appName.split(' ').map((w: string) => w[0]).join('')}
          </span>
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        openKeys={openKeys}
        onOpenChange={keys => setOpenKeys(keys as string[])}
        items={menuItems}
        onClick={({ key }) => {
          if (key.startsWith('/admin')) {
            navigate(key);
            if (isMobile) setMobileOpen(false);
          }
        }}
      />
    </>
  );

  const notifContent = (
    <div style={{ width: isMobile ? 'calc(100vw - 48px)' : 340, maxWidth: 340, maxHeight: 400, overflowY: 'auto' }}>
      {totalNotifs === 0 ? (
        <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8' }}>
          <CheckCircleOutlined style={{ fontSize: 28, color: '#22c55e', marginBottom: 8, display: 'block' }} />
          <div style={{ fontSize: 13, fontWeight: 500 }}>All caught up!</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>No pending approvals</div>
        </div>
      ) : (
        notifications?.items?.map((item: { type: string; id: number; investor_id: number; label: string; sub_label: string }) => (
          <div
            key={`${item.type}_${item.id}`}
            onClick={() => { navigate(`/admin/investors/${item.investor_id}`); setNotifOpen(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 16px',
              cursor: 'pointer',
              background: typeColor[item.type] ?? '#f8fafc',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              transition: 'filter 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(0.96)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
              {typeIcon[item.type] ?? <BellOutlined style={{ color: '#6b7280' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
              {item.sub_label && (
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.sub_label}</div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider trigger={null} collapsible collapsed={collapsed}>
          {siderContent}
        </Sider>
      )}
      {isMobile && (
        <Drawer
          placement="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          width={250}
          styles={{ body: { padding: 0, background: '#001529' }, header: { display: 'none' } }}
        >
          {siderContent}
        </Drawer>
      )}
      <Layout>
        <Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            type="text"
            icon={isMobile ? <MenuOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            onClick={() => isMobile ? setMobileOpen(true) : setCollapsed(!collapsed)}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Popover
              content={notifContent}
              title={<span style={{ fontWeight: 600 }}>Pending Approvals</span>}
              trigger="click"
              open={notifOpen}
              onOpenChange={setNotifOpen}
              placement="bottomRight"
              styles={{ body: { padding: 0 } }}
            >
              <Badge count={totalNotifs} size="small" offset={[-2, 2]}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18, color: totalNotifs > 0 ? '#f59e0b' : undefined }} />}
                  style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </Badge>
            </Popover>

            <Dropdown
              menu={{
                items: [
                  { key: 'profile', label: 'My Profile', icon: <UserOutlined /> },
                  { type: 'divider' },
                  { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, danger: true },
                ],
                onClick: ({ key }) => {
                  if (key === 'profile') navigate('/admin/profile');
                  if (key === 'logout') handleLogout();
                },
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size={32} icon={<UserOutlined />} style={{ background: '#6366f1' }} />
                <span className="admin-username" style={{ display: isMobile ? 'none' : 'inline' }}>{adminUser?.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: isMobile ? 8 : 16, padding: isMobile ? 12 : 24, background: colorBgContainer, borderRadius: borderRadiusLG, minHeight: 280 }}>
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center', padding: '12px 16px', color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
          All Rights Reserved by Zig Capital Investment. Developed by Bluechange Technology.
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
