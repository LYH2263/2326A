import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Card,
  Calendar,
  Drawer,
  List,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  message,
  Popconfirm,
  Tooltip,
  Typography,
  Row,
  Col,
  Divider,
  Steps,
  InputNumber,
  Badge,
  Empty,
} from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  FilterOutlined,
  ReloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  ApartmentOutlined,
  RightOutlined,
  LeftOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { checkupScheduleApi, animalApi } from '../api';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { Step } = Steps;

const priorityOptions = [
  { value: 'normal', label: '普通', color: 'default' as const, dotColor: '#52c41a' },
  { value: 'high', label: '高', color: 'warning' as const, dotColor: '#faad14' },
  { value: 'urgent', label: '紧急', color: 'error' as const, dotColor: '#ff4d4f' },
];

const statusOptions = [
  { value: 'scheduled', label: '已排期', color: 'processing' as const },
  { value: 'completed', label: '已完成', color: 'success' as const },
  { value: 'missed', label: '已错过', color: 'error' as const },
  { value: 'cancelled', label: '已取消', color: 'default' as const },
];

const checkTypeOptions = [
  { value: 'routine', label: '常规体检' },
  { value: 'pre_experiment', label: '实验前检查' },
  { value: 'post_treatment', label: '治疗后复查' },
  { value: 'follow_up', label: '随访复查' },
];

const timeSlotOptions = [
  { value: 'morning', label: '上午' },
  { value: 'afternoon', label: '下午' },
];

const conditionOptions = [
  { value: 'normal', label: '正常', color: 'success' },
  { value: 'abnormal', label: '异常', color: 'warning' },
  { value: 'critical', label: '危急', color: 'error' },
];

const CheckupSchedules: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [veterinarians, setVeterinarians] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [daySchedules, setDaySchedules] = useState<any[]>([]);

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [form] = Form.useForm();

  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completingSchedule, setCompletingSchedule] = useState<any>(null);
  const [completeForm] = Form.useForm();

  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [batchStep, setBatchStep] = useState(0);
  const [batchForm] = Form.useForm();
  const [batchPreview, setBatchPreview] = useState<any[]>([]);

  const [filterVet, setFilterVet] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterPriority, setFilterPriority] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  const [animalFilterMode, setAnimalFilterMode] = useState<'cage' | 'species' | 'all'>('all');
  const [cageList, setCageList] = useState<string[]>([]);
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [selectedAnimals, setSelectedAnimals] = useState<number[]>([]);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const start = currentMonth.startOf('month').format('YYYY-MM-DD');
      const end = currentMonth.endOf('month').format('YYYY-MM-DD');
      const res: any = await checkupScheduleApi.getByDateRange(start, end, {
        veterinarian: filterVet,
        checkType: filterType,
        priority: filterPriority,
        status: filterStatus,
      });
      setSchedules(res || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [currentMonth, filterVet, filterType, filterPriority, filterStatus]);

  const fetchAnimals = useCallback(async () => {
    try {
      const res: any = await animalApi.getList({ page: 1, pageSize: 200 });
      const list = res?.list || [];
      setAnimals(list);

      const cages = Array.from(new Set(list.map((a: any) => a.cageNumber).filter(Boolean))) as string[];
      const species = Array.from(new Set(list.map((a: any) => a.species).filter(Boolean))) as string[];
      setCageList(cages);
      setSpeciesList(species);
    } catch {
      // handled
    }
  }, []);

  const fetchVeterinarians = useCallback(async () => {
    try {
      const res: any = await checkupScheduleApi.getVeterinarians();
      setVeterinarians(res || []);
    } catch {
      // handled
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    fetchAnimals();
    fetchVeterinarians();
  }, [fetchAnimals, fetchVeterinarians]);

  const getSchedulesByDate = useCallback((date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    return schedules.filter((s) => dayjs(s.scheduledDate).format('YYYY-MM-DD') === dateStr);
  }, [schedules]);

  const dateCellRender = (value: Dayjs) => {
    const dayScheds = getSchedulesByDate(value);
    if (dayScheds.length === 0) return null;

    const priorityCounts: Record<string, number> = {};
    for (const s of dayScheds) {
      priorityCounts[s.priority] = (priorityCounts[s.priority] || 0) + 1;
    }

    return (
      <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 4, flexWrap: 'wrap' }}>
        {priorityOptions.map((p) =>
          priorityCounts[p.value] ? (
            <Tooltip key={p.value} title={`${p.label}: ${priorityCounts[p.value]}项`}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: p.dotColor,
                }}
              />
            </Tooltip>
          ) : null,
        )}
      </div>
    );
  };

  const handleDateSelect = (value: Dayjs) => {
    setSelectedDate(value);
    setDaySchedules(getSchedulesByDate(value));
    setDrawerOpen(true);
  };

  const handleMonthChange = (value: Dayjs) => {
    setCurrentMonth(value);
  };

  const handleAdd = () => {
    setEditingSchedule(null);
    form.resetFields();
    form.setFieldsValue({
      scheduledDate: selectedDate,
      timeSlot: 'morning',
      checkType: 'routine',
      priority: 'normal',
      status: 'scheduled',
    });
    setFormModalVisible(true);
  };

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    form.setFieldsValue({
      ...schedule,
      scheduledDate: schedule.scheduledDate ? dayjs(schedule.scheduledDate) : null,
    });
    setFormModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await checkupScheduleApi.delete(id);
      message.success('删除成功');
      fetchSchedules();
      if (drawerOpen) {
        setDaySchedules(getSchedulesByDate(selectedDate));
      }
    } catch {
      // handled
    }
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        scheduledDate: values.scheduledDate?.format('YYYY-MM-DD'),
      };

      if (editingSchedule) {
        await checkupScheduleApi.update(editingSchedule.id, payload);
        message.success('更新成功');
      } else {
        await checkupScheduleApi.create(payload);
        message.success('创建成功');
      }
      setFormModalVisible(false);
      fetchSchedules();
      if (drawerOpen) {
        setDaySchedules(getSchedulesByDate(selectedDate));
      }
    } catch {
      // handled
    }
  };

  const handleComplete = (schedule: any) => {
    setCompletingSchedule(schedule);
    completeForm.resetFields();
    completeForm.setFieldsValue({
      checkDate: dayjs(schedule.scheduledDate),
      veterinarian: schedule.veterinarian,
      condition: 'normal',
    });
    setCompleteModalVisible(true);
  };

  const handleCompleteSubmit = async () => {
    try {
      const values = await completeForm.validateFields();
      const payload = {
        ...values,
        checkDate: values.checkDate?.format('YYYY-MM-DD'),
        nextCheckDate: values.nextCheckDate?.format('YYYY-MM-DD'),
      };

      await checkupScheduleApi.complete(completingSchedule.id, payload);
      message.success('完成排班，已创建健康记录');
      setCompleteModalVisible(false);
      fetchSchedules();
      if (drawerOpen) {
        setDaySchedules(getSchedulesByDate(selectedDate));
      }
    } catch {
      // handled
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await checkupScheduleApi.cancel(id);
      message.success('已取消排班');
      fetchSchedules();
      if (drawerOpen) {
        setDaySchedules(getSchedulesByDate(selectedDate));
      }
    } catch {
      // handled
    }
  };

  const handleBatchOpen = () => {
    setBatchStep(0);
    setSelectedAnimals([]);
    setAnimalFilterMode('all');
    batchForm.resetFields();
    batchForm.setFieldsValue({
      startDate: selectedDate,
      intervalDays: 7,
      times: 4,
      timeSlot: 'morning',
      checkType: 'routine',
      priority: 'normal',
    });
    setBatchPreview([]);
    setBatchModalVisible(true);
  };

  const handleAnimalSelectionChange = (value: number[]) => {
    setSelectedAnimals(value);
  };

  const getFilteredAnimals = () => {
    let list = animals;
    const cageFilter = batchForm.getFieldValue('cageNumber');
    const speciesFilter = batchForm.getFieldValue('species');

    if (animalFilterMode === 'cage' && cageFilter) {
      list = list.filter((a: any) => a.cageNumber === cageFilter);
    }
    if (animalFilterMode === 'species' && speciesFilter) {
      list = list.filter((a: any) => a.species === speciesFilter);
    }
    return list;
  };

  const generateBatchPreview = () => {
    const values = batchForm.getFieldsValue();
    const animalIds = selectedAnimals;

    if (animalIds.length === 0) {
      message.warning('请先选择动物');
      return;
    }
    if (!values.startDate || !values.intervalDays || !values.times) {
      message.warning('请填写完整的排班规则');
      return;
    }

    const preview: any[] = [];
    const start = dayjs(values.startDate);

    for (const animalId of animalIds) {
      const animal = animals.find((a: any) => a.id === animalId);
      for (let i = 0; i < values.times; i++) {
        const date = start.add(i * values.intervalDays, 'day');
        preview.push({
          animalId,
          animalName: animal?.name || `#${animalId}`,
          species: animal?.species,
          scheduledDate: date.format('YYYY-MM-DD'),
          timeSlot: values.timeSlot,
          checkType: values.checkType,
          priority: values.priority,
          veterinarian: values.veterinarian,
        });
      }
    }

    setBatchPreview(preview);
    setBatchStep(2);
  };

  const handleBatchSubmit = async () => {
    try {
      const values = batchForm.getFieldsValue();
      const payload = {
        animalIds: selectedAnimals,
        startDate: values.startDate.format('YYYY-MM-DD'),
        intervalDays: values.intervalDays,
        times: values.times,
        timeSlot: values.timeSlot,
        checkType: values.checkType,
        priority: values.priority,
        veterinarian: values.veterinarian,
        notes: values.notes,
      };

      const res: any = await checkupScheduleApi.batchCreate(payload);
      message.success(`成功创建 ${res?.count || 0} 条排班`);
      setBatchModalVisible(false);
      fetchSchedules();
      if (drawerOpen) {
        setDaySchedules(getSchedulesByDate(selectedDate));
      }
    } catch {
      // handled
    }
  };

  const getStatusTag = (status: string) => {
    const opt = statusOptions.find((o) => o.value === status);
    return <Tag color={opt?.color}>{opt?.label || status}</Tag>;
  };

  const getPriorityTag = (priority: string) => {
    const opt = priorityOptions.find((o) => o.value === priority);
    return <Tag color={opt?.color}>{opt?.label || priority}</Tag>;
  };

  const getCheckTypeLabel = (type: string) => {
    const opt = checkTypeOptions.find((o) => o.value === type);
    return opt?.label || type;
  };

  const getTimeSlotLabel = (slot: string) => {
    const opt = timeSlotOptions.find((o) => o.value === slot);
    return opt?.label || slot;
  };

  const resetFilters = () => {
    setFilterVet(undefined);
    setFilterType(undefined);
    setFilterPriority(undefined);
    setFilterStatus(undefined);
  };

  const monthStats = useMemo(() => {
    const total = schedules.length;
    const completed = schedules.filter((s) => s.status === 'completed').length;
    const missed = schedules.filter((s) => s.status === 'missed').length;
    const scheduled = schedules.filter((s) => s.status === 'scheduled').length;
    return { total, completed, missed, scheduled };
  }, [schedules]);

  return (
    <div>
      <Row gutter={16}>
        <Col span={18}>
          <Card
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            title={
              <Space>
                <CalendarOutlined style={{ color: '#1677ff' }} />
                <span style={{ fontWeight: 600 }}>体检排班日历</span>
              </Space>
            }
            extra={
              <Space>
                <Button icon={<PlusOutlined />} type="primary" onClick={handleBatchOpen}>
                  批量排班
                </Button>
                <Button icon={<PlusOutlined />} onClick={handleAdd}>
                  新增排班
                </Button>
              </Space>
            }
          >
            <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Space size={16}>
                <Text type="secondary">本月统计：</Text>
                <Badge count={monthStats.total} showZero style={{ backgroundColor: '#1677ff' }}>
                  <Tag color="processing">总计</Tag>
                </Badge>
                <Badge count={monthStats.scheduled} showZero style={{ backgroundColor: '#1890ff' }}>
                  <Tag color="processing">待检查</Tag>
                </Badge>
                <Badge count={monthStats.completed} showZero style={{ backgroundColor: '#52c41a' }}>
                  <Tag color="success">已完成</Tag>
                </Badge>
                <Badge count={monthStats.missed} showZero style={{ backgroundColor: '#ff4d4f' }}>
                  <Tag color="error">已错过</Tag>
                </Badge>
              </Space>
            </div>

            <Calendar
              cellRender={dateCellRender}
              onSelect={handleDateSelect}
              onPanelChange={handleMonthChange}
              fullscreen={false}
              style={{ border: 'none' }}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            title={
              <Space>
                <FilterOutlined style={{ color: '#722ed1' }} />
                <span style={{ fontWeight: 600 }}>筛选条件</span>
              </Space>
            }
            extra={
              <Button type="text" size="small" icon={<ReloadOutlined />} onClick={resetFilters}>
                重置
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  负责兽医
                </Text>
                <Select
                  placeholder="选择兽医"
                  allowClear
                  style={{ width: '100%' }}
                  value={filterVet}
                  onChange={(v) => setFilterVet(v)}
                >
                  {veterinarians.map((v) => (
                    <Option key={v} value={v}>
                      {v}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  检查类型
                </Text>
                <Select
                  placeholder="选择类型"
                  allowClear
                  style={{ width: '100%' }}
                  value={filterType}
                  onChange={(v) => setFilterType(v)}
                >
                  {checkTypeOptions.map((o) => (
                    <Option key={o.value} value={o.value}>
                      {o.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  优先级
                </Text>
                <Select
                  placeholder="选择优先级"
                  allowClear
                  style={{ width: '100%' }}
                  value={filterPriority}
                  onChange={(v) => setFilterPriority(v)}
                >
                  {priorityOptions.map((o) => (
                    <Option key={o.value} value={o.value}>
                      {o.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  状态
                </Text>
                <Select
                  placeholder="选择状态"
                  allowClear
                  style={{ width: '100%' }}
                  value={filterStatus}
                  onChange={(v) => setFilterStatus(v)}
                >
                  {statusOptions.map((o) => (
                    <Option key={o.value} value={o.value}>
                      {o.label}
                    </Option>
                  ))}
                </Select>
              </div>
            </Space>

            <Divider style={{ margin: '16px 0' }} />

            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                优先级图例
              </Text>
              <Space direction="vertical" size="small">
                {priorityOptions.map((p) => (
                  <div key={p.value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: p.dotColor,
                        display: 'inline-block',
                      }}
                    />
                    <span style={{ fontSize: 13 }}>{p.label}</span>
                  </div>
                ))}
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 每日排班 Drawer */}
      <Drawer
        title={
          <Space>
            <CalendarOutlined />
            <span>{selectedDate.format('YYYY年MM月DD日')} 排班</span>
            <Tag color="blue">{daySchedules.length} 项</Tag>
          </Space>
        }
        placement="right"
        width={480}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAdd}>
            新增
          </Button>
        }
      >
        {daySchedules.length === 0 ? (
          <Empty description="当日暂无排班" style={{ marginTop: 60 }} />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={daySchedules}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                style={{
                  padding: '16px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
                extra={
                  <Space>
                    {item.status === 'scheduled' && (
                      <>
                        <Tooltip title="完成">
                          <Button
                            type="text"
                            size="small"
                            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            onClick={() => handleComplete(item)}
                          />
                        </Tooltip>
                        <Tooltip title="编辑">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(item)}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="确定取消此排班？"
                          onConfirm={() => handleCancel(item.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Tooltip title="取消">
                            <Button type="text" size="small" danger icon={<CloseOutlined />} />
                          </Tooltip>
                        </Popconfirm>
                      </>
                    )}
                    {item.status === 'completed' && (
                      <Tooltip title="查看健康记录">
                        <Button
                          type="text"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => {
                            message.info('跳转至健康记录（功能待完善）');
                          }}
                        />
                      </Tooltip>
                    )}
                    <Popconfirm
                      title="确定删除？"
                      onConfirm={() => handleDelete(item.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Tooltip title="删除">
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                }
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{item.animal?.name || `#${item.animalId}`}</Text>
                      {getStatusTag(item.status)}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Space size={8}>
                        <Tag color="default">{item.animal?.species}</Tag>
                        {getPriorityTag(item.priority)}
                        <Tag color="blue">{getCheckTypeLabel(item.checkType)}</Tag>
                      </Space>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, color: '#666' }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {getTimeSlotLabel(item.timeSlot)}
                        </span>
                        {item.veterinarian && (
                          <span style={{ fontSize: 13, color: '#666' }}>
                            <UserOutlined style={{ marginRight: 4 }} />
                            {item.veterinarian}
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          备注：{item.notes}
                        </Text>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>

      {/* 新增/编辑排班 Modal */}
      <Modal
        title={editingSchedule ? '编辑排班' : '新增排班'}
        open={formModalVisible}
        onOk={handleFormSubmit}
        onCancel={() => setFormModalVisible(false)}
        width={560}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="animalId" label="动物" rules={[{ required: true, message: '请选择动物' }]}>
                <Select showSearch optionFilterProp="children" placeholder="选择动物">
                  {animals.map((a: any) => (
                    <Option key={a.id} value={a.id}>
                      {a.name} ({a.species})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="scheduledDate" label="计划日期" rules={[{ required: true, message: '请选择日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="timeSlot" label="时间段">
                <Select placeholder="选择时间段">
                  {timeSlotOptions.map((o) => (
                    <Option key={o.value} value={o.value}>
                      {o.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="veterinarian" label="负责兽医">
                <Input placeholder="兽医姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="checkType" label="检查类型">
                <Select placeholder="选择类型">
                  {checkTypeOptions.map((o) => (
                    <Option key={o.value} value={o.value}>
                      {o.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级">
                <Select placeholder="选择优先级">
                  {priorityOptions.map((o) => (
                    <Option key={o.value} value={o.value}>
                      {o.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {editingSchedule && (
            <Form.Item name="status" label="状态">
              <Select placeholder="选择状态">
                {statusOptions.map((o) => (
                  <Option key={o.value} value={o.value}>
                    {o.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="其他备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 完成排班 Modal */}
      <Modal
        title="完成排班 - 录入健康记录"
        open={completeModalVisible}
        onOk={handleCompleteSubmit}
        onCancel={() => setCompleteModalVisible(false)}
        width={640}
        okText="确认完成"
        cancelText="取消"
        destroyOnClose
      >
        {completingSchedule && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <Space direction="vertical" size="small">
              <Text strong>
                {completingSchedule.animal?.name || `#${completingSchedule.animalId}`} -{' '}
                {getCheckTypeLabel(completingSchedule.checkType)}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                计划日期：{dayjs(completingSchedule.scheduledDate).format('YYYY-MM-DD')} ·{' '}
                {getTimeSlotLabel(completingSchedule.timeSlot)}
              </Text>
            </Space>
          </div>
        )}
        <Form form={completeForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="checkDate" label="检查日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="condition" label="健康状况" rules={[{ required: true }]}>
                <Select>
                  {conditionOptions.map((o) => (
                    <Option key={o.value} value={o.value}>
                      {o.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="temperature" label="体温(℃)">
                <InputNumber style={{ width: '100%' }} min={30} max={45} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="weight" label="体重(g)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="heartRate" label="心率(次/分)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="respiratoryRate" label="呼吸频率(次/分)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="veterinarian" label="兽医">
                <Input placeholder="兽医姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nextCheckDate" label="下次检查日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="diagnosis" label="诊断">
            <TextArea rows={2} placeholder="诊断结果" />
          </Form.Item>
          <Form.Item name="treatment" label="治疗方案">
            <TextArea rows={2} placeholder="治疗方案" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="其他备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量排班 Modal */}
      <Modal
        title="批量排班"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        width={720}
        footer={null}
        destroyOnClose
      >
        <Steps current={batchStep} style={{ marginBottom: 24 }}>
          <Step title="选择动物" icon={<TeamOutlined />} />
          <Step title="设置规则" icon={<CalendarOutlined />} />
          <Step title="预览确认" icon={<EyeOutlined />} />
        </Steps>

        {batchStep === 0 && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Button
                type={animalFilterMode === 'all' ? 'primary' : 'default'}
                onClick={() => setAnimalFilterMode('all')}
                icon={<TeamOutlined />}
              >
                全部动物
              </Button>
              <Button
                type={animalFilterMode === 'cage' ? 'primary' : 'default'}
                onClick={() => setAnimalFilterMode('cage')}
                icon={<ApartmentOutlined />}
              >
                按笼位
              </Button>
              <Button
                type={animalFilterMode === 'species' ? 'primary' : 'default'}
                onClick={() => setAnimalFilterMode('species')}
                icon={<UserOutlined />}
              >
                按物种
              </Button>
            </Space>

            <Form form={batchForm} layout="vertical">
              {animalFilterMode === 'cage' && (
                <Form.Item name="cageNumber" label="选择笼位">
                  <Select
                    placeholder="选择笼位"
                    style={{ width: '100%' }}
                    onChange={() => setSelectedAnimals([])}
                  >
                    {cageList.map((c) => (
                      <Option key={c} value={c}>
                        {c}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
              {animalFilterMode === 'species' && (
                <Form.Item name="species" label="选择物种">
                  <Select
                    placeholder="选择物种"
                    style={{ width: '100%' }}
                    onChange={() => setSelectedAnimals([])}
                  >
                    {speciesList.map((s) => (
                      <Option key={s} value={s}>
                        {s}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              <Form.Item label="选择动物" required>
                <Select
                  mode="multiple"
                  placeholder="选择要排班的动物"
                  style={{ width: '100%' }}
                  value={selectedAnimals}
                  onChange={handleAnimalSelectionChange}
                  showSearch
                  optionFilterProp="children"
                  maxTagCount={6}
                  listHeight={300}
                >
                  {getFilteredAnimals().map((a: any) => (
                    <Option key={a.id} value={a.id}>
                      {a.name} ({a.species} - {a.cageNumber || '无笼位'})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Button type="primary" icon={<RightOutlined />} onClick={() => setBatchStep(1)}>
                下一步
              </Button>
            </div>
          </div>
        )}

        {batchStep === 1 && (
          <div>
            <Form form={batchForm} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="startDate" label="开始日期" rules={[{ required: true }]}>
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="timeSlot" label="时间段">
                    <Select placeholder="选择时间段">
                      {timeSlotOptions.map((o) => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="intervalDays" label="间隔天数" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={1} max={365} addonAfter="天" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="times" label="重复次数" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={1} max={100} addonAfter="次" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="checkType" label="检查类型">
                    <Select placeholder="选择类型">
                      {checkTypeOptions.map((o) => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="priority" label="优先级">
                    <Select placeholder="选择优先级">
                      {priorityOptions.map((o) => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="veterinarian" label="负责兽医">
                <Input placeholder="兽医姓名" />
              </Form.Item>
              <Form.Item name="notes" label="备注">
                <TextArea rows={2} placeholder="其他备注" />
              </Form.Item>
            </Form>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <Button icon={<LeftOutlined />} onClick={() => setBatchStep(0)}>
                上一步
              </Button>
              <Button type="primary" icon={<RightOutlined />} onClick={generateBatchPreview}>
                生成预览
              </Button>
            </div>
          </div>
        )}

        {batchStep === 2 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>预览结果</Text>
              <Tag color="blue" style={{ marginLeft: 8 }}>
                共 {batchPreview.length} 条排班
              </Tag>
            </div>
            <div
              style={{
                maxHeight: 300,
                overflow: 'auto',
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 8,
              }}
            >
              {batchPreview.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: index < batchPreview.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <Space>
                    <Text strong>{item.animalName}</Text>
                    <Tag color="default">{item.species}</Tag>
                    <Tag color="blue">{getCheckTypeLabel(item.checkType)}</Tag>
                  </Space>
                  <Space>
                    <Text type="secondary">{item.scheduledDate}</Text>
                    {getPriorityTag(item.priority)}
                  </Space>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <Button icon={<LeftOutlined />} onClick={() => setBatchStep(1)}>
                上一步
              </Button>
              <Button type="primary" onClick={handleBatchSubmit}>
                确认创建
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CheckupSchedules;
