import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Eye,
  EyeOff,
  GraduationCap,
  AlertCircle,
  Loader2,
  UserRound,
  ShieldCheck,
  Check,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useLanguage } from "../contexts/LanguageContext"
import type { UserRole } from "../types"

export default function LoginPage() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: "", password: "", remember: false })
  const [selectedRole, setSelectedRole] = useState<UserRole>("student")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.email || !form.password) {
      setError(t("login.fill_all_fields"))
      return
    }
    setLoading(true)
    const result = await login(form.email, form.password, selectedRole)
    setLoading(false)
    if (result.success) {
      navigate(selectedRole === "admin" ? "/admin" : "/dashboard")
    } else {
      setError(result.error || t("login.login_error"))
    }
  }

  const roles = [
    {
      role: "student" as const,
      label: t("login.role.student"),
      description: t("login.role.student_desc"),
      icon: UserRound,
      email: "student@demo.uz",
    },
    {
      role: "admin" as const,
      label: t("login.role.admin"),
      description: t("login.role.admin_desc"),
      icon: ShieldCheck,
      email: "admin@demo.uz",
    },
  ]

  const chooseRole = (role: UserRole, email: string) => {
    setSelectedRole(role)
    setError("")
    setForm((current) => ({ ...current, email, password: "demo" }))
  }

  return (
    <div className="min-h-screen bg-[#fff9fb] flex">
      {/* Left side */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-slate-900 p-12 text-white">
        <Link
          to="/"
          className="flex items-center gap-2 font-display font-bold text-xl text-violet-400"
        >
          <GraduationCap className="w-7 h-7" />
          Imkon Ta’lim
        </Link>
        <div>
          <blockquote className="text-2xl font-display font-semibold leading-relaxed mb-4">
            {t("login.quote")}
          </blockquote>
          <cite className="text-slate-400 text-sm not-italic">
            {t("login.quote_author")}
          </cite>
        </div>
        <img
          src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&h=400&fit=crop&auto=format"
          alt={t("login.image_alt")}
          className="rounded-2xl w-full h-56 object-cover opacity-60"
        />
      </div>

      {/* Right side */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <Link
              to="/"
              className="flex items-center gap-2 font-display font-bold text-xl text-violet-600"
            >
              <GraduationCap className="w-7 h-7" />
              Imkon Ta’lim
            </Link>
          </div>

          <h1 className="font-display font-bold text-3xl text-slate-900 mb-2">
            {t("login.welcome")}
          </h1>
          <p className="text-slate-500 mb-8">{t("login.subtitle")}</p>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <fieldset className="mb-6">
            <legend className="mb-3 text-sm font-semibold text-slate-800">
              {t("login.select_role")}
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {roles.map((item) => {
                const Icon = item.icon
                const active = selectedRole === item.role
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => chooseRole(item.role, item.email)}
                    aria-pressed={active}
                    className={`relative rounded-xl border p-3 text-left transition-all ${
                      active
                        ? "border-violet-600 bg-violet-50 text-violet-800 ring-1 ring-violet-600"
                        : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50/40"
                    }`}
                  >
                    {active && (
                      <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-violet-700" />
                    )}
                    <Icon className="mb-2 h-5 w-5" />
                    <span className="block text-sm font-semibold">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-tight opacity-75">
                      {item.description}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {t("login.demo_hint")}
            </p>
          </fieldset>

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  {t("login.email_label")}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  placeholder={t("login.email_placeholder")}
                  aria-required="true"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  {t("login.password_label")}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    placeholder={t("login.password_placeholder")}
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    aria-label={
                      showPassword
                        ? t("login.hide_password")
                        : t("login.show_password")
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, remember: e.target.checked }))
                    }
                    className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
                  />
                  <span className="text-sm text-slate-600">
                    {t("login.remember_me")}
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                >
                  {t("login.forgot_password")}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-violet-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              aria-busy={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t("login.logging_in") : t("login.login_button")}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {t("login.no_account")}{" "}
            <Link
              to="/register"
              className="text-violet-600 font-semibold hover:text-violet-700"
            >
              {t("login.register")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
