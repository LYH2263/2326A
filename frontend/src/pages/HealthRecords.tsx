import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Select, Modal, Form,
  InputNumber, DatePicker, Input, message, Popconfirm, Tooltip, Typography,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, HeartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { healthApi, animalApi } from '../api';

const { Option } = Select;
const { TextArea } = Input;

const conditionOptions = [
  { value: 'normal', label: '正常', color: 'success' },
  { value: 'abnormal', label: '异常', color: 'warning' },
  { value: 'critical', label: '危急', color: 'error' },
];

const HealthRecords: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [conditionFilter, setConditionFilter] = useState<string | undefined>();
  const [animalFilter, setAnimalFilter] = useState<number | undefined>();
  const [animals, setAnimals] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await healthApi.getList({
        page, pageSize, condition: conditionFilter, animalId: animalFilter,
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, conditionFilter, animalFilter]);

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
    form.setFieldsValue({ condition: 'normal' });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      checkDate: record.checkDate ? dayjs(record.checkDate) : null,
      nextCheckDate: record.nextCheckDate ? dayjs(record.nextCheckDate) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await healthApi.delete(id);
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
        checkDate: values.checkDate?.format('YYYY-MM-DD'),
        nextCheckDate: values.nextCheckDate?.format('YYYY-MM-DD'),
      };

      if (editingRecord) {
        await healthApi.update(editingRecord.id, payload);
        message.success('更新成功');
      } else {
        await healthApi.create(payload);
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
      title: '检查日期',
      dataIndex: 'checkDate',
      key: 'checkDate',
      width: 120,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '-',
    },
    {
      title: '体温(℃)',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 90,
      render: (v: number) => v ? `${v}℃` : '-',
    },
    {
      title: '体重(g)',
      dataIndex: 'weight',
      key: 'weight',
      width: 90,
      render: (v: number) => v ? `${v}g` : '-',
    },
    {
      title: '心率',
      dataIndex: 'heartRate',
      key: 'heartRate',
      width: 80,
      render: (v: number) => v ? `${v}次/分` : '-',
    },
    {
      title: '健康状况',
      dataIndex: 'condition',
      key: 'condition',
      width: 100,
      render: (c: string) => {
        const opt = conditionOptions.find(o => o.value === c);
        return <Tag color={opt?.color}>{opt?.label || c}</Tag>;
      },
    },
    { title: '诊断', dataIndex: 'diagnosis', key: 'diagnosis', ellipsis: true },
    { title: '兽医', dataIndex: 'veterinarian', key: 'veterinarian', width: 80 },
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
            <HeartOutlined style={{ color: '#ec4899' }} />
            <span style={{ fontWeight: 600 }}>健康记录管理</span>
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
          <Select
            placeholder="健康状况"
            allowClear
            style={{ width: 140 }}
            value={conditionFilter}
            onChange={(v) => { setConditionFilter(v); setPage(1); }}
          >
            {conditionOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => { setConditionFilter(undefined); setAnimalFilter(undefined); setPage(1); }}>
            重置
          </Button>
        </div>

        <Table
          loading={loading}
          dataSource={data}
          columns={columns}
          rowKey="id"
          scroll={{ x: 950 }}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑健康记录' : '添加健康记录'}
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
            <Form.Item name="checkDate" label="检查日期" rules={[{ required: true, message: '请选择日期' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="temperature" label="体温(℃)">
              <InputNumber style={{ width: '100%' }} min={30} max={45} step={0.1} />
            </Form.Item>
            <Form.Item name="weight" label="体重(g)">
              <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
            </Form.Item>
            <Form.Item name="heartRate" label="心率(次/分)">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="respiratoryRate" label="呼吸频率(次/分)">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="condition" label="健康状况" rules={[{ required: true }]}>
              <Select>
                {conditionOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="veterinarian" label="兽医">
              <Input placeholder="兽医姓名" />
            </Form.Item>
          </div>
          <Form.Item name="diagnosis" label="诊断">
            <TextArea rows={2} placeholder="诊断结果" />
          </Form.Item>
          <Form.Item name="treatment" label="治疗方案">
            <TextArea rows={2} placeholder="治疗方案" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="nextCheckDate" label="下次检查日期">
              <DatePicker style={{ width: '100%' }} />
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

export default HealthRecords;
