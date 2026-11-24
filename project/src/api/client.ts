import axios, { type AxiosInstance, type AxiosRequestConfig, AxiosError } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/utils/auth';

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
).replace(/\/+$/, '');

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach access token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Track refresh state to avoid duplicate refresh calls
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${BASE_URL}/auth/refresh/`, {
      refresh: refreshToken,
    });
    const data = response.data as Record<string, unknown>;
    const newAccess =
      (data.access as string) ||
      (data.access_token as string) ||
      null;
    const newRefresh =
      (data.refresh as string) ||
      (data.refresh_token as string) ||
      refreshToken;
    if (newAccess) {
      setTokens(newAccess, newRefresh);
      return newAccess;
    }
    return null;
  } catch {
    return null;
  }
}

// Handle 401 by attempting token refresh once
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }

      const newToken = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;

      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }

      // Refresh failed — clear session
      clearTokens();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Error classification helper
export function classifyError(error: unknown): {
  type: 'network' | 'cors' | 'unauthorized' | 'forbidden' | 'not_found' | 'server' | 'client' | 'unknown';
  message: string;
  status?: number;
} {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError;
    const status = axiosErr.response?.status;

    // No response = network or CORS
    if (!axiosErr.response) {
      if (axiosErr.message.includes('Network Error')) {
        return {
          type: 'cors',
          message:
            'Unable to reach the backend server. This may be a CORS issue — ensure your Django backend allows requests from this origin, or the server is running.',
          status: 0,
        };
      }
      return {
        type: 'network',
        message: 'Network error: Could not connect to the server. Please check your connection and that the backend is running.',
        status: 0,
      };
    }

    const errorData = axiosErr.response.data as Record<string, unknown> | undefined;
    const detail =
      (errorData?.detail as string) ||
      (errorData?.message as string) ||
      (typeof errorData === 'string' ? errorData : null) ||
      axiosErr.message;

    switch (status) {
      case 400:
        return { type: 'client', message: formatErrorDetail(errorData) || detail || 'Bad request. Please check your input.', status };
      case 401:
        return { type: 'unauthorized', message: 'Your session has expired. Please log in again.', status };
      case 403:
        return { type: 'forbidden', message: 'You do not have permission to perform this action.', status };
      case 404:
        return { type: 'not_found', message: 'The requested resource was not found.', status };
      case 500:
      case 502:
      case 503:
        return {
          type: 'server',
          message: formatErrorDetail(errorData) || 'The server encountered an error. Please try again later.',
          status,
        };
      default:
        return { type: 'unknown', message: formatErrorDetail(errorData) || detail || 'An unexpected error occurred.', status };
    }
  }

  return {
    type: 'unknown',
    message: error instanceof Error ? error.message : 'An unexpected error occurred.',
  };
}

function formatErrorDetail(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  if (typeof data === 'string') return data;

  const parts: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (key === 'detail' || key === 'message') {
      if (typeof value === 'string') parts.push(value);
    } else if (Array.isArray(value)) {
      parts.push(`${key}: ${value.join(', ')}`);
    } else if (typeof value === 'string') {
      parts.push(`${key}: ${value}`);
    }
  }
  return parts.length > 0 ? parts.join('; ') : null;
}

export { BASE_URL };
