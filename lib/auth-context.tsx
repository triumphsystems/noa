'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { CognitoUser, CognitoUserPool, AuthenticationDetails } from 'amazon-cognito-identity-js'

import { useDoctorDashboardStore } from '@/lib/stores/doctor-dashboard-store'
import { useSessionStore } from '@/lib/stores/session-store'

interface AuthContextType {
  user: CognitoUser | null
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
  const [user, setUser] = useState<CognitoUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState<'doctor' | 'patient' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || ''
        const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || ''

        if (!userPoolId || !clientId) {
          console.log('[v0] Cognito config not available')
          setLoading(false)
          return
        }

        const userPool = new CognitoUserPool({
          UserPoolId: userPoolId,
          ClientId: clientId,
        })

        const currentUser = userPool.getCurrentUser()
        if (currentUser) {
          currentUser.getSession((err: any, session: any) => {
            if (err) {
              console.log('[v0] No valid session:', err)
              setLoading(false)
            } else if (session && session.isValid()) {
              setUser(currentUser)
              setIsAuthenticated(true)
              // Try to get user type from attributes
              currentUser.getUserAttributes((err: any, attributes: any) => {
                if (!err && attributes) {
                  const type = attributes.find((attr: any) => attr.Name === 'custom:user_type')?.Value || 'patient'
                  setUserType(type as 'doctor' | 'patient')
                }
                setLoading(false)
              })
            } else {
              setLoading(false)
            }
          })
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('[v0] Error checking session:', error)
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string, type: 'doctor' | 'patient') => {
    try {
      const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || ''
      const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || ''

      const userPool = new CognitoUserPool({
        UserPoolId: userPoolId,
        ClientId: clientId,
      })

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      })

      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      })

      return new Promise<void>((resolve, reject) => {
        cognitoUser.authenticateUser(authDetails, {
          onSuccess: (result: any) => {
            setUser(cognitoUser)
            setIsAuthenticated(true)
            setUserType(type)
            resolve()
          },
          onFailure: (err: any) => {
            reject(new Error(err.message || 'Authentication failed'))
          },
        })
      })
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    if (user) {
      user.signOut()
    }

    if (typeof window !== 'undefined') {
      ;['doctorId', 'patientId', 'userType', 'accessToken', 'idToken', 'refreshToken'].forEach(key => {
        window.localStorage.removeItem(key)
      })
    }

    useDoctorDashboardStore.getState().clearDashboard()
    useSessionStore.getState().resetSession()

    setUser(null)
    setIsAuthenticated(false)
    setUserType(null)
  }

  const signup = async (email: string, password: string, type: 'doctor' | 'patient', userData: any) => {
    throw new Error('Signup not implemented yet - use API route')
  }

  const verifyCode = async (email: string, code: string) => {
    throw new Error('Code verification not implemented yet - use API route')
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
