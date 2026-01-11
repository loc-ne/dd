'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role?: string;
  
  // Bổ sung các trường từ Database
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  isHost: boolean;
  isActive: boolean; 
  isAdmin: boolean;
  authProvider?: string;
  googleId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  
  // Hàm này dùng để refresh token (hệ thống tự chạy)
  refreshAuth: () => Promise<void>; 
  
  // Hàm này dùng cho UI gọi chủ động (VD: Sau khi update profile thì gọi để lấy data mới)
  refreshUser: () => Promise<void>; 

  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchMe = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include', 
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.success && data.data) {
        setUser(data.data); 
        console.log(data.data);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const refreshAuth = async () => {
    try {
      setIsLoading(true);
      
      const success = await fetchMe();
      if (success) return;

      console.log('Access token expired or missing, trying to refresh...');
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (refreshResponse.ok) {
        await fetchMe();
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchMe();
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      window.location.href = '/login'; 
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, refreshAuth, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};