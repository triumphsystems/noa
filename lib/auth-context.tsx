'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useDoctorStore } from '@/lib/stores/doctor.store'
import { useSessionStore } from '@/lib/stores/session.store'

export interface UserSession {
  id: string
  email: string
  name: string
  userType: 'doctor' | 'patient'
}

interface AuthContextType {
  user: UserSession | null
  isAuthenticated: boolean
  userType: 'doctor' | 'patient' | null
  loading: boolean
  login: (email: string, password: string, userType: 'doctor' | 'patient') => Promise<void>
  logout: () => void
  signup: (email: string, password: string, userType: 'doctor' | 'patient', userData: Record<string, unknown>) => Promise<void>
  verifyCode: (email: string, code: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState<'doctor' | 'patient' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verify the session by calling /api/auth/me on mount.
    // This is the authoritative check — localStorage is only used as a hint
    // for UX (e.g., redirect target) but never to construct the user object.
    const verifySession = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setUser(data.user)
            setIsAuthenticated(true)
            setUserType(data.user.userType)
            // Sync localStorage for downstream store hydration (doctorId / patientId)
            if (typeof window !== 'undefined') {
              if (data.user.userType === 'doctor') {
                window.localStorage.setItem('doctorId', data.user.id)
              } else {
                window.localStorage.setItem('patientId', data.user.id)
              }
              window.localStorage.setItem('userType', data.user.userType)
            }
          }
        }
      } catch {
        // Network error on mount — session stays null, user sees login
      } finally {
        setLoading(false)
      }
    }

    verifySession()
  }, [])

  const login = async (email: string, password: string, type: 'doctor' | 'patient') => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, userType: type }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || 'Login failed')
    }

    if (data.user) {
      setUser(data.user)
      setIsAuthenticated(true)
      setUserType(type)
      if (typeof window !== 'undefined') {
        if (type === 'doctor') {
          window.localStorage.setItem('doctorId', data.user.id)
        } else {
          window.localStorage.setItem('patientId', data.user.id)
        }
        window.localStorage.setItem('userType', type)
      }
    }
  }

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(err => {
      console.error('[AuthContext] Logout error:', err)
    })

    if (typeof window !== 'undefined') {
      ;['doctorId', 'patientId', 'userType', 'accessToken', 'idToken', 'refreshToken'].forEach(key => {
        window.localStorage.removeItem(key)
      })
    }

    useDoctorStore.getState().clearDashboard()
    useSessionStore.getState().resetSession()

    setUser(null)
    setIsAuthenticated(false)
    setUserType(null)
  }

  const signup = async (email: string, password: string, type: 'doctor' | 'patient', userData: Record<string, unknown>) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, userType: type, ...userData }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || 'Signup failed')
    }
  }

  const verifyCode = async (email: string, code: string) => {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || 'Verification failed')
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, userType, loading, login, logout, signup, verifyCode }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
