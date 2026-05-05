"use client"

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  type AuthSession,
  type AuthUser,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type LoginPayload,
  type RegisterPayload,
} from "@/lib/api"

const TOKEN_STORAGE_KEY = "zipher.auth.token"

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (payload: LoginPayload) => Promise<AuthSession>
  register: (payload: RegisterPayload) => Promise<AuthSession>
  logout: () => Promise<void>
  refreshUser: () => Promise<AuthUser | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function persistToken(token: string | null) {
  if (typeof window === "undefined") {
    return
  }

  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    setUser(null)
    setToken(null)
    persistToken(null)
  }, [])

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null)
      return null
    }

    try {
      const me = await getCurrentUser(token)
      setUser(me)
      return me
    } catch {
      clearSession()
      return null
    }
  }, [clearSession, token])

  const syncSession = useCallback((session: AuthSession) => {
    setToken(session.token)
    setUser(session.user)
    persistToken(session.token)
  }, [])

  const login = useCallback(
    async (payload: LoginPayload) => {
      const session = await loginUser(payload)
      syncSession(session)
      return session
    },
    [syncSession]
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const session = await registerUser(payload)
      syncSession(session)
      return session
    },
    [syncSession]
  )

  const logout = useCallback(async () => {
    const activeToken = token

    try {
      if (activeToken) {
        await logoutUser(activeToken)
      }
    } finally {
      clearSession()
    }
  }, [clearSession, token])

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY)

    if (!storedToken) {
      setLoading(false)
      return
    }

    setToken(storedToken)

    ;(async () => {
      try {
        const me = await getCurrentUser(storedToken)
        setUser(me)
      } catch {
        clearSession()
      } finally {
        setLoading(false)
      }
    })()
  }, [clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      loading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [loading, login, logout, refreshUser, register, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return context
}
