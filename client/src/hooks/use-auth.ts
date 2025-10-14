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
  hasEmbedAccess: boolean;
  hasBusinessProAccess: boolean;
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

  // Check if user is authenticated on mount with retry logic  
  useEffect(() => {
    const checkAuth = async (retries = 2) => {
      const token = getToken();
      if (token) {
        try {
          await fetchUser();
        } catch (error) {
          // If fetch fails and we have retries left, try again
          if (retries > 0) {
            console.log(`Auth check failed, retrying... (${retries} attempts left)`);
            setTimeout(() => checkAuth(retries - 1), 1000);
          } else {
            console.error('Auth check failed after all retries');
            setLoading(false);
          }
        }
      } else {
        setLoading(false);
      }
    };
    
    checkAuth();
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
      } else if (response.status === 401 || response.status === 403) {
        // Only remove token if authentication actually failed
        removeToken();
        setUser(null);
      } else {
        // For other errors, don't remove the token (could be network issues)
        console.error('Failed to fetch user, keeping token. Status:', response.status);
        throw new Error(`Network error: ${response.status}`);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message);
      // Only remove token for explicit auth failures, not network errors
      // This prevents logout on page refresh when API is slow or temporarily unavailable
      if (err.message?.includes('401') || err.message?.includes('403') || 
          (err.response && (err.response.status === 401 || err.response.status === 403))) {
        removeToken();
        setUser(null);
      } else {
        // For network errors, keep the user logged in but throw error for retry logic
        throw err;
      }
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