import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Select, Modal, Form,
  message, Descriptions, Tabs, Timeline, Alert,
} from 'antd';
import {
  SearchOutlined, CheckOutlined, CloseOutlined,
  EyeOutlined, ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { animalApi } from '../api';

const { Option } = Select;
const { TextArea } = Input;

const statusOptions = [
  { value: 'healthy', label: '健康', color: 'success' },
  { value: 'sick', label: '患病', color: 'error' },
  { value: 'in_experiment', label: '实验中', color: 'processing' },
  { value: 'deceased', label: '已死亡', color: 'default' },
  { value: 'quarantine', label: '隔离中', color: 'warning' },
];

const approvalStatusOptions = [
  { value: 'pending', label: '待审批', color: 'processing' },
  { value: 'approved', label: '已通过', color: 'success' },
  { value: 'rejected', label: '已拒绝', color: 'error' },
];

const StatusChangeApproval: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>('pending');
  const [keyword, setKeyword] = useState('');

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);

  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [approveType, setApproveType] = useState<'approved' | 'rejected'>('approved');
  const [approveComment, setApproveComment] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await animalApi.getStatusChangeRequests({
        page,
        pageSize,
        approvalStatus: approvalStatusFilter || undefined,
        keyword: keyword || undefined,
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, approvalStatusFilter, keyword]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDetail = (record: any) => {
    setDetailItem(record);
    setDetailVisible(true);
  };

  const handleOpenApprove = (record: any, type: 'approved' | 'rejected') => {
    setApprovingId(record.id);
    setApproveType(type);
    setApproveComment('');
    setApproveModalVisible(true);
  };

  const handleApproveSubmit = async () => {
    if (!approvingId) return;

    try {
      setApproveLoading(true);
      await animalApi.approveStatusChangeRequest(approvingId, {
        status: approveType,
        comment: approveComment || undefined,
      });
      message.success(approveType === 'approved' ? '审批通过' : '已拒绝');
      setApproveModalVisible(false);
      fetchData();
      if (detailItem && detailItem.id === approvingId) {
        const res: any = await animalApi.getStatusChangeRequest(approvingId);
        setDetailItem(res);
      }
    } catch {
      // handled
    } finally {
      setApproveLoading(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  const columns = [
    {
      title: '申请编号',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <span style={{ fontWeight: 500 }}>#{id}</span>,
    },
    {
      title: '动物编号',
      dataIndex: ['animal', 'name'],
      key: 'animalName',
      width: 100,
      render: (name: string, record: any) => (
        <span>{name || record.animalId}</span>
      ),
    },
    {
      title: '物种',
      dataIndex: ['animal', 'species'],
      key: 'species',
      width: 80,
    },
    {
      title: '状态变更',
      key: 'statusChange',
      width: 200,
      render: (_: any, record: any) => {
        const fromOpt = statusOptions.find(o => o.value === record.fromStatus);
        const toOpt = statusOptions.find(o => o.value === record.toStatus);
        return (
          <Space size="small">
            <Tag color={fromOpt?.color}>{fromOpt?.label || record.fromStatus}</Tag>
            <span style={{ color: '#999' }}>→</span>
            <Tag color={toOpt?.color}>{toOpt?.label || record.toStatus}</Tag>
          </Space>
        );
      },
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 100,
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '审批状态',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 100,
      render: (status: string) => {
        const opt = approvalStatusOptions.find(o => o.value === status);
        return <Tag color={opt?.color}>{opt?.label || status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
            详情
          </Button>
          {isAdmin && record.approvalStatus === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleOpenApprove(record, 'approved')}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleOpenApprove(record, 'rejected')}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        title={<span style={{ fontWeight: 600 }}>审批中心 - 状态变更申请</span>}
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
            刷新
          </Button>
        }
      >
        {!isAdmin && (
          <Alert
            style={{ marginBottom: 16 }}
            type="info"
            showIcon
            message="提示"
            description="只有管理员可以审批状态变更申请，您可以查看申请状态。"
          />
        )}

        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索动物编号"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            onPressEnter={() => { setPage(1); fetchData(); }}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="审批状态"
            style={{ width: 140 }}
            value={approvalStatusFilter}
            onChange={(v) => { setApprovalStatusFilter(v); setPage(1); }}
          >
            <Option value="">全部</Option>
            {approvalStatusOptions.map(o => (
              <Option key={o.value} value={o.value}>{o.label}</Option>
            ))}
          </Select>
        </div>

        <Table
          loading={loading}
          dataSource={data}
          columns={columns}
          rowKey="id"
          scroll={{ x: 900 }}
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
        title="申请详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        {detailItem && (
          <div style={{ marginTop: 8 }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="申请编号">#{detailItem.id}</Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {dayjs(detailItem.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">{detailItem.applicant}</Descriptions.Item>
              <Descriptions.Item label="审批状态">
                {(() => {
                  const opt = approvalStatusOptions.find(o => o.value === detailItem.approvalStatus);
                  return <Tag color={opt?.color}>{opt?.label || detailItem.approvalStatus}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="动物编号">
                {detailItem.animal?.name || detailItem.animalId}
              </Descriptions.Item>
              <Descriptions.Item label="物种">
                {detailItem.animal?.species || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="原状态">
                {(() => {
                  const opt = statusOptions.find(o => o.value === detailItem.fromStatus);
                  return <Tag color={opt?.color}>{opt?.label || detailItem.fromStatus}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="目标状态">
                {(() => {
                  const opt = statusOptions.find(o => o.value === detailItem.toStatus);
                  return <Tag color={opt?.color}>{opt?.label || detailItem.toStatus}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="变更原因" span={2}>
                {detailItem.reason || '-'}
              </Descriptions.Item>
              {detailItem.approvalStatus !== 'pending' && (
                <>
                  <Descriptions.Item label="审批人">
                    {detailItem.approver || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="审批时间">
                    {detailItem.approvedAt ? dayjs(detailItem.approvedAt).format('YYYY-MM-DD HH:mm') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="审批意见" span={2}>
                    {detailItem.approvalComment || '-'}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>

            {isAdmin && detailItem.approvalStatus === 'pending' && (
              <div style={{ marginTop: 20, textAlign: 'right' }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => handleOpenApprove(detailItem, 'approved')}
                  >
                    通过申请
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => handleOpenApprove(detailItem, 'rejected')}
                  >
                    拒绝申请
                  </Button>
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={approveType === 'approved' ? '通过申请' : '拒绝申请'}
        open={approveModalVisible}
        onOk={handleApproveSubmit}
        onCancel={() => setApproveModalVisible(false)}
        width={480}
        okText={approveType === 'approved' ? '确认通过' : '确认拒绝'}
        cancelText="取消"
        confirmLoading={approveLoading}
        okButtonProps={{ danger: approveType === 'rejected' }}
        destroyOnClose
      >
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 16 }}>
            {approveType === 'approved' ? (
              <Alert type="success" showIcon message="确认通过该状态变更申请？" description="通过后动物状态将自动更新。" />
            ) : (
              <Alert type="error" showIcon message="确认拒绝该状态变更申请？" description="拒绝后申请人将收到拒绝结果。" />
            )}
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>
              审批意见 {approveType === 'rejected' && <span style={{ color: '#ff4d4f' }}>*</span>}
            </div>
            <TextArea
              rows={4}
              value={approveComment}
              onChange={(e) => setApproveComment(e.target.value)}
              placeholder={approveType === 'rejected' ? '请填写拒绝原因' : '请输入审批意见（可选）'}
              maxLength={500}
              showCount
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StatusChangeApproval;
