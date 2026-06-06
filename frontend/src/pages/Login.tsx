import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../api';

const { Title, Text } = Typography;

interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);
      const res: any = await authApi.login(values);
      message.success('登录成功');
      onLogin(res.token, res.user);
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4f46e5 60%, #7c3aed 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-5%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
        }}
      />

      <Card
        style={{
          width: 420,
          maxWidth: '90vw',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: 'none',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 36,
            }}
          >
            🐾
          </div>
          <Title level={3} style={{ margin: 0, color: '#1a1a2e' }}>
            实验室动物信息管理系统
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 4, display: 'block' }}>
            请输入账号密码登录系统
          </Text>
        </div>

        {/* Form */}
        <Form
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#4f46e5' }} />}
              placeholder="用户名"
              style={{ borderRadius: 10, height: 48 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#4f46e5' }} />}
              placeholder="密码"
              style={{ borderRadius: 10, height: 48 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 48,
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                border: 'none',
                boxShadow: '0 4px 16px rgba(79,70,229,0.4)',
              }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Space direction="vertical" size={4}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              默认管理员账号: admin / admin123
            </Text>
            <Text type="secondary" style={{ fontSize: 11, color: '#bbb' }}>
              Lab Animal Information Management System v1.0
            </Text>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Login;
