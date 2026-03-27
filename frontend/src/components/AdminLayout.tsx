import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Drawer, theme } from 'antd';
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
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { adminLogout } from '../api/admin';

const { Header, Sider, Content, Footer } = Layout;

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();
  const location = useLocation();
  const { adminUser, setAdminUser } = useAuth();
  const { appName, logoUrl } = useSettings();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    { key: '/admin/settings', icon: <SettingOutlined />, label: 'Settings' },
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
            {appName.split(' ').map(w => w[0]).join('')}
          </span>
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => { navigate(key); if (isMobile) setMobileOpen(false); }}
      />
    </>
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
