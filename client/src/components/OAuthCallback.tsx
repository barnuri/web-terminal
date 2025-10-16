import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { setToken, setError } = useAuth();

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      setError(decodeURIComponent(error));
      navigate('/login');
    } else if (token) {
      setToken(token);
      navigate('/');
    } else {
      setError('No token received from OAuth provider');
      navigate('/login');
    }
  }, [navigate, setToken, setError]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
    }}>
      <div style={{
        textAlign: 'center',
        color: 'var(--text-primary)',
      }}>
        <div style={{
          fontSize: '18px',
          marginBottom: '16px',
        }}>
          Completing authentication...
        </div>
        <div style={{
          width: '40px',
          height: '40px',
          margin: '0 auto',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent-color)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    </div>
  );
};

export default OAuthCallback;
