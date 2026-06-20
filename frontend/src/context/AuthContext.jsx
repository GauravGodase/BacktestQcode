import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { clearStoredToken, getStoredToken, setStoredToken } from '../api/client'
import { fetchMe, login as loginRequest, register as registerRequest } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(true)

  const bootstrap = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setUser(null)
      setBootstrapping(false)
      return
    }

    try {
      const profile = await fetchMe()
      setUser(profile)
    } catch {
      clearStoredToken()
      setUser(null)
    } finally {
      setBootstrapping(false)
    }
  }, [])

  useEffect(() => {
    bootstrap()
    const onUnauthorized = () => {
      setUser(null)
    }
    window.addEventListener('qcode:unauthorized', onUnauthorized)
    return () => window.removeEventListener('qcode:unauthorized', onUnauthorized)
  }, [bootstrap])

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password)
    setStoredToken(data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (email, password, fullName) => {
    const data = await registerRequest(email, password, fullName)
    setStoredToken(data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    clearStoredToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, bootstrapping, login, register, logout, isAuthenticated: Boolean(user) }),
    [user, bootstrapping, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
