import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, GraduationCap, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Ism kiritilmagan";
    if (!form.lastName.trim()) e.lastName = "Familiya kiritilmagan";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Email noto'g'ri";
    if (form.password.length < 6) e.password = "Parol kamida 6 ta belgi bo'lishi kerak";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Parollar mos emas";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    const result = await register({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.toLowerCase(),
      password: form.password,
    });
    setLoading(false);
    if (result.success) {
      navigate("/onboarding");
    } else {
      setErrors({ submit: result.error || "Xato yuz berdi" });
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strength = passwordStrength();
  const strengthLabels = ["", "Juda zaif", "Zaif", "O'rta", "Kuchli", "Juda kuchli"];
  const strengthColors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-teal-500", "bg-green-500"];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-teal-600">
            <GraduationCap className="w-7 h-7" />
            EduAccess
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h1 className="font-display font-bold text-2xl text-slate-900 mb-2">Ro'yxatdan o'tish</h1>
          <p className="text-slate-500 text-sm mb-6">Bepul hisob yarating va o'rganishni boshlang</p>

          {errors.submit && (
            <div role="alert" className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field
                id="firstName"
                label="Ism"
                type="text"
                value={form.firstName}
                onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
                error={errors.firstName}
                autoComplete="given-name"
                placeholder="Alisher"
              />
              <Field
                id="lastName"
                label="Familiya"
                type="text"
                value={form.lastName}
                onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
                error={errors.lastName}
                autoComplete="family-name"
                placeholder="Qodirov"
              />
            </div>

            <div className="mb-4">
              <Field
                id="email"
                label="Email manzil"
                type="email"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                error={errors.email}
                autoComplete="email"
                placeholder="sizning@email.uz"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Parol
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className={`w-full px-4 py-3 pr-12 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                    errors.password ? "border-red-300 bg-red-50" : "border-slate-200"
                  }`}
                  placeholder="Kamida 6 ta belgi"
                  autoComplete="new-password"
                  aria-describedby="password-strength"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div id="password-strength" className="mt-2">
                  <div className="flex gap-1 mb-1" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= strength ? strengthColors[strength] : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Parol kuchi: {strengthLabels[strength]}</p>
                </div>
              )}
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div className="mb-6">
              <Field
                id="confirmPassword"
                label="Parolni tasdiqlang"
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(v) => setForm((f) => ({ ...f, confirmPassword: v }))}
                error={errors.confirmPassword}
                autoComplete="new-password"
                placeholder="Parolni qayta kiriting"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ro'yxatdan o'tilmoqda...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Ro'yxatdan o'tish
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Hisobingiz bormi?{" "}
            <Link to="/login" className="text-teal-600 font-semibold hover:text-teal-700">
              Kirish
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  id, label, type, value, onChange, error, autoComplete, placeholder,
}: {
  id: string; label: string; type: string; value: string;
  onChange: (v: string) => void; error?: string; autoComplete?: string; placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
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
        className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
          error ? "border-red-300 bg-red-50" : "border-slate-200"
        }`}
      />
      {error && <p id={`${id}-error`} className="text-xs text-red-600 mt-1" role="alert">{error}</p>}
    </div>
  );
}
