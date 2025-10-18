# API Client Setup

This project uses Axios for all HTTP requests instead of the native `fetch` API. This provides better error handling, request/response interceptors, and a more consistent API.

## Overview

The API client setup consists of several files:

- `utils/api.ts` - Main axios instance with interceptors
- `utils/api.types.ts` - TypeScript types for API responses
- `utils/api.services.ts` - Service functions for different API endpoints

## Usage

### Direct Axios Usage

```typescript
import axiosInstance from '../utils/api';

// Simple GET request
const response = await axiosInstance.get('/api/endpoint');
const data = response.data;

// POST request with data
const response = await axiosInstance.post('/api/users', {
  name: 'John Doe',
  email: 'john@example.com',
});

// With TypeScript types
interface User {
  id: number;
  name: string;
  email: string;
}

const response = await axiosInstance.get<User>('/api/users/1');
const user: User = response.data;
```

### Using Service Functions (Recommended)

Service functions provide better error handling and type safety:

```typescript
import { authApi, terminalApi } from '../utils/api.services';

// Check auth status
try {
  const status = await authApi.getStatus();
  console.log('Auth enabled:', status.authEnabled);
} catch (error) {
  console.error('Failed to get status:', error.message);
}

// Get terminal sessions
try {
  const sessions = await terminalApi.getSessions();
  console.log('Sessions:', sessions);
} catch (error) {
  console.error('Failed to get sessions:', error.message);
}
```

## Features

### Automatic Token Handling

The axios instance automatically adds JWT tokens to requests:

```typescript
// Token is automatically added to Authorization header
const response = await axiosInstance.get('/protected-endpoint');
```

### Global Error Handling

The response interceptor handles common errors:

- **401 Unauthorized**: Automatically removes invalid tokens and dispatches logout event
- **403 Forbidden**: Logs access denied errors
- **500+ Server Errors**: Logs server errors
- **Network Errors**: Handles connection issues

### Error Handling Helper

Use the `handleApiError` function for consistent error messages:

```typescript
import axiosInstance, { handleApiError } from '../utils/api';

try {
  const response = await axiosInstance.get('/api/data');
  return response.data;
} catch (error) {
  const userFriendlyMessage = handleApiError(error);
  setError(userFriendlyMessage);
}
```

### Global Logout Event

When a 401 error occurs, the axios interceptor dispatches a custom event:

```typescript
// Listen for automatic logout
useEffect(() => {
  const handleLogout = () => {
    // Handle logout in your component
    logout();
  };

  window.addEventListener('auth:logout', handleLogout);

  return () => {
    window.removeEventListener('auth:logout', handleLogout);
  };
}, []);
```

## Configuration

The axios instance is configured with:

- **Base URL**: `/` (relative to current origin)
- **Timeout**: 10 seconds
- **Content-Type**: `application/json` by default

To modify configuration, edit `utils/api.ts`:

```typescript
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/',
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Adding New API Services

To add new API endpoints, create service functions in `utils/api.services.ts`:

```typescript
export const myApi = {
  getData: async (): Promise<MyDataType> => {
    try {
      const response = await axiosInstance.get<MyDataType>('/api/my-data');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  createItem: async (data: CreateItemRequest): Promise<CreatedItem> => {
    try {
      const response = await axiosInstance.post<CreatedItem>('/api/items', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};
```

Add corresponding TypeScript types to `utils/api.types.ts`:

```typescript
export interface MyDataType {
  id: number;
  name: string;
  // ... other fields
}

export interface CreateItemRequest {
  name: string;
  description?: string;
}

export interface CreatedItem extends CreateItemRequest {
  id: number;
  createdAt: string;
}
```

## Best Practices

1. **Use service functions** instead of calling axios directly
2. **Add TypeScript types** for all API requests and responses
3. **Handle errors consistently** using the `handleApiError` helper
4. **Don't catch and re-throw errors** unless you're adding context
5. **Use the global logout event** for authentication state management
6. **Test error scenarios** to ensure proper user feedback

## Migration from Fetch

If migrating from fetch, replace:

```typescript
// OLD: Using fetch
const response = await fetch('/api/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(data),
});

if (!response.ok) {
  throw new Error('Request failed');
}

const result = await response.json();
```

```typescript
// NEW: Using axios service
const result = await myApi.createData(data);
```

The axios setup handles headers, JSON parsing, error checking, and token management automatically.
