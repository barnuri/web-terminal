import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authApi, terminalApi, utilsApi } from './api.services';
import axiosInstance from './api';

// Mock the axios instance
vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  handleApiError: vi.fn((error) => error.message || 'API Error'),
}));

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authApi', () => {
    describe('getStatus', () => {
      it('should successfully fetch authentication status', async () => {
        const mockResponse = {
          data: {
            authenticated: true,
            user: { email: 'test@example.com', name: 'Test User' },
          },
        };

        vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse);

        const result = await authApi.getStatus();

        expect(axiosInstance.get).toHaveBeenCalledWith('/auth/status');
        expect(result).toEqual(mockResponse.data);
      });

      it('should throw error when authentication status fetch fails', async () => {
        const mockError = new Error('Network error');
        vi.mocked(axiosInstance.get).mockRejectedValueOnce(mockError);

        await expect(authApi.getStatus()).rejects.toThrow();
        expect(axiosInstance.get).toHaveBeenCalledWith('/auth/status');
      });
    });

    describe('loginWithStaticSecret', () => {
      it('should successfully login with static secret', async () => {
        const mockResponse = {
          data: { token: 'mock-jwt-token' },
        };

        vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse);

        const result = await authApi.loginWithStaticSecret('test-secret');

        expect(axiosInstance.post).toHaveBeenCalledWith('/auth/static-secret', {
          secret: 'test-secret',
        });
        expect(result).toEqual(mockResponse.data);
        expect(result.token).toBe('mock-jwt-token');
      });

      it('should throw error when login fails', async () => {
        const mockError = new Error('Invalid secret');
        vi.mocked(axiosInstance.post).mockRejectedValueOnce(mockError);

        await expect(authApi.loginWithStaticSecret('wrong-secret')).rejects.toThrow();
        expect(axiosInstance.post).toHaveBeenCalledWith('/auth/static-secret', {
          secret: 'wrong-secret',
        });
      });
    });

    describe('logout', () => {
      it('should successfully logout', async () => {
        vi.mocked(axiosInstance.post).mockResolvedValueOnce({});

        await authApi.logout();

        expect(axiosInstance.post).toHaveBeenCalledWith('/auth/logout');
      });

      it('should not throw error when logout fails', async () => {
        const mockError = new Error('Server error');
        vi.mocked(axiosInstance.post).mockRejectedValueOnce(mockError);

        // Should not throw, just log warning
        await expect(authApi.logout()).resolves.toBeUndefined();
        expect(axiosInstance.post).toHaveBeenCalledWith('/auth/logout');
      });
    });
  });

  describe('terminalApi', () => {
    describe('getSessions', () => {
      it('should successfully fetch terminal sessions', async () => {
        const mockSessions = [
          { id: 'session-1', status: 'active' },
          { id: 'session-2', status: 'inactive' },
        ];
        const mockResponse = { data: mockSessions };

        vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse);

        const result = await terminalApi.getSessions();

        expect(axiosInstance.get).toHaveBeenCalledWith('/terminal/sessions');
        expect(result).toEqual(mockSessions);
        expect(result).toHaveLength(2);
      });

      it('should throw error when fetching sessions fails', async () => {
        const mockError = new Error('Unauthorized');
        vi.mocked(axiosInstance.get).mockRejectedValueOnce(mockError);

        await expect(terminalApi.getSessions()).rejects.toThrow();
      });
    });

    describe('createSession', () => {
      it('should successfully create a terminal session with options', async () => {
        const mockSession = { id: 'new-session', shell: '/bin/bash', cwd: '/home' };
        const mockResponse = { data: mockSession };

        vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse);

        const options = { shell: '/bin/bash', cwd: '/home' };
        const result = await terminalApi.createSession(options);

        expect(axiosInstance.post).toHaveBeenCalledWith('/terminal/session', options);
        expect(result).toEqual(mockSession);
      });

      it('should create session with default options', async () => {
        const mockSession = { id: 'new-session' };
        const mockResponse = { data: mockSession };

        vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse);

        const result = await terminalApi.createSession({});

        expect(axiosInstance.post).toHaveBeenCalledWith('/terminal/session', {});
        expect(result).toEqual(mockSession);
      });

      it('should throw error when session creation fails', async () => {
        const mockError = new Error('Session limit reached');
        vi.mocked(axiosInstance.post).mockRejectedValueOnce(mockError);

        await expect(terminalApi.createSession({})).rejects.toThrow();
      });
    });
  });

  describe('utilsApi', () => {
    describe('healthCheck', () => {
      it('should successfully perform health check', async () => {
        const mockResponse = { data: { status: 'ok' } };

        vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse);

        const result = await utilsApi.healthCheck();

        expect(axiosInstance.get).toHaveBeenCalledWith('/health');
        expect(result).toEqual({ status: 'ok' });
        expect(result.status).toBe('ok');
      });

      it('should throw error when health check fails', async () => {
        const mockError = new Error('Service unavailable');
        vi.mocked(axiosInstance.get).mockRejectedValueOnce(mockError);

        await expect(utilsApi.healthCheck()).rejects.toThrow();
        expect(axiosInstance.get).toHaveBeenCalledWith('/health');
      });
    });
  });
});
