import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Select, Modal, Form,
  InputNumber, DatePicker, message, Popconfirm, Descriptions, Typography, Tooltip,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
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

const genderOptions = [
  { value: 'male', label: '雄性' },
  { value: 'female', label: '雌性' },
  { value: 'unknown', label: '未知' },
];

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
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<any>(null);
  const [detailAnimal, setDetailAnimal] = useState<any>(null);
  const [form] = Form.useForm();

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

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchSpecies(); }, []);

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
    setModalVisible(true);
  };

  const handleDetail = async (id: number) => {
    try {
      const res: any = await animalApi.getDetail(id);
      setDetailAnimal(res);
      setDetailVisible(true);
    } catch {
      // handled
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await animalApi.delete(id);
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
        birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : undefined,
      };

      if (editingAnimal) {
        await animalApi.update(editingAnimal.id, payload);
        message.success('更新成功');
      } else {
        await animalApi.create(payload);
        message.success('添加成功');
      }
      setModalVisible(false);
      fetchData();
      fetchSpecies();
    } catch {
      // validation or api error
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
    { title: '笼号', dataIndex: 'cageNumber', key: 'cageNumber', width: 80 },
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

  return (
    <div>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        title={<span style={{ fontWeight: 600 }}>动物信息管理</span>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加动物
          </Button>
        }
      >
        {/* Search Bar */}
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

      {/* Add/Edit Modal */}
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
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select>
                {statusOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
              </Select>
            </Form.Item>
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

      {/* Detail Modal */}
      <Modal
        title="动物详细信息"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {detailAnimal && (
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
        )}
      </Modal>
    </div>
  );
};

export default AnimalList;
