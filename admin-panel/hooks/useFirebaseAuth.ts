'use client';

import { useState, useEffect } from 'react';

interface AdminUser {
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export function useFirebaseAuth() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check authentication status via API
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/verify');

      if (response.ok) {
        const data = await response.json();
        setCurrentUser({
          email: data.user.email,
          name: data.user.name || 'Admin',
          role: 'Admin',
          permissions: ['all']
        });
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setError('');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      // Refresh auth status
      await checkAuthStatus();
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed. Please try again.');
    }
  };

  return {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    logout
  };
}
