import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Users,
  BookOpen,
  BarChart2,
  FileText,
  Settings,
  Shield,
  LayoutDashboard,
  TrendingUp,
  UserCheck,
  Eye,
  Edit2,
  Trash2,
  Video,
  ClipboardList,
  Plus,
  Upload,
  ArrowUpRight,
  CircleCheck,
  MoreHorizontal,
  Search,
  UserPlus,
  Layers3,
  Download,
  RefreshCw,
  Activity,
  GraduationCap,
  Target,
  SlidersHorizontal,
  Check,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { useCatalog } from "../contexts/CatalogContext"
import { api } from "../lib/api"
import Navbar from "../components/layout/Navbar"
import AccessibilityPanel from "../components/AccessibilityPanel"
import { useLanguage } from "../contexts/LanguageContext"
import ContentManager from "../components/admin/ContentManager"
import type { Course } from "../types"
import { useAuth } from "../contexts/AuthContext"

type Tab = "overview" | "users" | "courses" | "lessons" | "videos" | "tests" | "reports" | "settings"

const ADMIN_TABS: readonly Tab[] = [
  "overview",
  "users",
  "courses",
  "lessons",
  "videos",
  "tests",
  "reports",
  "settings",
]

function getAdminTab(value: string | null): Tab {
  return ADMIN_TABS.includes(value as Tab) ? (value as Tab) : "overview"
}

type AdminUser = {
  id: string
  name: string
  email: string
  role: "student" | "admin"
  status: "active" | "inactive"
  joined: string
}
type RecentActivity = {
  id: string
  action: string
  entity: string
  createdAt: string
  user?: { firstName: string; lastName: string } | null
}
type AdminReport = {
  summary: {
    students: number
    activeStudents: number
    enrollments: number
    averageProgress: number
    completedEnrollments: number
    quizAttempts: number
    averageQuizScore: number
    passedQuizAttempts: number
    accessibilityProfiles: number
    enabledAccessibility: number
  }
  coursePerformance: Array<{
    id: string
    title: string
    students: number
    averageProgress: number
    completed: number
  }>
  recentLearners: Array<{
    id: string
    student: string
    email: string
    course: string
    progress: number
    completedLessons: number
    lastActivityAt: string
  }>
}
type AdminPreferences = {
  compactCards: boolean
  showActivity: boolean
  pageSize: number
}
type EditorState = { kind: "course"; item?: Course } | {
  kind: "user"
  item?: AdminUser
}

const COLORS = ["#9464A2", "#A978B5", "#C98EBF", "#E879A7", "#F4C6D8"]
const ADMIN_PREFERENCES_KEY = "eduaccess_admin_preferences"
const defaultAdminPreferences: AdminPreferences = {
  compactCards: false,
  showActivity: true,
  pageSize: 10,
}

function buildCategoryData(courses: Course[]) {
  const counts = courses.reduce<Record<string, number>>((result, course) => {
    const category = course.category || "Boshqa"
    result[category] = (result[category] || 0) + 1
    return result
  }, {})
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

const languageLocales = {
  uz: "uz-UZ",
  ru: "ru-RU",
  en: "en-US",
  ko: "ko-KR",
  zh: "zh-CN",
} as const

function buildMonthlyData(
  users: AdminUser[],
  language: keyof typeof languageLocales,
) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
    const year = date.getFullYear()
    const month = date.getMonth()
    return {
      month: new Intl.DateTimeFormat(languageLocales[language], {
        month: "short",
      }).format(date),
      students: users.filter((user) => {
        const joined = new Date(user.joined)
        return (
          user.role === "student" &&
          joined.getFullYear() === year &&
          joined.getMonth() === month
        )
      }).length,
    }
  })
}

const roleBadge = {
  student: "bg-rose-50 text-rose-700",
  admin: "bg-purple-50 text-purple-700",
}

const getRoleLabel = (role: string, t: (key: string) => string) =>
  role === "student" ? t("roleStudent") : t("roleAdmin")

function activityLabel(
  action: string,
  entity: string,
  t: (key: any) => string,
) {
  const actionKey = `admin_activity_${action.toLocaleLowerCase()}`
  const entityKey = `admin_entity_${entity.toLocaleLowerCase()}`
  const translatedAction = t(actionKey)
  const translatedEntity = t(entityKey)
  return `${translatedEntity === entityKey ? entity : translatedEntity}: ${
    translatedAction === actionKey
      ? action.toLocaleLowerCase()
      : translatedAction
  }`
}

function formatActivityDate(
  value: string,
  language: keyof typeof languageLocales,
) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(languageLocales[language], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const content = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n")
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }),
  )
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function AdminDashboard() {
  const { user: currentUser } = useAuth()
  const { courses, reload } = useCatalog()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = getAdminTab(searchParams.get("tab"))
  const setTab = (nextTab: Tab) => {
    const nextParams = new URLSearchParams(searchParams)
    if (nextTab === "overview") nextParams.delete("tab")
    else nextParams.set("tab", nextTab)
    setSearchParams(nextParams, { replace: true })
  }
  const [userFilter, setUserFilter] = useState("all")
  const [userStatusFilter, setUserStatusFilter] = useState("all")
  const [userSearch, setUserSearch] = useState("")
  const [userPage, setUserPage] = useState(1)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [report, setReport] = useState<AdminReport | null>(null)
  const [adminLoading, setAdminLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(true)
  const [adminError, setAdminError] = useState("")
  const [reportError, setReportError] = useState("")
  const [contentCourseId, setContentCourseId] = useState("")
  const [contentLessonId, setContentLessonId] = useState("")
  const [liveStats, setLiveStats] = useState({
    students: 0,
    courses: 0,
    lessons: 0,
    videos: 0,
    completedLessons: 0,
    activeSessions: 0,
    activeStudents24h: 0,
    learningActivities24h: 0,
  })
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [crudMessage, setCrudMessage] = useState("")
  const [preferences, setPreferences] = useState<AdminPreferences>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_PREFERENCES_KEY)
      return saved
        ? { ...defaultAdminPreferences, ...JSON.parse(saved) }
        : defaultAdminPreferences
    } catch {
      return defaultAdminPreferences
    }
  })
  const { t, language } = useLanguage()

  const categoryData = buildCategoryData(courses)
  const monthlyData = buildMonthlyData(users, language)
  const tabInfo: Record<Tab, { title: string; description: string }> = {
    overview: {
      title: t("admin_tab_overview"),
      description: t("platformStatusDesc"),
    },
    users: {
      title: t("admin_tab_users"),
      description: t("admin_tab_users_desc"),
    },
    courses: {
      title: t("courses"),
      description: t("admin_tab_courses_desc"),
    },
    lessons: {
      title: t("modules_and_lessons"),
      description: t("admin_tab_lessons_desc"),
    },
    videos: {
      title: t("videoLessons"),
      description: t("admin_tab_videos_desc"),
    },
    tests: {
      title: t("tests"),
      description: t("admin_tab_tests_desc"),
    },
    reports: {
      title: t("admin_tab_reports"),
      description: t("admin_tab_reports_desc"),
    },
    settings: {
      title: t("settings"),
      description: t("admin_tab_settings_desc"),
    },
  }

  const loadAdminData = async (showLoading = true) => {
    if (showLoading) setAdminLoading(true)
    setAdminError("")
    try {
      const [userResult, statsResult] = await Promise.all([
        api<{
          users: Array<{
            id: string
            firstName: string
            lastName: string
            email: string
            role: AdminUser["role"]
            active: boolean
            createdAt: string
          }>
        }>("/admin/users"),
        api<{ stats: typeof liveStats; recentActivity: RecentActivity[] }>(
          "/admin/stats",
        ),
      ])
      setUsers(
        userResult.users.map((item) => ({
          id: item.id,
          name: `${item.firstName} ${item.lastName}`,
          email: item.email,
          role: item.role,
          status: item.active ? "active" : "inactive",
          joined: item.createdAt,
        })),
      )
      setLiveStats(statsResult.stats)
      setRecentActivity(statsResult.recentActivity)
    } catch (error) {
      setAdminError(
        error instanceof Error
          ? error.message
          : "Ma’lumotlarni yuklab bo‘lmadi",
      )
    } finally {
      if (showLoading) setAdminLoading(false)
    }
  }

  const loadReports = async () => {
    setReportLoading(true)
    setReportError("")
    try {
      setReport(await api<AdminReport>("/admin/reports"))
    } catch (error) {
      setReportError(
        error instanceof Error ? error.message : "Hisobotlarni yuklab bo‘lmadi",
      )
    } finally {
      setReportLoading(false)
    }
  }

  useEffect(() => {
    void loadAdminData()
    void loadReports()
    const refreshTimer = window.setInterval(() => {
      void loadAdminData(false)
    }, 60_000)
    return () => window.clearInterval(refreshTimer)
  }, [])

  const normalizedUserSearch = userSearch.trim().toLocaleLowerCase()
  const filteredUsers = users.filter(
    (item) =>
      (userFilter === "all" || item.role === userFilter) &&
      (userStatusFilter === "all" || item.status === userStatusFilter) &&
      (!normalizedUserSearch ||
        item.name.toLocaleLowerCase().includes(normalizedUserSearch) ||
        item.email.toLocaleLowerCase().includes(normalizedUserSearch)),
  )
  const userPageCount = Math.max(
    1,
    Math.ceil(filteredUsers.length / preferences.pageSize),
  )
  const safeUserPage = Math.min(userPage, userPageCount)
  const userPageStart = (safeUserPage - 1) * preferences.pageSize
  const visibleUsers = filteredUsers.slice(
    userPageStart,
    userPageStart + preferences.pageSize,
  )

  useEffect(() => {
    setUserPage(1)
  }, [userFilter, userStatusFilter, userSearch, preferences.pageSize])
  const activeUsers = users.filter((item) => item.status === "active").length
  const adminUsers = users.filter((item) => item.role === "admin").length
  const publishedCourses = courses.filter(
    (course) => course.status === "published",
  ).length
  const videoCoverage = liveStats.lessons
    ? Math.round((liveStats.videos / liveStats.lessons) * 100)
    : 0
  const activeAccountRate = users.length
    ? Math.round((activeUsers / users.length) * 100)
    : 0
  const lessonsPerCourse = liveStats.courses
    ? (liveStats.lessons / liveStats.courses).toFixed(1)
    : "0"

  const savePreferences = (next: AdminPreferences) => {
    setPreferences(next)
    localStorage.setItem(ADMIN_PREFERENCES_KEY, JSON.stringify(next))
    setCrudMessage("Panel sozlamalari saqlandi")
  }

  const exportUsers = () => {
    downloadCsv("imkon-talim-foydalanuvchilar.csv", [
      ["Ism", "Email", "Rol", "Holat", "Qo‘shilgan sana"],
      ...filteredUsers.map((item) => [
        item.name,
        item.email,
        item.role,
        item.status,
        item.joined,
      ]),
    ])
  }

  const exportReport = () => {
    if (!report) return
    downloadCsv("imkon-talim-kurslar-hisoboti.csv", [
      ["Fan", "O‘quvchilar", "O‘rtacha progress", "Yakunlaganlar"],
      ...report.coursePerformance.map((item) => [
        item.title,
        item.students,
        `${item.averageProgress}%`,
        item.completed,
      ]),
    ])
  }

  const stats = [
    {
      icon: <Users className="w-5 h-5" />,
      label: t("totalStudents"),
      value: liveStats.students,
      change: t("live"),
      color: "teal",
    },
    {
      icon: <UserCheck className="w-5 h-5" />,
      label: t("completedLessons"),
      value: liveStats.completedLessons,
      change: t("live"),
      color: "green",
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: t("courses"),
      value: liveStats.courses || courses.length,
      change: t("live"),
      color: "amber",
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: t("lessons"),
      value: liveStats.lessons,
      change: t("live"),
      color: "blue",
    },
    {
      icon: <Video className="w-5 h-5" />,
      label: t("videoLessons"),
      value: liveStats.videos,
      change: t("live"),
      color: "purple",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: t("activeSessions"),
      value: liveStats.activeSessions,
      change: t("live"),
      color: "red",
    },
  ]

  const deleteUser = async (id: string) => {
    const target = users.find((item) => item.id === id)
    if (
      !target ||
      !window.confirm(`“${target.name}” foydalanuvchisini o‘chirasizmi?`)
    )
      return
    try {
      await api(`/admin/users/${id}`, { method: "DELETE" })
      await loadAdminData()
      setCrudMessage(t("userDeleted"))
    } catch (error) {
      setCrudMessage(error instanceof Error ? error.message : t("deleteFailed"))
    }
  }

  const toggleUserStatus = async (target: AdminUser) => {
    try {
      await api(`/admin/users/${target.id}`, {
        method: "PATCH",
        body: { active: target.status !== "active" },
      })
      await loadAdminData()
      setCrudMessage(
        target.status === "active"
          ? "Foydalanuvchi bloklandi"
          : "Foydalanuvchi faollashtirildi",
      )
    } catch (error) {
      setCrudMessage(error instanceof Error ? error.message : t("saveFailed"))
    }
  }

  const deleteCourse = async (id: string) => {
    const target = courses.find((course) => course.id === id)
    if (!target || !window.confirm(`“${target.title}” fanini o‘chirasizmi?`))
      return
    try {
      await api(`/courses/${id}`, { method: "DELETE" })
      await reload()
      await loadAdminData()
      setCrudMessage(t("courseDeleted"))
    } catch (error) {
      setCrudMessage(error instanceof Error ? error.message : t("deleteFailed"))
    }
  }

  const toggleCourseStatus = async (course: Course) => {
    try {
      await api(`/courses/${course.id}`, {
        method: "PATCH",
        body: {
          status: course.status === "published" ? "hidden" : "published",
        },
      })
      await reload()
      await loadAdminData()
      setCrudMessage(
        course.status === "published" ? "Fan yashirildi" : "Fan nashr qilindi",
      )
    } catch (error) {
      setCrudMessage(error instanceof Error ? error.message : t("saveFailed"))
    }
  }

  const saveEditor = async (
    values: Record<string, string | boolean | File>,
  ) => {
    if (!editor) return
    if (editor.kind === "course") {
      const body = {
        title: values.title,
        description: values.description,
        category: values.category,
        level: values.level,
        status: values.status,
        thumbnail:
          typeof values.thumbnail === "string"
            ? values.thumbnail || undefined
            : undefined,
      }
      const result = editor.item
        ? await api<{ course: Course }>(`/courses/${editor.item.id}`, {
            method: "PATCH",
            body,
          })
        : await api<{ course: Course }>("/courses", { method: "POST", body })
      if (
        values.thumbnailImage instanceof File &&
        values.thumbnailImage.size > 0
      ) {
        const form = new FormData()
        form.append("image", values.thumbnailImage)
        await api(`/media/courses/${result.course.id}/image`, {
          method: "POST",
          body: form,
        })
      }
      await reload()
      await loadAdminData()
      setTab("courses")
      setCrudMessage(editor.item ? t("courseUpdated") : t("newCourseCreated"))
    } else {
      const body = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        role: values.role,
        active: values.active,
      }
      if (editor.item)
        await api(`/admin/users/${editor.item.id}`, {
          method: "PATCH",
          body: {
            firstName: body.firstName,
            lastName: body.lastName,
            role: body.role,
            active: body.active,
          },
        })
      else await api("/admin/users", { method: "POST", body })
      await loadAdminData()
      setCrudMessage(editor.item ? t("userUpdated") : t("userCreated"))
    }
    setEditor(null)
  }

  return (
    <div
      className={`admin-shell min-h-screen bg-[#f4f7fb] mobile-safe ${
        preferences.compactCards ? "admin-compact" : ""
      }`}
    >
      <Navbar />
      <aside className="hidden lg:fixed lg:inset-y-[4.5rem] lg:left-0 lg:z-20 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-white/10 lg:bg-[#4a294f] lg:p-5 lg:text-white">
        <div className="mb-5 border-b border-white/10 px-3 pb-5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-950/40">
            <Shield className="h-5 w-5" />
          </div>
          <p className="eyebrow text-rose-300">{t("controlCenter")}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {t("controlCenterDesc")}
          </p>
        </div>
        <AdminNav tab={tab} setTab={setTab} />
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[.06] p-4">
          <p className="text-sm font-bold text-white">{t("systemStatus")}</p>
          <p className="mt-1 text-xs text-slate-400">
            {t("allServicesWorking")}
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.12)]" />
            {t("stable")}
          </span>
        </div>
      </aside>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:ml-72 lg:max-w-none lg:px-8 xl:px-10">
        <div className="mb-7 flex flex-col gap-5 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-2 text-rose-600">
              {t("admin")} / {tabInfo[tab].title}
            </p>
            <h1 className="font-display font-bold text-3xl tracking-tight text-slate-950 sm:text-4xl">
              {tabInfo[tab].title}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {tabInfo[tab].description}
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              {currentUser?.firstName} {currentUser?.lastName} · {t("roleAdmin")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTab("videos")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            >
              <Upload className="h-4 w-4" />
              {t("upload_video")}
            </button>
            <button
              type="button"
              onClick={() => setTab("tests")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-700"
            >
              <ClipboardList className="h-4 w-4" />
              {t("create_quiz")}
            </button>
            <button
              onClick={() => setEditor({ kind: "course" })}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700"
            >
              <Plus className="h-4 w-4" />
              {t("newSubject")}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="lg:hidden flex gap-1 overflow-x-auto bg-white rounded-xl border border-slate-200 p-1 mb-6"
          role="tablist"
        >
          {([
            { id: "overview", label: t("dashboard") },
            { id: "courses", label: t("courses") },
            { id: "lessons", label: t("lessons") },
            { id: "videos", label: t("videos") },
            { id: "users", label: t("students") },
            { id: "tests", label: t("tests") },
            { id: "reports", label: t("statistics") },
            { id: "settings", label: t("settings") },
          ] as { id: Tab; label: string }[]).map((tabItem) => (
            <button
              key={tabItem.id}
              role="tab"
              aria-selected={tab === tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === tabItem.id
                  ? "bg-rose-600 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tabItem.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div role="tabpanel">
            <section className="mb-6 grid gap-3 sm:grid-cols-3">
              <QuickContentAction
                icon={<FileText className="h-5 w-5" />}
                title={t("modules_and_lessons")}
                description={t("create_module_add_lessons")}
                action={t("lessonsManagement")}
                onClick={() => setTab("lessons")}
              />
              <QuickContentAction
                icon={<Video className="h-5 w-5" />}
                title={t("videoLessons")}
                description={t("videoLessonsDesc")}
                action={t("upload_video")}
                onClick={() => setTab("videos")}
              />
              <QuickContentAction
                icon={<ClipboardList className="h-5 w-5" />}
                title={t("createTest")}
                description={t("testsDesc")}
                action={t("create_quiz")}
                onClick={() => setTab("tests")}
              />
            </section>
            {/* Stats grid */}
            <section className="mb-6 overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/10 sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="eyebrow text-rose-300">{t("todaysControl")}</p>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {t("platformStable")}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
                    {t("last24HoursActivity")
                      .replace(
                        "{students}",
                        liveStats.activeStudents24h.toLocaleString(),
                      )
                      .replace(
                        "{activities}",
                        liveStats.learningActivities24h.toLocaleString(),
                      )}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-5 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  <div>
                    <p className="text-xs text-slate-400">
                      {t("completedLessons")}
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold">
                      {liveStats.completedLessons}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">
                      {t("activeSessions")}
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold text-rose-300">
                      {liveStats.activeSessions}
                    </p>
                  </div>
                </div>
              </div>
            </section>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-7">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/80"
                >
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-rose-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                      {s.icon}
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {s.change}
                    </span>
                  </div>
                  <div className="font-display font-bold text-2xl text-slate-950">
                    {s.value}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <section className="mb-7 grid gap-4 lg:grid-cols-3">
              <HealthMetric
                label={t("admin_video_coverage")}
                value={`${videoCoverage}%`}
                progress={videoCoverage}
                detail={t("admin_lessons_ratio")
                  .replace("{videos}", String(liveStats.videos))
                  .replace("{lessons}", String(liveStats.lessons))}
                tone="emerald"
              />
              <HealthMetric
                label={t("admin_published_courses")}
                value={`${publishedCourses}`}
                progress={
                  courses.length ? (publishedCourses / courses.length) * 100 : 0
                }
                detail={t("admin_courses_total").replace(
                  "{count}",
                  String(courses.length),
                )}
                tone="blue"
              />
              <HealthMetric
                label={t("admin_active_users")}
                value={`${activeAccountRate}%`}
                progress={activeAccountRate}
                detail={t("admin_lessons_average").replace(
                  "{count}",
                  lessonsPerCourse,
                )}
                tone="violet"
              />
            </section>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_.85fr] gap-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <p className="eyebrow text-rose-600">
                      {t("growthDynamics")}
                    </p>
                    <h3 className="mt-1 font-display font-bold text-slate-900">
                      {t("studentsActivity")}
                    </h3>
                  </div>
                  <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <Tooltip
                      contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                      formatter={(v) => [v, t("students")]}
                    />
                    <Bar
                      dataKey="students"
                      fill="#9464A2"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
                <div className="mb-4">
                  <p className="eyebrow text-rose-600">
                    {t("contentStructure")}
                  </p>
                  <h3 className="mt-1 font-display font-bold text-slate-900">
                    {t("byCategories")}
                  </h3>
                </div>
                <div className="flex items-center gap-3 sm:gap-6">
                  <ResponsiveContainer width="60%" height={200}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [v, t("courses")]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {categoryData.map((item, i) => (
                      <div
                        key={item.name}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ background: COLORS[i] }}
                        />
                        <span className="text-slate-600">{item.name}</span>
                        <span className="text-slate-400 ml-auto">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {preferences.showActivity && (
              <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="eyebrow text-rose-600">{t("liveStream")}</p>
                    <h3 className="mt-1 font-display font-bold text-slate-900">
                      {t("recentActivity")}
                    </h3>
                  </div>
                  <button
                    onClick={() => setTab("users")}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-rose-700 hover:text-rose-800"
                  >
                    {t("seeAll")} <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {recentActivity.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl bg-[#fff9fb] p-3"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <CircleCheck className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {item.user
                            ? `${item.user.firstName} ${item.user.lastName}`
                            : t("admin_system")}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                          {activityLabel(item.action, item.entity, t)}
                        </p>
                        <p className="mt-2 text-[11px] font-medium text-slate-400">
                          {formatActivityDate(item.createdAt, language)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!adminLoading && recentActivity.length === 0 && (
                    <p className="text-sm text-slate-500">
                      {t("admin_no_activity")}
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {tab === "users" && (
          <div role="tabpanel" className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <UserSummary label={t("admin_total_users")} value={users.length} />
              <UserSummary
                label={t("admin_active_accounts")}
                value={activeUsers}
                tone="green"
              />
              <UserSummary
                label={t("admin_administrators")}
                value={adminUsers}
                tone="violet"
              />
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="border-b border-slate-100 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display font-semibold text-slate-900">
                      {t("admin_users_management")}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {t("admin_users_management_desc")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={exportUsers}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
                    >
                      <Download className="h-4 w-4" /> CSV
                    </button>
                    <button
                      onClick={() => setEditor({ kind: "user" })}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white"
                    >
                      <UserPlus className="h-4 w-4" />
                      {t("admin_add_user")}
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder={t("admin_search_users")}
                      className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </label>
                  <select
                    value={userFilter}
                    onChange={(event) => setUserFilter(event.target.value)}
                    aria-label={t("roleFilter")}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="all">{t("admin_all_roles")}</option>
                    <option value="student">{t("roleStudent")}</option>
                    <option value="admin">{t("roleAdmin")}</option>
                  </select>
                  <select
                    value={userStatusFilter}
                    onChange={(event) =>
                      setUserStatusFilter(event.target.value)
                    }
                    aria-label={t("admin_status_filter")}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="all">{t("admin_all_statuses")}</option>
                    <option value="active">{t("activeStatus")}</option>
                    <option value="inactive">{t("inactiveStatus")}</option>
                  </select>
                </div>
              </div>
              {adminError && (
                <div
                  className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                  role="alert"
                >
                  {adminError}
                  <button
                    onClick={() => void loadAdminData()}
                    className="ml-3 font-bold underline"
                  >
                    {t("admin_retry")}
                  </button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#fff9fb]">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {t("user")}
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {t("role")}
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {t("status")}
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {t("addedAt")}
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminLoading && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center text-slate-500"
                        >
                          {t("admin_users_loading")}
                        </td>
                      </tr>
                    )}
                    {!adminLoading &&
                      !adminError &&
                      filteredUsers.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-12 text-center text-slate-500"
                          >
                            {t("admin_users_not_found")}
                          </td>
                        </tr>
                      )}
                    {visibleUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-[#fff9fb] transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-xs font-bold">
                              {u.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {u.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleBadge[(u.role as keyof typeof roleBadge)]}`}
                          >
                            {getRoleLabel(u.role, t as any)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`flex items-center gap-1.5 text-xs font-medium ${
                              u.status === "active"
                                ? "text-green-600"
                                : "text-red-400"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.status === "active"
                                  ? "bg-green-500"
                                  : "bg-red-400"
                              }`}
                            />
                            {u.status === "active"
                              ? t("activeStatus")
                              : t("inactiveStatus")}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {formatActivityDate(u.joined, language)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={u.id === currentUser?.id}
                              onClick={() => void toggleUserStatus(u)}
                              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                                u.status === "active"
                                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {u.status === "active"
                                ? t("admin_block")
                                : t("admin_activate")}
                            </button>
                            <button
                              onClick={() =>
                                setEditor({ kind: "user", item: u })
                              }
                              className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                              aria-label={t("edit")}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              disabled={u.id === currentUser?.id}
                              onClick={() => void deleteUser(u.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label={t("delete")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!adminLoading && filteredUsers.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                  <p>
                    {t("admin_users_range")
                      .replace("{from}", String(userPageStart + 1))
                      .replace(
                        "{to}",
                        String(
                          Math.min(
                            userPageStart + visibleUsers.length,
                            filteredUsers.length,
                          ),
                        ),
                      )
                      .replace("{total}", String(filteredUsers.length))}
                  </p>
                  {userPageCount > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={safeUserPage === 1}
                        onClick={() => setUserPage((page) => Math.max(1, page - 1))}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-40"
                      >
                        {t("previous")}
                      </button>
                      <span className="font-semibold text-slate-700">
                        {safeUserPage} / {userPageCount}
                      </span>
                      <button
                        type="button"
                        disabled={safeUserPage === userPageCount}
                        onClick={() =>
                          setUserPage((page) => Math.min(userPageCount, page + 1))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-40"
                      >
                        {t("next")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "courses" && (
          <div role="tabpanel">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-semibold text-slate-900">
                    {t("coursesManagement")}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {t("coursesManagementDesc")}
                  </p>
                </div>
                <button
                  onClick={() => setEditor({ kind: "course" })}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  <Plus className="h-4 w-4" />
                  {t("addCourse")}
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-[#fff9fb] sm:flex-row sm:items-center"
                  >
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {course.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {course.teacherName} ·{" "}
                        {course.enrolledCount.toLocaleString()}{" "}
                        {t("studentSingular")}
                      </p>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-1 sm:w-auto sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setContentCourseId(course.id)
                          setContentLessonId("")
                          setTab("lessons")
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        <Layers3 className="h-4 w-4" />
                        {t("content_crud")}
                      </button>
                      <button
                        onClick={() =>
                          setEditor({ kind: "course", item: course })
                        }
                        className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        aria-label={t("editCourse")}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => void toggleCourseStatus(course)}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          course.status === "published"
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {course.status === "published"
                          ? t("published")
                          : t("hidden")}
                      </button>
                      <button
                        onClick={() => void deleteCourse(course.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                        aria-label={t("delete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {courses.length === 0 && (
                  <div className="px-5 py-16 text-center text-sm text-slate-500">
                    {t("create_or_select_course")}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "reports" && (
          <div role="tabpanel" className="space-y-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow text-rose-600">{t("admin_live_report")}</p>
                <h2 className="mt-1 font-display text-xl font-bold text-slate-950">
                  {t("admin_learning_analysis")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t("admin_report_current_data")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void loadReports()}
                  disabled={reportLoading}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${reportLoading ? "animate-spin" : ""}`}
                  />
                  {t("admin_refresh")}
                </button>
                <button
                  type="button"
                  onClick={exportReport}
                  disabled={!report}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Download className="h-4 w-4" /> {t("admin_download_csv")}
                </button>
              </div>
            </div>

            {reportError && (
              <div
                className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                role="alert"
              >
                {reportError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ReportMetric
                icon={<GraduationCap className="h-5 w-5" />}
                label={t("admin_active_students")}
                value={report?.summary.activeStudents ?? 0}
                detail={t("admin_students_total").replace(
                  "{count}",
                  String(report?.summary.students ?? 0),
                )}
                tone="blue"
              />
              <ReportMetric
                icon={<TrendingUp className="h-5 w-5" />}
                label={t("admin_average_progress")}
                value={`${report?.summary.averageProgress ?? 0}%`}
                detail={t("admin_enrollments_count").replace(
                  "{count}",
                  String(report?.summary.enrollments ?? 0),
                )}
                tone="emerald"
              />
              <ReportMetric
                icon={<Target className="h-5 w-5" />}
                label={t("admin_quiz_result")}
                value={`${report?.summary.averageQuizScore ?? 0}%`}
                detail={t("admin_quiz_passed")
                  .replace(
                    "{passed}",
                    String(report?.summary.passedQuizAttempts ?? 0),
                  )
                  .replace(
                    "{total}",
                    String(report?.summary.quizAttempts ?? 0),
                  )}
                tone="violet"
              />
              <ReportMetric
                icon={<Settings className="h-5 w-5" />}
                label={t("accessibility")}
                value={report?.summary.accessibilityProfiles ?? 0}
                detail={t("admin_enabled_settings").replace(
                  "{count}",
                  String(report?.summary.enabledAccessibility ?? 0),
                )}
                tone="amber"
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                  <h3 className="font-display font-bold text-slate-900">
                    {t("admin_course_performance")}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {t("admin_course_performance_desc")}
                  </p>
                </div>
                <div className="divide-y divide-slate-100">
                  {report?.coursePerformance.map((item) => (
                    <div key={item.id} className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {t("admin_course_students_completed")
                              .replace("{students}", String(item.students))
                              .replace("{completed}", String(item.completed))}
                          </p>
                        </div>
                        <span className="font-display text-lg font-bold text-rose-700">
                          {item.averageProgress}%
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-600 to-violet-400"
                          style={{
                            width: `${Math.min(item.averageProgress, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {!reportLoading && report?.coursePerformance.length === 0 && (
                    <EmptyReport text={t("admin_no_enrollments")} />
                  )}
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                  <h3 className="font-display font-bold text-slate-900">
                    {t("admin_recent_learning")}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {t("admin_recent_learning_desc")}
                  </p>
                </div>
                <div className="divide-y divide-slate-100">
                  {report?.recentLearners.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
                        {item.student
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.student}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {item.course}
                        </p>
                      </div>
                      <span className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">
                        {item.progress}%
                      </span>
                    </div>
                  ))}
                  {!reportLoading && report?.recentLearners.length === 0 && (
                    <EmptyReport text={t("admin_no_learning_activity")} />
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {tab === "settings" && (
          <AdminSettings
            preferences={preferences}
            onSave={savePreferences}
            onReset={() => savePreferences(defaultAdminPreferences)}
          />
        )}

        {tab === "lessons" && (
          <ContentManager
            initialSection="structure"
            initialCourseId={contentCourseId}
            initialLessonId={contentLessonId}
            onCourseChange={setContentCourseId}
            onLessonChange={setContentLessonId}
            onSectionChange={(section) =>
              setTab(
                section === "media"
                  ? "videos"
                  : section === "quizzes"
                    ? "tests"
                    : "lessons",
              )
            }
          />
        )}
        {tab === "videos" && (
          <ContentManager
            initialSection="media"
            initialCourseId={contentCourseId}
            initialLessonId={contentLessonId}
            onCourseChange={setContentCourseId}
            onLessonChange={setContentLessonId}
            onSectionChange={(section) =>
              setTab(
                section === "media"
                  ? "videos"
                  : section === "quizzes"
                    ? "tests"
                    : "lessons",
              )
            }
          />
        )}
        {tab === "tests" && (
          <ContentManager
            initialSection="quizzes"
            initialCourseId={contentCourseId}
            initialLessonId={contentLessonId}
            onCourseChange={setContentCourseId}
            onLessonChange={setContentLessonId}
            onSectionChange={(section) =>
              setTab(
                section === "media"
                  ? "videos"
                  : section === "quizzes"
                    ? "tests"
                    : "lessons",
              )
            }
          />
        )}
      </main>
      {crudMessage && (
        <div
          role="status"
          className="fixed bottom-24 right-5 z-50 rounded-xl bg-slate-950 px-4 py-3 text-sm text-white shadow-xl"
        >
          {crudMessage}
          <button
            onClick={() => setCrudMessage("")}
            className="ml-3 text-slate-300"
          >
            ×
          </button>
        </div>
      )}
      {editor && (
        <AdminEditor
          editor={editor}
          onClose={() => setEditor(null)}
          onSave={saveEditor}
        />
      )}
      <AccessibilityPanel />
    </div>
  )
}

function AdminEditor({
  editor,
  onClose,
  onSave,
}: {
  editor: EditorState
  onClose: () => void
  onSave: (values: Record<string, string | boolean | File>) => Promise<void>
}) {
  const { t } = useLanguage()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const userParts =
    editor.kind === "user" ? editor.item?.name.split(" ") || [] : []
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    const data = new FormData(event.currentTarget)
    const values = Object.fromEntries(
      data.entries(),
    ) as Record<string, string | boolean | File>
    if (editor.kind === "user") values.active = data.get("active") === "on"
    try {
      await onSave(values)
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : t("saveFailed"),
      )
      setSaving(false)
    }
  }
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={editor.kind === "course" ? t("courseForm") : t("userForm")}
    >
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="eyebrow text-rose-600">
              {editor.item ? t("edit") : t("newRecord")}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-900">
              {editor.kind === "course" ? t("courseDetails") : t("userDetails")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-xl bg-slate-100 text-xl text-slate-500"
            aria-label={t("close")}
          >
            ×
          </button>
        </div>
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {editor.kind === "course" ? (
          <div className="space-y-4">
            <EditorField
              name="title"
              label={t("courseName")}
              defaultValue={editor.item?.title}
              required
            />
            <label className="block text-sm font-semibold text-slate-700">
              {t("description")}
              <textarea
                name="description"
                defaultValue={editor.item?.description}
                required
                minLength={10}
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-rose-500"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <EditorField
                name="category"
                label={t("category")}
                defaultValue={editor.item?.category || "IT"}
                required
              />
              <label className="block text-sm font-semibold text-slate-700">
                {t("level")}
                <select
                  name="level"
                  defaultValue={editor.item?.level || "boshlangich"}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal"
                >
                  <option value="boshlangich">{t("beginner")}</option>
                  <option value="orta">{t("intermediate")}</option>
                  <option value="yuqori">{t("advanced")}</option>
                </select>
              </label>
            </div>
            <label className="block rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/50 p-4 text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-rose-600" />
                {t("uploadThumbnail")}
              </span>
              <input
                name="thumbnailImage"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="mt-3 block w-full cursor-pointer text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-rose-600 file:px-4 file:py-2 file:font-semibold file:text-white"
              />
              <span className="mt-2 block text-xs font-normal text-slate-500">
                {t("uploadThumbnailDesc")}
              </span>
            </label>
            <EditorField
              name="thumbnail"
              label={t("orThumbnailUrl")}
              type="url"
              defaultValue={
                editor.item?.thumbnail?.startsWith("/api/")
                  ? ""
                  : editor.item?.thumbnail
              }
            />
            <label className="block text-sm font-semibold text-slate-700">
              {t("status")}
              <select
                name="status"
                defaultValue={editor.item?.status || "draft"}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal"
              >
                <option value="draft">{t("draft")}</option>
                <option value="published">{t("published")}</option>
                <option value="hidden">{t("hidden")}</option>
              </select>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <EditorField
                name="firstName"
                label={t("firstName")}
                defaultValue={userParts[0]}
                required
              />
              <EditorField
                name="lastName"
                label={t("lastName")}
                defaultValue={userParts.slice(1).join(" ")}
                required
              />
            </div>
            {!editor.item && (
              <>
                <EditorField name="email" label="Email" type="email" required />
                <EditorField
                  name="password"
                  label={t("temporaryPassword")}
                  type="password"
                  minLength={8}
                  required
                />
              </>
            )}
            <label className="block text-sm font-semibold text-slate-700">
              {t("role")}
              <select
                name="role"
                defaultValue={editor.item?.role || "student"}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal"
              >
                <option value="student">{t("roleStudent")}</option>
                <option value="admin">{t("roleAdmin")}</option>
              </select>
            </label>
            {editor.item && (
              <label className="flex items-center gap-3 rounded-xl bg-[#fff9fb] p-4 text-sm font-semibold text-slate-700">
                <input
                  name="active"
                  type="checkbox"
                  defaultChecked={editor.item.status === "active"}
                  className="h-5 w-5"
                />
                {t("accountActive")}
              </label>
            )}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600"
          >
            {t("cancel")}
          </button>
          <button
            disabled={saving}
            type="submit"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </form>
    </div>
  )
}

function EditorField({
  name,
  label,
  defaultValue,
  type = "text",
  required,
  minLength,
}: {
  name: string
  label: string
  defaultValue?: string
  type?: string
  required?: boolean
  minLength?: number
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        minLength={minLength}
        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-rose-500"
      />
    </label>
  )
}

function AdminNav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  const { t } = useLanguage()
  const items: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: t("overview"),
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: "courses",
      label: t("courses"),
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      id: "lessons",
      label: t("lessons"),
      icon: <FileText className="h-4 w-4" />,
    },
    { id: "videos", label: t("videos"), icon: <Video className="h-4 w-4" /> },
    { id: "users", label: t("students"), icon: <Users className="h-4 w-4" /> },
    {
      id: "tests",
      label: t("tests"),
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      id: "reports",
      label: t("statistics"),
      icon: <BarChart2 className="h-4 w-4" />,
    },
    {
      id: "settings",
      label: t("settings"),
      icon: <SlidersHorizontal className="h-4 w-4" />,
    },
  ]
  return (
    <nav className="space-y-1" aria-label={t("adminMenu")}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setTab(item.id)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
            tab === item.id
              ? "bg-rose-500 text-white shadow-lg shadow-rose-950/30"
              : "text-slate-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
  )
}

function QuickContentAction({
  icon,
  title,
  description,
  action,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-32 items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-lg"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition group-hover:bg-rose-600 group-hover:text-white">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-display font-bold text-slate-900">
          {title}
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-rose-700">
          {action} <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </span>
    </button>
  )
}

function UserSummary({
  label,
  value,
  tone = "blue",
}: {
  label: string
  value: number
  tone?: "blue" | "green" | "violet"
}) {
  const styles = {
    blue: "bg-rose-50 text-rose-700 border-rose-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
  }
  return (
    <div className={`rounded-2xl border p-5 ${styles[tone]}`}>
      <p className="text-xs font-semibold opacity-75">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
    </div>
  )
}

function HealthMetric({
  label,
  value,
  progress,
  detail,
  tone,
}: {
  label: string
  value: string
  progress: number
  detail: string
  tone: "emerald" | "blue" | "violet"
}) {
  const colors = {
    emerald: "bg-emerald-500",
    blue: "bg-rose-500",
    violet: "bg-violet-500",
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-950">
            {value}
          </p>
        </div>
        <span className={`mt-1 h-3 w-3 rounded-full ${colors[tone]}`} />
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${colors[tone]}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-400">{detail}</p>
    </div>
  )
}

function ReportMetric({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  detail: string
  tone: "blue" | "emerald" | "violet" | "amber"
}) {
  const styles = {
    blue: "bg-rose-50 text-rose-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[tone]}`}
      >
        {icon}
      </span>
      <p className="mt-4 text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-400">{detail}</p>
    </div>
  )
}

function EmptyReport({ text }: { text: string }) {
  return <p className="p-8 text-center text-sm text-slate-500">{text}</p>
}

function AdminSettings({
  preferences,
  onSave,
  onReset,
}: {
  preferences: AdminPreferences
  onSave: (preferences: AdminPreferences) => void
  onReset: () => void
}) {
  const { t } = useLanguage()
  const [draft, setDraft] = useState(preferences)

  useEffect(() => setDraft(preferences), [preferences])

  return (
    <div role="tabpanel" className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSave(draft)
        }}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <p className="eyebrow text-rose-600">{t("admin_panel_appearance")}</p>
          <h2 className="mt-1 font-display text-xl font-bold text-slate-950">
            {t("admin_workspace")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("admin_preferences_desc")}
          </p>
        </div>
        <div className="space-y-3 p-5 sm:p-6">
          <SettingToggle
            title={t("admin_compact_cards")}
            description={t("admin_compact_cards_desc")}
            checked={draft.compactCards}
            onChange={(checked) =>
              setDraft({ ...draft, compactCards: checked })
            }
          />
          <SettingToggle
            title={t("admin_show_activity")}
            description={t("admin_show_activity_desc")}
            checked={draft.showActivity}
            onChange={(checked) =>
              setDraft({ ...draft, showActivity: checked })
            }
          />
          <label className="block rounded-2xl border border-slate-200 p-4">
            <span className="font-semibold text-slate-900">
              {t("admin_rows_per_page")}
            </span>
            <span className="mt-1 block text-sm text-slate-500">
              {t("admin_rows_per_page_desc")}
            </span>
            <select
              value={draft.pageSize}
              onChange={(event) =>
                setDraft({ ...draft, pageSize: Number(event.target.value) })
              }
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-[#fff9fb] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => {
              setDraft(defaultAdminPreferences)
              onReset()
            }}
            className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600"
          >
            {t("reset")}
          </button>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white"
          >
            <Check className="h-4 w-4" /> {t("save")}
          </button>
        </div>
      </form>

      <aside className="rounded-2xl bg-[#4a294f] p-6 text-white shadow-xl shadow-slate-900/10">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500">
          <Shield className="h-5 w-5" />
        </span>
        <h3 className="mt-5 font-display text-xl font-bold">
          {t("admin_safe_settings")}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {t("admin_safe_settings_desc")}
        </p>
        <div className="mt-6 space-y-3 text-sm text-slate-300">
          {[
            t("admin_local_storage"),
            t("admin_apply_immediately"),
            t("admin_reset_anytime"),
          ].map(
            (item) => (
              <p key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" /> {item}
              </p>
            ),
          )}
        </div>
      </aside>
    </div>
  )
}

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-rose-200 hover:bg-rose-50/30">
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-slate-900">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-500">
          {description}
        </span>
      </span>
      <span className="relative mt-1 inline-flex shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-rose-600" />
        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  )
}

function ManagementPanel({
  tab,
}: {
  tab: "lessons" | "videos" | "tests" | "settings"
}) {
  const { t } = useLanguage()
  const content = {
    lessons: {
      title: t("lessonsManagement"),
      desc: t("lessonsManagementDesc"),
      action: t("addLesson"),
      icon: <FileText className="h-5 w-5" />,
    },
    videos: {
      title: t("videoLessons"),
      desc: t("videoLessonsDesc"),
      action: t("uploadVideo"),
      icon: <Video className="h-5 w-5" />,
    },
    tests: {
      title: t("tests"),
      desc: t("testsDesc"),
      action: t("createTest"),
      icon: <ClipboardList className="h-5 w-5" />,
    },
    settings: {
      title: t("platformSettings"),
      desc: t("platformSettingsDesc"),
      action: t("save"),
      icon: <Settings className="h-5 w-5" />,
    },
  }[tab]
  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      role="tabpanel"
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            {content.icon}
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              {content.title}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              {content.desc}
            </p>
          </div>
        </div>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
          <Plus className="h-4 w-4" />
          {content.action}
        </button>
      </div>
      {tab === "videos" ? (
        <div className="m-5 rounded-xl border-2 border-dashed border-rose-200 bg-rose-50/50 p-8 text-center">
          <Upload className="mx-auto h-8 w-8 text-rose-600" />
          <p className="mt-3 font-semibold text-slate-900">
            {t("dropVideoHere")}
          </p>
          <p className="mt-1 text-sm text-slate-500">{t("videoFormatDesc")}</p>
          <button className="mt-4 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
            {t("chooseFile")}
          </button>
        </div>
      ) : (
        <div className="p-5">
          <div className="rounded-xl bg-[#fff9fb] p-5 text-sm text-slate-600">
            {t("managementPanelDesc")}
          </div>
        </div>
      )}
    </section>
  )
}
