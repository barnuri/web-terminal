// API response types
export interface AuthStatusResponse {
  authEnabled: boolean;
  availableProviders?: {
    google: boolean;
    github: boolean;
  };
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}

// Re-export axios types that might be needed
export type { AxiosResponse, AxiosError } from 'axios';
