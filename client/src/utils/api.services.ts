import axiosInstance, { handleApiError } from './api';
import type { AuthStatusResponse } from './api.types';

// Auth-related API calls
export const authApi = {
  // Get authentication status
  getStatus: async (): Promise<AuthStatusResponse> => {
    try {
      const response = await axiosInstance.get<AuthStatusResponse>('/auth/status');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Logout (if there's a server endpoint for it)
  logout: async (): Promise<void> => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      // Even if logout fails, we can still clear local storage
      console.warn('Server logout failed:', handleApiError(error));
    }
  },
};

// Example: Terminal-related API calls (if any are added in the future)
export const terminalApi = {
  // Example: Get user's terminal sessions
  getSessions: async (): Promise<any[]> => {
    try {
      const response = await axiosInstance.get('/terminal/sessions');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Example: Create a new session with specific settings
  createSession: async (options: { shell?: string; cwd?: string }): Promise<any> => {
    try {
      const response = await axiosInstance.post('/terminal/session', options);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Example: General utility API calls
export const utilsApi = {
  // Health check
  healthCheck: async (): Promise<{ status: string }> => {
    try {
      const response = await axiosInstance.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};
