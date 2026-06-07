import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Select, Modal, Form,
  DatePicker, message, Popconfirm, Tooltip, Typography, Descriptions, List, Badge,
  Tabs, Empty, Divider, Table as AntTable, InputNumber,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, ReloadOutlined, ExperimentOutlined, UserAddOutlined,
  FileTextOutlined, BarChartOutlined, DownloadOutlined, SaveOutlined,
  TableOutlined, AppstoreAddOutlined, DeleteRowOutlined,
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

interface BatchRow {
  key: string;
  animalId: number | null;
  collectedAt: dayjs.Dayjs | null;
  metricName: string;
  dataType: string;
  numericValue: number | null;
  textValue: string;
  optionValue: string;
  unit: string;
  notes: string;
}

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
  const [batchModalVisible, setBatchModalVisible] = useState(false);
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
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState<Record<string, { timeSeries: any[]; statistics: any[] }>>({});
  const reportRef = useRef<HTMLDivElement>(null);

  const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
  const [batchSubmitting, setBatchSubmitting] = useState(false);

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

  const createEmptyRow = (): BatchRow => ({
    key: Math.random().toString(36).slice(2),
    animalId: null,
    collectedAt: dayjs(),
    metricName: '',
    dataType: 'numeric',
    numericValue: null,
    textValue: '',
    optionValue: '',
    unit: '',
    notes: '',
  });

  const openBatchModal = () => {
    setBatchRows([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
    setBatchModalVisible(true);
  };

  const addBatchRow = () => {
    setBatchRows([...batchRows, createEmptyRow()]);
  };

  const removeBatchRow = (key: string) => {
    if (batchRows.length <= 1) {
      message.warning('至少保留一行');
      return;
    }
    setBatchRows(batchRows.filter(r => r.key !== key));
  };

  const updateBatchRow = (key: string, field: keyof BatchRow, value: any) => {
    setBatchRows(batchRows.map(row =>
      row.key === key ? { ...row, [field]: value } : row
    ));
  };

  const handleBatchSubmit = async () => {
    const validRows = batchRows.filter(row =>
      row.animalId && row.metricName && row.collectedAt &&
      (
        (row.dataType === 'numeric' && row.numericValue !== null) ||
        (row.dataType === 'text' && row.textValue) ||
        (row.dataType === 'option' && row.optionValue)
      )
    );

    if (validRows.length === 0) {
      message.error('请至少填写一行有效数据');
      return;
    }

    const invalidRows = batchRows.length - validRows.length;
    if (invalidRows > 0) {
      message.warning(`有 ${invalidRows} 行数据不完整，将被跳过`);
    }

    try {
      setBatchSubmitting(true);
      const points = validRows.map(row => ({
        experimentId: detailExperiment.id,
        animalId: row.animalId!,
        metricName: row.metricName,
        dataType: row.dataType,
        collectedAt: row.collectedAt!.format('YYYY-MM-DD HH:mm:ss'),
        unit: row.unit || undefined,
        notes: row.notes || undefined,
        numericValue: row.dataType === 'numeric' ? row.numericValue! : undefined,
        textValue: row.dataType === 'text' ? row.textValue : undefined,
        optionValue: row.dataType === 'option' ? row.optionValue : undefined,
      }));

      await experimentDataPointApi.batchCreate({ points });
      message.success(`成功录入 ${validRows.length} 条数据`);
      setBatchModalVisible(false);
      fetchDataPoints();
      fetchMetricNames();
    } catch {
    } finally {
      setBatchSubmitting(false);
    }
  };

  const fetchAllReportData = async () => {
    if (!detailExperiment?.id || metricNames.length === 0) return;
    try {
      setReportLoading(true);
      const allData: Record<string, { timeSeries: any[]; statistics: any[] }> = {};

      for (const metric of metricNames) {
        try {
          const [timeSeries, stats] = await Promise.all([
            experimentDataPointApi.getTimeSeries({
              experimentId: detailExperiment.id,
              metricName: metric,
            }),
            experimentDataPointApi.getStatistics({
              experimentId: detailExperiment.id,
              metricName: metric,
              groupBy: 'animal',
            }),
          ]);
          allData[metric] = {
            timeSeries: (timeSeries as unknown as any[]) || [],
            statistics: (stats as unknown as any[]) || [],
          };
        } catch {
          allData[metric] = { timeSeries: [], statistics: [] };
        }
      }

      setReportData(allData);
    } catch {
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (detailVisible && activeTab === 'report' && metricNames.length > 0) {
      fetchAllReportData();
    }
  }, [detailVisible, activeTab, metricNames.length]);

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

  const batchColumns = [
    {
      title: '动物',
      dataIndex: 'animalId',
      key: 'animalId',
      width: 180,
      render: (_: any, record: BatchRow) => (
        <Select
          placeholder="选择动物"
          style={{ width: '100%' }}
          value={record.animalId || undefined}
          onChange={(v) => updateBatchRow(record.key, 'animalId', v)}
        >
          {experimentAnimals.map((ea: any) => (
            <Option key={ea.animalId} value={ea.animalId}>
              {ea.animal?.name || `#${ea.animalId}`} ({ea.role || '-'})
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: '采集时间',
      dataIndex: 'collectedAt',
      key: 'collectedAt',
      width: 180,
      render: (_: any, record: BatchRow) => (
        <DatePicker
          showTime
          style={{ width: '100%' }}
          format="YYYY-MM-DD HH:mm"
          value={record.collectedAt}
          onChange={(v) => updateBatchRow(record.key, 'collectedAt', v)}
        />
      ),
    },
    {
      title: '指标名称',
      dataIndex: 'metricName',
      key: 'metricName',
      width: 140,
      render: (_: any, record: BatchRow) => (
        <Input
          placeholder="如 tumor_volume"
          value={record.metricName}
          onChange={(e) => updateBatchRow(record.key, 'metricName', e.target.value)}
        />
      ),
    },
    {
      title: '数据类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 100,
      render: (_: any, record: BatchRow) => (
        <Select
          style={{ width: '100%' }}
          value={record.dataType}
          onChange={(v) => updateBatchRow(record.key, 'dataType', v)}
        >
          {dataTypeOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
        </Select>
      ),
    },
    {
      title: '数值内容',
      key: 'value',
      width: 160,
      render: (_: any, record: BatchRow) => {
        if (record.dataType === 'numeric') {
          return (
            <InputNumber
              style={{ width: '100%' }}
              placeholder="数值"
              value={record.numericValue}
              onChange={(v) => updateBatchRow(record.key, 'numericValue', v)}
            />
          );
        }
        if (record.dataType === 'text') {
          return (
            <Input
              placeholder="文本内容"
              value={record.textValue}
              onChange={(e) => updateBatchRow(record.key, 'textValue', e.target.value)}
            />
          );
        }
        if (record.dataType === 'option') {
          return (
            <Input
              placeholder="选项值"
              value={record.optionValue}
              onChange={(e) => updateBatchRow(record.key, 'optionValue', e.target.value)}
            />
          );
        }
        return null;
      },
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 100,
      render: (_: any, record: BatchRow) => (
        <Input
          placeholder="单位"
          value={record.unit}
          onChange={(e) => updateBatchRow(record.key, 'unit', e.target.value)}
        />
      ),
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 120,
      render: (_: any, record: BatchRow) => (
        <Input
          placeholder="备注"
          value={record.notes}
          onChange={(e) => updateBatchRow(record.key, 'notes', e.target.value)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 70,
      fixed: 'right' as const,
      render: (_: any, record: BatchRow) => (
        <Button
          type="text"
          danger
          icon={<DeleteRowOutlined />}
          onClick={() => removeBatchRow(record.key)}
        />
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

  const renderChart = (metric: string, data: any[]) => {
    const chartData = data.map((item: any) => ({
      time: dayjs(item.collectedAt).format('YYYY-MM-DD HH:mm'),
      value: Number(item.value),
      animal: item.animalName || `动物#${item.animalId}`,
    }));

    if (chartData.length === 0) {
      return <Empty description="暂无数据" style={{ padding: '40px 0' }} />;
    }

    return (
      <div style={{ height: 300 }}>
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
    );
  };

  const renderStatisticsTable = (data: any[]) => {
    if (data.length === 0) {
      return <Empty description="暂无统计数据" style={{ padding: '20px 0' }} />;
    }

    return (
      <AntTable
        size="small"
        dataSource={data}
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
    );
  };

  const numericMetrics = metricNames.filter(m => {
    const d = reportData[m];
    return d && d.timeSeries.length > 0 && d.timeSeries.some((item: any) => item.value !== null && item.value !== undefined);
  });

  const otherMetrics = metricNames.filter(m => !numericMetrics.includes(m));

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
        width={1100}
        destroyOnClose
        style={{ top: 20 }}
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
                  <Button icon={<ReloadOutlined />} onClick={() => { setFilterMetric(undefined); setFilterAnimal(undefined); setDataPointsPage(1); fetchDataPoints(); }}>
                    重置
                  </Button>
                  <Space style={{ marginLeft: 'auto' }}>
                    <Button icon={<AppstoreAddOutlined />} onClick={openBatchModal}>
                      批量录入
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDataPoint}>
                      添加数据点
                    </Button>
                  </Space>
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
                  locale={{ emptyText: '暂无数据点，请点击"批量录入"或"添加数据点"开始采集' }}
                />
              </div>
            )}

            {activeTab === 'report' && (
              <div style={{ paddingTop: 8 }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>实验数据报告（共 {metricNames.length} 个指标）</Text>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExportPDF}
                    disabled={metricNames.length === 0}
                  >
                    导出PDF
                  </Button>
                </div>

                {metricNames.length === 0 ? (
                  <Empty description="暂无数据，无法生成报告" />
                ) : (
                  <div
                    ref={reportRef}
                    style={{
                      background: '#fff',
                      padding: 24,
                      borderRadius: 8,
                      border: '1px solid #f0f0f0',
                      maxHeight: '60vh',
                      overflowY: 'auto',
                    }}
                  >
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <Title level={3} style={{ marginBottom: 4 }}>{detailExperiment.name}</Title>
                      <Text type="secondary">项目编号：{detailExperiment.projectCode} | 生成时间：{dayjs().format('YYYY-MM-DD HH:mm')}</Text>
                    </div>

                    <div style={{ marginBottom: 20 }}>
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

                    <div style={{ marginBottom: 20 }}>
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

                    <div style={{ marginBottom: 20 }}>
                      <Title level={5} style={{ marginBottom: 12 }}>三、指标数据汇总</Title>
                      {reportLoading ? (
                        <Empty description="加载中..." style={{ padding: '40px 0' }} />
                      ) : (
                        <>
                          {numericMetrics.map((metric, idx) => (
                            <div key={metric} style={{ marginBottom: 24 }}>
                              <Divider orientation="left" orientationMargin={0} style={{ margin: '0 0 12px 0' }}>
                                <Text strong>指标 {idx + 1}：{metric}</Text>
                              </Divider>
                              <div style={{ marginBottom: 12 }}>
                                <Text type="secondary" style={{ fontSize: 13 }}>趋势图</Text>
                                {renderChart(metric, reportData[metric]?.timeSeries || [])}
                              </div>
                              <div>
                                <Text type="secondary" style={{ fontSize: 13 }}>统计数据</Text>
                                {renderStatisticsTable(reportData[metric]?.statistics || [])}
                              </div>
                            </div>
                          ))}
                          {otherMetrics.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                              <Divider orientation="left" orientationMargin={0} style={{ margin: '0 0 12px 0' }}>
                                <Text strong>其他指标（非数值型）</Text>
                              </Divider>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {otherMetrics.map(m => (
                                  <Tag key={m} color="blue">{m}</Tag>
                                ))}
                              </div>
                            </div>
                          )}
                          {numericMetrics.length === 0 && otherMetrics.length === 0 && (
                            <Empty description="暂无指标数据" style={{ padding: '40px 0' }} />
                          )}
                        </>
                      )}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px dashed #d9d9d9' }}>
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

      <Modal
        title="批量录入数据点"
        open={batchModalVisible}
        onOk={handleBatchSubmit}
        onCancel={() => setBatchModalVisible(false)}
        width={1000}
        okText="提交录入"
        cancelText="取消"
        confirmLoading={batchSubmitting}
        destroyOnClose
      >
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary">支持一次性录入多行数据，提交前请检查数据完整性</Text>
          <Button size="small" icon={<PlusOutlined />} onClick={addBatchRow}>
            新增一行
          </Button>
        </div>
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <Table
            dataSource={batchRows}
            columns={batchColumns}
            rowKey="key"
            pagination={false}
            size="small"
            scroll={{ x: 1000 }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Experiments;
