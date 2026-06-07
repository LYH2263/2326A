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
  TimePicker,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Tooltip,
  Typography,
  Row,
  Col,
  Divider,
  Badge,
  Empty,
  Tabs,
  Radio,
  Checkbox,
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
  CoffeeOutlined,
  ApartmentOutlined,
  BugOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SwapRightOutlined,
  ScheduleOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { feedingPlanApi, animalApi } from '../api';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const statusOptions = [
  { value: 'active', label: '启用中', color: 'success' as const },
  { value: 'paused', label: '已暂停', color: 'warning' as const },
  { value: 'expired', label: '已过期', color: 'default' as const },
];

const taskStatusOptions = [
  { value: 'pending', label: '待执行', color: 'processing' as const },
  { value: 'completed', label: '已完成', color: 'success' as const },
  { value: 'missed', label: '已错过', color: 'error' as const },
  { value: 'cancelled', label: '已取消', color: 'default' as const },
];

const repeatTypeOptions = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'cron', label: '自定义(Cron)' },
];

const weekDays = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
];

const targetTypeOptions = [
  { value: 'animal', label: '指定动物', icon: <BugOutlined /> },
  { value: 'cage', label: '指定笼位', icon: <ApartmentOutlined /> },
];

const FeedingPlans: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [plans, setPlans] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [feeders, setFeeders] = useState<string[]>([]);
  const [cageList, setCageList] = useState<string[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [dayTasks, setDayTasks] = useState<any[]>([]);
  const [dayPlans, setDayPlans] = useState<any[]>([]);

  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm] = Form.useForm();

  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completingTask, setCompletingTask] = useState<any>(null);
  const [completeForm] = Form.useForm();

  const [filterFeeder, setFilterFeeder] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterTargetType, setFilterTargetType] = useState<string | undefined>();

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const start = currentDate.startOf(viewMode === 'month' ? 'month' : 'week').format('YYYY-MM-DD');
      const end = currentDate.endOf(viewMode === 'month' ? 'month' : 'week').format('YYYY-MM-DD');
      const res: any = await feedingPlanApi.getPlansByDateRange(start, end, {
        feeder: filterFeeder,
        status: filterStatus,
        targetType: filterTargetType,
      });
      setPlans(res || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode, filterFeeder, filterStatus, filterTargetType]);

  const fetchTasks = useCallback(async () => {
    try {
      const start = currentDate.startOf(viewMode === 'month' ? 'month' : 'week').format('YYYY-MM-DD');
      const end = currentDate.endOf(viewMode === 'month' ? 'month' : 'week').format('YYYY-MM-DD');
      const res: any = await feedingPlanApi.getTasksByDateRange(start, end, {
        feeder: filterFeeder,
      });
      setTasks(res || []);
    } catch {
      // handled
    }
  }, [currentDate, viewMode, filterFeeder]);

  const fetchAnimals = useCallback(async () => {
    try {
      const res: any = await animalApi.getList({ page: 1, pageSize: 200 });
      const list = res?.list || [];
      setAnimals(list);
      const cages = Array.from(new Set(list.map((a: any) => a.cageNumber).filter(Boolean))) as string[];
      setCageList(cages);
    } catch {
      // handled
    }
  }, []);

  const fetchFeeders = useCallback(async () => {
    try {
      const res: any = await feedingPlanApi.getFeeders();
      setFeeders(res || []);
    } catch {
      // handled
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchTasks();
  }, [fetchPlans, fetchTasks]);

  useEffect(() => {
    fetchAnimals();
    fetchFeeders();
  }, [fetchAnimals, fetchFeeders]);

  const getTasksByDate = useCallback((date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    return tasks.filter((t) => dayjs(t.taskDate).format('YYYY-MM-DD') === dateStr);
  }, [tasks]);

  const getPlansForDate = useCallback((date: Dayjs) => {
    const dayOfWeek = date.day() === 0 ? 7 : date.day();
    return plans.filter((plan) => {
      const planStart = dayjs(plan.startDate);
      const planEnd = plan.endDate ? dayjs(plan.endDate) : dayjs('2099-12-31');
      if (date.isBefore(planStart, 'day') || date.isAfter(planEnd, 'day')) {
        return false;
      }
      if (plan.repeatType === 'daily') return true;
      if (plan.repeatType === 'weekly') {
        if (!plan.repeatDays) return false;
        const days = plan.repeatDays.split(',').map(Number);
        return days.includes(dayOfWeek);
      }
      return true;
    });
  }, [plans]);

  const dateCellRender = (value: Dayjs) => {
    const dayTasks = getTasksByDate(value);
    if (dayTasks.length === 0) return null;

    const statusCounts: Record<string, number> = {};
    for (const t of dayTasks) {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    }

    const statusColors: Record<string, string> = {
      pending: '#1890ff',
      completed: '#52c41a',
      missed: '#ff4d4f',
      cancelled: '#bfbfbf',
    };

    return (
      <div style={{ marginTop: 4 }}>
        <div style={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {Object.entries(statusCounts).map(([status, count]) => (
            <Tooltip key={status} title={`${taskStatusOptions.find(o => o.value === status)?.label}: ${count}项`}>
              <span
                style={{
                  display: 'inline-block',
                  minWidth: 18,
                  height: 16,
                  lineHeight: '14px',
                  textAlign: 'center',
                  fontSize: 10,
                  padding: '0 4px',
                  borderRadius: 8,
                  color: '#fff',
                  backgroundColor: statusColors[status],
                }}
              >
                {count}
              </span>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  };

  const handleDateSelect = (value: Dayjs) => {
    setSelectedDate(value);
    setDayTasks(getTasksByDate(value));
    setDayPlans(getPlansForDate(value));
    setDrawerOpen(true);
  };

  const handleMonthChange = (value: Dayjs) => {
    setCurrentDate(value);
  };

  const handleAddPlan = () => {
    setEditingPlan(null);
    planForm.resetFields();
    planForm.setFieldsValue({
      targetType: 'animal',
      repeatType: 'daily',
      unit: 'g',
      status: 'active',
      feedTime: dayjs('08:00:00', 'HH:mm:ss'),
      startDate: dayjs(),
      repeatDays: [],
    });
    setPlanModalVisible(true);
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    planForm.setFieldsValue({
      ...plan,
      feedTime: plan.feedTime ? dayjs(plan.feedTime, 'HH:mm:ss') : null,
      startDate: plan.startDate ? dayjs(plan.startDate) : null,
      endDate: plan.endDate ? dayjs(plan.endDate) : null,
      repeatDays: plan.repeatDays ? plan.repeatDays.split(',').map(Number) : [],
    });
    setPlanModalVisible(true);
  };

  const handleDeletePlan = async (id: number) => {
    try {
      await feedingPlanApi.delete(id);
      message.success('删除成功');
      fetchPlans();
    } catch {
      // handled
    }
  };

  const handlePlanSubmit = async () => {
    try {
      const values = await planForm.validateFields();
      const payload: any = {
        ...values,
        feedTime: values.feedTime?.format('HH:mm:ss'),
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
        repeatDays: values.repeatDays?.sort((a: number, b: number) => a - b).join(','),
      };

      if (editingPlan) {
        await feedingPlanApi.update(editingPlan.id, payload);
        message.success('更新成功');
      } else {
        await feedingPlanApi.create(payload);
        message.success('创建成功');
      }
      setPlanModalVisible(false);
      fetchPlans();
    } catch {
      // handled
    }
  };

  const handleCompleteTask = (task: any) => {
    setCompletingTask(task);
    completeForm.resetFields();
    completeForm.setFieldsValue({
      actualQuantity: task.quantity,
      actualWaterMl: task.waterMl,
      actualFeedTime: dayjs(),
      feeder: task.feeder,
    });
    setCompleteModalVisible(true);
  };

  const handleCompleteSubmit = async () => {
    try {
      const values = await completeForm.validateFields();
      const payload = {
        ...values,
        actualFeedTime: values.actualFeedTime?.format('HH:mm:ss'),
      };

      await feedingPlanApi.completeTask(completingTask.id, payload);
      message.success('任务已完成，已创建饲养记录');
      setCompleteModalVisible(false);
      fetchTasks();
      if (drawerOpen) {
        setDayTasks(getTasksByDate(selectedDate));
      }
    } catch {
      // handled
    }
  };

  const handleCancelTask = async (id: number) => {
    try {
      await feedingPlanApi.cancelTask(id);
      message.success('已取消任务');
      fetchTasks();
      if (drawerOpen) {
        setDayTasks(getTasksByDate(selectedDate));
      }
    } catch {
      // handled
    }
  };

  const handleGenerateTasks = async () => {
    try {
      const res: any = await feedingPlanApi.generateTasks(selectedDate.format('YYYY-MM-DD'));
      message.success(`已生成 ${res?.count || 0} 条任务`);
      fetchTasks();
      if (drawerOpen) {
        setDayTasks(getTasksByDate(selectedDate));
      }
    } catch {
      // handled
    }
  };

  const getStatusTag = (status: string) => {
    const opt = statusOptions.find((o) => o.value === status);
    return <Tag color={opt?.color}>{opt?.label || status}</Tag>;
  };

  const getTaskStatusTag = (status: string) => {
    const opt = taskStatusOptions.find((o) => o.value === status);
    return <Tag color={opt?.color}>{opt?.label || status}</Tag>;
  };

  const getTargetTypeLabel = (type: string) => {
    const opt = targetTypeOptions.find((o) => o.value === type);
    return opt?.label || type;
  };

  const getRepeatTypeLabel = (plan: any) => {
    if (plan.repeatType === 'daily') return '每日';
    if (plan.repeatType === 'weekly') {
      const days = plan.repeatDays?.split(',').map(Number) || [];
      const dayLabels = days.map((d: number) => weekDays.find(w => w.value === d)?.label).filter(Boolean).join('、');
      return `每周 ${dayLabels}`;
    }
    if (plan.repeatType === 'cron') return `Cron: ${plan.cronExpression}`;
    return plan.repeatType;
  };

  const resetFilters = () => {
    setFilterFeeder(undefined);
    setFilterStatus(undefined);
    setFilterTargetType(undefined);
  };

  const weekStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const missed = tasks.filter((t) => t.status === 'missed').length;
    return { total, completed, pending, missed };
  }, [tasks]);

  const targetType = Form.useWatch('targetType', planForm);
  const repeatType = Form.useWatch('repeatType', planForm);

  return (
    <div>
      <Row gutter={16}>
        <Col span={18}>
          <Card
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            title={
              <Space>
                <ScheduleOutlined style={{ color: '#059669' }} />
                <span style={{ fontWeight: 600 }}>饲养计划排程</span>
              </Space>
            }
            extra={
              <Space>
                <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} size="small">
                  <Radio.Button value="month">月视图</Radio.Button>
                  <Radio.Button value="week">周视图</Radio.Button>
                </Radio.Group>
                <Button icon={<PlusOutlined />} type="primary" onClick={handleAddPlan}>
                  新增计划
                </Button>
              </Space>
            }
          >
            <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Space size={16}>
                <Text type="secondary">{viewMode === 'month' ? '本月统计：' : '本周统计：'}</Text>
                <Badge count={weekStats.total} showZero style={{ backgroundColor: '#1677ff' }}>
                  <Tag color="processing">总计</Tag>
                </Badge>
                <Badge count={weekStats.pending} showZero style={{ backgroundColor: '#1890ff' }}>
                  <Tag color="processing">待执行</Tag>
                </Badge>
                <Badge count={weekStats.completed} showZero style={{ backgroundColor: '#52c41a' }}>
                  <Tag color="success">已完成</Tag>
                </Badge>
                <Badge count={weekStats.missed} showZero style={{ backgroundColor: '#ff4d4f' }}>
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
                  负责人
                </Text>
                <Select
                  placeholder="选择负责人"
                  allowClear
                  style={{ width: '100%' }}
                  value={filterFeeder}
                  onChange={(v) => setFilterFeeder(v)}
                >
                  {feeders.map((v) => (
                    <Option key={v} value={v}>
                      {v}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  计划状态
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

              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  目标类型
                </Text>
                <Select
                  placeholder="选择类型"
                  allowClear
                  style={{ width: '100%' }}
                  value={filterTargetType}
                  onChange={(v) => setFilterTargetType(v)}
                >
                  {targetTypeOptions.map((o) => (
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
                任务状态图例
              </Text>
              <Space direction="vertical" size="small">
                {taskStatusOptions.map((s) => (
                  <div key={s.value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag color={s.color} style={{ margin: 0 }}>{s.label}</Tag>
                  </div>
                ))}
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 每日详情 Drawer */}
      <Drawer
        title={
          <Space>
            <CalendarOutlined />
            <span>{selectedDate.format('YYYY年MM月DD日')}</span>
            <Tag color="blue">{dayTasks.length} 条任务</Tag>
          </Space>
        }
        placement="right"
        width={520}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        extra={
          <Space>
            <Button size="small" icon={<PlayCircleOutlined />} onClick={handleGenerateTasks}>
              生成任务
            </Button>
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddPlan}>
              新增计划
            </Button>
          </Space>
        }
      >
        <Tabs defaultActiveKey="tasks">
          <TabPane tab={<span><UnorderedListOutlined />当日任务</span>} key="tasks">
            {dayTasks.length === 0 ? (
              <Empty description="当日暂无任务" style={{ marginTop: 40 }} />
            ) : (
              <List
                itemLayout="vertical"
                dataSource={dayTasks}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    style={{
                      padding: '16px 0',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                    extra={
                      <Space>
                        {item.status === 'pending' && (
                          <>
                            <Tooltip title="完成">
                              <Button
                                type="text"
                                size="small"
                                icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                onClick={() => handleCompleteTask(item)}
                              />
                            </Tooltip>
                            <Popconfirm
                              title="确定取消此任务？"
                              onConfirm={() => handleCancelTask(item.id)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Tooltip title="取消">
                                <Button type="text" size="small" danger icon={<CloseOutlined />} />
                              </Tooltip>
                            </Popconfirm>
                          </>
                        )}
                      </Space>
                    }
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{item.animal?.name || `#${item.animalId}`}</Text>
                          {getTaskStatusTag(item.status)}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Space size={8}>
                            <Tag color="default">{item.animal?.species}</Tag>
                            <Tag color="green">{item.foodType}</Tag>
                          </Space>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, color: '#666' }}>
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              {item.taskTime}
                            </span>
                            <span style={{ fontSize: 13, color: '#666' }}>
                              <CoffeeOutlined style={{ marginRight: 4 }} />
                              {item.quantity ? `${item.quantity}${item.unit || 'g'}` : '-'}
                            </span>
                            {item.feeder && (
                              <span style={{ fontSize: 13, color: '#666' }}>
                                <UserOutlined style={{ marginRight: 4 }} />
                                {item.feeder}
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
          </TabPane>
          <TabPane tab={<span><ScheduleOutlined />关联计划</span>} key="plans">
            {dayPlans.length === 0 ? (
              <Empty description="当日无关联计划" style={{ marginTop: 40 }} />
            ) : (
              <List
                itemLayout="vertical"
                dataSource={dayPlans}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    style={{
                      padding: '16px 0',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                    extra={
                      <Space>
                        <Tooltip title="编辑">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditPlan(item)}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="确定删除此计划？"
                          onConfirm={() => handleDeletePlan(item.id)}
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
                          <Text strong>{item.planName}</Text>
                          {getStatusTag(item.status)}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Space size={8}>
                            <Tag color="blue">{getTargetTypeLabel(item.targetType)}</Tag>
                            <Tag color="purple">{getRepeatTypeLabel(item)}</Tag>
                            <Tag color="green">{item.foodType}</Tag>
                          </Space>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, color: '#666' }}>
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              {item.feedTime}
                            </span>
                            <span style={{ fontSize: 13, color: '#666' }}>
                              <CoffeeOutlined style={{ marginRight: 4 }} />
                              {item.quantity ? `${item.quantity}${item.unit || 'g'}` : '-'}
                            </span>
                            {item.feeder && (
                              <span style={{ fontSize: 13, color: '#666' }}>
                                <UserOutlined style={{ marginRight: 4 }} />
                                {item.feeder}
                              </span>
                            )}
                          </div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            有效期：{dayjs(item.startDate).format('YYYY-MM-DD')} ~ {item.endDate ? dayjs(item.endDate).format('YYYY-MM-DD') : '长期'}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </TabPane>
        </Tabs>
      </Drawer>

      {/* 新增/编辑计划 Modal */}
      <Modal
        title={editingPlan ? '编辑饲养计划' : '新增饲养计划'}
        open={planModalVisible}
        onOk={handlePlanSubmit}
        onCancel={() => setPlanModalVisible(false)}
        width={640}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={planForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="planName" label="计划名称" rules={[{ required: true, message: '请输入计划名称' }]}>
            <Input placeholder="如：小鼠A-101笼每日早餐" />
          </Form.Item>

          <Form.Item name="targetType" label="目标类型" rules={[{ required: true }]}>
            <Radio.Group>
              {targetTypeOptions.map((o) => (
                <Radio.Button key={o.value} value={o.value}>
                  {o.icon} {o.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>

          {targetType === 'animal' && (
            <Form.Item name="animalId" label="选择动物" rules={[{ required: true, message: '请选择动物' }]}>
              <Select showSearch optionFilterProp="children" placeholder="选择动物">
                {animals.map((a: any) => (
                  <Option key={a.id} value={a.id}>
                    {a.name} ({a.species} - {a.cageNumber || '无笼位'})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {targetType === 'cage' && (
            <Form.Item name="cageNumber" label="选择笼位" rules={[{ required: true, message: '请选择笼位' }]}>
              <Select showSearch placeholder="选择笼位">
                {cageList.map((c) => (
                  <Option key={c} value={c}>
                    {c}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="foodType" label="饲料类型" rules={[{ required: true, message: '请输入饲料类型' }]}>
                <Input placeholder="如：标准啮齿类动物饲料" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="feedTime" label="喂养时间" rules={[{ required: true, message: '请选择时间' }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm:ss" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="quantity" label="喂养量">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="单位">
                <Select>
                  <Option value="g">克(g)</Option>
                  <Option value="ml">毫升(ml)</Option>
                  <Option value="kg">千克(kg)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="waterMl" label="饮水量(ml)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="repeatType" label="重复规则" rules={[{ required: true }]}>
            <Radio.Group>
              {repeatTypeOptions.map((o) => (
                <Radio.Button key={o.value} value={o.value}>
                  {o.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>

          {repeatType === 'weekly' && (
            <Form.Item name="repeatDays" label="每周重复" rules={[{ required: true, message: '请选择重复日' }]}>
              <Checkbox.Group>
                <Space wrap>
                  {weekDays.map((d) => (
                    <Checkbox key={d.value} value={d.value}>
                      {d.label}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </Form.Item>
          )}

          {repeatType === 'cron' && (
            <Form.Item name="cronExpression" label="Cron表达式" rules={[{ required: true, message: '请输入Cron表达式' }]}>
              <Input placeholder="如：0 8 * * * (每天8点)" />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="开始日期" rules={[{ required: true, message: '请选择开始日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="结束日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="feeder" label="负责人">
                <Input placeholder="负责人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>
                  {statusOptions.map((o) => (
                    <Option key={o.value} value={o.value}>
                      {o.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="其他备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 完成任务 Modal */}
      <Modal
        title="完成饲养任务 - 创建饲养记录"
        open={completeModalVisible}
        onOk={handleCompleteSubmit}
        onCancel={() => setCompleteModalVisible(false)}
        width={560}
        okText="确认完成"
        cancelText="取消"
        destroyOnClose
      >
        {completingTask && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <Space direction="vertical" size="small">
              <Text strong>
                {completingTask.animal?.name || `#${completingTask.animalId}`} - {completingTask.foodType}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                计划时间：{dayjs(completingTask.taskDate).format('YYYY-MM-DD')} {completingTask.taskTime}
              </Text>
            </Space>
          </div>
        )}
        <Form form={completeForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="actualQuantity" label="实际喂养量">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} addonAfter={completingTask?.unit || 'g'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actualWaterMl" label="实际饮水量(ml)">
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="actualFeedTime" label="实际喂养时间">
                <TimePicker style={{ width: '100%' }} format="HH:mm:ss" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="feeder" label="喂养员">
                <Input placeholder="喂养员姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="其他备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FeedingPlans;
