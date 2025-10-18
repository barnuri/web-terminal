import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { TerminalProvider } from './contexts/TerminalContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import TerminalTabs from './components/TerminalTabs';
import ThemeToggle from './components/ThemeToggle';
import Login from './components/Login';
import OAuthCallback from './components/OAuthCallback';
import './App.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, authEnabled, user } = useAuth();

  console.log('PrivateRoute state:', { isAuthenticated, isLoading, authEnabled, user });

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
        }}
      >
        <div style={{ textAlign: 'center', color: 'var(--text-primary)' }}>Loading...</div>
      </div>
    );
  }

  if (authEnabled && !isAuthenticated) {
    console.log(
      'Redirecting to login: authEnabled =',
      authEnabled,
      'isAuthenticated =',
      isAuthenticated,
    );
    return <Navigate to="/login" replace />;
  }

  console.log('Allowing access to main app');
  return <>{children}</>;
};

const MainApp: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="header-icon"
            >
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
            <h1 className="header-title">Web Terminal</h1>
          </div>
          <div className="header-right">
            {isAuthenticated && user && (
              <div className="user-info">
                {user.picture && <img src={user.picture} alt={user.name} className="user-avatar" />}
                <span className="user-name">{user.name}</span>
                <button onClick={logout} className="logout-button">
                  Logout
                </button>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="app-main">
        <TerminalTabs />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TerminalProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/login/callback" element={<OAuthCallback />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <MainApp />
                </PrivateRoute>
              }
            />
          </Routes>
        </TerminalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
