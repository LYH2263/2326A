import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Select, Modal, Form,
  InputNumber, DatePicker, TimePicker, Input, message, Popconfirm, Tooltip, Typography,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, CoffeeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { feedingApi, animalApi } from '../api';

const { Option } = Select;
const { TextArea } = Input;

const FeedingRecords: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [animalFilter, setAnimalFilter] = useState<number | undefined>();
  const [dateFilter, setDateFilter] = useState<string | undefined>();
  const [animals, setAnimals] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await feedingApi.getList({
        page, pageSize, animalId: animalFilter, feedDate: dateFilter,
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, animalFilter, dateFilter]);

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
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ unit: 'g' });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      feedDate: record.feedDate ? dayjs(record.feedDate) : null,
      feedTime: record.feedTime ? dayjs(record.feedTime, 'HH:mm:ss') : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await feedingApi.delete(id);
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
        feedDate: values.feedDate?.format('YYYY-MM-DD'),
        feedTime: values.feedTime?.format('HH:mm:ss'),
      };

      if (editingRecord) {
        await feedingApi.update(editingRecord.id, payload);
        message.success('更新成功');
      } else {
        await feedingApi.create(payload);
        message.success('添加成功');
      }
      setModalVisible(false);
      fetchData();
    } catch {
      // handled
    }
  };

  const columns = [
    {
      title: '动物编号',
      key: 'animalName',
      width: 100,
      render: (_: any, record: any) => (
        <Typography.Text strong>{record.animal?.name || `#${record.animalId}`}</Typography.Text>
      ),
    },
    {
      title: '喂养日期',
      dataIndex: 'feedDate',
      key: 'feedDate',
      width: 120,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '-',
    },
    {
      title: '时间',
      dataIndex: 'feedTime',
      key: 'feedTime',
      width: 80,
      render: (t: string) => t || '-',
    },
    { title: '饲料类型', dataIndex: 'foodType', key: 'foodType', ellipsis: true },
    {
      title: '数量',
      key: 'quantity',
      width: 90,
      render: (_: any, record: any) => record.quantity ? `${record.quantity}${record.unit || 'g'}` : '-',
    },
    {
      title: '饮水(ml)',
      dataIndex: 'waterMl',
      key: 'waterMl',
      width: 90,
      render: (v: number) => v ? `${v}ml` : '-',
    },
    { title: '喂养员', dataIndex: 'feeder', key: 'feeder', width: 80 },
    { title: '备注', dataIndex: 'notes', key: 'notes', ellipsis: true, width: 140 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
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
            <CoffeeOutlined style={{ color: '#059669' }} />
            <span style={{ fontWeight: 600 }}>饲养记录管理</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加记录
          </Button>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Select
            placeholder="选择动物"
            allowClear
            showSearch
            optionFilterProp="children"
            style={{ width: 180 }}
            value={animalFilter}
            onChange={(v) => { setAnimalFilter(v); setPage(1); }}
          >
            {animals.map(a => <Option key={a.id} value={a.id}>{a.name} ({a.species})</Option>)}
          </Select>
          <DatePicker
            placeholder="喂养日期"
            onChange={(d) => { setDateFilter(d ? d.format('YYYY-MM-DD') : undefined); setPage(1); }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={() => { setAnimalFilter(undefined); setDateFilter(undefined); setPage(1); }}>
            重置
          </Button>
        </div>

        <Table
          loading={loading}
          dataSource={data}
          columns={columns}
          rowKey="id"
          scroll={{ x: 980 }}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑饲养记录' : '添加饲养记录'}
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
            <Form.Item name="animalId" label="动物" rules={[{ required: true, message: '请选择动物' }]}>
              <Select showSearch optionFilterProp="children" placeholder="选择动物">
                {animals.map(a => <Option key={a.id} value={a.id}>{a.name} ({a.species})</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="feedDate" label="喂养日期" rules={[{ required: true, message: '请选择日期' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="feedTime" label="喂养时间">
              <TimePicker style={{ width: '100%' }} format="HH:mm:ss" />
            </Form.Item>
            <Form.Item name="foodType" label="饲料类型" rules={[{ required: true, message: '请输入饲料类型' }]}>
              <Input placeholder="如 标准啮齿类动物饲料" />
            </Form.Item>
            <Form.Item name="quantity" label="数量">
              <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
            </Form.Item>
            <Form.Item name="unit" label="单位">
              <Select>
                <Option value="g">克(g)</Option>
                <Option value="ml">毫升(ml)</Option>
                <Option value="kg">千克(kg)</Option>
              </Select>
            </Form.Item>
            <Form.Item name="waterMl" label="饮水量(ml)">
              <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
            </Form.Item>
            <Form.Item name="feeder" label="喂养员">
              <Input placeholder="喂养员姓名" />
            </Form.Item>
          </div>
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="其他备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FeedingRecords;
