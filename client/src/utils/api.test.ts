import { describe, it, expect } from 'vitest';
import { handleApiError } from './api';

describe('API Utils', () => {
  describe('handleApiError', () => {
    it('should return authentication error message for 401 status', () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
          statusText: 'Unauthorized',
        },
      };
      const result = handleApiError(error);
      expect(result).toBe('Authentication required. Please log in again.');
    });

    it('should return custom forbidden message for 403 status', () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'Email not in allowlist' },
          statusText: 'Forbidden',
        },
      };
      const result = handleApiError(error);
      expect(result).toBe('Email not in allowlist');
    });

    it('should return default forbidden message for 403 without custom message', () => {
      const error = {
        response: {
          status: 403,
          data: {},
          statusText: 'Forbidden',
        },
      };
      const result = handleApiError(error);
      expect(result).toBe('Forbidden');
    });

    it('should return not found message for 404 status', () => {
      const error = {
        response: {
          status: 404,
          data: {},
          statusText: 'Not Found',
        },
      };
      const result = handleApiError(error);
      expect(result).toBe('Resource not found.');
    });

    it('should return rate limit message for 429 status', () => {
      const error = {
        response: {
          status: 429,
          data: {},
          statusText: 'Too Many Requests',
        },
      };
      const result = handleApiError(error);
      expect(result).toBe('Too many requests. Please try again later.');
    });

    it('should return server error message for 500 status', () => {
      const error = {
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
        },
      };
      const result = handleApiError(error);
      expect(result).toBe('Server error. Please try again later.');
    });

    it('should return custom message from server response', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Invalid input data' },
          statusText: 'Bad Request',
        },
      };
      const result = handleApiError(error);
      expect(result).toBe('Invalid input data');
    });

    it('should return network error message when no response', () => {
      const error = {
        request: {},
        message: 'Network timeout',
      };
      const result = handleApiError(error);
      expect(result).toBe('Network error. Please check your connection and try again.');
    });

    it('should return error message for request setup errors', () => {
      const error = {
        message: 'Invalid configuration',
      };
      const result = handleApiError(error);
      expect(result).toBe('Invalid configuration');
    });

    it('should return default message for unknown errors', () => {
      const error = {};
      const result = handleApiError(error);
      expect(result).toBe('An unexpected error occurred.');
    });
  });
});
