import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Typography, Empty, Progress, Space, Tag } from 'antd';
import {
  BarChartOutlined,
  PieChartOutlined,
  ExperimentOutlined,
  BugOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import { statisticsApi } from '../api';

const { Title, Text } = Typography;

const statusLabelMap: Record<string, string> = {
  healthy: '健康',
  sick: '患病',
  in_experiment: '实验中',
  deceased: '已死亡',
  quarantine: '隔离中',
};

const statusColorMap: Record<string, string> = {
  healthy: '#52c41a',
  sick: '#ff4d4f',
  in_experiment: '#1677ff',
  deceased: '#8c8c8c',
  quarantine: '#faad14',
};

const expStatusLabelMap: Record<string, string> = {
  planning: '计划中',
  in_progress: '进行中',
  completed: '已完成',
  suspended: '已暂停',
  cancelled: '已取消',
};

const expStatusColorMap: Record<string, string> = {
  planning: '#1677ff',
  in_progress: '#fa8c16',
  completed: '#52c41a',
  suspended: '#faad14',
  cancelled: '#8c8c8c',
};

const conditionLabelMap: Record<string, string> = {
  normal: '正常',
  abnormal: '异常',
  critical: '危急',
};

const conditionColorMap: Record<string, string> = {
  normal: '#52c41a',
  abnormal: '#faad14',
  critical: '#ff4d4f',
};

const Statistics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [animalStats, setAnimalStats] = useState<any>(null);
  const [experimentStats, setExperimentStats] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewRes, animalRes, expRes] = await Promise.all([
          statisticsApi.getOverview(),
          statisticsApi.getAnimalStats(),
          statisticsApi.getExperimentStats(),
        ]);
        setOverview(overviewRes);
        setAnimalStats(animalRes);
        setExperimentStats(expRes);
      } catch {
        // handled
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="加载统计数据中..." />
      </div>
    );
  }

  const totalAnimals = overview?.animalCount || 0;

  const renderBarChart = (data: any[], labelMap: Record<string, string>, colorMap: Record<string, string>, total: number) => {
    if (!data || data.length === 0) return <Empty description="暂无数据" />;

    return (
      <div style={{ padding: '8px 0' }}>
        {data.map((item: any, index: number) => {
          const count = Number(item.count);
          const percent = total > 0 ? Math.round((count / total) * 100) : 0;
          const label = labelMap[item.status || item.condition || item.species] || item.status || item.condition || item.species;
          const color = colorMap[item.status || item.condition || item.species] || '#4f46e5';

          return (
            <div key={index} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Space>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    backgroundColor: color,
                  }} />
                  <Text>{label}</Text>
                </Space>
                <Text strong>{count} ({percent}%)</Text>
              </div>
              <Progress
                percent={percent}
                showInfo={false}
                strokeColor={color}
                trailColor="#f0f0f0"
                size="small"
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderSpeciesChart = (data: any[]) => {
    if (!data || data.length === 0) return <Empty description="暂无数据" />;

    const colors = ['#4f46e5', '#059669', '#ea580c', '#ec4899', '#8b5cf6', '#0ea5e9'];
    const total = data.reduce((sum: number, item: any) => sum + Number(item.count), 0);

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 24, marginBottom: 24 }}>
          {data.map((item: any, index: number) => {
            const count = Number(item.count);
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div
                key={index}
                style={{
                  textAlign: 'center',
                  padding: '20px 24px',
                  borderRadius: 16,
                  background: `${colors[index % colors.length]}08`,
                  border: `2px solid ${colors[index % colors.length]}20`,
                  minWidth: 120,
                  transition: 'all 0.3s',
                  cursor: 'default',
                }}
              >
                <div style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: colors[index % colors.length],
                  lineHeight: 1.2,
                }}>
                  {count}
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>{item.species}</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag color={colors[index % colors.length]} style={{ borderRadius: 10 }}>
                    {percent}%
                  </Tag>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '0 8px' }}>
          {data.map((item: any, index: number) => {
            const count = Number(item.count);
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={index} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{item.species}</Text>
                  <Text type="secondary">{count} 只</Text>
                </div>
                <Progress
                  percent={percent}
                  showInfo={false}
                  strokeColor={colors[index % colors.length]}
                  size="small"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDepartmentChart = (data: any[]) => {
    if (!data || data.length === 0) return <Empty description="暂无数据" />;

    const colors = ['#4f46e5', '#059669', '#ea580c', '#ec4899', '#8b5cf6'];
    const total = data.reduce((sum: number, item: any) => sum + Number(item.count), 0);

    return (
      <div style={{ padding: '8px 0' }}>
        {data.map((item: any, index: number) => {
          const count = Number(item.count);
          const percent = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={index} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Space>
                  <div style={{
                    width: 10, height: 10, borderRadius: 2,
                    backgroundColor: colors[index % colors.length],
                  }} />
                  <Text>{item.department || '未分配'}</Text>
                </Space>
                <Text strong>{count} 项 ({percent}%)</Text>
              </div>
              <Progress
                percent={percent}
                showInfo={false}
                strokeColor={colors[index % colors.length]}
                size="small"
              />
            </div>
          );
        })}
      </div>
    );
  };

  const totalExperiments = experimentStats?.byStatus?.reduce((sum: number, item: any) => sum + Number(item.count), 0) || 0;
  const totalHealthRecords = overview?.healthByCondition?.reduce((sum: number, item: any) => sum + Number(item.count), 0) || 0;

  return (
    <div>
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          border: 'none',
        }}
      >
        <Row align="middle">
          <Col flex="auto">
            <Title level={3} style={{ color: '#fff', margin: 0 }}>数据统计分析</Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              多维度数据可视化，全面掌握实验室动物管理概况
            </Text>
          </Col>
          <Col>
            <Space size={16}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#a5b4fc' }}>{totalAnimals}</div>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>动物总数</Text>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#a5b4fc' }}>{totalExperiments}</div>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>实验总数</Text>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Animal by Status */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BugOutlined style={{ color: '#4f46e5' }} />
                <span>动物状态分布</span>
              </Space>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
          >
            {renderBarChart(
              animalStats?.byStatus || [],
              statusLabelMap,
              statusColorMap,
              totalAnimals,
            )}
          </Card>
        </Col>

        {/* Animal by Species */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <PieChartOutlined style={{ color: '#059669' }} />
                <span>物种分布统计</span>
              </Space>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
          >
            {renderSpeciesChart(animalStats?.bySpecies || [])}
          </Card>
        </Col>

        {/* Experiment by Status */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ExperimentOutlined style={{ color: '#ea580c' }} />
                <span>实验状态分布</span>
              </Space>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
          >
            {renderBarChart(
              experimentStats?.byStatus || [],
              expStatusLabelMap,
              expStatusColorMap,
              totalExperiments,
            )}
          </Card>
        </Col>

        {/* Experiment by Department */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BarChartOutlined style={{ color: '#7c3aed' }} />
                <span>部门实验分布</span>
              </Space>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
          >
            {renderDepartmentChart(experimentStats?.byDepartment || [])}
          </Card>
        </Col>

        {/* Health Condition Distribution */}
        <Col xs={24}>
          <Card
            title={
              <Space>
                <HeartOutlined style={{ color: '#ec4899' }} />
                <span>健康状况分布</span>
              </Space>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <Row gutter={[24, 16]}>
              {(overview?.healthByCondition || []).map((item: any, index: number) => {
                const count = Number(item.count);
                const percent = totalHealthRecords > 0 ? Math.round((count / totalHealthRecords) * 100) : 0;
                const label = conditionLabelMap[item.condition] || item.condition;
                const color = conditionColorMap[item.condition] || '#4f46e5';

                return (
                  <Col xs={24} sm={8} key={index}>
                    <div style={{
                      textAlign: 'center',
                      padding: 24,
                      borderRadius: 12,
                      border: `1px solid ${color}30`,
                      background: `${color}08`,
                    }}>
                      <Progress
                        type="circle"
                        percent={percent}
                        size={100}
                        strokeColor={color}
                        format={() => (
                          <div>
                            <div style={{ fontSize: 24, fontWeight: 700, color }}>{count}</div>
                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>记录</div>
                          </div>
                        )}
                      />
                      <div style={{ marginTop: 12 }}>
                        <Text strong style={{ fontSize: 16 }}>{label}</Text>
                      </div>
                      <div>
                        <Text type="secondary">{percent}% 占比</Text>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;
