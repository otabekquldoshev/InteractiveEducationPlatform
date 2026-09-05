import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, GraduationCap, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("Barcha maydonlarni to'ldiring");
      return;
    }
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Kirish xatosi");
    }
  };

  const demoAccounts = [
    { label: "Student", email: "student@demo.uz", password: "demo" },
    { label: "O'qituvchi", email: "teacher@demo.uz", password: "demo" },
    { label: "Admin", email: "admin@demo.uz", password: "demo" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-slate-900 p-12 text-white">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-teal-400">
          <GraduationCap className="w-7 h-7" />
          EduAccess
        </Link>
        <div>
          <blockquote className="text-2xl font-display font-semibold leading-relaxed mb-4">
            "Ta'lim — bu har bir insanning huquqi, imkoni emas."
          </blockquote>
          <cite className="text-slate-400 text-sm not-italic">— EduAccess dasturi</cite>
        </div>
        <img
          src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&h=400&fit=crop&auto=format"
          alt="O'quvchilar"
          className="rounded-2xl w-full h-56 object-cover opacity-60"
        />
      </div>

      {/* Right side */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-teal-600">
              <GraduationCap className="w-7 h-7" />
              EduAccess
            </Link>
          </div>

          <h1 className="font-display font-bold text-3xl text-slate-900 mb-2">Xush kelibsiz</h1>
          <p className="text-slate-500 mb-8">Hisobingizga kiring va o'rganishni davom eting</p>

          {error && (
            <div role="alert" className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Demo accounts */}
          <div className="mb-6 p-4 bg-teal-50 rounded-xl border border-teal-100">
            <p className="text-xs font-semibold text-teal-700 mb-2">Demo hisoblar:</p>
            <div className="flex gap-2 flex-wrap">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, email: acc.email, password: acc.password }))}
                  className="text-xs bg-white text-teal-700 px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-colors font-medium"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email manzil
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="sizning@email.uz"
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Parol
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="Parolni kiriting"
                    aria-required="true"
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
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={(e) => setForm((f) => ({ ...f, remember: e.target.checked }))}
                    className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-600">Eslab qolish</span>
                </label>
                <button type="button" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                  Parolni unutdim
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-teal-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              aria-busy={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Kirish..." : "Kirish"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Hisobingiz yo'qmi?{" "}
            <Link to="/register" className="text-teal-600 font-semibold hover:text-teal-700">
              Ro'yxatdan o'ting
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
