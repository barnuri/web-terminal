import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Create axios instance with default configuration
const axiosInstance: AxiosInstance = axios.create({
  baseURL: '/', // Use relative URLs since frontend and backend are on same origin
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    origin: window.location.origin,
    href: window.location.href,
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('jwt_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for global error handling
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;

      if (status === 401) {
        // Token might be expired, remove it
        localStorage.removeItem('jwt_token');
        // Dispatch custom event for components to handle logout
        window.dispatchEvent(new CustomEvent('auth:logout'));
      } else if (status === 403) {
        // Forbidden - user not allowed
        console.error(
          'Access forbidden:',
          error.response.data?.message || 'Insufficient permissions',
        );
      } else if (status >= 500) {
        // Server errors
        console.error('Server error:', error.response.data?.message || 'Internal server error');
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
    } else {
      // Request setup error
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  },
);

// Helper function to handle API errors consistently
export const handleApiError = (error: any): string => {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.response.statusText;

    switch (status) {
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return message || 'Access denied. You are not authorized to perform this action.';
      case 404:
        return 'Resource not found.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return message || `Request failed with status ${status}`;
    }
  } else if (error.request) {
    return 'Network error. Please check your connection and try again.';
  } else {
    return error.message || 'An unexpected error occurred.';
  }
};

export default axiosInstance;
