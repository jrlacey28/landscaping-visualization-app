import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  emailVerified: boolean;
}

interface Subscription {
  planId: string;
  status: string;
  currentPeriodEnd: string;
}

interface UsageInfo {
  canUse: boolean;
  currentUsage: number;
  limit: number;
  planName: string;
}

interface AuthUser {
  user: User;
  subscription: Subscription | null;
  usage: UsageInfo;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get token from localStorage
  const getToken = () => localStorage.getItem('auth_token');
  const setToken = (token: string) => localStorage.setItem('auth_token', token);
  const removeToken = () => localStorage.removeItem('auth_token');

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setUser(null);
        return;
      }

      const response = await apiRequest('GET', '/api/auth/me', undefined, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch user');
        }
      } else {
        // Token is invalid
        removeToken();
        setUser(null);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message);
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiRequest('POST', '/api/auth/login', {
        email,
        password
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.data.token);
        await fetchUser();
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiRequest('POST', '/api/auth/register', registerData);

      const data = await response.json();

      if (data.success) {
        setToken(data.data.token);
        await fetchUser();
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setError(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return React.createElement(AuthContext.Provider, {
    value: {
      user,
      login,
      register,
      logout,
      loading,
      error,
      refreshUser
    }
  }, children);
}

// Hook to get auth token for API requests
export function useAuthToken() {
  return localStorage.getItem('auth_token');
}