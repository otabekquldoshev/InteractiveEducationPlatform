import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, GraduationCap, LayoutDashboard, BookOpen, ChevronDown, Home, SlidersHorizontal, Languages } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";

export default function Navbar() {
  const { user, switchRole } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const changeRole = (role: "student" | "admin") => {
    switchRole(role);
    navigate(role === "admin" ? "/admin" : "/dashboard");
    setDropdownOpen(false);
  };

  const dashboardPath = user?.role === "admin" ? "/admin" : user?.role === "teacher" ? "/teacher" : "/dashboard";

  const navLinks = [
    { to: "/", label: t("home") }, { to: "/courses", label: t("courses") }, { to: "/#features", label: t("features") }, { to: "/#about", label: t("about") },
  ];

  return (
    <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-30">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[4.5rem] flex items-center justify-between"
        role="navigation"
        aria-label="Asosiy navigatsiya"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-slate-900 font-bold text-xl font-display tracking-tight">
          <span className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm shadow-blue-600/30"><GraduationCap className="w-5 h-5" aria-hidden="true" /></span>
          <span>Edu<span className="text-blue-600">Access</span></span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/80 p-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors hover:text-teal-700 ${
                location.pathname === link.to ? "text-blue-700 bg-white shadow-sm" : "text-slate-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth area */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSelect language={language} setLanguage={setLanguage} />
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-semibold text-sm">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <span className="text-sm font-medium text-slate-700">{user.firstName}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                    </div>
                    <Link
                      to={dashboardPath}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      {t("dashboard")}
                    </Link>
                    <Link
                      to="/courses"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      {t("courses")}
                    </Link>
                    <button
                      onClick={() => changeRole(user.role === "admin" ? "student" : "admin")}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition-colors border-t border-slate-100"
                    >
                      <ShieldIcon />
                      {user.role === "admin" ? t("studentMode") : t("adminMode")}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-700 hover:text-teal-600 transition-colors px-3 py-2"
              >
                Kirish
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/30"
              >
                Ro'yxatdan o'tish
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label="Menyu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pb-4 pt-3 space-y-1">
          <div className="mb-2"><LanguageSelect language={language} setLanguage={setLanguage} /></div>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="block px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to={dashboardPath} className="block px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50" onClick={() => setMenuOpen(false)}>{t("dashboard")}</Link>
              <button onClick={() => changeRole(user.role === "admin" ? "student" : "admin")} className="block w-full text-left px-3 py-2.5 text-sm font-medium text-blue-700 rounded-lg hover:bg-blue-50">{user.role === "admin" ? t("studentMode") : t("adminMode")}</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50" onClick={() => setMenuOpen(false)}>Kirish</Link>
              <Link to="/register" className="block px-3 py-2.5 text-sm font-medium text-teal-600 rounded-lg hover:bg-teal-50" onClick={() => setMenuOpen(false)}>Ro'yxatdan o'tish</Link>
            </>
          )}
        </div>
      )}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[4.5rem] border-t border-slate-200 bg-white/95 backdrop-blur-xl flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]" aria-label="Mobil tezkor navigatsiya">
        <MobileLink to="/" label={t("home")} icon={<Home className="w-5 h-5" />} active={location.pathname === "/"} />
        <MobileLink to="/courses" label={t("courses")} icon={<BookOpen className="w-5 h-5" />} active={location.pathname.startsWith("/courses")} />
        {user && <MobileLink to={dashboardPath} label={t("dashboard")} icon={<LayoutDashboard className="w-5 h-5" />} active={["/dashboard", "/teacher", "/admin"].includes(location.pathname)} />}
        <button onClick={() => setMenuOpen(true)} className="flex min-w-14 flex-col items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500" aria-label={t("menu")}><SlidersHorizontal className="w-5 h-5" /><span>{t("settings")}</span></button>
      </nav>
    </header>
  );
}

function ShieldIcon() { return <span className="flex h-4 w-4 items-center justify-center rounded bg-blue-100 text-[10px] font-bold text-blue-700">A</span>; }

function LanguageSelect({ language, setLanguage }: { language: "uz" | "ru" | "en"; setLanguage: (language: "uz" | "ru" | "en") => void }) { return <label className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-600"><Languages className="h-4 w-4 text-blue-600" /><span className="sr-only">Til</span><select value={language} onChange={(event) => setLanguage(event.target.value as "uz" | "ru" | "en")} className="bg-transparent text-xs font-semibold outline-none"><option value="uz">O‘zbek</option><option value="ru">Русский</option><option value="en">English</option></select></label>; }

function MobileLink({ to, label, icon, active }: { to: string; label: string; icon: React.ReactNode; active: boolean }) {
  return <Link to={to} className={`flex min-w-14 flex-col items-center gap-1 px-2 py-1 text-xs font-medium ${active ? "text-blue-700" : "text-slate-500"}`}><span className={active ? "rounded-lg bg-blue-50 p-1" : "p-1"}>{icon}</span><span>{label}</span></Link>;
}
