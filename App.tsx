import { API_URL } from './config';

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthView } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import ActivateAccount from './components/ActivateAccount';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { User, AuthState } from './types';
import { Toaster, toast } from 'react-hot-toast';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  // Verify token on load
  useEffect(() => {
    const token = localStorage.getItem('drive_token');
    if (token) {
      fetch('${API_URL}/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Invalid token');
        })
        .then(data => {
          setAuth({
            user: data.result,
            token: token,
            loading: false,
          });
        })
        .catch(() => {
          localStorage.removeItem('drive_token');
          setAuth(prev => ({ ...prev, loading: false }));
        });
    } else {
      setAuth(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Periodic Session Check (Auto-logout if user deleted)
  useEffect(() => {
    if (!auth.user) return;

    const interval = setInterval(() => {
      const token = localStorage.getItem('drive_token');
      if (token) {
        fetch('${API_URL}/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(async res => {
            // If 401 (Unauthorized) or 404 (User Not Found), logout
            if (res.status === 401 || res.status === 404) {
              localStorage.removeItem('drive_token');
              setAuth({ user: null, token: null, loading: false });
              toast.error('Session expired or user not found');
            }
          })
          .catch((err) => {
            // Ignore network errors to prevent nuisance logouts
            console.error("Session check failed", err);
          });
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [auth.user]);

  const handleLogin = (user: User, token: string) => {
    localStorage.setItem('drive_token', token);
    setAuth({ user, token, loading: false });
    toast.success(`Welcome back, ${user.firstName}!`);
  };

  const handleLogout = async () => {
    if (auth.user) {
      try {
        await fetch('${API_URL}/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: auth.user.id })
        });
      } catch (error) {
        console.error('Logout failed on backend');
      }
    }
    localStorage.removeItem('drive_token');
    setAuth({ user: null, token: null, loading: false });
    toast.success('Logged out successfully');
  };

  if (auth.loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/activate/:token"
          element={<ActivateAccount />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />
        <Route
          path="/login"
          element={!auth.user ? <AuthView onLogin={handleLogin} /> : <Navigate to="/" />}
        />
        <Route
          path="/"
          element={auth.user ? <Dashboard user={auth.user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default App;

