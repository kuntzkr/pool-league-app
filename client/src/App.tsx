import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import { User, AuthStatusResponse } from './types';

import './App.css';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/status');

        if (response.ok) {
          const data = await response.json() as AuthStatusResponse;
          setIsAuthenticated(data.authenticated);
          setUser(data.user); // Will be User or null based on data.authenticated
        } else {
          console.log('Auth status check failed:', response.statusText);
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Page */}
        <Route
          path="/login"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
        />

        {/* Protected Dashboard - Same component for all users, admin features conditionally rendered */}
        <Route
          path="/"
          element={
            isAuthenticated && user ? (
              <Dashboard user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all or 404 route (optional) */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
