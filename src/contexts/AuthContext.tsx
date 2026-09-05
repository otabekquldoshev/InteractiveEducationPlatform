import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User, UserRole } from "../types";
import { DEMO_USERS } from "../data/mockData";

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: "student" | "admin") => void;
  updateUser: (updates: Partial<User>) => void;
  isLoading: boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "edu_current_user";
const USERS_KEY = "edu_users";

function getStoredUsers(): User[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEMO_USERS;
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    // Authentication is intentionally bypassed in this interactive demo.
    // A learner workspace is available immediately; admin mode is selected in the UI.
    if (!localStorage.getItem(USERS_KEY)) {
      saveUsers(DEMO_USERS);
    }
    if (!stored) {
      const learner = DEMO_USERS.find((item) => item.role === "student") || null;
      setUser(learner);
      if (learner) localStorage.setItem(STORAGE_KEY, JSON.stringify(learner));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 600));
    const users = getStoredUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { success: false, error: "Foydalanuvchi topilmadi" };
    // Demo: any password works for demo accounts, real ones need match
    const stored = localStorage.getItem(`edu_pwd_${found.id}`);
    if (stored && stored !== password) {
      return { success: false, error: "Parol noto'g'ri" };
    }
    setUser(found);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    return { success: true };
  };

  const register = async (data: RegisterData) => {
    await new Promise((r) => setTimeout(r, 600));
    const users = getStoredUsers();
    if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: "Bu email allaqachon ro'yxatdan o'tgan" };
    }
    const newUser: User = {
      id: `u${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role || "student",
      accessibilitySetupDone: false,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [...users, newUser];
    saveUsers(updated);
    localStorage.setItem(`edu_pwd_${newUser.id}`, data.password);
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    const learner = getStoredUsers().find((item) => item.role === "student") || null;
    setUser(learner);
    if (learner) localStorage.setItem(STORAGE_KEY, JSON.stringify(learner));
  };

  const switchRole = (role: "student" | "admin") => {
    const selected = getStoredUsers().find((item) => item.role === role);
    if (!selected) return;
    setUser(selected);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    const users = getStoredUsers();
    saveUsers(users.map((u) => (u.id === updated.id ? updated : u)));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, switchRole, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
