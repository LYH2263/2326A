import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Select, Modal, Form,
  DatePicker, message, Popconfirm, Tooltip, Typography, Descriptions, List, Badge,
  Tabs, Empty, Divider, Table as AntTable,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, ReloadOutlined, ExperimentOutlined, UserAddOutlined,
  FileTextOutlined, BarChartOutlined, DownloadOutlined, SaveOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { experimentApi, animalApi, experimentDataPointApi } from '../api';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const statusOptions = [
  { value: 'planning', label: '计划中', color: 'blue' },
  { value: 'in_progress', label: '进行中', color: 'processing' },
  { value: 'completed', label: '已完成', color: 'success' },
  { value: 'suspended', label: '已暂停', color: 'warning' },
  { value: 'cancelled', label: '已取消', color: 'default' },
];

const dataTypeOptions = [
  { value: 'numeric', label: '数值型' },
  { value: 'text', label: '文本型' },
  { value: 'option', label: '选项型' },
];

const Experiments: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [addAnimalVisible, setAddAnimalVisible] = useState(false);
  const [addDataPointVisible, setAddDataPointVisible] = useState(false);
  const [editingExperiment, setEditingExperiment] = useState<any>(null);
  const [detailExperiment, setDetailExperiment] = useState<any>(null);
  const [animals, setAnimals] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [animalForm] = Form.useForm();
  const [dataPointForm] = Form.useForm();

  const [dataPoints, setDataPoints] = useState<any[]>([]);
  const [dataPointsTotal, setDataPointsTotal] = useState(0);
  const [dataPointsPage, setDataPointsPage] = useState(1);
  const [dataPointsPageSize, setDataPointsPageSize] = useState(20);
  const [dataPointsLoading, setDataPointsLoading] = useState(false);
  const [metricNames, setMetricNames] = useState<string[]>([]);
  const [filterMetric, setFilterMetric] = useState<string | undefined>();
  const [filterAnimal, setFilterAnimal] = useState<number | undefined>();
  const [editingDataPoint, setEditingDataPoint] = useState<any>(null);

  const [activeTab, setActiveTab] = useState('basic');
  const [reportMetric, setReportMetric] = useState<string>('');
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [statisticsData, setStatisticsData] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await experimentApi.getList({
        page, pageSize, keyword: keyword || undefined, status: statusFilter,
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, statusFilter]);

  const fetchAnimals = async () => {
    try {
      const res: any = await animalApi.getList({ page: 1, pageSize: 100 });
      setAnimals(res?.list || []);
    } catch {
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchAnimals(); }, []);

  const handleAdd = () => {
    setEditingExperiment(null);
    form.resetFields();
    form.setFieldsValue({ status: 'planning' });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingExperiment(record);
    form.setFieldsValue({
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
    });
    setModalVisible(true);
  };

  const handleDetail = async (id: number) => {
    try {
      const res: any = await experimentApi.getDetail(id);
      setDetailExperiment(res);
      setDetailVisible(true);
      setActiveTab('basic');
    } catch {
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await experimentApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch {
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
      };

      if (editingExperiment) {
        await experimentApi.update(editingExperiment.id, payload);
        message.success('更新成功');
      } else {
        await experimentApi.create(payload);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch {
    }
  };

  const handleAddAnimal = async () => {
    try {
      const values = await animalForm.validateFields();
      const payload = {
        ...values,
        experimentId: detailExperiment.id,
        joinDate: values.joinDate?.format('YYYY-MM-DD'),
      };
      await experimentApi.addAnimal(payload);
      message.success('关联成功');
      setAddAnimalVisible(false);
      animalForm.resetFields();
      handleDetail(detailExperiment.id);
    } catch {
    }
  };

  const handleRemoveAnimal = async (eaId: number) => {
    try {
      await experimentApi.removeAnimal(eaId);
      message.success('已移除');
      handleDetail(detailExperiment.id);
    } catch {
    }
  };

  const fetchDataPoints = useCallback(async () => {
    if (!detailExperiment?.id) return;
    try {
      setDataPointsLoading(true);
      const res: any = await experimentDataPointApi.getList({
        experimentId: detailExperiment.id,
        animalId: filterAnimal,
        metricName: filterMetric,
        page: dataPointsPage,
        pageSize: dataPointsPageSize,
      });
      setDataPoints(res?.list || []);
      setDataPointsTotal(res?.total || 0);
    } catch {
    } finally {
      setDataPointsLoading(false);
    }
  }, [detailExperiment?.id, filterAnimal, filterMetric, dataPointsPage, dataPointsPageSize]);

  const fetchMetricNames = useCallback(async () => {
    if (!detailExperiment?.id) return;
    try {
      const res: any = await experimentDataPointApi.getMetricNames(detailExperiment.id);
      setMetricNames(res || []);
    } catch {
    }
  }, [detailExperiment?.id]);

  useEffect(() => {
    if (detailVisible && activeTab === 'data') {
      fetchDataPoints();
      fetchMetricNames();
    }
  }, [detailVisible, activeTab, fetchDataPoints, fetchMetricNames]);

  const handleAddDataPoint = () => {
    setEditingDataPoint(null);
    dataPointForm.resetFields();
    dataPointForm.setFieldsValue({
      dataType: 'numeric',
      collectedAt: dayjs(),
    });
    setAddDataPointVisible(true);
  };

  const handleEditDataPoint = (record: any) => {
    setEditingDataPoint(record);
    dataPointForm.setFieldsValue({
      ...record,
      collectedAt: record.collectedAt ? dayjs(record.collectedAt) : null,
    });
    setAddDataPointVisible(true);
  };

  const handleDeleteDataPoint = async (id: number) => {
    try {
      await experimentDataPointApi.delete(id);
      message.success('删除成功');
      fetchDataPoints();
      fetchMetricNames();
    } catch {
    }
  };

  const handleSubmitDataPoint = async () => {
    try {
      const values = await dataPointForm.validateFields();
      const payload = {
        experimentId: detailExperiment.id,
        animalId: values.animalId,
        metricName: values.metricName,
        dataType: values.dataType,
        collectedAt: values.collectedAt.format('YYYY-MM-DD HH:mm:ss'),
        unit: values.unit,
        notes: values.notes,
        numericValue: values.dataType === 'numeric' ? values.numericValue : undefined,
        textValue: values.dataType === 'text' ? values.textValue : undefined,
        optionValue: values.dataType === 'option' ? values.optionValue : undefined,
      };

      if (editingDataPoint) {
        await experimentDataPointApi.update(editingDataPoint.id, payload);
        message.success('更新成功');
      } else {
        await experimentDataPointApi.create(payload);
        message.success('添加成功');
      }
      setAddDataPointVisible(false);
      fetchDataPoints();
      fetchMetricNames();
    } catch {
    }
  };

  const getDisplayValue = (record: any) => {
    switch (record.dataType) {
      case 'numeric':
        return record.numericValue !== null && record.numericValue !== undefined
          ? `${record.numericValue} ${record.unit || ''}`.trim()
          : '-';
      case 'text':
        return record.textValue || '-';
      case 'option':
        return record.optionValue || '-';
      default:
        return '-';
    }
  };

  const fetchReportData = async (metricName: string) => {
    if (!detailExperiment?.id || !metricName) return;
    try {
      setReportLoading(true);
      const [timeSeries, stats] = await Promise.all([
        experimentDataPointApi.getTimeSeries({
          experimentId: detailExperiment.id,
          metricName,
        }),
        experimentDataPointApi.getStatistics({
          experimentId: detailExperiment.id,
          metricName,
          groupBy: 'animal',
        }),
      ]);
      setTimeSeriesData((timeSeries as unknown as any[]) || []);
      setStatisticsData((stats as unknown as any[]) || []);
    } catch {
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (detailVisible && activeTab === 'report' && metricNames.length > 0) {
      if (!reportMetric && metricNames.length > 0) {
        const firstNumericMetric = metricNames[0];
        setReportMetric(firstNumericMetric);
        fetchReportData(firstNumericMetric);
      } else if (reportMetric) {
        fetchReportData(reportMetric);
      }
    }
  }, [detailVisible, activeTab, metricNames]);

  const handleMetricChange = (metric: string) => {
    setReportMetric(metric);
    fetchReportData(metric);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    try {
      message.loading('正在生成PDF...', 0);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${detailExperiment?.projectCode || 'experiment'}_report.pdf`);
      message.destroy();
      message.success('PDF导出成功');
    } catch {
      message.destroy();
      message.error('PDF导出失败');
    }
  };

  const chartData = timeSeriesData.map((item: any) => ({
    time: dayjs(item.collectedAt).format('YYYY-MM-DD HH:mm'),
    value: Number(item.value),
    animal: item.animalName || `动物#${item.animalId}`,
  }));

  const columns = [
    {
      title: '项目编号',
      dataIndex: 'projectCode',
      key: 'projectCode',
      width: 140,
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    { title: '项目名称', dataIndex: 'name', key: 'name', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const opt = statusOptions.find(o => o.value === status);
        return <Tag color={opt?.color}>{opt?.label || status}</Tag>;
      },
    },
    { title: '负责人', dataIndex: 'researcher', key: 'researcher', width: 100 },
    { title: '部门', dataIndex: 'department', key: 'department', width: 120, ellipsis: true },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '-',
    },
    {
      title: '关联动物',
      key: 'animalCount',
      width: 100,
      render: (_: any, record: any) => (
        <Badge count={record.experimentAnimals?.length || 0} showZero style={{ backgroundColor: '#4f46e5' }} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record.id)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Tooltip title="删除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const dataPointColumns = [
    {
      title: '采集时间',
      dataIndex: 'collectedAt',
      key: 'collectedAt',
      width: 170,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '动物',
      dataIndex: 'animal',
      key: 'animal',
      width: 150,
      render: (_: any, record: any) => record.animal?.name || `#${record.animalId}`,
    },
    { title: '指标名称', dataIndex: 'metricName', key: 'metricName', width: 140 },
    {
      title: '数据类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 100,
      render: (type: string) => {
        const opt = dataTypeOptions.find(o => o.value === type);
        return <Tag>{opt?.label || type}</Tag>;
      },
    },
    {
      title: '数值',
      key: 'value',
      render: (_: any, record: any) => getDisplayValue(record),
    },
    { title: '备注', dataIndex: 'notes', key: 'notes', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditDataPoint(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDeleteDataPoint(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'basic',
      label: <span><FileTextOutlined /> 基本信息</span>,
    },
    {
      key: 'data',
      label: <span><TableOutlined /> 数据采集</span>,
    },
    {
      key: 'report',
      label: <span><BarChartOutlined /> 实验报告</span>,
    },
  ];

  const experimentAnimals = detailExperiment?.experimentAnimals || [];

  return (
    <div>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        title={
          <Space>
            <ExperimentOutlined style={{ color: '#ea580c' }} />
            <span style={{ fontWeight: 600 }}>实验项目管理</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            创建实验
          </Button>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索项目名称"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => { setPage(1); fetchData(); }}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
          >
            {statusOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setStatusFilter(undefined); setPage(1); }}>
            重置
          </Button>
        </div>

        <Table
          loading={loading}
          dataSource={data}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1040 }}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <Modal
        title={editingExperiment ? '编辑实验项目' : '创建实验项目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
              <Input placeholder="实验项目名称" />
            </Form.Item>
            <Form.Item name="projectCode" label="项目编号" rules={[{ required: true, message: '请输入项目编号' }]}>
              <Input placeholder="如 EXP-2025-001" />
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select>
                {statusOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="researcher" label="负责研究员">
              <Input placeholder="负责人姓名" />
            </Form.Item>
            <Form.Item name="department" label="所属部门">
              <Input placeholder="部门名称" />
            </Form.Item>
            <Form.Item name="startDate" label="开始日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endDate" label="结束日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="description" label="实验描述">
            <TextArea rows={3} placeholder="详细描述" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="其他备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="实验项目详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={1000}
        destroyOnClose
      >
        {detailExperiment && (
          <>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4} style={{ margin: 0 }}>{detailExperiment.name}</Title>
              <Tag color={statusOptions.find(o => o.value === detailExperiment.status)?.color}>
                {statusOptions.find(o => o.value === detailExperiment.status)?.label}
              </Tag>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

            {activeTab === 'basic' && (
              <div style={{ paddingTop: 8 }}>
                <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                  <Descriptions.Item label="项目编号">{detailExperiment.projectCode}</Descriptions.Item>
                  <Descriptions.Item label="项目名称">{detailExperiment.name}</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={statusOptions.find(o => o.value === detailExperiment.status)?.color}>
                      {statusOptions.find(o => o.value === detailExperiment.status)?.label}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="负责人">{detailExperiment.researcher || '-'}</Descriptions.Item>
                  <Descriptions.Item label="部门">{detailExperiment.department || '-'}</Descriptions.Item>
                  <Descriptions.Item label="开始日期">{detailExperiment.startDate ? dayjs(detailExperiment.startDate).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="结束日期">{detailExperiment.endDate ? dayjs(detailExperiment.endDate).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="描述" span={2}>{detailExperiment.description || '-'}</Descriptions.Item>
                  <Descriptions.Item label="备注" span={2}>{detailExperiment.notes || '-'}</Descriptions.Item>
                </Descriptions>

                <Divider orientation="left" orientationMargin={0}>关联动物</Divider>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text strong>共 {experimentAnimals.length} 只动物</Text>
                  <Button size="small" type="primary" icon={<UserAddOutlined />} onClick={() => { animalForm.resetFields(); setAddAnimalVisible(true); }}>
                    添加关联
                  </Button>
                </div>
                <List
                  size="small"
                  bordered
                  dataSource={experimentAnimals}
                  locale={{ emptyText: '暂无关联动物' }}
                  renderItem={(ea: any) => (
                    <List.Item
                      actions={[
                        <Popconfirm title="确定移除？" onConfirm={() => handleRemoveAnimal(ea.id)} okText="确定" cancelText="取消">
                          <Button type="link" size="small" danger>移除</Button>
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta
                        title={`${ea.animal?.name || `#${ea.animalId}`} - ${ea.animal?.species || ''}`}
                        description={`角色: ${ea.role || '-'} | 加入: ${ea.joinDate ? dayjs(ea.joinDate).format('YYYY-MM-DD') : '-'}`}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {activeTab === 'data' && (
              <div style={{ paddingTop: 8 }}>
                <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Select
                    placeholder="选择指标筛选"
                    allowClear
                    style={{ width: 180 }}
                    value={filterMetric}
                    onChange={(v) => { setFilterMetric(v || undefined); setDataPointsPage(1); }}
                  >
                    {metricNames.map(m => <Option key={m} value={m}>{m}</Option>)}
                  </Select>
                  <Select
                    placeholder="选择动物筛选"
                    allowClear
                    style={{ width: 180 }}
                    value={filterAnimal}
                    onChange={(v) => { setFilterAnimal(v || undefined); setDataPointsPage(1); }}
                  >
                    {experimentAnimals.map((ea: any) => (
                      <Option key={ea.animalId} value={ea.animalId}>
                        {ea.animal?.name || `#${ea.animalId}`}
                      </Option>
                    ))}
                  </Select>
                  <Button icon={<ReloadOutlined />} onClick={() => { setFilterMetric(undefined); setFilterAnimal(undefined); setDataPointsPage(1); }}>
                    重置
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDataPoint} style={{ marginLeft: 'auto' }}>
                    添加数据点
                  </Button>
                </div>

                <Table
                  loading={dataPointsLoading}
                  dataSource={dataPoints}
                  columns={dataPointColumns}
                  rowKey="id"
                  scroll={{ x: 900 }}
                  pagination={{
                    current: dataPointsPage, pageSize: dataPointsPageSize, total: dataPointsTotal,
                    showSizeChanger: true, showQuickJumper: true,
                    showTotal: (t) => `共 ${t} 条数据`,
                    onChange: (p, ps) => { setDataPointsPage(p); setDataPointsPageSize(ps); },
                  }}
                  locale={{ emptyText: '暂无数据点，请点击"添加数据点"开始采集' }}
                />
              </div>
            )}

            {activeTab === 'report' && (
              <div style={{ paddingTop: 8 }}>
                <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Text strong>选择指标：</Text>
                  <Select
                    placeholder="请选择指标"
                    style={{ width: 200 }}
                    value={reportMetric || undefined}
                    onChange={handleMetricChange}
                    allowClear={false}
                  >
                    {metricNames.map(m => <Option key={m} value={m}>{m}</Option>)}
                  </Select>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExportPDF}
                    style={{ marginLeft: 'auto' }}
                  >
                    导出PDF
                  </Button>
                </div>

                {metricNames.length === 0 ? (
                  <Empty description="暂无数据，无法生成报告" />
                ) : (
                  <div ref={reportRef} style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #f0f0f0' }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <Title level={3} style={{ marginBottom: 4 }}>{detailExperiment.name}</Title>
                      <Text type="secondary">项目编号：{detailExperiment.projectCode} | 生成时间：{dayjs().format('YYYY-MM-DD HH:mm')}</Text>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Title level={5} style={{ marginBottom: 8 }}>一、实验基本信息</Title>
                      <Descriptions bordered size="small" column={2}>
                        <Descriptions.Item label="项目名称">{detailExperiment.name}</Descriptions.Item>
                        <Descriptions.Item label="项目编号">{detailExperiment.projectCode}</Descriptions.Item>
                        <Descriptions.Item label="负责人">{detailExperiment.researcher || '-'}</Descriptions.Item>
                        <Descriptions.Item label="部门">{detailExperiment.department || '-'}</Descriptions.Item>
                        <Descriptions.Item label="开始日期">{detailExperiment.startDate ? dayjs(detailExperiment.startDate).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
                        <Descriptions.Item label="结束日期">{detailExperiment.endDate ? dayjs(detailExperiment.endDate).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
                        <Descriptions.Item label="实验状态">
                          <Tag color={statusOptions.find(o => o.value === detailExperiment.status)?.color}>
                            {statusOptions.find(o => o.value === detailExperiment.status)?.label}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="动物数量">{experimentAnimals.length} 只</Descriptions.Item>
                      </Descriptions>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Title level={5} style={{ marginBottom: 8 }}>二、关联动物信息</Title>
                      <AntTable
                        size="small"
                        dataSource={experimentAnimals}
                        rowKey="id"
                        pagination={false}
                        columns={[
                          { title: '动物编号', dataIndex: ['animal', 'name'], key: 'name', width: 100 },
                          { title: '物种', dataIndex: ['animal', 'species'], key: 'species', width: 80 },
                          { title: '品系', dataIndex: ['animal', 'breed'], key: 'breed', width: 100 },
                          { title: '性别', dataIndex: ['animal', 'gender'], key: 'gender', width: 80 },
                          { title: '角色', dataIndex: 'role', key: 'role' },
                          { title: '加入日期', dataIndex: 'joinDate', key: 'joinDate', render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '-' },
                        ]}
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Title level={5} style={{ marginBottom: 8 }}>三、{reportMetric} 趋势图</Title>
                      {chartData.length > 0 ? (
                        <div style={{ height: 320 }}>
                          <Line
                            data={chartData}
                            xField="time"
                            yField="value"
                            seriesField="animal"
                            smooth
                            point={{ size: 3 }}
                            legend={{ position: 'top' }}
                            xAxis={{ label: { autoRotate: true } }}
                          />
                        </div>
                      ) : (
                        <Empty description="暂无趋势数据" />
                      )}
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Title level={5} style={{ marginBottom: 8 }}>四、{reportMetric} 统计数据</Title>
                      {statisticsData.length > 0 ? (
                        <AntTable
                          size="small"
                          dataSource={statisticsData}
                          rowKey="animalId"
                          pagination={false}
                          columns={[
                            { title: '动物', dataIndex: 'animalName', key: 'animalName', width: 120, render: (v: string, r: any) => v || `动物#${r.animalId}` },
                            { title: '数据点数', dataIndex: 'count', key: 'count', width: 100 },
                            { title: '均值', dataIndex: 'avgValue', key: 'avgValue', render: (v: number) => v ? Number(v).toFixed(2) : '-' },
                            { title: '最小值', dataIndex: 'minValue', key: 'minValue', render: (v: number) => v ? Number(v).toFixed(2) : '-' },
                            { title: '最大值', dataIndex: 'maxValue', key: 'maxValue', render: (v: number) => v ? Number(v).toFixed(2) : '-' },
                            { title: '标准差', dataIndex: 'stdValue', key: 'stdValue', render: (v: number) => v ? Number(v).toFixed(2) : '-' },
                          ]}
                        />
                      ) : (
                        <Empty description="暂无统计数据" />
                      )}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 30, paddingTop: 16, borderTop: '1px dashed #d9d9d9' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        — 实验动物信息管理系统 · 自动生成 —
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal
        title="添加关联动物"
        open={addAnimalVisible}
        onOk={handleAddAnimal}
        onCancel={() => setAddAnimalVisible(false)}
        okText="添加"
        cancelText="取消"
      >
        <Form form={animalForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="animalId" label="选择动物" rules={[{ required: true, message: '请选择动物' }]}>
            <Select showSearch optionFilterProp="children" placeholder="搜索选择">
              {animals.map(a => <Option key={a.id} value={a.id}>{a.name} ({a.species} - {a.breed || '未知品系'})</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select placeholder="选择角色">
              <Option value="treatment_group">治疗组</Option>
              <Option value="control_group">对照组</Option>
              <Option value="subject">实验对象</Option>
            </Select>
          </Form.Item>
          <Form.Item name="joinDate" label="加入日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingDataPoint ? '编辑数据点' : '添加数据点'}
        open={addDataPointVisible}
        onOk={handleSubmitDataPoint}
        onCancel={() => setAddDataPointVisible(false)}
        width={520}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={dataPointForm} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="animalId" label="选择动物" rules={[{ required: true, message: '请选择动物' }]}>
              <Select placeholder="请选择">
                {experimentAnimals.map((ea: any) => (
                  <Option key={ea.animalId} value={ea.animalId}>
                    {ea.animal?.name || `#${ea.animalId}`} ({ea.role || '-'})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="collectedAt" label="采集时间" rules={[{ required: true, message: '请选择采集时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="metricName" label="指标名称" rules={[{ required: true, message: '请输入指标名称' }]}>
              <Input placeholder="如 tumor_volume" />
            </Form.Item>
            <Form.Item name="dataType" label="数据类型" rules={[{ required: true }]}>
              <Select onChange={() => dataPointForm.validateFields()}>
                {dataTypeOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
              </Select>
            </Form.Item>
          </div>

          <Form.Item noStyle shouldUpdate={(prev: any, cur: any) => prev.dataType !== cur.dataType}>
            {() => {
              const dataType = dataPointForm.getFieldValue('dataType');
              if (dataType === 'numeric') {
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <Form.Item name="numericValue" label="数值" rules={[{ required: true, message: '请输入数值' }]}>
                      <Input type="number" placeholder="请输入数值" />
                    </Form.Item>
                    <Form.Item name="unit" label="单位">
                      <Input placeholder="如 mm³, g, U/L" />
                    </Form.Item>
                  </div>
                );
              }
              if (dataType === 'text') {
                return (
                  <Form.Item name="textValue" label="文本内容" rules={[{ required: true, message: '请输入文本内容' }]}>
                    <TextArea rows={3} placeholder="请输入文本内容" />
                  </Form.Item>
                );
              }
              if (dataType === 'option') {
                return (
                  <Form.Item name="optionValue" label="选项值" rules={[{ required: true, message: '请输入选项值' }]}>
                    <Input placeholder="如 良好/一般/差" />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Experiments;
