import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import {
  Menu,
  X,
  LayoutDashboard,
  BookOpen,
  ChevronDown,
  Home,
  SlidersHorizontal,
  Languages,
  LogOut,
  Trophy,
} from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { useLanguage } from "../../contexts/LanguageContext"

export default function Navbar() {
  const { user, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/")
    setDropdownOpen(false)
  }

  const dashboardPath = user?.role === "admin" ? "/admin" : "/dashboard"

  const navLinks = [
    { to: "/", label: t("home") },
    { to: "/courses", label: t("courses") },
    { to: "/surdo", label: t("nav_surdo") },
    { to: "/#features", label: t("features") },
    { to: "/#about", label: t("about") },
  ]

  const handleSectionNavigation = (to: string) => {
    setMenuOpen(false)
    if (location.pathname !== "/") return

    if (to === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (to.startsWith("/#")) {
      document
        .getElementById(to.slice(2))
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const isNavLinkActive = (to: string) => {
    if (to.startsWith("/#")) {
      return location.pathname === "/" && location.hash === to.slice(1)
    }
    if (to === "/") {
      return location.pathname === "/" && !location.hash
    }
    return location.pathname === to
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-rose-100 bg-white/95 shadow-[0_10px_35px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <nav
          className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
          role="navigation"
          aria-label={t("main_navigation")}
        >
        {/* Logo */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 rounded-xl pr-2 font-display text-xl font-bold tracking-tight text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
          aria-label={`Imkon Ta’lim — ${t("home")}`}
        >
          <span className="relative flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-rose-100 bg-white shadow-sm shadow-rose-900/10 transition-transform duration-300 group-hover:-translate-y-0.5">
            <span className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-amber-50" />
            <img
              src="/brand/eduaccess-mark.png"
              alt=""
              className="relative h-11 w-12 object-contain"
              aria-hidden="true"
            />
          </span>
          <span className="hidden drop-shadow-sm sm:inline">
            Imkon <span className="text-rose-600">Ta’lim</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-slate-50 to-violet-50 p-1.5 shadow-inner md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => handleSectionNavigation(link.to)}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
                isNavLinkActive(link.to)
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/25"
                  : "text-slate-700 hover:bg-white hover:text-rose-700 hover:shadow-sm"
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
                className="flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 transition-colors hover:border-rose-100 hover:bg-rose-50"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-rose-600 to-violet-500 text-sm font-bold text-white shadow-md shadow-rose-600/20">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {user.firstName}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      to={dashboardPath}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-[#fff9fb] transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      {t("dashboard")}
                    </Link>
                    <Link
                      to="/courses"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-[#fff9fb] transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      {t("courses")}
                    </Link>
                    {user.role === "student" && (
                      <Link
                        to="/certificates"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-amber-50"
                      >
                        <Trophy className="h-4 w-4 text-amber-500" />
                        Mening sertifikatlarim
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors border-t border-slate-100"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("logout")}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-700 hover:text-violet-600 transition-colors px-3 py-2"
              >
                {t("login")}
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-rose-600 text-white px-4 py-2.5 rounded-xl hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/30"
              >
                {t("register")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-700 shadow-sm transition-colors hover:bg-rose-100 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label={t("menu")}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="space-y-1 border-t border-slate-200 bg-white px-4 pb-4 pt-3 md:hidden">
          <div className="mb-2">
            <LanguageSelect language={language} setLanguage={setLanguage} />
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="block px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-[#fff9fb]"
              onClick={() => handleSectionNavigation(link.to)}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                to={dashboardPath}
                className="block px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-[#fff9fb]"
                onClick={() => setMenuOpen(false)}
              >
                {t("dashboard")}
              </Link>
              {user.role === "student" && (
                <Link
                  to="/certificates"
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-amber-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Mening sertifikatlarim
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2.5 text-sm font-medium text-red-700 rounded-lg hover:bg-red-50"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-[#fff9fb]"
                onClick={() => setMenuOpen(false)}
              >
                {t("login")}
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2.5 text-sm font-medium text-violet-600 rounded-lg hover:bg-violet-50"
                onClick={() => setMenuOpen(false)}
              >
                {t("register")}
              </Link>
            </>
          )}
          </div>
        )}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
      </header>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[4.5rem] border-t border-slate-200 bg-white/95 backdrop-blur-xl flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]"
        aria-label={t("mobile_quick_navigation")}
      >
        <MobileLink
          to="/"
          label={t("home")}
          icon={<Home className="w-5 h-5" />}
          active={location.pathname === "/"}
        />
        <MobileLink
          to="/courses"
          label={t("courses")}
          icon={<BookOpen className="w-5 h-5" />}
          active={location.pathname.startsWith("/courses")}
        />
        <MobileLink
          to="/surdo"
          label={t("nav_surdo")}
          icon={<Languages className="w-5 h-5" />}
          active={location.pathname === "/surdo"}
        />
        {user && (
          <MobileLink
            to={dashboardPath}
            label={t("dashboard")}
            icon={<LayoutDashboard className="w-5 h-5" />}
            active={["/dashboard", "/admin"].includes(location.pathname)}
          />
        )}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex min-w-14 flex-col items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500"
          aria-label={t("menu")}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span>{t("settings")}</span>
        </button>
      </nav>
    </>
  )
}

function LanguageSelect({
  language,
  setLanguage,
}: {
  language: "uz" | "ru" | "en" | "ko" | "zh"
  setLanguage: (language: "uz" | "ru" | "en" | "ko" | "zh") => void
}) {
  const { t } = useLanguage()
  return (
    <label className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-600">
      <Languages className="h-4 w-4 text-rose-600" />
      <span className="sr-only">{t("language")}</span>
      <select
        value={language}
        onChange={(event) =>
          setLanguage(event.target.value as "uz" | "ru" | "en" | "ko" | "zh")
        }
        className="bg-transparent text-xs font-semibold outline-none"
      >
        <option value="uz">O‘zbek</option>
        <option value="ru">Русский</option>
        <option value="en">English</option>
        <option value="ko">한국어</option>
        <option value="zh">中文</option>
      </select>
    </label>
  )
}

function MobileLink({
  to,
  label,
  icon,
  active,
}: {
  to: string
  label: string
  icon: React.ReactNode
  active: boolean
}) {
  return (
    <Link
      to={to}
      className={`flex min-w-14 flex-col items-center gap-1 px-2 py-1 text-xs font-medium ${
        active ? "text-rose-700" : "text-slate-500"
      }`}
    >
      <span className={active ? "rounded-lg bg-rose-50 p-1" : "p-1"}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  )
}
