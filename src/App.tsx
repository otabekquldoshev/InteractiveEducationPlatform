import { useEffect } from "react"
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { AccessibilityProvider } from "./contexts/AccessibilityContext"
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext"
import { CatalogProvider } from "./contexts/CatalogContext"

import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import AccessibilityOnboarding from "./pages/AccessibilityOnboarding"
import StudentDashboard from "./pages/StudentDashboard"
import CoursesPage from "./pages/CoursesPage"
import CoursePage from "./pages/CoursePage"
import LessonPage from "./pages/LessonPage"
import QuizPage from "./pages/QuizPage"
import AdminDashboard from "./pages/AdminDashboard"
import SurdoTranslatorPage from "./pages/SurdoTranslatorPage"
import MyCertificatesPage from "./pages/MyCertificatesPage"

function AppRoutes() {
  const { user, isLoading } = useAuth()
  const { t } = useLanguage()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fff9fb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">{t("app_loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <HashScrollHandler />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/onboarding"
          element={
            user ? (
              <AccessibilityOnboarding />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Dashboard routing by role */}
        <Route
          path="/dashboard"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <StudentDashboard />
            )
          }
        />
        <Route
          path="/admin"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.role !== "admin" ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AdminDashboard />
            )
          }
        />

        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CoursePage />} />
        <Route path="/surdo" element={<SurdoTranslatorPage />} />
        <Route
          path="/certificates"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <MyCertificatesPage />
            )
          }
        />
        <Route
          path="/lesson/:id"
          element={user ? <LessonPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/quiz/:id"
          element={user ? <QuizPage /> : <Navigate to="/login" replace />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

function HashScrollHandler() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (pathname !== "/") return

    const frame = requestAnimationFrame(() => {
      if (!hash) {
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }

      document
        .getElementById(decodeURIComponent(hash.slice(1)))
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    })

    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AuthConsumerWrapper />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}

function AuthConsumerWrapper() {
  const { user } = useAuth()
  return (
    <AccessibilityProvider userId={user?.id}>
      <CatalogProvider key={user?.id || "guest"}>
        <AppRoutes />
      </CatalogProvider>
    </AccessibilityProvider>
  )
}
