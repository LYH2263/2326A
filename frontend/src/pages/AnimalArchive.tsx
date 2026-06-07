import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Timeline,
  Button,
  Space,
  Tag,
  Spin,
  message,
  Typography,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  PrinterOutlined,
  FileWordOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { animalArchiveApi } from '../api';

const { Title, Text } = Typography;

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

const conditionOptions = [
  { value: 'normal', label: '正常', color: 'success' },
  { value: 'abnormal', label: '异常', color: 'warning' },
  { value: 'critical', label: '危重', color: 'error' },
];

const experimentStatusOptions: Record<string, string> = {
  planning: '规划中',
  in_progress: '进行中',
  completed: '已完成',
  suspended: '已暂停',
  cancelled: '已取消',
};

const AnimalArchive: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [archiveData, setArchiveData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchArchive(parseInt(id, 10));
    }
  }, [id]);

  const fetchArchive = async (animalId: number) => {
    try {
      setLoading(true);
      const res: any = await animalArchiveApi.getArchive(animalId);
      setArchiveData(res);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleExportWord = async () => {
    if (!id) return;
    try {
      const blob = await animalArchiveApi.exportWord(parseInt(id, 10));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${archiveData?.basicInfo?.name || '动物档案'}_动物档案.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      message.success('Word 文档导出成功');
    } catch {
      message.error('导出失败，请稍后重试');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusTag = (status: string) => {
    const opt = statusOptions.find((o) => o.value === status);
    return opt ? <Tag color={opt.color}>{opt.label}</Tag> : <Tag>{status}</Tag>;
  };

  const getGenderLabel = (gender: string) => {
    const opt = genderOptions.find((o) => o.value === gender);
    return opt ? opt.label : gender;
  };

  const getConditionTag = (condition: string) => {
    const opt = conditionOptions.find((o) => o.value === condition);
    return opt ? <Tag color={opt.color}>{opt.label}</Tag> : <Tag>{condition}</Tag>;
  };

  const healthColumns = [
    {
      title: '检查日期',
      dataIndex: 'checkDate',
      key: 'checkDate',
      width: 120,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD'),
    },
    {
      title: '体温(℃)',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 90,
      render: (v: number) => (v ? v : '-'),
    },
    {
      title: '体重(g)',
      dataIndex: 'weight',
      key: 'weight',
      width: 90,
      render: (v: number) => (v ? v : '-'),
    },
    {
      title: '心率(次/分)',
      dataIndex: 'heartRate',
      key: 'heartRate',
      width: 100,
      render: (v: number) => (v ? v : '-'),
    },
    {
      title: '呼吸(次/分)',
      dataIndex: 'respiratoryRate',
      key: 'respiratoryRate',
      width: 100,
      render: (v: number) => (v ? v : '-'),
    },
    {
      title: '状况',
      dataIndex: 'condition',
      key: 'condition',
      width: 80,
      render: (c: string) => getConditionTag(c),
    },
    {
      title: '诊断',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      ellipsis: true,
    },
    {
      title: '兽医',
      dataIndex: 'veterinarian',
      key: 'veterinarian',
      width: 100,
    },
  ];

  const experimentColumns = [
    {
      title: '实验名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '项目编号',
      dataIndex: 'projectCode',
      key: 'projectCode',
      width: 120,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
    },
    {
      title: '加入日期',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 120,
      render: (d: string) => (d ? dayjs(d).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '退出日期',
      dataIndex: 'leaveDate',
      key: 'leaveDate',
      width: 120,
      render: (d: string) => (d ? dayjs(d).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => experimentStatusOptions[s] || s,
    },
  ];

  return (
    <div className="animal-archive-page">
      <div className="no-print">
        <Card style={{ borderRadius: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                返回
              </Button>
              <Title level={4} style={{ margin: 0 }}>
                动物档案
              </Title>
            </div>
            <Space>
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                打印
              </Button>
              <Button
                type="primary"
                icon={<FileWordOutlined />}
                onClick={handleExportWord}
              >
                导出 Word
              </Button>
            </Space>
          </div>
        </Card>
      </div>

      <Spin spinning={loading} tip="加载档案数据中...">
        {archiveData && (
          <div className="archive-content">
            <Card
              className="archive-section"
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="section-number">一</span>
                <span>基本信息</span>
              </div>
            }
              style={{ borderRadius: 12, marginBottom: 16 }}
            >
              <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                <Descriptions.Item label="编号">
                  <Text strong>{archiveData.basicInfo?.name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="物种">
                  {archiveData.basicInfo?.species}
                </Descriptions.Item>
                <Descriptions.Item label="品系">
                  {archiveData.basicInfo?.breed || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="性别">
                  {getGenderLabel(archiveData.basicInfo?.gender)}
                </Descriptions.Item>
                <Descriptions.Item label="体重">
                  {archiveData.basicInfo?.weight
                    ? `${archiveData.basicInfo.weight}g`
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  {getStatusTag(archiveData.basicInfo?.status)}
                </Descriptions.Item>
                <Descriptions.Item label="笼号">
                  {archiveData.basicInfo?.cageNumber || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="RFID">
                  {archiveData.basicInfo?.rfidTag || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="出生日期">
                  {archiveData.basicInfo?.birthDate
                    ? dayjs(archiveData.basicInfo.birthDate).format('YYYY-MM-DD')
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="来源">
                  {archiveData.basicInfo?.source || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="父亲编号">
                  {archiveData.basicInfo?.father?.name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="母亲编号">
                  {archiveData.basicInfo?.mother?.name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="备注" span={2}>
                  {archiveData.basicInfo?.description || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              className="archive-section"
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="section-number">二</span>
                  <span>健康记录</span>
                  <Tag color="blue" style={{ marginLeft: 'auto' }}>
                    共 {archiveData.healthRecords?.length || 0} 条
                  </Tag>
                </div>
              }
              style={{ borderRadius: 12, marginBottom: 16 }}
            >
              {archiveData.healthRecords?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  暂无健康记录
                </div>
              ) : (
                <Table
                  dataSource={archiveData.healthRecords}
                  columns={healthColumns}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  scroll={{ x: 800 }}
                />
              )}
            </Card>

            <Card
              className="archive-section"
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="section-number">三</span>
                  <span>饲养记录</span>
                  <Tag color="green" style={{ marginLeft: 'auto' }}>
                    共 {archiveData.feedingRecords?.length || 0} 条
                  </Tag>
                </div>
              }
              style={{ borderRadius: 12, marginBottom: 16 }}
            >
              {archiveData.feedingRecords?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  暂无饲养记录
                </div>
              ) : (
                <Timeline
                  mode="left"
                  items={archiveData.feedingRecords.map((record: any) => ({
                    color: 'green',
                    label: dayjs(record.feedDate).format('YYYY-MM-DD'),
                    children: (
                      <div>
                        <Space size={8} wrap>
                          <Tag color="green">
                            {record.foodType}
                          </Tag>
                          <Text strong>
                            {record.quantity
                              ? `${record.quantity}${record.unit || 'g'}`
                              : '-'}
                          </Text>
                          {record.waterMl && (
                            <Text type="secondary">饮水: {record.waterMl}ml</Text>
                          )}
                        </Space>
                        <div style={{ marginTop: 4, color: '#666', fontSize: 13 }}>
                          {record.feedTime && <span>时间：{record.feedTime} </span>}
                          {record.feeder && <span>饲喂员：{record.feeder}</span>}
                        </div>
                        {record.notes && (
                          <div style={{ marginTop: 2, color: '#999', fontSize: 12 }}>
                            备注：{record.notes}
                          </div>
                        )}
                      </div>
                    ),
                  }))}
                />
              )}
            </Card>

            <Card
              className="archive-section"
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="section-number">四</span>
                  <span>参与实验</span>
                  <Tag color="purple" style={{ marginLeft: 'auto' }}>
                    共 {archiveData.experiments?.length || 0} 项
                  </Tag>
                </div>
              }
              style={{ borderRadius: 12 }}
            >
              {archiveData.experiments?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  暂无参与实验
                </div>
              ) : (
                <Table
                  dataSource={archiveData.experiments}
                  columns={experimentColumns}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  scroll={{ x: 800 }}
                />
              )}
            </Card>

            <div className="print-footer no-screen">
              <Divider />
              <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
                档案生成时间：{dayjs().format('YYYY-MM-DD HH:mm:ss')}
              </div>
            </div>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default AnimalArchive;
