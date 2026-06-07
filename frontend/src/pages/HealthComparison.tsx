import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Select,
  Tabs,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  Typography,
  Table,
  Empty,
  Spin,
  DatePicker,
  Button,
  message,
  Tooltip,
} from 'antd';
import {
  LineChartOutlined,
  RadarChartOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { Radar, Line, Column } from '@ant-design/plots';
import dayjs from 'dayjs';
import { healthApi, animalApi } from '../api';

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const indicatorLabels: Record<string, string> = {
  temperature: '体温',
  weight: '体重',
  heartRate: '心率',
  respiratoryRate: '呼吸频率',
};

const indicatorUnits: Record<string, string> = {
  temperature: '℃',
  weight: 'g',
  heartRate: '次/分',
  respiratoryRate: '次/分',
};

const indicatorColors: Record<string, string> = {
  temperature: '#ef4444',
  weight: '#3b82f6',
  heartRate: '#10b981',
  respiratoryRate: '#8b5cf6',
};

const HealthComparison: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'multi'>('single');
  const [animals, setAnimals] = useState<any[]>([]);
  const [loadingAnimals, setLoadingAnimals] = useState(false);

  const [selectedAnimal, setSelectedAnimal] = useState<number | null>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendLimit, setTrendLimit] = useState(10);

  const [selectedAnimals, setSelectedAnimals] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  const fetchAnimals = useCallback(async () => {
    try {
      setLoadingAnimals(true);
      const res: any = await animalApi.getList({ page: 1, pageSize: 100 });
      setAnimals(res?.list || []);
      return res?.list || [];
    } catch {
      return [];
    } finally {
      setLoadingAnimals(false);
    }
  }, []);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  useEffect(() => {
    if (animals.length > 0 && !selectedAnimal) {
      setSelectedAnimal(animals[0].id);
    }
  }, [animals, selectedAnimal]);

  useEffect(() => {
    if (selectedAnimal) {
      fetchTrendData(selectedAnimal, trendLimit);
    }
  }, [selectedAnimal, trendLimit]);

  const fetchTrendData = async (animalId: number, limit: number) => {
    try {
      setTrendLoading(true);
      const res: any = await healthApi.getTrend(animalId, limit);
      setTrendData(res);
    } catch {
      setTrendData(null);
    } finally {
      setTrendLoading(false);
    }
  };

  const handleMultiCompare = async () => {
    if (selectedAnimals.length === 0) {
      message.warning('请选择至少一只动物');
      return;
    }
    if (selectedAnimals.length > 5) {
      message.warning('最多选择5只动物');
      return;
    }
    try {
      setComparisonLoading(true);
      const startDate = dateRange?.[0]?.format('YYYY-MM-DD');
      const endDate = dateRange?.[1]?.format('YYYY-MM-DD');
      const res: any = await healthApi.getMultiComparison(selectedAnimals, startDate, endDate);
      setComparisonData(res);
    } catch {
      setComparisonData(null);
    } finally {
      setComparisonLoading(false);
    }
  };

  const renderAnomalyTag = (status: string) => {
    switch (status) {
      case 'above':
        return (
          <Tag color="red" icon={<ArrowUpOutlined />}>
            偏高
          </Tag>
        );
      case 'below':
        return (
          <Tag color="orange" icon={<ArrowDownOutlined />}>
            偏低
          </Tag>
        );
      case 'normal':
        return (
          <Tag color="green" icon={<MinusOutlined />}>
            正常
          </Tag>
        );
      default:
        return <Tag>未知</Tag>;
    }
  };

  const renderSingleMode = () => {
    if (!trendData || !trendData.latest) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Empty description="暂无体检数据" />
        </div>
      );
    }

    const { records, latest, average, normalRanges, anomalies, animal } = trendData;

    const radarData = [
      {
        item: '体温',
        value: latest.temperature,
        type: '最新值',
      },
      {
        item: '体重',
        value: latest.weight,
        type: '最新值',
      },
      {
        item: '心率',
        value: latest.heartRate,
        type: '最新值',
      },
      {
        item: '呼吸频率',
        value: latest.respiratoryRate,
        type: '最新值',
      },
      {
        item: '体温',
        value: average.temperature,
        type: '历史均值',
      },
      {
        item: '体重',
        value: average.weight,
        type: '历史均值',
      },
      {
        item: '心率',
        value: average.heartRate,
        type: '历史均值',
      },
      {
        item: '呼吸频率',
        value: average.respiratoryRate,
        type: '历史均值',
      },
    ].filter((d) => d.value !== null && d.value !== undefined);

    const radarConfig = {
      data: radarData,
      xField: 'item',
      yField: 'value',
      seriesField: 'type',
      meta: {
        value: {
          min: 0,
        },
      },
      color: ['#1677ff', '#52c41a'],
      point: {
        size: 3,
        shape: 'circle',
      },
      area: {
        style: {
          fillOpacity: 0.2,
        },
      },
      legend: {
        position: 'bottom' as const,
      },
    };

    const renderLineChart = (indicator: string, label: string, color: string, unit: string) => {
      const range = normalRanges[indicator];
      const lineData = records
        .filter((r: any) => r[indicator] !== null && r[indicator] !== undefined)
        .map((r: any) => ({
          date: r.checkDate,
          value: Number(r[indicator]),
          type: label,
        }));

      if (lineData.length === 0) {
        return (
          <Card key={indicator} size="small" style={{ borderRadius: 8 }} title={label}>
            <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </Card>
        );
      }

      const annotations: any[] = [];
      const firstDate = lineData[0].date;
      const lastDate = lineData[lineData.length - 1].date;

      if (range && range.min !== null && range.max !== null) {
        annotations.push({
          type: 'region',
          start: [firstDate, range.max],
          end: [lastDate, 'max'],
          style: {
            fill: '#ff4d4f',
            fillOpacity: 0.15,
          },
        });
        annotations.push({
          type: 'region',
          start: [firstDate, 'min'],
          end: [lastDate, range.min],
          style: {
            fill: '#ff4d4f',
            fillOpacity: 0.15,
          },
        });
        annotations.push({
          type: 'line',
          start: [firstDate, range.max],
          end: [lastDate, range.max],
          style: {
            stroke: '#ff4d4f',
            lineWidth: 1,
            lineDash: [4, 4],
            opacity: 0.8,
          },
        });
        annotations.push({
          type: 'line',
          start: [firstDate, range.min],
          end: [lastDate, range.min],
          style: {
            stroke: '#ff4d4f',
            lineWidth: 1,
            lineDash: [4, 4],
            opacity: 0.8,
          },
        });
      }

      const config: any = {
        data: lineData,
        xField: 'date',
        yField: 'value',
        seriesField: 'type',
        color: [color],
        smooth: true,
        point: {
          size: 3,
          shape: 'circle',
        },
        lineStyle: {
          lineWidth: 2,
        },
        annotations,
        yAxis: {
          label: {
            formatter: (v: string) => `${v}${unit}`,
          },
        },
        height: 220,
        legend: false,
      };

      return (
        <Card
          key={indicator}
          size="small"
          style={{ borderRadius: 8 }}
          title={
            <Space>
              <span style={{ color, fontWeight: 500 }}>{label}</span>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {range && range.min !== null
                  ? `正常范围: ${range.min} - ${range.max} ${unit}`
                  : '暂无正常范围'}
              </Text>
              {anomalies[indicator]?.isAbnormal && (
                <Tag color="red" style={{ marginLeft: 8 }}>
                  异常
                </Tag>
              )}
            </Space>
          }
        >
          <Line {...config} />
        </Card>
      );
    };

    return (
      <div>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {['temperature', 'weight', 'heartRate', 'respiratoryRate'].map((ind) => (
            <Col xs={12} sm={6} key={ind}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic
                  title={
                    <Space>
                      <span>{indicatorLabels[ind]}</span>
                      {anomalies[ind]?.isAbnormal && renderAnomalyTag(anomalies[ind].status)}
                    </Space>
                  }
                  value={latest[ind] ?? '-'}
                  suffix={indicatorUnits[ind]}
                  valueStyle={{
                    color: anomalies[ind]?.isAbnormal ? '#ff4d4f' : undefined,
                    fontSize: 20,
                  }}
                />
                {average[ind] !== null && average[ind] !== undefined && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    历史均值: {average[ind]?.toFixed(1)} {indicatorUnits[ind]}
                  </Text>
                )}
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Card
              size="small"
              style={{ borderRadius: 8, height: '100%' }}
              title={
                <Space>
                  <RadarChartOutlined style={{ color: '#1677ff' }} />
                  <span>指标雷达图</span>
                </Space>
              }
            >
              {radarData.length > 0 ? (
                <div style={{ height: 320 }}>
                  <Radar {...radarConfig} height={320} />
                </div>
              ) : (
                <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Empty description="数据不足" />
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card
              size="small"
              style={{ borderRadius: 8, height: '100%' }}
              title={
                <Space>
                  <LineChartOutlined style={{ color: '#52c41a' }} />
                  <span>指标趋势</span>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    共 {records.length} 次体检
                  </Text>
                </Space>
              }
            >
              <Row gutter={[12, 12]}>
                {['temperature', 'weight', 'heartRate', 'respiratoryRate'].map((ind) => (
                  <Col xs={24} sm={12} key={ind}>
                    {renderLineChart(ind, indicatorLabels[ind], indicatorColors[ind], indicatorUnits[ind])}
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderMultiMode = () => {
    if (!comparisonData || !comparisonData.animals || comparisonData.animals.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Empty description="请选择动物并点击对比" />
        </div>
      );
    }

    const { animals: compAnimals, normalRanges } = comparisonData;

    const barData: any[] = [];
    compAnimals.forEach((a: any) => {
      ['temperature', 'weight', 'heartRate', 'respiratoryRate'].forEach((ind) => {
        if (a[ind] !== null && a[ind] !== undefined) {
          barData.push({
            animal: a.animal.name,
            indicator: indicatorLabels[ind],
            value: Number(a[ind]),
            isAbnormal: a.anomalies[ind]?.isAbnormal || false,
          });
        }
      });
    });

    const barColors = (datum: any) => {
      return datum.isAbnormal ? '#ff4d4f' : '#1677ff';
    };

    const barConfig = {
      data: barData,
      isGroup: true,
      xField: 'indicator',
      yField: 'value',
      seriesField: 'animal',
      color: ['#1677ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96'],
      columnStyle: {
        radius: [4, 4, 0, 0],
      },
      legend: {
        position: 'top' as const,
      },
      label: {
        position: 'top' as const,
        style: {
          fontSize: 11,
        },
        formatter: (datum: any) => Number(datum.value).toFixed(1),
      },
      height: 360,
    };

    const tableColumns = [
      {
        title: '动物',
        dataIndex: 'animal',
        key: 'animal',
        width: 150,
        render: (animal: any) => (
          <Space direction="vertical" size={2}>
            <Space>
              <Text strong>{animal.name}</Text>
              <Tag color="blue">{animal.species}</Tag>
            </Space>
          </Space>
        ),
      },
      {
        title: '时段范围',
        dataIndex: 'startDate',
        key: 'dateRange',
        width: 200,
        render: (_: any, record: any) => {
          if (!record.startDate) return '-';
          return (
            <Space direction="vertical" size={0}>
              <Text style={{ fontSize: 12 }}>
                {record.startDate} ~ {record.endDate}
              </Text>
              <Tag color="purple" style={{ fontSize: 11, padding: '0 6px', margin: 0 }}>
                共 {record.recordCount} 次体检 · 均值
              </Tag>
            </Space>
          );
        },
      },
      ...['temperature', 'weight', 'heartRate', 'respiratoryRate'].map((ind) => ({
        title: (
          <Space>
            <span>{indicatorLabels[ind]}</span>
            <Text type="secondary" style={{ fontSize: 11 }}>
              ({indicatorUnits[ind]})
            </Text>
          </Space>
        ),
        dataIndex: ind,
        key: ind,
        width: 160,
        render: (val: number, record: any) => {
          if (val === null || val === undefined) return '-';
          const anomaly = record.anomalies?.[ind];
          return (
            <Space>
              <span style={{ color: anomaly?.isAbnormal ? '#ff4d4f' : undefined, fontWeight: anomaly?.isAbnormal ? 600 : undefined }}>
                {Number(val).toFixed(1)}
              </span>
              {anomaly?.isAbnormal && renderAnomalyTag(anomaly.status)}
            </Space>
          );
        },
      })),
    ];

    const hasAbnormal = compAnimals.some((a: any) =>
      ['temperature', 'weight', 'heartRate', 'respiratoryRate'].some(
        (ind) => a.anomalies?.[ind]?.isAbnormal,
      ),
    );

    return (
      <div>
        {hasAbnormal && (
          <Card
            size="small"
            style={{ marginBottom: 16, borderRadius: 8, borderColor: '#ffccc7', background: '#fff1f0' }}
          >
            <Space>
              <Tag color="red">异常提示</Tag>
              <Text type="danger">
                检测到 {compAnimals.filter((a: any) =>
                  ['temperature', 'weight', 'heartRate', 'respiratoryRate'].some(
                    (ind) => a.anomalies?.[ind]?.isAbnormal,
                  ),
                ).length} 只动物存在指标异常，详情见下方表格
              </Text>
            </Space>
          </Card>
        )}

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              size="small"
              style={{ borderRadius: 8 }}
              title={
                <Space>
                  <BarChartOutlined style={{ color: '#1677ff' }} />
                  <span>多动物指标对比</span>
                  <Tag color="purple">时段均值</Tag>
                </Space>
              }
            >
              {barData.length > 0 ? (
                <Column {...barConfig} />
              ) : (
                <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Empty description="暂无对比数据" />
                </div>
              )}
            </Card>
          </Col>

          <Col span={24}>
            <Card
              size="small"
              style={{ borderRadius: 8 }}
              title={
                <Space>
                  <LineChartOutlined style={{ color: '#52c41a' }} />
                  <span>详细指标对比表</span>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    异常项红色高亮显示
                  </Text>
                </Space>
              }
            >
              <Table
                dataSource={compAnimals}
                columns={tableColumns as any}
                rowKey={(record: any) => record.animal.id}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <div>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 }}
        title={
          <Space>
            <LineChartOutlined style={{ color: '#ec4899' }} />
            <span style={{ fontWeight: 600 }}>健康对比分析</span>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'single' | 'multi')}
          items={[
            {
              key: 'single',
              label: (
                <Space>
                  <RadarChartOutlined />
                  单动物时间对比
                </Space>
              ),
            },
            {
              key: 'multi',
              label: (
                <Space>
                  <BarChartOutlined />
                  多动物横向对比
                </Space>
              ),
            },
          ]}
        />

        {activeTab === 'single' && (
          <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Select
              placeholder="选择动物"
              style={{ width: 220 }}
              value={selectedAnimal}
              onChange={setSelectedAnimal}
              showSearch
              optionFilterProp="children"
              loading={loadingAnimals}
            >
              {animals.map((a) => (
                <Option key={a.id} value={a.id}>
                  {a.name} ({a.species})
                </Option>
              ))}
            </Select>
            <Select
              style={{ width: 140 }}
              value={trendLimit}
              onChange={setTrendLimit}
            >
              <Option value={5}>最近5次</Option>
              <Option value={10}>最近10次</Option>
              <Option value={20}>最近20次</Option>
              <Option value={30}>最近30次</Option>
              <Option value={50}>最近50次</Option>
            </Select>
            {trendData?.animal && (
              <Tag color="blue">
                {trendData.animal.name} - {trendData.animal.species}
              </Tag>
            )}
          </div>
        )}

        {activeTab === 'multi' && (
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Select
              mode="multiple"
              placeholder="选择动物（最多5只）"
              style={{ minWidth: 300 }}
              value={selectedAnimals}
              onChange={(vals) => {
                if (vals.length <= 5) {
                  setSelectedAnimals(vals);
                } else {
                  message.warning('最多选择5只动物');
                }
              }}
              showSearch
              optionFilterProp="children"
              loading={loadingAnimals}
              maxTagCount={5}
            >
              {animals.map((a) => (
                <Option key={a.id} value={a.id}>
                  {a.name} ({a.species})
                </Option>
              ))}
            </Select>
            <RangePicker
              value={dateRange as any}
              onChange={(dates) => setDateRange(dates as any)}
              style={{ width: 260 }}
            />
            <Button type="primary" onClick={handleMultiCompare} loading={comparisonLoading}>
              开始对比
            </Button>
            <Tooltip title="最多支持5只动物同时对比">
              <Text type="secondary" style={{ fontSize: 12 }}>
                已选 {selectedAnimals.length}/5
              </Text>
            </Tooltip>
          </div>
        )}
      </Card>

      <Spin spinning={activeTab === 'single' ? trendLoading : comparisonLoading}>
        {activeTab === 'single' ? renderSingleMode() : renderMultiMode()}
      </Spin>
    </div>
  );
};

export default HealthComparison;
