'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

interface User {
  id: string;
  email: string;
  last_name: string;
  first_name: string;
  phone?: string;
  is_private: boolean;
  is_ride_leader: boolean;
  is_admin: boolean;
  total_distance_km: number;
  total_rides: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; last_name: string; first_name: string; phone?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await api.auth.me();
      setUser(data);
    } catch {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.auth.login({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('refresh_token', data.refresh_token);
    setUser(data.user);
  };

  const register = async (regData: { email: string; password: string; last_name: string; first_name: string; phone?: string }) => {
    const data = await api.auth.register(regData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refresh_token', data.refresh_token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
