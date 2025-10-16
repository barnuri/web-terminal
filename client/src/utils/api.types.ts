// API response types
export interface AuthStatusResponse {
  authEnabled: boolean;
  authenticated?: boolean;
  user?: {
    email: string;
    name: string;
    picture?: string;
    provider: string;
  } | null;
  availableProviders?: {
    google: boolean;
    github: boolean;
    staticSecret?: boolean;
  };
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}

// Re-export axios types that might be needed
export type { AxiosResponse, AxiosError } from 'axios';
