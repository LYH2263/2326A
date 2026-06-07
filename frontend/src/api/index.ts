import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动附加 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.message || error.message || '网络请求失败';

    // Token 过期或未认证，跳转登录
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 避免在登录页重复跳转
      if (!window.location.pathname.includes('/login')) {
        message.error('登录已过期，请重新登录');
        window.location.href = '/login';
      }
    } else {
      message.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }

    return Promise.reject(error);
  },
);

// ========== 认证 API ==========
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// ========== 动物管理 API ==========
export const animalApi = {
  getList: (params?: any) => api.get('/animals', { params }),
  getDetail: (id: number) => api.get(`/animals/${id}`),
  create: (data: any) => api.post('/animals', data),
  update: (id: number, data: any) => api.patch(`/animals/${id}`, data),
  delete: (id: number) => api.delete(`/animals/${id}`),
  getSpecies: () => api.get('/animals/species'),
  cageSplit: (data: any) => api.post('/animals/cage-split', data),
  cageMerge: (data: any) => api.post('/animals/cage-merge', data),
  getTransferLogs: (params?: any) => api.get('/animals/transfer-logs', { params }),
  getAnimalTransferLogs: (id: number) => api.get(`/animals/${id}/transfer-logs`),
  getStatusFlowRules: () => api.get('/animals/status-flow/rules'),
  getStatusChangeLogs: (id: number) => api.get(`/animals/${id}/status-logs`),
};

// ========== 健康记录 API ==========
export const healthApi = {
  getList: (params?: any) => api.get('/health-records', { params }),
  getDetail: (id: number) => api.get(`/health-records/${id}`),
  create: (data: any) => api.post('/health-records', data),
  update: (id: number, data: any) => api.patch(`/health-records/${id}`, data),
  delete: (id: number) => api.delete(`/health-records/${id}`),
  getTrend: (animalId: number, limit?: number) =>
    api.get(`/health-records/trend/${animalId}`, { params: { limit } }),
  getMultiComparison: (animalIds: number[], startDate?: string, endDate?: string) =>
    api.get('/health-records/comparison/multi', {
      params: { animalIds: animalIds.join(','), startDate, endDate },
    }),
  getNormalRanges: (species?: string) =>
    api.get('/health-records/normal-ranges', { params: { species } }),
};

// ========== 实验项目 API ==========
export const experimentApi = {
  getList: (params?: any) => api.get('/experiments', { params }),
  getDetail: (id: number) => api.get(`/experiments/${id}`),
  create: (data: any) => api.post('/experiments', data),
  update: (id: number, data: any) => api.patch(`/experiments/${id}`, data),
  delete: (id: number) => api.delete(`/experiments/${id}`),
  addAnimal: (data: any) => api.post('/experiments/animals', data),
  removeAnimal: (id: number) => api.delete(`/experiments/animals/${id}`),
};

// ========== 实验数据点 API ==========
export const experimentDataPointApi = {
  getList: (params?: any) => api.get('/experiment-data-points', { params }),
  getDetail: (id: number) => api.get(`/experiment-data-points/${id}`),
  create: (data: any) => api.post('/experiment-data-points', data),
  batchCreate: (data: { points: any[] }) => api.post('/experiment-data-points/batch', data),
  update: (id: number, data: any) => api.patch(`/experiment-data-points/${id}`, data),
  delete: (id: number) => api.delete(`/experiment-data-points/${id}`),
  getMetricNames: (experimentId: number) => api.get('/experiment-data-points/metrics', { params: { experimentId } }),
  getStatistics: (params: {
    experimentId: number;
    metricName: string;
    groupBy?: 'animal' | 'day' | 'week';
    startDate?: string;
    endDate?: string;
    animalIds?: number[];
  }) => {
    const { animalIds, ...rest } = params;
    return api.get('/experiment-data-points/statistics', {
      params: {
        ...rest,
        animalIds: animalIds ? animalIds.join(',') : undefined,
      },
    });
  },
  getTimeSeries: (params: {
    experimentId: number;
    metricName: string;
    animalIds?: number[];
    startDate?: string;
    endDate?: string;
  }) => {
    const { animalIds, ...rest } = params;
    return api.get('/experiment-data-points/time-series', {
      params: {
        ...rest,
        animalIds: animalIds ? animalIds.join(',') : undefined,
      },
    });
  },
};

// ========== 饲养记录 API ==========
export const feedingApi = {
  getList: (params?: any) => api.get('/feeding-records', { params }),
  getDetail: (id: number) => api.get(`/feeding-records/${id}`),
  create: (data: any) => api.post('/feeding-records', data),
  update: (id: number, data: any) => api.patch(`/feeding-records/${id}`, data),
  delete: (id: number) => api.delete(`/feeding-records/${id}`),
};

// ========== 统计 API ==========
export const statisticsApi = {
  getOverview: () => api.get('/statistics/overview'),
  getAnimalStats: () => api.get('/statistics/animals'),
  getExperimentStats: () => api.get('/statistics/experiments'),
  getFeedingStats: () => api.get('/statistics/feeding'),
};

// ========== 体检排班 API ==========
export const checkupScheduleApi = {
  getList: (params?: any) => api.get('/checkup-schedules', { params }),
  getDetail: (id: number) => api.get(`/checkup-schedules/${id}`),
  create: (data: any) => api.post('/checkup-schedules', data),
  update: (id: number, data: any) => api.patch(`/checkup-schedules/${id}`, data),
  delete: (id: number) => api.delete(`/checkup-schedules/${id}`),
  getByDateRange: (startDate: string, endDate: string, params?: any) =>
    api.get('/checkup-schedules/date-range', { params: { startDate, endDate, ...params } }),
  batchCreate: (data: any) => api.post('/checkup-schedules/batch', data),
  complete: (id: number, data: any) => api.patch(`/checkup-schedules/${id}/complete`, data),
  cancel: (id: number, notes?: string) =>
    api.patch(`/checkup-schedules/${id}/cancel`, { notes }),
  getVeterinarians: () => api.get('/checkup-schedules/veterinarians'),
  getDailyStats: (date: string) => api.get('/checkup-schedules/daily-stats', { params: { date } }),
};

// ========== 预警通知 API ==========
export const alertApi = {
  getList: (params?: any) => api.get('/alerts', { params }),
  getDetail: (id: number) => api.get(`/alerts/${id}`),
  getStats: () => api.get('/alerts/stats'),
  getUnreadCount: () => api.get('/alerts/unread-count'),
  markAsRead: (id: number) => api.patch(`/alerts/${id}/read`),
  markAllAsRead: () => api.patch('/alerts/read-all'),
  markAsResolved: (id: number) => api.patch(`/alerts/${id}/resolve`),
  scanAlerts: () => api.post('/alerts/scan'),
};

export default api;
