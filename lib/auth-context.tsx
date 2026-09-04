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
  signup: (email: string, password: string, userType: 'doctor' | 'patient', userData: any) => Promise<void>
  verifyCode: (email: string, code: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState<'doctor' | 'patient' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session from localStorage on mount
    if (typeof window !== 'undefined') {
      const storedDoctorId = window.localStorage.getItem('doctorId')
      const storedPatientId = window.localStorage.getItem('patientId')
      const storedUserType = window.localStorage.getItem('userType') as 'doctor' | 'patient' | null

      if ((storedDoctorId || storedPatientId) && storedUserType) {
        const id = storedUserType === 'doctor' ? (storedDoctorId || '') : (storedPatientId || '')
        setUser({
          id,
          email: '',
          name: '',
          userType: storedUserType,
        })
        setIsAuthenticated(true)
        setUserType(storedUserType)
      }
      setLoading(false)
    }
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

  const signup = async (email: string, password: string, type: 'doctor' | 'patient', userData: any) => {
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
