import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Select, Modal, Form,
  DatePicker, message, Popconfirm, Tooltip, Typography, Descriptions, List, Badge,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, ReloadOutlined, ExperimentOutlined, UserAddOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { experimentApi, animalApi } from '../api';

const { Option } = Select;
const { TextArea } = Input;

const statusOptions = [
  { value: 'planning', label: '计划中', color: 'blue' },
  { value: 'in_progress', label: '进行中', color: 'processing' },
  { value: 'completed', label: '已完成', color: 'success' },
  { value: 'suspended', label: '已暂停', color: 'warning' },
  { value: 'cancelled', label: '已取消', color: 'default' },
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
  const [editingExperiment, setEditingExperiment] = useState<any>(null);
  const [detailExperiment, setDetailExperiment] = useState<any>(null);
  const [animals, setAnimals] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [animalForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await experimentApi.getList({
        page, pageSize, keyword: keyword || undefined, status: statusFilter,
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, statusFilter]);

  const fetchAnimals = async () => {
    try {
      const res: any = await animalApi.getList({ page: 1, pageSize: 100 });
      setAnimals(res?.list || []);
    } catch {
      // handled
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
    } catch {
      // handled
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await experimentApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch {
      // handled
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
      // handled
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
      // handled
    }
  };

  const handleRemoveAnimal = async (eaId: number) => {
    try {
      await experimentApi.removeAnimal(eaId);
      message.success('已移除');
      handleDetail(detailExperiment.id);
    } catch {
      // handled
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

      {/* Create/Edit Modal */}
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

      {/* Detail Modal */}
      <Modal
        title="实验项目详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {detailExperiment && (
          <>
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small" style={{ marginTop: 16 }}>
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
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Typography.Title level={5} style={{ margin: 0 }}>关联动物</Typography.Title>
                <Button size="small" type="primary" icon={<UserAddOutlined />} onClick={() => { animalForm.resetFields(); setAddAnimalVisible(true); }}>
                  添加关联
                </Button>
              </div>
              <List
                size="small"
                bordered
                dataSource={detailExperiment.experimentAnimals || []}
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
          </>
        )}
      </Modal>

      {/* Add Animal Modal */}
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
    </div>
  );
};

export default Experiments;
