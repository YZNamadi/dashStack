import axios from 'axios';
import { useAuthStore } from '../state/auth.store';

const API_URL = 'http://localhost:3000'; // Your backend URL

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Auth ---
export const loginUser = async (credentials: any) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const getMe = async () => {
    const response = await api.get('/auth/me');
    return response.data;
}

// --- Datasources ---
export const getDatasources = async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/datasources`);
    return response.data;
}

export const createDatasource = async (projectId: string, data: any) => {
    const response = await api.post(`/projects/${projectId}/datasources`, data);
    return response.data;
}

export const runDatasourceQuery = async (projectId: string, datasourceId: string, query: string) => {
    const response = await api.post(`/projects/${projectId}/datasources/${datasourceId}/run`, { query });
    return response.data;
}


export default api; 