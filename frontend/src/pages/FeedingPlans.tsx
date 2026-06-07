import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  Progress,
  Statistic,
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
  ScheduleOutlined,
  UnorderedListOutlined,
  LeftOutlined,
  RightOutlined,
  HoldOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { feedingPlanApi, animalApi } from '../api';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
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
  const [dailyStats, setDailyStats] = useState<any[]>([]);

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

  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

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

  const fetchDailyStats = useCallback(async () => {
    try {
      const start = currentDate.startOf(viewMode === 'month' ? 'month' : 'week').format('YYYY-MM-DD');
      const end = currentDate.endOf(viewMode === 'month' ? 'month' : 'week').format('YYYY-MM-DD');
      const res: any = await feedingPlanApi.getDailyStatsByDateRange(start, end, {
        feeder: filterFeeder,
      });
      setDailyStats(res || []);
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
    fetchDailyStats();
  }, [fetchPlans, fetchTasks, fetchDailyStats]);

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

  const weekDates = useMemo(() => {
    const startOfWeek = currentDate.startOf('week').add(1, 'day');
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(startOfWeek.add(i, 'day'));
    }
    return dates;
  }, [currentDate]);

  const monthDates = useMemo(() => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startDayOfWeek = startOfMonth.day() === 0 ? 6 : startOfMonth.day() - 1;
    const dates: (Dayjs | null)[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      dates.push(null);
    }

    let current = startOfMonth;
    while (current.isBefore(endOfMonth) || current.isSame(endOfMonth, 'day')) {
      dates.push(current);
      current = current.add(1, 'day');
    }

    const remaining = 42 - dates.length;
    for (let i = 0; i < remaining; i++) {
      dates.push(null);
    }

    return dates;
  }, [currentDate]);

  const handleDragStart = (e: React.DragEvent, task: any) => {
    if (task.status !== 'pending') {
      e.preventDefault();
      return;
    }
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id.toString());
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateStr);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Dayjs) => {
    e.preventDefault();
    setDragOverDate(null);

    if (!draggedTask || draggedTask.status !== 'pending') {
      setDraggedTask(null);
      return;
    }

    const targetDateStr = targetDate.format('YYYY-MM-DD');
    const sourceDateStr = dayjs(draggedTask.taskDate).format('YYYY-MM-DD');

    if (targetDateStr === sourceDateStr) {
      setDraggedTask(null);
      return;
    }

    try {
      await feedingPlanApi.updateTask(draggedTask.id, {
        taskDate: targetDateStr,
      });
      message.success('任务已移动');
      fetchTasks();
      fetchDailyStats();
      if (drawerOpen) {
        setDayTasks(getTasksByDate(selectedDate));
      }
    } catch {
      message.error('移动任务失败');
    } finally {
      setDraggedTask(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverDate(null);
  };

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

  const handlePrev = () => {
    if (viewMode === 'week') {
      setCurrentDate(currentDate.subtract(7, 'day'));
    } else {
      setCurrentDate(currentDate.subtract(1, 'month'));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(currentDate.add(7, 'day'));
    } else {
      setCurrentDate(currentDate.add(1, 'month'));
    }
  };

  const handleToday = () => {
    setCurrentDate(dayjs());
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
      fetchDailyStats();
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
      fetchDailyStats();
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
      fetchDailyStats();
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

  const getTaskStatusColor = (status: string) => {
    const opt = taskStatusOptions.find((o) => o.value === status);
    return opt?.color || 'default';
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

  const overallStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const missed = tasks.filter((t) => t.status === 'missed').length;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';
    return { total, completed, pending, missed, completionRate };
  }, [tasks]);

  const targetType = Form.useWatch('targetType', planForm);
  const repeatType = Form.useWatch('repeatType', planForm);

  const renderWeekView = () => {
    return (
      <div style={{ width: '100%' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          padding: '0 8px',
        }}>
          <Text strong style={{ fontSize: 16 }}>
            {currentDate.startOf('week').add(1, 'day').format('YYYY年MM月DD日')} - {currentDate.endOf('week').add(1, 'day').format('MM月DD日')}
          </Text>
          <Space>
            <Button size="small" icon={<LeftOutlined />} onClick={handlePrev}>上一周</Button>
            <Button size="small" onClick={handleToday}>今天</Button>
            <Button size="small" icon={<RightOutlined />} onClick={handleNext}>下一周</Button>
          </Space>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 8,
          }}
        >
          {weekDates.map((date, idx) => {
            const dayTasks = getTasksByDate(date);
            const isToday = date.isSame(dayjs(), 'day');
            const isDragging = dragOverDate === date.format('YYYY-MM-DD');
            const weekday = weekDays[idx];

            return (
              <div
                key={idx}
                onDragOver={(e) => handleDragOver(e, date.format('YYYY-MM-DD'))}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, date)}
                onClick={() => handleDateSelect(date)}
                style={{
                  minHeight: 320,
                  border: `1px solid ${isDragging ? '#1890ff' : '#e8e8e8'}`,
                  borderRadius: 8,
                  backgroundColor: isDragging ? '#e6f7ff' : (isToday ? '#f6ffed' : '#fff'),
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #f0f0f0',
                    background: isToday ? '#52c41a' : (idx >= 5 ? '#fafafa' : '#fff'),
                    color: isToday ? '#fff' : (idx >= 5 ? '#bfbfbf' : '#333'),
                    fontWeight: 600,
                    textAlign: 'center',
                    fontSize: 13,
                  }}
                >
                  <div>{weekday?.label}</div>
                  <div style={{ fontSize: 18, marginTop: 2 }}>{date.date()}</div>
                </div>

                <div
                  style={{
                    flex: 1,
                    padding: 8,
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {dayTasks.length === 0 ? (
                    <div style={{
                      color: '#d9d9d9',
                      fontSize: 12,
                      textAlign: 'center',
                      marginTop: 20,
                    }}>
                      暂无任务
                    </div>
                  ) : (
                    dayTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable={task.status === 'pending'}
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        style={{
                          padding: '6px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          borderLeft: `3px solid ${getTaskStatusColor(task.status) === 'success' ? '#52c41a' : getTaskStatusColor(task.status) === 'error' ? '#ff4d4f' : getTaskStatusColor(task.status) === 'default' ? '#bfbfbf' : '#1890ff'}`,
                          backgroundColor: task.status === 'completed' ? '#f6ffed' : task.status === 'missed' ? '#fff1f0' : task.status === 'cancelled' ? '#f5f5f5' : '#e6f7ff',
                          cursor: task.status === 'pending' ? 'grab' : 'default',
                          userSelect: 'none',
                          opacity: draggedTask?.id === task.id ? 0.5 : 1,
                          transition: 'opacity 0.2s',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(date);
                          setDayTasks(getTasksByDate(date));
                          setDayPlans(getPlansForDate(date));
                          setDrawerOpen(true);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          {task.status === 'pending' && <HoldOutlined style={{ fontSize: 10, color: '#999' }} />}
                          <Text ellipsis={{ tooltip: task.animal?.name }} style={{ fontSize: 12, fontWeight: 500 }}>
                            {task.animal?.name || `#${task.animalId}`}
                          </Text>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          color: '#666',
                        }}>
                          <ClockCircleOutlined style={{ fontSize: 10 }} />
                          <span>{task.taskTime?.slice(0, 5)}</span>
                          <span>·</span>
                          <span>{task.foodType}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    return (
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          padding: '0 8px',
        }}>
          <Text strong style={{ fontSize: 16 }}>
            {currentDate.format('YYYY年MM月')}
          </Text>
          <Space>
            <Button size="small" icon={<LeftOutlined />} onClick={handlePrev}>上个月</Button>
            <Button size="small" onClick={handleToday}>今天</Button>
            <Button size="small" icon={<RightOutlined />} onClick={handleNext}>下个月</Button>
          </Space>
        </div>

        <div
          onDragLeave={handleDragLeave}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            {['一', '二', '三', '四', '五', '六', '日'].map((day, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px 0',
                  textAlign: 'center',
                  fontWeight: 500,
                  color: idx >= 5 ? '#bfbfbf' : '#333',
                  fontSize: 13,
                }}
              >
                周{day}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {monthDates.map((date, idx) => {
              if (!date) {
                return (
                  <div
                    key={idx}
                    style={{
                      minHeight: 100,
                      border: '1px solid #f5f5f5',
                      borderTop: 'none',
                      borderLeft: 'none',
                      backgroundColor: '#fafafa',
                    }}
                  />
                );
              }

              const dayTasks = getTasksByDate(date);
              const isToday = date.isSame(dayjs(), 'day');
              const isCurrentMonth = date.isSame(currentDate, 'month');
              const isDragging = dragOverDate === date.format('YYYY-MM-DD');
              const displayTasks = dayTasks.slice(0, 3);
              const moreCount = dayTasks.length - 3;

              return (
                <div
                  key={idx}
                  onDragOver={(e) => handleDragOver(e, date.format('YYYY-MM-DD'))}
                  onDrop={(e) => handleDrop(e, date)}
                  onClick={() => handleDateSelect(date)}
                  style={{
                    minHeight: 100,
                    border: `1px solid ${isDragging ? '#1890ff' : '#f5f5f5'}`,
                    borderTop: 'none',
                    borderLeft: 'none',
                    backgroundColor: isDragging ? '#e6f7ff' : (isToday ? '#f6ffed' : '#fff'),
                    cursor: 'pointer',
                    padding: 4,
                    transition: 'background 0.2s',
                    opacity: isCurrentMonth ? 1 : 0.4,
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 22,
                        height: 22,
                        lineHeight: '22px',
                        textAlign: 'center',
                        fontSize: 12,
                        borderRadius: '50%',
                        backgroundColor: isToday ? '#52c41a' : 'transparent',
                        color: isToday ? '#fff' : '#333',
                        fontWeight: isToday ? 600 : 400,
                      }}
                    >
                      {date.date()}
                    </span>
                    {dayTasks.length > 0 && (
                      <Tag color="blue" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                        {dayTasks.length}项
                      </Tag>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {displayTasks.map((task: any) => (
                      <div
                        key={task.id}
                        draggable={task.status === 'pending'}
                        onDragStart={(e) => {
                          e.stopPropagation();
                          handleDragStart(e, task);
                        }}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          padding: '2px 6px',
                          fontSize: 11,
                          borderRadius: 3,
                          backgroundColor: task.status === 'completed' ? '#f6ffed' : task.status === 'missed' ? '#fff1f0' : task.status === 'cancelled' ? '#f5f5f5' : '#e6f7ff',
                          borderLeft: `2px solid ${getTaskStatusColor(task.status) === 'success' ? '#52c41a' : getTaskStatusColor(task.status) === 'error' ? '#ff4d4f' : getTaskStatusColor(task.status) === 'default' ? '#bfbfbf' : '#1890ff'}`,
                          cursor: task.status === 'pending' ? 'grab' : 'default',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          opacity: draggedTask?.id === task.id ? 0.5 : 1,
                        }}
                        title={`${task.animal?.name || `#${task.animalId}`} - ${task.foodType}`}
                      >
                        <HoldOutlined style={{ fontSize: 9, marginRight: 2, opacity: task.status === 'pending' ? 1 : 0 }} />
                        {task.taskTime?.slice(0, 5)} {task.animal?.name?.slice(0, 4) || `#${task.animalId}`}
                      </div>
                    ))}
                    {moreCount > 0 && (
                      <div style={{ fontSize: 11, color: '#999', paddingLeft: 4 }}>
                        +{moreCount} 更多
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderCompletionStats = () => {
    if (dailyStats.length === 0) {
      return <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 20 }} />;
    }

    const visibleDays = viewMode === 'week' ? dailyStats : dailyStats.filter((_, i) => i % Math.ceil(dailyStats.length / 7) === 0 || i === dailyStats.length - 1);

    return (
      <div style={{ padding: 4 }}>
        <div style={{ marginBottom: 12 }}>
          <Space size="large">
            <Statistic
              title="总完成率"
              value={overallStats.completionRate}
              suffix="%"
              valueStyle={{ fontSize: 20, color: '#52c41a' }}
              prefix={<RiseOutlined />}
            />
            <Statistic
              title="已完成/总计"
              value={`${overallStats.completed}/${overallStats.total}`}
              valueStyle={{ fontSize: 16 }}
            />
          </Space>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          每日完成率
        </Text>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dailyStats.slice(-viewMode === 'week' ? 7 : 14).map((stat: any) => {
            const isToday = dayjs(stat.date).isSame(dayjs(), 'day');
            const statusColor = stat.completionRate >= 80 ? '#52c41a' : stat.completionRate >= 50 ? '#faad14' : stat.total > 0 ? '#ff4d4f' : '#d9d9d9';

            return (
              <div key={stat.date} style={{ fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: isToday ? 600 : 400, color: isToday ? '#1890ff' : '#666' }}>
                    {dayjs(stat.date).format('MM-DD')}
                    {isToday && <Tag color="blue" style={{ marginLeft: 4, fontSize: 10, padding: '0 4px' }}>今天</Tag>}
                  </span>
                  <span style={{ color: statusColor, fontWeight: 500 }}>
                    {stat.completed}/{stat.total} · {stat.completionRate}%
                  </span>
                </div>
                <Progress
                  percent={stat.completionRate}
                  showInfo={false}
                  size="small"
                  strokeColor={statusColor}
                  style={{ marginBottom: 0 }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
                <Badge count={overallStats.total} showZero style={{ backgroundColor: '#1677ff' }}>
                  <Tag color="processing">总计</Tag>
                </Badge>
                <Badge count={overallStats.pending} showZero style={{ backgroundColor: '#1890ff' }}>
                  <Tag color="processing">待执行</Tag>
                </Badge>
                <Badge count={overallStats.completed} showZero style={{ backgroundColor: '#52c41a' }}>
                  <Tag color="success">已完成</Tag>
                </Badge>
                <Badge count={overallStats.missed} showZero style={{ backgroundColor: '#ff4d4f' }}>
                  <Tag color="error">已错过</Tag>
                </Badge>
              </Space>
            </div>

            {viewMode === 'month' ? renderMonthView() : renderWeekView()}

            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 提示：拖拽蓝色待执行任务可移动到其他日期
              </Text>
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Card
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 }}
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

          <Card
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            title={
              <Space>
                <RiseOutlined style={{ color: '#52c41a' }} />
                <span style={{ fontWeight: 600 }}>完成率统计</span>
              </Space>
            }
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                {viewMode === 'month' ? '本月' : '本周'}
              </Text>
            }
            size="default"
          >
            {renderCompletionStats()}
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
