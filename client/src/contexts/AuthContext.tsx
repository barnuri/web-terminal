import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../utils/api.services';

interface User {
  email: string;
  name: string;
  picture?: string;
  provider: string;
}

interface AvailableProviders {
  google: boolean;
  github: boolean;
  staticSecret?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  authEnabled: boolean;
  availableProviders: AvailableProviders;
  error: string | null;
  login: (provider: 'google' | 'github') => void;
  logout: () => void;
  setToken: (token: string) => void;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<AvailableProviders>({
    google: false,
    github: false,
    staticSecret: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();

    // Listen for global logout events
    const handleLogout = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      // First, get the stored token
      const storedToken = localStorage.getItem('jwt_token');

      // Check if auth is enabled and get authentication status
      const statusData = await authApi.getStatus();

      setAuthEnabled(statusData.authEnabled);
      setAvailableProviders(
        statusData.availableProviders || { google: false, github: false, staticSecret: false },
      );

      // If auth is disabled, we're done
      if (!statusData.authEnabled) {
        setIsLoading(false);
        setIsAuthenticated(true); // No auth required
        return;
      }

      // If auth is enabled but no providers are configured, show error
      if (
        !statusData.availableProviders?.google &&
        !statusData.availableProviders?.github &&
        !statusData.availableProviders?.staticSecret
      ) {
        setError(
          'Authentication is enabled but no OAuth providers are configured. Please contact your administrator.',
        );
        setIsLoading(false);
        return;
      }

      // Check if the server says we're authenticated (token was valid)
      if (statusData.authenticated && statusData.user && storedToken) {
        // Server confirmed authentication - use server data
        console.log('Server confirmed authentication:', statusData.user);
        setTokenState(storedToken);
        setUser(statusData.user);
        setIsAuthenticated(true);
        setError(null);
        setIsLoading(false);
        return;
      }

      // If we reach here, either no token or token is invalid
      console.log('No valid authentication found, clearing token');
      localStorage.removeItem('jwt_token');
      setTokenState(null);
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
    } catch (error) {
      console.error('Auth status check failed:', error);
      // If auth check fails, clear token and require login
      localStorage.removeItem('jwt_token');
      setTokenState(null);
      setIsAuthenticated(false);
      setUser(null);
      setError(error instanceof Error ? error.message : 'Failed to check authentication status');
      setIsLoading(false);
    }
  };

  const setToken = (newToken: string) => {
    setTokenState(newToken);
    localStorage.setItem('jwt_token', newToken);

    // Decode JWT to get user info (simple base64 decode, not secure verification)
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      setUser({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        provider: payload.provider,
      });
      setIsAuthenticated(true);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Failed to decode token:', error);
      setError('Invalid token format');
      // If token is invalid, treat as not authenticated
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('jwt_token');
    }
    setIsLoading(false);
  };

  const login = (provider: 'google' | 'github') => {
    // Redirect to OAuth provider
    window.location.href = `/auth/${provider}`;
  };

  const logout = async () => {
    try {
      // Call server logout endpoint
      await authApi.logout();
    } catch (error) {
      console.warn('Server logout failed:', error);
    } finally {
      // Always clear local state regardless of server response
      localStorage.removeItem('jwt_token');
      setTokenState(null);
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        isLoading,
        authEnabled,
        availableProviders,
        error,
        login,
        logout,
        setToken,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
