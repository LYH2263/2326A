import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Select, Modal, Form,
  InputNumber, DatePicker, message, Popconfirm, Descriptions, Typography,
  Row, Col,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { breedingApi, animalApi } from '../api';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

const statusOptions = [
  { value: 'planned', label: '计划中', color: 'default' },
  { value: 'pairing', label: '配对中', color: 'processing' },
  { value: 'pregnant', label: '怀孕中', color: 'warning' },
  { value: 'birthed', label: '已产仔', color: 'success' },
  { value: 'weaned', label: '已断奶', color: 'success' },
  { value: 'failed', label: '失败', color: 'error' },
];

const BreedingRecords: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const [animalList, setAnimalList] = useState<any[]>([]);
  const [maleAnimals, setMaleAnimals] = useState<any[]>([]);
  const [femaleAnimals, setFemaleAnimals] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await breedingApi.getList({
        page, pageSize,
        status: statusFilter,
      });
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  const fetchAnimals = async () => {
    try {
      const res: any = await animalApi.getList({ pageSize: 1000 });
      const animals = res?.list || [];
      setAnimalList(animals);
      setMaleAnimals(animals.filter((a: any) => a.gender === 'male'));
      setFemaleAnimals(animals.filter((a: any) => a.gender === 'female'));
    } catch {
      // handled
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchAnimals(); }, []);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ status: 'planned' });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      pairingDate: record.pairingDate ? dayjs(record.pairingDate) : null,
      expectedBirthDate: record.expectedBirthDate ? dayjs(record.expectedBirthDate) : null,
      actualBirthDate: record.actualBirthDate ? dayjs(record.actualBirthDate) : null,
    });
    setModalVisible(true);
  };

  const handleDetail = async (id: number) => {
    try {
      const res: any = await breedingApi.getDetail(id);
      setDetailRecord(res);
      setDetailVisible(true);
    } catch {
      // handled
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await breedingApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch {
      // handled
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: any = {
        ...values,
        pairingDate: values.pairingDate ? values.pairingDate.format('YYYY-MM-DD') : undefined,
        expectedBirthDate: values.expectedBirthDate ? values.expectedBirthDate.format('YYYY-MM-DD') : undefined,
        actualBirthDate: values.actualBirthDate ? values.actualBirthDate.format('YYYY-MM-DD') : undefined,
      };

      if (editingRecord) {
        await breedingApi.update(editingRecord.id, payload);
        message.success('更新成功');
      } else {
        await breedingApi.create(payload);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch {
      // validation or api error
    }
  };

  const filteredData = keyword
    ? data.filter((item: any) =>
        item.male?.name?.includes(keyword) ||
        item.female?.name?.includes(keyword) ||
        item.male?.species?.includes(keyword)
      )
    : data;

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '雄性',
      dataIndex: ['male', 'name'],
      key: 'male',
      width: 100,
      render: (text: string, record: any) => (
        <Space size={4}>
          <Tag color="blue">{record.male?.name || '-'}</Tag>
        </Space>
      ),
    },
    {
      title: '雌性',
      dataIndex: ['female', 'name'],
      key: 'female',
      width: 100,
      render: (text: string, record: any) => (
        <Space size={4}>
          <Tag color="magenta">{record.female?.name || '-'}</Tag>
        </Space>
      ),
    },
    {
      title: '物种',
      dataIndex: ['male', 'species'],
      key: 'species',
      width: 80,
    },
    {
      title: '配对日期',
      dataIndex: 'pairingDate',
      key: 'pairingDate',
      width: 110,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '-',
    },
    {
      title: '预产期',
      dataIndex: 'expectedBirthDate',
      key: 'expectedBirthDate',
      width: 110,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '-',
    },
    {
      title: '实际产仔',
      dataIndex: 'actualBirthDate',
      key: 'actualBirthDate',
      width: 110,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '-',
    },
    {
      title: '产仔数',
      dataIndex: 'litterCount',
      key: 'litterCount',
      width: 70,
      render: (v: number) => v !== undefined && v !== null ? v : '-',
    },
    {
      title: '存活数',
      dataIndex: 'survivalCount',
      key: 'survivalCount',
      width: 70,
      render: (v: number) => v !== undefined && v !== null ? v : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const opt = statusOptions.find(o => o.value === status);
        return <Tag color={opt?.color}>{opt?.label || status}</Tag>;
      },
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 90,
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record.id)} />
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="确定删除该繁殖记录吗？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        title={<span style={{ fontWeight: 600 }}>繁殖记录管理</span>}
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加记录
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
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1100 }}
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
        title={editingRecord ? '编辑繁殖记录' : '添加繁殖记录'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={680}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="maleId" label="雄性动物" rules={[{ required: true, message: '请选择雄性动物' }]}>
                <Select
                  placeholder="选择雄性动物"
                  showSearch
                  optionFilterProp="children"
                >
                  {maleAnimals.map((a: any) => (
                    <Option key={a.id} value={a.id}>
                      {a.name} ({a.species})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="femaleId" label="雌性动物" rules={[{ required: true, message: '请选择雌性动物' }]}>
                <Select
                  placeholder="选择雌性动物"
                  showSearch
                  optionFilterProp="children"
                >
                  {femaleAnimals.map((a: any) => (
                    <Option key={a.id} value={a.id}>
                      {a.name} ({a.species})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="pairingDate" label="配对日期" rules={[{ required: true, message: '请选择配对日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select>
                  {statusOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="expectedBirthDate" label="预计出生日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actualBirthDate" label="实际出生日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="litterCount" label="产仔数量">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="survivalCount" label="存活数量">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="maleCount" label="雄性幼崽">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="femaleCount" label="雌性幼崽">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="繁殖记录详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        {detailRecord && (
          <div style={{ marginTop: 8 }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="状态">
                <Tag color={statusOptions.find(o => o.value === detailRecord.status)?.color}>
                  {statusOptions.find(o => o.value === detailRecord.status)?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="操作人">{detailRecord.operator || '-'}</Descriptions.Item>
              <Descriptions.Item label="雄性动物">
                <Tag color="blue">{detailRecord.male?.name || '-'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="雌性动物">
                <Tag color="magenta">{detailRecord.female?.name || '-'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="物种">{detailRecord.male?.species || '-'}</Descriptions.Item>
              <Descriptions.Item label="品系">{detailRecord.male?.breed || '-'}</Descriptions.Item>
              <Descriptions.Item label="配对日期">
                {detailRecord.pairingDate ? dayjs(detailRecord.pairingDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="预产期">
                {detailRecord.expectedBirthDate ? dayjs(detailRecord.expectedBirthDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="实际出生日期">
                {detailRecord.actualBirthDate ? dayjs(detailRecord.actualBirthDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="产仔数量">{detailRecord.litterCount ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="存活数量">{detailRecord.survivalCount ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="雄性幼崽">{detailRecord.maleCount ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="雌性幼崽">{detailRecord.femaleCount ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{detailRecord.notes || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {dayjs(detailRecord.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BreedingRecords;
