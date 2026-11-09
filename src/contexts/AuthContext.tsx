import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { User, UserRole } from "../types"
import { api, tokens } from "../lib/api"

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
}
interface AuthContextValue {
  user: User | null
  login: (
    email: string,
    password: string,
    role: UserRole,
  ) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  isLoading: boolean
}
type AuthResponse = { user: User; accessToken: string; refreshToken: string }
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!tokens.access() && !tokens.refresh()) {
      setIsLoading(false)
      return
    }
    api<{ user: User }>("/auth/me")
      .then((result) => setUser(result.user))
      .catch(() => tokens.clear())
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      const result = await api<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email, password, role },
        retry: false,
      })
      tokens.set(result.accessToken, result.refreshToken)
      setUser(result.user)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Kirish xatosi",
      }
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const result = await api<AuthResponse>("/auth/register", {
        method: "POST",
        body: data,
        retry: false,
      })
      tokens.set(result.accessToken, result.refreshToken)
      setUser(result.user)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Ro'yxatdan o'tish xatosi",
      }
    }
  }

  const logout = () => {
    const refreshToken = tokens.refresh()
    if (refreshToken)
      void api("/auth/logout", {
        method: "POST",
        body: { refreshToken },
        retry: false,
      }).catch(() => undefined)
    tokens.clear()
    setUser(null)
  }

  const updateUser = (updates: Partial<User>) => {
    setUser((current) => (current ? { ...current, ...updates } : current))
    void api<{ user: User }>("/auth/me", { method: "PATCH", body: updates })
      .then((result) => setUser(result.user))
      .catch(() => undefined)
  }
  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, updateUser, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}
