import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for unified format handling
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const getFilters = async () => {
  return apiClient.get('/filters');
};

export const getJobs = async (params = {}) => {
  return apiClient.get('/jobs', { params });
};

export const predictSalary = async (data) => {
  return apiClient.post('/predict-salary', data);
};

export const getStats = async () => {
  return apiClient.get('/stats');
};

export const getLearningAdvice = async (data) => {
  return apiClient.post('/advisor/suggest', data);
};

export const getLocations = async () => {
  return apiClient.get('/locations');
};

export const getLevels = async () => {
  return apiClient.get('/levels');
};

export const getSkills = async () => {
  return apiClient.get('/skills');
};

export const getRoles = async () => {
  return apiClient.get('/roles');
};

export const getCompanies = async () => {
  return apiClient.get('/companies');
};

// Analytics APIs
export const getAnalyticsOverview = async () => {
  return apiClient.get('/analytics/overview');
};

export const getAnalyticsSkills = async () => {
  return apiClient.get('/analytics/skills');
};

export const getAnalyticsSalary = async () => {
  return apiClient.get('/analytics/salary');
};

export const getAnalyticsTrend = async () => {
  return apiClient.get('/analytics/trend');
};

// Chat APIs
export const chatWithAI = async (message) => {
  return apiClient.post('/chat', { message });
};
