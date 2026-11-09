import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Eye,
  EyeOff,
  GraduationCap,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useLanguage } from "../contexts/LanguageContext"

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = t("register.validation.firstName")
    if (!form.lastName.trim()) e.lastName = t("register.validation.lastName")
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      e.email = t("register.validation.email")
    if (form.password.length < 8) e.password = t("register.validation.password")
    if (form.password !== form.confirmPassword)
      e.confirmPassword = t("register.validation.confirmPassword")
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setLoading(true)
    const result = await register({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.toLowerCase(),
      password: form.password,
    })
    setLoading(false)
    if (result.success) {
      navigate("/onboarding")
    } else {
      setErrors({ submit: result.error || t("register.validation.submit") })
    }
  }

  const passwordStrength = () => {
    const p = form.password
    if (!p) return 0
    let score = 0
    if (p.length >= 6) score++
    if (p.length >= 10) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  }

  const strength = passwordStrength()
  const strengthLabels = [
    "",
    t("register.strength.veryWeak"),
    t("register.strength.weak"),
    t("register.strength.medium"),
    t("register.strength.strong"),
    t("register.strength.veryStrong"),
  ]
  const strengthColors = [
    "",
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-violet-500",
    "bg-green-500",
  ]

  return (
    <div className="min-h-screen bg-[#fff9fb] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 font-display font-bold text-xl text-violet-600"
          >
            <GraduationCap className="w-7 h-7" />
            Imkon Ta’lim
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h1 className="font-display font-bold text-2xl text-slate-900 mb-2">
            {t("register.title")}
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            {t("register.subtitle")}
          </p>

          {errors.submit && (
            <div
              role="alert"
              className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field
                id="firstName"
                label={t("register.label.firstName")}
                type="text"
                value={form.firstName}
                onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
                error={errors.firstName}
                autoComplete="given-name"
                placeholder={t("register.placeholder.firstName")}
              />
              <Field
                id="lastName"
                label={t("register.label.lastName")}
                type="text"
                value={form.lastName}
                onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
                error={errors.lastName}
                autoComplete="family-name"
                placeholder={t("register.placeholder.lastName")}
              />
            </div>

            <div className="mb-4">
              <Field
                id="email"
                label={t("register.label.email")}
                type="email"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                error={errors.email}
                autoComplete="email"
                placeholder={t("register.placeholder.email")}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                {t("register.label.password")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className={`w-full px-4 py-3 pr-12 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all ${
                    errors.password
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  }`}
                  placeholder={t("register.placeholder.password")}
                  autoComplete="new-password"
                  aria-describedby="password-strength"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={
                    showPassword
                      ? t("register.aria.hidePassword")
                      : t("register.aria.showPassword")
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {form.password && (
                <div id="password-strength" className="mt-2">
                  <div className="flex gap-1 mb-1" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= strength
                            ? strengthColors[strength]
                            : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    {t("register.passwordStrength")}
                    {strengthLabels[strength]}
                  </p>
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            <div className="mb-6">
              <Field
                id="confirmPassword"
                label={t("register.label.confirmPassword")}
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(v) => setForm((f) => ({ ...f, confirmPassword: v }))}
                error={errors.confirmPassword}
                autoComplete="new-password"
                placeholder={t("register.placeholder.confirmPassword")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("register.button.loading")}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {t("register.button.submit")}
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            {t("register.haveAccount")}
            <Link
              to="/login"
              className="text-violet-600 font-semibold hover:text-violet-700"
            >
              {t("register.loginLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
}: {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  error?: string
  autoComplete?: string
  placeholder?: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-700 mb-1.5"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all ${
          error ? "border-red-300 bg-red-50" : "border-slate-200"
        }`}
      />
      {error && (
        <p
          id={`${id}-error`}
          className="text-xs text-red-600 mt-1"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}
