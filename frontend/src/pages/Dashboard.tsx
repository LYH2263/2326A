import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Tag, Table, Typography, Space } from 'antd';
import {
  BugOutlined,
  HeartOutlined,
  ExperimentOutlined,
  CoffeeOutlined,
  RiseOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { statisticsApi, animalApi, experimentApi } from '../api';

const { Title, Text } = Typography;

const statusColorMap: Record<string, string> = {
  healthy: 'success',
  sick: 'error',
  in_experiment: 'processing',
  deceased: 'default',
  quarantine: 'warning',
};

const statusLabelMap: Record<string, string> = {
  healthy: '健康',
  sick: '患病',
  in_experiment: '实验中',
  deceased: '已死亡',
  quarantine: '隔离中',
};

const expStatusLabelMap: Record<string, string> = {
  planning: '计划中',
  in_progress: '进行中',
  completed: '已完成',
  suspended: '已暂停',
  cancelled: '已取消',
};

const expStatusColorMap: Record<string, string> = {
  planning: 'blue',
  in_progress: 'processing',
  completed: 'success',
  suspended: 'warning',
  cancelled: 'default',
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [recentAnimals, setRecentAnimals] = useState<any[]>([]);
  const [recentExperiments, setRecentExperiments] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewData, animalsData, experimentsData] = await Promise.all([
          statisticsApi.getOverview(),
          animalApi.getList({ page: 1, pageSize: 5 }),
          experimentApi.getList({ page: 1, pageSize: 5 }),
        ]);
        setOverview(overviewData);
        setRecentAnimals((animalsData as any)?.list || []);
        setRecentExperiments((experimentsData as any)?.list || []);
      } catch {
        // error handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusCount = (list: any[], status: string) => {
    const item = list?.find((i: any) => i.status === status);
    return item ? Number(item.count) : 0;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  const statCards = [
    {
      title: '动物总数',
      value: overview?.animalCount || 0,
      icon: <BugOutlined style={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      suffix: '只',
    },
    {
      title: '健康动物',
      value: getStatusCount(overview?.animalsByStatus || [], 'healthy'),
      icon: <HeartOutlined style={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      suffix: '只',
    },
    {
      title: '进行中实验',
      value: getStatusCount(overview?.experimentsByStatus || [], 'in_progress'),
      icon: <ExperimentOutlined style={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)',
      suffix: '项',
    },
    {
      title: '异常健康记录',
      value: getStatusCount(overview?.healthByCondition || [], 'abnormal') +
        getStatusCount(overview?.healthByCondition || [], 'critical'),
      icon: <AlertOutlined style={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
      suffix: '条',
    },
  ];

  const animalColumns = [
    { title: '编号', dataIndex: 'name', key: 'name', width: 100 },
    { title: '物种', dataIndex: 'species', key: 'species', width: 80 },
    { title: '品系', dataIndex: 'breed', key: 'breed' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColorMap[status]}>{statusLabelMap[status] || status}</Tag>
      ),
    },
    { title: '笼号', dataIndex: 'cageNumber', key: 'cageNumber', width: 80 },
  ];

  const experimentColumns = [
    { title: '项目名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '项目编号', dataIndex: 'projectCode', key: 'projectCode', width: 140 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={expStatusColorMap[status]}>{expStatusLabelMap[status] || status}</Tag>
      ),
    },
    { title: '负责人', dataIndex: 'researcher', key: 'researcher', width: 100 },
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a78bfa 100%)',
          border: 'none',
          overflow: 'hidden',
        }}
      >
        <Row align="middle" gutter={24}>
          <Col flex="auto">
            <Title level={3} style={{ color: '#fff', margin: 0, marginBottom: 8 }}>
              实验室动物信息管理系统
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>
              全面管理实验室动物信息，追踪健康状况，关联实验项目，记录饲养数据
            </Text>
            <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Tag icon={<CheckCircleOutlined />} color="#52c41a" style={{ borderRadius: 12, padding: '2px 12px' }}>
                系统运行正常
              </Tag>
              <Tag icon={<ClockCircleOutlined />} color="#1677ff" style={{ borderRadius: 12, padding: '2px 12px' }}>
                数据实时同步
              </Tag>
            </div>
          </Col>
          <Col>
            <span style={{ fontSize: 72, opacity: 0.3 }}>🔬</span>
          </Col>
        </Row>
      </Card>

      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              className="stat-card"
              style={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 14 }}>{card.title}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Statistic
                      value={card.value}
                      suffix={card.suffix}
                      valueStyle={{ fontSize: 32, fontWeight: 700, color: '#1a1a2e' }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: card.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  {card.icon}
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <RiseOutlined style={{ color: '#059669', fontSize: 12 }} />
                <Text style={{ color: '#059669', fontSize: 12 }}>数据已更新</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Data Tables */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BugOutlined style={{ color: '#4f46e5' }} />
                <span>最近添加的动物</span>
              </Space>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <Table
              dataSource={recentAnimals}
              columns={animalColumns}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 460 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ExperimentOutlined style={{ color: '#ea580c' }} />
                <span>最近实验项目</span>
              </Space>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <Table
              dataSource={recentExperiments}
              columns={experimentColumns}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 440 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Species Distribution */}
      {overview?.animalsBySpecies && overview.animalsBySpecies.length > 0 && (
        <Card
          title={
            <Space>
              <BarChartOutlined style={{ color: '#7c3aed' }} />
              <span>物种分布</span>
            </Space>
          }
          style={{ marginTop: 16, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <Row gutter={[16, 16]}>
            {overview.animalsBySpecies.map((item: any, index: number) => {
              const colors = ['#4f46e5', '#059669', '#ea580c', '#ec4899', '#8b5cf6', '#0ea5e9'];
              return (
                <Col xs={12} sm={8} md={6} key={index}>
                  <div style={{
                    textAlign: 'center',
                    padding: 16,
                    borderRadius: 12,
                    background: `${colors[index % colors.length]}10`,
                    border: `1px solid ${colors[index % colors.length]}30`,
                  }}>
                    <div style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: colors[index % colors.length],
                    }}>
                      {item.count}
                    </div>
                    <Text type="secondary">{item.species}</Text>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>
      )}
    </div>
  );
};

const BarChartOutlined: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" style={style}>
    <path d="M888 792H200V168c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v688c0 4.4 3.6 8 8 8h752c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm-600-80h56c4.4 0 8-3.6 8-8V560c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v144c0 4.4 3.6 8 8 8zm152 0h56c4.4 0 8-3.6 8-8V384c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v320c0 4.4 3.6 8 8 8zm152 0h56c4.4 0 8-3.6 8-8V462c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v242c0 4.4 3.6 8 8 8zm152 0h56c4.4 0 8-3.6 8-8V304c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v400c0 4.4 3.6 8 8 8z" />
  </svg>
);

export default Dashboard;
