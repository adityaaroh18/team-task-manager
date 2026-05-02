import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Users
export const usersApi = {
  search: (q) => api.get('/users/search', { params: { q } }),
};

// Auth
export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Dashboard
export const dashboardApi = {
  get: () => api.get('/dashboard'),
  getMyTasks: () => api.get('/dashboard/my-tasks'),
};

// Projects
export const projectsApi = {
  list: () => api.get('/projects'),
  create: (data) => api.post('/projects', data),
  get: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getMembers: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  updateMemberRole: (projectId, userId, data) => api.put(`/projects/${projectId}/members/${userId}`, data),
  removeMember: (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`),
};

// Tasks
export const tasksApi = {
  list: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  get: (projectId, taskId) => api.get(`/projects/${projectId}/tasks/${taskId}`),
  update: (projectId, taskId, data) => api.put(`/projects/${projectId}/tasks/${taskId}`, data),
  delete: (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`),
  getComments: (projectId, taskId) => api.get(`/projects/${projectId}/tasks/${taskId}/comments`),
  addComment: (projectId, taskId, data) => api.post(`/projects/${projectId}/tasks/${taskId}/comments`, data),
};

export default api;
