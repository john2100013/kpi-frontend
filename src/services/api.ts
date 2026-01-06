import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    if (config.url?.includes('rating-options')) {
      console.log('🔍 [api] Request interceptor - rating-options call');
      console.log('🔍 [api] Request URL:', config.url);
      console.log('🔍 [api] Full URL:', config.baseURL + config.url);
      console.log('🔍 [api] Request headers:', config.headers);
      console.log('🔍 [api] Authorization header:', config.headers?.Authorization);
    }
    return config;
  },
  (error) => {
    console.error('❌ [api] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (response.config.url?.includes('rating-options')) {
      console.log('✅ [api] Response interceptor - rating-options response');
      console.log('✅ [api] Response status:', response.status);
      console.log('✅ [api] Response data:', response.data);
    }
    return response;
  },
  (error) => {
    if (error.config?.url?.includes('rating-options')) {
      console.error('❌ [api] Response interceptor - rating-options error');
      console.error('❌ [api] Error response:', error.response);
      console.error('❌ [api] Error status:', error.response?.status);
      console.error('❌ [api] Error data:', error.response?.data);
    }
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

