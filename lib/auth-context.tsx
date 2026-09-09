'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDoctorStore } from '@/lib/stores/doctor.store';
import { useSessionStore } from '@/lib/stores/session.store';
import { http } from '@/lib/http';
import { type Role } from '@/lib/auth/roles';
import { clearAuthStorage, setStoredUserId } from '@/lib/auth/storage';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  userType: Role;
  avatar?: string | null;
}

export interface SignupInput {
  firstName: string;
  lastName: string;
  specialty?: string;
  clinic?: string;
  license?: string;
  issuingAuthority?: string;
  licenseDocumentUrl?: string;
  dateOfBirth?: string;
  doctorId?: string;
}

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  userType: Role | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    userType: Role
  ) => Promise<void>;
  logout: () => void;
  signup: (
    email: string,
    password: string,
    userType: Role,
    userData: SignupInput
  ) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify the session by calling /api/auth/me on mount.
    // Using resilient http client ensures transparent 401 token refresh on mount.
    const verifySession = async () => {
      try {
        const data = await http.get<{ user: UserSession | null }>('/api/auth/me');
        if (data?.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          setUserType(data.user.userType);
          setStoredUserId(data.user.userType, data.user.id);
        }
      } catch {
        // Network or auth error on mount — session stays null, user sees login
      } finally {
        setLoading(false);
      }
    };

    void verifySession();
  }, []);

  const login = async (
    email: string,
    password: string,
    type: Role
  ) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, userType: type }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.user) {
      setUser(data.user);
      setIsAuthenticated(true);
      setUserType(data.user.userType || type);
      setStoredUserId(data.user.userType || type, data.user.id);
    }
  };

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch((err) => {
      console.error('[AuthContext] Logout error:', err);
    });

    clearAuthStorage();

    useDoctorStore.getState().clearDashboard();
    useSessionStore.getState().resetSession();

    setUser(null);
    setIsAuthenticated(false);
    setUserType(null);
  };

  const signup = async (
    email: string,
    password: string,
    type: Role,
    userData: SignupInput
  ) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, userType: type, ...userData }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Signup failed');
    }
  };

  const verifyCode = async (email: string, code: string) => {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Verification failed');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        userType,
        loading,
        login,
        logout,
        signup,
        verifyCode,
      }}
    >
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
