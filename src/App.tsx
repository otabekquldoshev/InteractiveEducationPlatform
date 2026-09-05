import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { LanguageProvider } from "./contexts/LanguageContext";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AccessibilityOnboarding from "./pages/AccessibilityOnboarding";
import StudentDashboard from "./pages/StudentDashboard";
import CoursesPage from "./pages/CoursesPage";
import CoursePage from "./pages/CoursePage";
import LessonPage from "./pages/LessonPage";
import QuizPage from "./pages/QuizPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/register" element={<Navigate to="/dashboard" replace />} />
      <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />

      {/* Dashboard routing by role */}
      <Route
        path="/dashboard"
        element={
          !user ? <StudentDashboard /> :
          user.role === "admin" ? <Navigate to="/admin" replace /> :
          user.role === "teacher" ? <Navigate to="/teacher" replace /> :
          <StudentDashboard />
        }
      />
      <Route
        path="/teacher"
        element={
          <Navigate to="/dashboard" replace />
        }
      />
      <Route
        path="/admin"
        element={
          !user ? <StudentDashboard /> :
          user.role !== "admin" ? <Navigate to="/dashboard" replace /> :
          <AdminDashboard />
        }
      />

      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:id" element={<CoursePage />} />
      <Route path="/lesson/:id" element={user ? <LessonPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/quiz/:id" element={user ? <QuizPage /> : <Navigate to="/dashboard" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider><AuthProvider><AuthConsumerWrapper /></AuthProvider></LanguageProvider>
    </BrowserRouter>
  );
}

function AuthConsumerWrapper() {
  const { user } = useAuth();
  return (
    <AccessibilityProvider userId={user?.id}>
      <AppRoutes />
    </AccessibilityProvider>
  );
}
