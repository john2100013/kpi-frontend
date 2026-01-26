import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

interface ApiErrorResponse {
  message: string;
  error?: string;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

let csrfToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setCSRFToken = (token: string | null) => {
  csrfToken = token;
};

export const getCSRFToken = (): string | null => {
  return csrfToken;
};

export const clearAuthCookies = () => {
  setCSRFToken(null);
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (csrfToken && config.headers && config.method !== 'get') {
      config.headers['x-csrf-token'] = csrfToken;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Request configuration error:', error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh-token') ||
      originalRequest.url?.includes('/auth/logout')
    ) {
      return Promise.reject(error);
    }

    // Handle 401 with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh-token');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          setCSRFToken(null);
          window.dispatchEvent(new CustomEvent('auth:logout'));
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) {
      console.error('CSRF validation failed');
    }

    if (!error.response) {
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;

