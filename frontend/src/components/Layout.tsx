import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, theme, Button, Drawer, Dropdown, Avatar, Space } from 'antd';
import {
  DashboardOutlined,
  ExperimentOutlined,
  HeartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarChartOutlined,
  BugOutlined,
  CoffeeOutlined,
  MenuOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '系统首页' },
  { key: '/animals', icon: <BugOutlined />, label: '动物管理' },
  { key: '/health', icon: <HeartOutlined />, label: '健康记录' },
  { key: '/experiments', icon: <ExperimentOutlined />, label: '实验项目' },
  { key: '/feeding', icon: <CoffeeOutlined />, label: '饲养记录' },
  { key: '/statistics', icon: <BarChartOutlined />, label: '数据统计' },
];

interface MainLayoutProps {
  user?: { username: string; name: string; role: string } | null;
  onLogout?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleMenuClick = (key: string) => {
    navigate(key);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      navigate('/login');
    }
  };

  const userDropdownItems = {
    items: [
      {
        key: 'info',
        label: (
          <div style={{ padding: '4px 0' }}>
            <div style={{ fontWeight: 600 }}>{user?.name || user?.username}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {user?.role === 'admin' ? '系统管理员' : '普通用户'}
            </Text>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  const siderContent = (
    <>
      <div className="logo-container" style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>🐾</span>
          {!collapsed && (
            <span className="logo-text">动物管理系统</span>
          )}
        </div>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => handleMenuClick(key)}
        style={{ border: 'none', padding: '8px' }}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sider */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={240}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            borderRight: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
          }}
        >
          {siderContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          closable={false}
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          width={240}
          styles={{ body: { padding: 0 } }}
        >
          {siderContent}
        </Drawer>
      )}

      <Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : 240), transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            height: 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileOpen(true)}
                style={{ fontSize: 18 }}
              />
            ) : (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: 18 }}
              />
            )}
            <Title level={5} style={{ margin: 0, color: token.colorTextHeading }}>
              {menuItems.find((item) => item.key === location.pathname)?.label || '实验室动物信息管理系统'}
            </Title>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user && (
              <Dropdown menu={userDropdownItems} placement="bottomRight" trigger={['click']}>
                <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8, transition: 'background 0.2s' }}>
                  <Avatar
                    size={32}
                    style={{
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      fontWeight: 600,
                    }}
                    icon={<UserOutlined />}
                  />
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
                    {user.name || user.username}
                  </span>
                </Space>
              </Dropdown>
            )}
          </div>
        </Header>

        <Content
          style={{
            margin: 24,
            minHeight: 'calc(100vh - 64px - 48px)',
          }}
        >
          <div className="page-container">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
