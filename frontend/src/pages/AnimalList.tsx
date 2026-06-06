import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Card, Table, Button, Space, Tag, Input, Select, Modal, Form,
  InputNumber, DatePicker, message, Popconfirm, Descriptions, Typography, Tooltip,
  Tabs, Timeline, Divider, Alert, AutoComplete,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, ReloadOutlined, SwapOutlined, MergeCellsOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { animalApi } from '../api';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const statusOptions = [
  { value: 'healthy', label: '健康', color: 'success' },
  { value: 'sick', label: '患病', color: 'error' },
  { value: 'in_experiment', label: '实验中', color: 'processing' },
  { value: 'deceased', label: '已死亡', color: 'default' },
  { value: 'quarantine', label: '隔离中', color: 'warning' },
];

const genderOptions = [
  { value: 'male', label: '雄性' },
  { value: 'female', label: '雌性' },
  { value: 'unknown', label: '未知' },
];

const operationTypeMap: Record<string, { label: string; color: string }> = {
  move_in: { label: '移入', color: 'success' },
  move_out: { label: '移出', color: 'default' },
  cage_split: { label: '分笼', color: 'processing' },
  cage_merge: { label: '合笼', color: 'warning' },
};

const AnimalList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [speciesFilter, setSpeciesFilter] = useState<string | undefined>();
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [cageList, setCageList] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<any>(null);
  const [detailAnimal, setDetailAnimal] = useState<any>(null);
  const [form] = Form.useForm();

  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [splitAnimals, setSplitAnimals] = useState<any[]>([]);
  const [splitTargetCage, setSplitTargetCage] = useState('');
  const [splitReason, setSplitReason] = useState('');
  const [splitLoading, setSplitLoading] = useState(false);

  const [mergeModalVisible, setMergeModalVisible] = useState(false);
  const [mergeTargetCage, setMergeTargetCage] = useState('');
  const [mergeReason, setMergeReason] = useState('');
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeCageGroups, setMergeCageGroups] = useState<Record<string, any[]>>({});

  const [transferLogs, setTransferLogs] = useState<any[]>([]);
  const [detailTabKey, setDetailTabKey] = useState('basic');

  const [statusFlowRules, setStatusFlowRules] = useState<any[]>([]);
  const [statusChangeLogs, setStatusChangeLogs] = useState<any[]>([]);
  const [changeReason, setChangeReason] = useState('');
  const [statusChanged, setStatusChanged] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasOpenedDetailRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await animalApi.getList({
        page, pageSize, keyword: keyword || undefined,
        status: statusFilter, species: speciesFilter,
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, statusFilter, speciesFilter]);

  const fetchSpecies = async () => {
    try {
      const res: any = await animalApi.getSpecies();
      setSpeciesList(Array.isArray(res) ? res : []);
    } catch {
      // handled
    }
  };

  const fetchCageList = async () => {
    try {
      const res: any = await animalApi.getList({ pageSize: 1000 });
      const cages = [...new Set((res?.list || []).map((a: any) => a.cageNumber).filter(Boolean))];
      setCageList(cages.sort());
    } catch {
      // handled
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchSpecies(); fetchCageList(); fetchStatusFlowRules(); }, []);

  useEffect(() => {
    const animalId = searchParams.get('animalId');
    if (animalId && !hasOpenedDetailRef.current) {
      hasOpenedDetailRef.current = true;
      const id = parseInt(animalId, 10);
      if (!isNaN(id)) {
        handleDetail(id);
      }
    }
  }, [searchParams]);

  const handleDetailClose = () => {
    setDetailVisible(false);
    if (searchParams.has('animalId')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('animalId');
      setSearchParams(newParams);
    }
  };

  const handleAdd = () => {
    setEditingAnimal(null);
    form.resetFields();
    form.setFieldsValue({ gender: 'unknown', status: 'healthy' });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingAnimal(record);
    form.setFieldsValue({
      ...record,
      birthDate: record.birthDate ? dayjs(record.birthDate) : null,
    });
    setChangeReason('');
    setStatusChanged(false);
    setModalVisible(true);
  };

  const handleDetail = async (id: number) => {
    try {
      const res: any = await animalApi.getDetail(id);
      setDetailAnimal(res);
      setDetailTabKey('basic');
      setTransferLogs([]);
      setStatusChangeLogs([]);
      setDetailVisible(true);
      fetchTransferLogs(id);
      fetchStatusChangeLogs(id);
    } catch {
      // handled
    }
  };

  const fetchTransferLogs = async (animalId: number) => {
    try {
      const res: any = await animalApi.getAnimalTransferLogs(animalId);
      setTransferLogs(Array.isArray(res) ? res : []);
    } catch {
      // handled
    }
  };

  const fetchStatusFlowRules = async () => {
    try {
      const res: any = await animalApi.getStatusFlowRules();
      setStatusFlowRules(Array.isArray(res) ? res : []);
    } catch {
      // handled
    }
  };

  const fetchStatusChangeLogs = async (animalId: number) => {
    try {
      const res: any = await animalApi.getStatusChangeLogs(animalId);
      setStatusChangeLogs(Array.isArray(res) ? res : []);
    } catch {
      // handled
    }
  };

  const getAllowedNextStatuses = (currentStatus: string): string[] => {
    return statusFlowRules
      .filter((edge: any) => edge.from === currentStatus)
      .map((edge: any) => edge.to);
  };

  const handleDelete = async (id: number) => {
    try {
      await animalApi.delete(id);
      message.success('删除成功');
      fetchData();
      fetchCageList();
    } catch {
      // handled
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: any = {
        ...values,
        birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : undefined,
      };

      if (editingAnimal) {
        if (values.status && values.status !== editingAnimal.status) {
          if (!changeReason.trim()) {
            message.warning('请填写状态变更原因');
            return;
          }
          payload.statusChangeReason = changeReason;
        }
        await animalApi.update(editingAnimal.id, payload);
        message.success('更新成功');
      } else {
        await animalApi.create(payload);
        message.success('添加成功');
      }
      setModalVisible(false);
      fetchData();
      fetchSpecies();
      fetchCageList();
    } catch {
      // validation or api error
    }
  };

  const handleRowSelectionChange = (keys: React.Key[], rows: any[]) => {
    setSelectedRowKeys(keys as number[]);
    setSelectedRows(rows);
  };

  const handleOpenSplit = () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择动物');
      return;
    }
    const cages = [...new Set(selectedRows.map(r => r.cageNumber).filter(Boolean))];
    if (cages.length > 1) {
      message.warning('分笼操作请选择同一笼位的动物');
      return;
    }
    setSplitAnimals([...selectedRows]);
    setSplitTargetCage('');
    setSplitReason('');
    setSplitModalVisible(true);
  };

  const handleSplitRemove = (id: number) => {
    setSplitAnimals(prev => prev.filter(a => a.id !== id));
  };

  const handleSplitSubmit = async () => {
    if (splitAnimals.length === 0) {
      message.warning('请至少保留一只动物');
      return;
    }
    if (!splitTargetCage.trim()) {
      message.warning('请输入目标笼号');
      return;
    }
    try {
      setSplitLoading(true);
      const res: any = await animalApi.cageSplit({
        animalIds: splitAnimals.map(a => a.id),
        targetCage: splitTargetCage.trim(),
        reason: splitReason || undefined,
      });
      let msg = `成功将 ${splitAnimals.length} 只动物分笼到 ${splitTargetCage}`;
      if (res?.sourceCageEmpty) {
        msg += `（原笼位 ${res.sourceCage} 已为空）`;
      }
      message.success(msg);
      setSplitModalVisible(false);
      setSelectedRowKeys([]);
      setSelectedRows([]);
      fetchData();
      fetchCageList();
    } catch {
      // handled
    } finally {
      setSplitLoading(false);
    }
  };

  const handleOpenMerge = () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择动物');
      return;
    }
    const groups: Record<string, any[]> = {};
    for (const animal of selectedRows) {
      const cage = animal.cageNumber || '未分笼';
      if (!groups[cage]) groups[cage] = [];
      groups[cage].push(animal);
    }
    setMergeCageGroups(groups);
    setMergeTargetCage('');
    setMergeReason('');
    setMergeModalVisible(true);
  };

  const handleMergeSubmit = async () => {
    if (!mergeTargetCage.trim()) {
      message.warning('请输入目标笼号');
      return;
    }
    const speciesSet = new Set(selectedRows.map(r => r.species));
    if (speciesSet.size > 1) {
      Modal.confirm({
        title: '不同物种合笼警告',
        content: `选中的动物包含不同物种：${Array.from(speciesSet).join('、')}，确定要合并到同一笼位吗？`,
        okText: '确认合笼',
        cancelText: '取消',
        onOk: async () => {
          await doMerge(true);
        },
      });
    } else {
      await doMerge(false);
    }
  };

  const doMerge = async (confirmSpeciesMixed: boolean) => {
    try {
      setMergeLoading(true);
      const res: any = await animalApi.cageMerge({
        animalIds: selectedRows.map(r => r.id),
        targetCage: mergeTargetCage.trim(),
        reason: mergeReason || undefined,
        confirmSpeciesMixed,
      });
      if (res?.success) {
        let msg = `成功将 ${res.count} 只动物合笼到 ${mergeTargetCage}`;
        if (res?.emptyCages?.length > 0) {
          msg += `（空笼：${res.emptyCages.join('、')}）`;
        }
        message.success(msg);
        setMergeModalVisible(false);
        setSelectedRowKeys([]);
        setSelectedRows([]);
        fetchData();
        fetchCageList();
      }
    } catch {
      // handled
    } finally {
      setMergeLoading(false);
    }
  };

  const columns = [
    {
      title: '编号',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      fixed: 'left' as const,
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    { title: '物种', dataIndex: 'species', key: 'species', width: 80 },
    { title: '品系', dataIndex: 'breed', key: 'breed', ellipsis: true },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 70,
      render: (g: string) => genderOptions.find(o => o.value === g)?.label || g,
    },
    {
      title: '体重(g)',
      dataIndex: 'weight',
      key: 'weight',
      width: 90,
      render: (w: number) => w ? `${w}g` : '-',
    },
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
    {
      title: '笼号',
      dataIndex: 'cageNumber',
      key: 'cageNumber',
      width: 90,
      render: (c: string) => c ? <Tag color="blue">{c}</Tag> : '-',
    },
    {
      title: '出生日期',
      dataIndex: 'birthDate',
      key: 'birthDate',
      width: 120,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '-',
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
          <Popconfirm title="确定删除该动物记录吗？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Tooltip title="删除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: handleRowSelectionChange,
  };

  const detailTabs = [
    {
      key: 'basic',
      label: '基本信息',
      children: detailAnimal && (
        <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small" style={{ marginTop: 16 }}>
          <Descriptions.Item label="编号">{detailAnimal.name}</Descriptions.Item>
          <Descriptions.Item label="物种">{detailAnimal.species}</Descriptions.Item>
          <Descriptions.Item label="品系">{detailAnimal.breed || '-'}</Descriptions.Item>
          <Descriptions.Item label="性别">{genderOptions.find(o => o.value === detailAnimal.gender)?.label}</Descriptions.Item>
          <Descriptions.Item label="体重">{detailAnimal.weight ? `${detailAnimal.weight}g` : '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusOptions.find(o => o.value === detailAnimal.status)?.color}>
              {statusOptions.find(o => o.value === detailAnimal.status)?.label}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="笼号">{detailAnimal.cageNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="RFID">{detailAnimal.rfidTag || '-'}</Descriptions.Item>
          <Descriptions.Item label="出生日期">{detailAnimal.birthDate ? dayjs(detailAnimal.birthDate).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
          <Descriptions.Item label="来源">{detailAnimal.source || '-'}</Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>{detailAnimal.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dayjs(detailAnimal.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{dayjs(detailAnimal.updatedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'cage-timeline',
      label: '笼位轨迹',
      children: (
        <div style={{ marginTop: 16 }}>
          {transferLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              暂无笼位变更记录
            </div>
          ) : (
            <Timeline
              mode="left"
              items={transferLogs.map((log: any) => {
                const opInfo = operationTypeMap[log.operationType] || { label: log.operationType, color: 'default' };
                return {
                  color: opInfo.color,
                  label: dayjs(log.operatedAt).format('YYYY-MM-DD HH:mm'),
                  children: (
                    <div>
                      <Space size={8}>
                        <Tag color={opInfo.color}>{opInfo.label}</Tag>
                        <Text strong>
                          {log.fromCage || '空'} → {log.toCage || '空'}
                        </Text>
                      </Space>
                      <div style={{ marginTop: 4, color: '#666', fontSize: 13 }}>
                        {log.reason && <span>原因：{log.reason}</span>}
                      </div>
                      <div style={{ marginTop: 2, color: '#999', fontSize: 12 }}>
                        操作人：{log.operator || '系统'}
                      </div>
                    </div>
                  ),
                };
              })}
            />
          )}
        </div>
      ),
    },
    {
      key: 'lifecycle',
      label: '生命周期',
      children: detailAnimal && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ marginBottom: 12 }}>状态流转图</Title>
            <div style={{ background: '#fafafa', borderRadius: 8, padding: 20, overflow: 'auto' }}>
              <svg width="600" height="280" viewBox="0 0 600 280" style={{ display: 'block', margin: '0 auto' }}>
                {statusFlowRules.map((edge: any, i: number) => {
                  const positions: Record<string, { x: number; y: number }> = {
                    quarantine: { x: 100, y: 40 },
                    healthy: { x: 300, y: 40 },
                    in_experiment: { x: 500, y: 40 },
                    sick: { x: 200, y: 160 },
                    deceased: { x: 400, y: 220 },
                  };
                  const from = positions[edge.from];
                  const to = positions[edge.to];
                  if (!from || !to) return null;
                  const isReachable = edge.from === detailAnimal.status;
                  const dx = to.x - from.x;
                  const dy = to.y - from.y;
                  const len = Math.sqrt(dx * dx + dy * dy);
                  if (len === 0) return null;
                  const nx = dx / len;
                  const ny = dy / len;
                  const startX = from.x + nx * 45;
                  const startY = from.y + ny * 22;
                  const endX = to.x - nx * 45;
                  const endY = to.y - ny * 22;
                  return (
                    <g key={i}>
                      <defs>
                        <marker id={`arrow-${i}`} markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                          <path d="M0,0 L0,6 L9,3 z" fill={isReachable ? '#52c41a' : '#bfbfbf'} />
                        </marker>
                      </defs>
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke={isReachable ? '#52c41a' : '#bfbfbf'}
                        strokeWidth={isReachable ? 2 : 1.5}
                        markerEnd={`url(#arrow-${i})`}
                      />
                      {edge.label && (
                        <text
                          x={(startX + endX) / 2}
                          y={(startY + endY) / 2 - 4}
                          textAnchor="middle"
                          fontSize="11"
                          fill={isReachable ? '#52c41a' : '#999'}
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}
                {[
                  { key: 'quarantine', label: '隔离中', x: 100, y: 40 },
                  { key: 'healthy', label: '健康', x: 300, y: 40 },
                  { key: 'in_experiment', label: '实验中', x: 500, y: 40 },
                  { key: 'sick', label: '患病', x: 200, y: 160 },
                  { key: 'deceased', label: '已死亡', x: 400, y: 220 },
                ].map((node) => {
                  const isCurrent = node.key === detailAnimal.status;
                  const allowedNext = getAllowedNextStatuses(detailAnimal.status);
                  const isReachable = allowedNext.includes(node.key);
                  let fillColor = '#fff';
                  let strokeColor = '#d9d9d9';
                  let textColor = '#666';
                  if (isCurrent) {
                    fillColor = '#e6f7ff';
                    strokeColor = '#1890ff';
                    textColor = '#1890ff';
                  } else if (isReachable) {
                    fillColor = '#f6ffed';
                    strokeColor = '#52c41a';
                    textColor = '#52c41a';
                  }
                  return (
                    <g key={node.key}>
                      <rect
                        x={node.x - 45}
                        y={node.y - 22}
                        width={90}
                        height={44}
                        rx={6}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isCurrent ? 2 : 1.5}
                      />
                      <text
                        x={node.x}
                        y={node.y + 5}
                        textAnchor="middle"
                        fontSize="13"
                        fontWeight={isCurrent ? 600 : 400}
                        fill={textColor}
                      >
                        {node.label}
                        {isCurrent && ' (当前)'}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12, color: '#888' }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#e6f7ff', border: '2px solid #1890ff', borderRadius: 2, marginRight: 4 }}></span>当前状态</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#f6ffed', border: '1.5px solid #52c41a', borderRadius: 2, marginRight: 4 }}></span>可达状态</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#fff', border: '1.5px solid #d9d9d9', borderRadius: 2, marginRight: 4 }}></span>其他状态</span>
            </div>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <div>
            <Title level={5} style={{ marginBottom: 12 }}>状态变更历史</Title>
            {statusChangeLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                暂无状态变更记录
              </div>
            ) : (
              <Timeline
                mode="left"
                items={statusChangeLogs.map((log: any) => {
                  const fromOpt = statusOptions.find(o => o.value === log.fromStatus);
                  const toOpt = statusOptions.find(o => o.value === log.toStatus);
                  return {
                    color: toOpt?.color || 'default',
                    label: dayjs(log.changedAt).format('YYYY-MM-DD HH:mm'),
                    children: (
                      <div>
                        <Space size={8} wrap>
                          <Tag color={fromOpt?.color}>{fromOpt?.label || log.fromStatus}</Tag>
                          <span style={{ color: '#999' }}>→</span>
                          <Tag color={toOpt?.color}>{toOpt?.label || log.toStatus}</Tag>
                        </Space>
                        <div style={{ marginTop: 6, color: '#666', fontSize: 13 }}>
                          {log.reason && <span>变更原因：{log.reason}</span>}
                        </div>
                        <div style={{ marginTop: 2, color: '#999', fontSize: 12 }}>
                          操作人：{log.operator || '系统'}
                          {log.experimentId && <span style={{ marginLeft: 12 }}>关联实验：#${log.experimentId}</span>}
                        </div>
                      </div>
                    ),
                  };
                })}
              />
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        title={<span style={{ fontWeight: 600 }}>动物信息管理</span>}
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <>
                <Button icon={<SwapOutlined />} onClick={handleOpenSplit}>
                  分笼 ({selectedRowKeys.length})
                </Button>
                <Button type="primary" icon={<MergeCellsOutlined />} onClick={handleOpenMerge}>
                  合笼 ({selectedRowKeys.length})
                </Button>
                <Divider type="vertical" />
              </>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加动物
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索动物编号"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => { setPage(1); fetchData(); }}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="物种筛选"
            allowClear
            style={{ width: 140 }}
            value={speciesFilter}
            onChange={(v) => { setSpeciesFilter(v); setPage(1); }}
          >
            {speciesList.map(s => <Option key={s} value={s}>{s}</Option>)}
          </Select>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
          >
            {statusOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setStatusFilter(undefined); setSpeciesFilter(undefined); setPage(1); }}>
            重置
          </Button>
        </div>

        <Table
          loading={loading}
          dataSource={data}
          columns={columns}
          rowKey="id"
          rowSelection={rowSelection}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <Modal
        title={editingAnimal ? '编辑动物信息' : '添加动物'}
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
            <Form.Item name="name" label="动物编号" rules={[{ required: true, message: '请输入动物编号' }]}>
              <Input placeholder="如 M-001" />
            </Form.Item>
            <Form.Item name="species" label="物种" rules={[{ required: true, message: '请输入物种' }]}>
              <Input placeholder="如 小鼠" />
            </Form.Item>
            <Form.Item name="breed" label="品系/品种">
              <Input placeholder="如 C57BL/6" />
            </Form.Item>
            <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
              <Select>
                {genderOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="birthDate" label="出生日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="weight" label="体重(g)">
              <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
            </Form.Item>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true }]}
            >
              <Select
                onChange={(value) => {
                  if (editingAnimal && value !== editingAnimal.status) {
                    setStatusChanged(true);
                  } else {
                    setStatusChanged(false);
                    setChangeReason('');
                  }
                }}
              >
                {editingAnimal
                  ? (() => {
                      const allowed = getAllowedNextStatuses(editingAnimal.status);
                      const options = statusOptions.filter(
                        o => o.value === editingAnimal.status || allowed.includes(o.value)
                      );
                      return options.map(o => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                          {o.value === editingAnimal.status ? ' (当前)' : ''}
                        </Option>
                      ));
                    })()
                  : statusOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)
                }
              </Select>
            </Form.Item>
            {editingAnimal && statusChanged && (
              <Form.Item
                label="变更原因"
                required
                style={{ gridColumn: '1 / -1' }}
              >
                <TextArea
                  rows={2}
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="请填写状态变更的原因"
                />
              </Form.Item>
            )}
            <Form.Item name="cageNumber" label="笼号">
              <Input placeholder="如 A-101" />
            </Form.Item>
            <Form.Item name="rfidTag" label="RFID标签">
              <Input placeholder="RFID标签号" />
            </Form.Item>
            <Form.Item name="source" label="来源">
              <Input placeholder="动物来源机构" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="备注">
            <TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="动物详细信息"
        open={detailVisible}
        onCancel={handleDetailClose}
        footer={null}
        width={750}
        destroyOnClose
      >
        <Tabs
          activeKey={detailTabKey}
          onChange={setDetailTabKey}
          items={detailTabs}
        />
      </Modal>

      <Modal
        title="分笼操作"
        open={splitModalVisible}
        onOk={handleSplitSubmit}
        onCancel={() => setSplitModalVisible(false)}
        width={720}
        okText="确认分笼"
        cancelText="取消"
        confirmLoading={splitLoading}
        destroyOnClose
      >
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <div style={{ flex: 1, border: '1px solid #e8e8e8', borderRadius: 8, padding: 12, maxHeight: 360, overflow: 'auto' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>已选动物（{splitAnimals.length}只）</div>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>点击 × 可取消选择</div>
            <Space size={[8, 8]} wrap>
              {splitAnimals.map(a => (
                <Tag
                  key={a.id}
                  color="blue"
                  closable
                  onClose={(e) => { e.preventDefault(); handleSplitRemove(a.id); }}
                  style={{ padding: '4px 8px' }}
                >
                  {a.name} ({a.species})
                </Tag>
              ))}
            </Space>
          </div>
          <div style={{ width: 260, border: '1px solid #e8e8e8', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>目标笼号</div>
            <AutoComplete
              placeholder="输入或选择笼号"
              value={splitTargetCage}
              onChange={setSplitTargetCage}
              style={{ width: '100%' }}
              options={cageList.map(c => ({ value: c }))}
              allowClear
            />
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>操作原因</div>
              <TextArea
                rows={4}
                value={splitReason}
                onChange={(e) => setSplitReason(e.target.value)}
                placeholder="请输入分笼原因（可选）"
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title="合笼操作"
        open={mergeModalVisible}
        onOk={handleMergeSubmit}
        onCancel={() => setMergeModalVisible(false)}
        width={720}
        okText="确认合笼"
        cancelText="取消"
        confirmLoading={mergeLoading}
        destroyOnClose
      >
        <div style={{ marginTop: 16 }}>
          <Alert
            message={`选中 ${selectedRows.length} 只动物，来自 ${Object.keys(mergeCageGroups).length} 个笼位`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, maxHeight: 300, overflow: 'auto' }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>按笼位分组</div>
              {Object.entries(mergeCageGroups).map(([cage, animals]) => (
                <div key={cage} style={{ marginBottom: 12, padding: 10, background: '#fafafa', borderRadius: 6 }}>
                  <div style={{ fontWeight: 500, marginBottom: 6 }}>
                    <Tag color="blue">{cage}</Tag>
                    <span style={{ color: '#888', fontSize: 12 }}>共 {animals.length} 只</span>
                  </div>
                  <Space size={[6, 6]} wrap>
                    {animals.map(a => (
                      <Tag key={a.id}>{a.name}</Tag>
                    ))}
                  </Space>
                </div>
              ))}
            </div>

            <div style={{ width: 260 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>目标笼号</div>
            <AutoComplete
              placeholder="输入或选择笼号"
              value={mergeTargetCage}
              onChange={setMergeTargetCage}
              style={{ width: '100%' }}
              options={cageList.map(c => ({ value: c }))}
              allowClear
            />
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>操作原因</div>
                <TextArea
                  rows={4}
                  value={mergeReason}
                  onChange={(e) => setMergeReason(e.target.value)}
                  placeholder="请输入合笼原因（可选）"
                />
              </div>
              <div style={{ marginTop: 12, color: '#faad14', fontSize: 12 }}>
                提示：不同物种合笼将弹出二次确认
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AnimalList;
