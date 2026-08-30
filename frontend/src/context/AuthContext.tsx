import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../api/supabase';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  restaurantId: string;
  branchId?: string;
  accessToken: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : 'http://localhost:3000/api/v1';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on app boot and verify with backend
    const stored = localStorage.getItem('restaurantos_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.accessToken) {
          fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${parsed.accessToken}` },
          })
            .then((res) => {
              if (res.ok) {
                return res.json();
              } else {
                throw new Error('Session invalid');
              }
            })
            .then((resJson) => {
              const meData = resJson.data || resJson;
              const updatedUser: User = {
                ...parsed,
                id: meData.id || parsed.id,
                email: meData.email || parsed.email,
                firstName: meData.firstName || parsed.firstName,
                lastName: meData.lastName || parsed.lastName,
                restaurantId: meData.restaurantId || meData.restaurant?.id || parsed.restaurantId,
                branchId: meData.branchId || parsed.branchId,
                role: Array.isArray(meData.roles) ? meData.roles[0] : parsed.role,
              };
              localStorage.setItem('restaurantos_user', JSON.stringify(updatedUser));
              setUser(updatedUser);
            })
            .catch(() => {
              localStorage.removeItem('restaurantos_user');
              setUser(null);
            })
            .finally(() => setIsLoading(false));
          return;
        }
      } catch {
        localStorage.removeItem('restaurantos_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Attempt Supabase client Auth if available
    try {
      if (supabase && supabase.auth) {
        await supabase.auth.signInWithPassword({ email, password }).catch(() => {
          // Ignore client side Supabase error if backend handles fallback
        });
      }
    } catch {}

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Invalid email or password');
    }

    const data = await res.json();
    const payload = data.data || data;
    const apiUser = payload.user || payload;
    const userData: User = {
      id: apiUser.id,
      email: apiUser.email || email,
      firstName: apiUser.firstName || 'User',
      lastName: apiUser.lastName || '',
      role: Array.isArray(apiUser.roles) ? apiUser.roles[0] : (apiUser.role || 'OWNER'),
      restaurantId: apiUser.restaurantId || '',
      branchId: apiUser.branchId,
      accessToken: payload.accessToken || data.accessToken,
    };

    localStorage.setItem('restaurantos_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      if (supabase && supabase.auth) {
        await supabase.auth.signOut();
      }
    } catch {}
    localStorage.removeItem('restaurantos_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
