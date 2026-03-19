import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Drawer, theme } from 'antd';
import {
  DashboardOutlined,
  ScheduleOutlined,
  DollarOutlined,
  FileOutlined,
  GiftOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { investorLogout } from '../api/investor';

const { Header, Sider, Content, Footer } = Layout;

const InvestorLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();
  const location = useLocation();
  const { investorUser, setInvestorUser } = useAuth();
  const { appName, logoUrl } = useSettings();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await investorLogout();
    setInvestorUser(null);
    navigate('/investor/login');
  };

  const initials = `${investorUser?.first_name?.[0] || ''}${investorUser?.second_name?.[0] || ''}`;

  const menuItems = [
    { key: '/investor', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/investor/schedules', icon: <ScheduleOutlined />, label: 'Payment Schedule' },
    { key: '/investor/payments', icon: <DollarOutlined />, label: 'Payment History' },
    { key: '/investor/documents', icon: <FileOutlined />, label: 'Documents' },
    { key: '/investor/referrals', icon: <GiftOutlined />, label: 'Referrals' },
  ];

  const showExpanded = isMobile ? true : !collapsed;

  const siderContent = (
    <>
      {/* Logo / Branding */}
      <div style={{ padding: '20px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {logoUrl ? (
            <img src={logoUrl} alt={appName} style={{ height: 28, objectFit: 'contain', flexShrink: 0 }} />
          ) : null}
          {showExpanded && (
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
        {showExpanded && (
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>Investor Portal</div>
        )}
      </div>

      {/* Investor Avatar */}
      <div style={{ padding: showExpanded ? '12px 16px' : '12px 0', textAlign: 'center', marginBottom: 8 }}>
        <Avatar
          size={showExpanded ? 52 : 36}
          style={{ background: '#6366f1', fontSize: showExpanded ? 20 : 14, fontWeight: 700 }}
        >
          {initials}
        </Avatar>
        {showExpanded && (
          <div style={{ marginTop: 8 }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
              {investorUser?.first_name} {investorUser?.second_name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
              {investorUser?.investor_id}
            </div>
          </div>
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
        <Sider trigger={null} collapsible collapsed={collapsed} style={{ background: '#001529' }}>
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
                { key: 'profile', label: 'My Profile', icon: <SettingOutlined /> },
                { type: 'divider' },
                { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, danger: true },
              ],
              onClick: ({ key }) => {
                if (key === 'profile') navigate('/investor/profile');
                if (key === 'logout') handleLogout();
              },
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar size={32} style={{ background: '#6366f1', fontWeight: 600 }}>{initials}</Avatar>
              <span style={{ display: isMobile ? 'none' : 'inline' }}>{investorUser?.first_name} {investorUser?.second_name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: isMobile ? 8 : 16, padding: isMobile ? 12 : 24, background: colorBgContainer, borderRadius: borderRadiusLG, minHeight: 280 }}>
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center', padding: '12px 16px', color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
          All Rights Reserved by Samawati Capital Investment. Developed by Bluechange Technology.
        </Footer>
      </Layout>
    </Layout>
  );
};

export default InvestorLayout;
