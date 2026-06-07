import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Badge,
  Button,
  Drawer,
  List,
  Tag,
  Space,
  Typography,
  Select,
  Empty,
  message,
  Tooltip,
} from 'antd';
import {
  BellOutlined,
  ClockCircleOutlined,
  CoffeeOutlined,
  HeartOutlined,
  CheckOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { alertApi } from '../api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Option } = Select;

export type AlertType = 'health_abnormal' | 'next_check_overdue' | 'no_feeding_record';
export type AlertLevel = 'warning' | 'danger' | 'info';
export type AlertStatus = 'unread' | 'read' | 'resolved';

export interface AlertItem {
  id: number;
  animalId: number;
  type: AlertType;
  level: AlertLevel;
  title: string;
  message: string;
  status: AlertStatus;
  relatedRecordId?: number;
  relatedRecordType?: string;
  triggeredAt?: string;
  createdAt: string;
  updatedAt: string;
  animal?: {
    id: number;
    name: string;
    species: string;
  };
}

const alertTypeLabels: Record<AlertType, string> = {
  health_abnormal: '健康异常',
  next_check_overdue: '检查逾期',
  no_feeding_record: '无饲养记录',
};

const alertTypeIcons: Record<AlertType, React.ReactNode> = {
  health_abnormal: <HeartOutlined />,
  next_check_overdue: <ClockCircleOutlined />,
  no_feeding_record: <CoffeeOutlined />,
};

const alertLevelColors: Record<AlertLevel, string> = {
  warning: 'orange',
  danger: 'red',
  info: 'blue',
};

const alertLevelLabels: Record<AlertLevel, string> = {
  warning: '警告',
  danger: '危险',
  info: '提示',
};

interface NotificationCenterProps {
  onAlertClick?: (alert: AlertItem) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onAlertClick }) => {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<AlertType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AlertStatus | 'all'>('all');
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const sseConnectedRef = useRef(false);
  const navigate = useNavigate();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res: any = await alertApi.getUnreadCount();
      setUnreadCount(res.count || 0);
    } catch (error) {
      // silently ignore
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { pageSize: 50 };
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      const res: any = await alertApi.getList(params);
      setAlerts(res.list || []);
    } catch (error) {
      message.error('获取预警列表失败');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  const connectSSE = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const connect = async () => {
      try {
        const response = await fetch('/api/alerts/stream', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`SSE connection failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        sseConnectedRef.current = true;
        const decoder = new TextDecoder();
        let buffer = '';

        const parseEvent = (eventStr: string) => {
          const lines = eventStr.trim().split('\n');
          let eventType = 'message';
          let data = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              data += line.slice(6);
            }
          }

          return { eventType, data: data.trim() };
        };

        const processData = () => {
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const eventStr of events) {
            if (!eventStr.trim()) continue;
            const { eventType, data } = parseEvent(eventStr);

            if (eventType === 'new_alert' && data) {
              try {
                const alert = JSON.parse(data);
                setUnreadCount((prev) => prev + 1);
                setAlerts((prev) => [alert, ...prev].slice(0, 50));
                message.info(`新预警：${alert.title}`);
              } catch (e) {
                // ignore parse error
              }
            }
          }
        };

        const read = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              processData();
            }
          } catch (e: any) {
            if (e.name !== 'AbortError') {
              throw e;
            }
          }
        };

        await read();
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        sseConnectedRef.current = false;
        // 重连
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }
        reconnectTimerRef.current = window.setTimeout(() => {
          if (!controller.signal.aborted) {
            connect();
          }
        }, 5000);
      }
    };

    connect();
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    connectSSE();

    const interval = setInterval(() => {
      fetchUnreadCount();
      if (!sseConnectedRef.current) {
        connectSSE();
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchUnreadCount, connectSSE]);

  useEffect(() => {
    if (open) {
      fetchAlerts();
    }
  }, [open, fetchAlerts]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleMarkAsRead = async (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      await alertApi.markAsRead(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'read' as AlertStatus } : a)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      message.error('标记已读失败');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res: any = await alertApi.markAllAsRead();
      message.success(`已将 ${res.count} 条预警标记为已读`);
      setAlerts((prev) =>
        prev.map((a) => (a.status === 'unread' ? { ...a, status: 'read' as AlertStatus } : a)),
      );
      setUnreadCount(0);
    } catch (error) {
      message.error('全部标记已读失败');
    }
  };

  const handleGoToAnimal = (alert: AlertItem) => {
    if (onAlertClick) {
      onAlertClick(alert);
    }
    if (alert.status === 'unread') {
      handleMarkAsRead(alert.id);
    }
    navigate(`/animals?animalId=${alert.animalId}&t=${Date.now()}`);
    setOpen(false);
  };

  const renderAlertItem = (item: AlertItem) => (
    <List.Item
      key={item.id}
      style={{
        background: item.status === 'unread' ? '#fffbe6' : 'transparent',
        padding: '12px 16px',
        borderRadius: 8,
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
      onClick={() => handleGoToAnimal(item)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          item.status === 'unread' ? '#fff1b8' : '#f5f5f5';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          item.status === 'unread' ? '#fffbe6' : 'transparent';
      }}
      actions={[
        item.status === 'unread' ? (
          <Tooltip key="read" title="标记已读">
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={(e) => handleMarkAsRead(item.id, e)}
              style={{ color: '#52c41a' }}
            />
          </Tooltip>
        ) : (
          <Tooltip key="view" title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleGoToAnimal(item);
              }}
            />
          </Tooltip>
        ),
      ]}
    >
      <List.Item.Meta
        avatar={
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: item.level === 'danger' ? '#fff1f0' : item.level === 'warning' ? '#fff7e6' : '#e6f7ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: item.level === 'danger' ? '#ff4d4f' : item.level === 'warning' ? '#fa8c16' : '#1890ff',
              fontSize: 18,
            }}
          >
            {alertTypeIcons[item.type]}
          </div>
        }
        title={
          <Space size="small" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text strong style={{ fontSize: 14 }}>
              {item.title}
            </Text>
            <Space size={4}>
              <Tag color={alertLevelColors[item.level]} style={{ margin: 0 }}>
                {alertLevelLabels[item.level]}
              </Tag>
              {item.status === 'unread' && (
                <Badge status="processing" color="#faad14" />
              )}
            </Space>
          </Space>
        }
        description={
          <div style={{ marginTop: 4 }}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {item.message}
              </Text>
              <Space size={8}>
                <Tag color="blue" style={{ margin: 0 }}>
                  {alertTypeLabels[item.type]}
                </Tag>
                {item.animal && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.animal.name} ({item.animal.species})
                  </Text>
                )}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {dayjs(item.createdAt).format('MM-DD HH:mm')}
                </Text>
              </Space>
            </Space>
          </div>
        }
      />
    </List.Item>
  );

  const filteredAlerts = alerts.filter((a) => {
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <>
      <Tooltip title="通知中心">
        <Badge count={unreadCount} size="small" offset={[2, 2]}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: 18 }} />}
            onClick={handleOpen}
            style={{ fontSize: 18, padding: '4px 8px' }}
          />
        </Badge>
      </Tooltip>

      <Drawer
        title={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <BellOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontWeight: 600 }}>通知中心</span>
              <Tag color="orange">{unreadCount} 条未读</Tag>
            </Space>
            <Button size="small" type="link" onClick={handleMarkAllAsRead}>
              全部已读
            </Button>
          </Space>
        }
        placement="right"
        onClose={handleClose}
        open={open}
        width={420}
        styles={{
          body: { padding: 0 },
        }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <Space size="middle">
            <Select
              size="small"
              value={filterType}
              onChange={(value) => setFilterType(value)}
              style={{ width: 120 }}
            >
              <Option value="all">全部类型</Option>
              <Option value="health_abnormal">健康异常</Option>
              <Option value="next_check_overdue">检查逾期</Option>
              <Option value="no_feeding_record">无饲养记录</Option>
            </Select>
            <Select
              size="small"
              value={filterStatus}
              onChange={(value) => setFilterStatus(value)}
              style={{ width: 120 }}
            >
              <Option value="all">全部状态</Option>
              <Option value="unread">未读</Option>
              <Option value="read">已读</Option>
              <Option value="resolved">已解决</Option>
            </Select>
          </Space>
        </div>

        <div style={{ padding: '8px 12px', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Empty description="加载中..." />
            </div>
          ) : filteredAlerts.length === 0 ? (
            <Empty
              description="暂无预警"
              style={{ padding: '40px 0' }}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={filteredAlerts}
              renderItem={renderAlertItem}
              split={false}
            />
          )}
        </div>
      </Drawer>
    </>
  );
};

export default NotificationCenter;
