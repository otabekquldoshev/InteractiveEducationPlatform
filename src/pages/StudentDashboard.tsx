import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  BookOpen,
  CheckCircle,
  Trophy,
  Play,
  BarChart2,
  ChevronRight,
  Download,
  TrendingUp,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useAuth } from "../contexts/AuthContext"
import { useEnrollment } from "../hooks/useEnrollment"
import { useCatalog } from "../contexts/CatalogContext"
import Navbar from "../components/layout/Navbar"
import AccessibilityPanel from "../components/AccessibilityPanel"
import { useLanguage } from "../contexts/LanguageContext"
import CertificatePreview from "../components/certificate/CertificatePreview"
import { api } from "../lib/api"
import type { Certificate } from "../types"

type DashboardStats = {
  averageQuizScore: number
  quizResultsCount: number
  weeklyActivity: Array<{ date: string; activities: number }>
  recentActivity: Array<{
    id: string
    type: "lesson" | "quiz"
    title: string
    context: string
    score?: number
    createdAt: string
  }>
}

const emptyDashboardStats: DashboardStats = {
  averageQuizScore: 0,
  quizResultsCount: 0,
  weeklyActivity: [],
  recentActivity: [],
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const { courses, modules } = useCatalog()
  const { t, language } = useLanguage()
  const { enrollments, getEnrollment } = useEnrollment(user?.id)
  const [dashboardStats, setDashboardStats] = useState(emptyDashboardStats)
  const [myCertificates, setMyCertificates] = useState<Certificate[]>([])
  const [certificate, setCertificate] = useState<{
    fullName: string
    courseName: string
    completedAt: string
    score: number
    verificationCode?: string
  } | null>(null)

  useEffect(() => {
    if (!user?.id) return
    let active = true
    Promise.all([
      api<DashboardStats>("/learning/dashboard-stats"),
      api<{ certificates: Certificate[] }>("/learning/certificates"),
    ])
      .then(([stats, certificateResult]) => {
        if (active) {
          setDashboardStats(stats)
          setMyCertificates(certificateResult.certificates)
        }
      })
      .catch(() => {
        if (active) {
          setDashboardStats(emptyDashboardStats)
          setMyCertificates([])
        }
      })
    return () => {
      active = false
    }
  }, [user?.id])

  const completedLessons = enrollments.reduce(
    (sum, e) => sum + e.completedLessons.length,
    0,
  )
  const enrolledCourses = courses.filter((c) =>
    enrollments.find((e) => e.courseId === c.id),
  )

  // Find the most recently active enrollment
  const lastEnrollment = [...enrollments].sort(
    (a, b) =>
      new Date(b.lastActivityAt).getTime() -
      new Date(a.lastActivityAt).getTime(),
  )[0]
  const lastCourse = lastEnrollment
    ? courses.find((c) => c.id === lastEnrollment.courseId)
    : null
  const lastLesson = lastEnrollment?.lastLessonId
    ? modules
        .flatMap((m) => m.lessons)
        .find((l) => l.id === lastEnrollment.lastLessonId)
    : null

  const locale =
    language === "ru"
      ? "ru-RU"
      : language === "en"
        ? "en-US"
        : language === "ko"
          ? "ko-KR"
          : language === "zh"
            ? "zh-CN"
            : "uz-UZ"
  const activityData = useMemo(
    () =>
      dashboardStats.weeklyActivity.map((item) => ({
        ...item,
        day: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
          new Date(`${item.date}T12:00:00`),
        ),
      })),
    [dashboardStats.weeklyActivity, locale],
  )
  const formatActivityTime = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value))

  return (
    <div className="min-h-screen page-shell mobile-safe">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-violet-700 mb-2">{t("studentArea")}</p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-900">
              {t("welcome")}, {user?.firstName}! 👋
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              {t("studentMotivationalQuote")}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-sm text-violet-900">
            <Link
              to="/certificates"
              className="inline-flex items-center gap-2 font-bold text-violet-700 hover:text-violet-900"
            >
              <Trophy className="h-4 w-4" /> Mening sertifikatlarim
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          role="list"
          aria-label={t("ariaStudyStats")}
        >
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            label={t("courses")}
            value={enrollments.length}
            sub={t("studying")}
            color="teal"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label={t("lessons")}
            value={completedLessons}
            sub={t("completed")}
            color="green"
          />
          <StatCard
            icon={<BarChart2 className="w-5 h-5" />}
            label={t("averageScore")}
            value={`${dashboardStats.averageQuizScore}%`}
            sub={
              dashboardStats.quizResultsCount
                ? `${dashboardStats.quizResultsCount} ta test natijasi`
                : "Hali test ishlanmagan"
            }
            color="amber"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label={t("certificates")}
            value={myCertificates.length}
            sub={t("obtained")}
            color="purple"
          />
        </div>

        <section className="mb-8" aria-labelledby="my-certificates-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-violet-600">Yutuqlar</p>
              <h2
                id="my-certificates-heading"
                className="mt-1 font-display text-xl font-bold text-slate-900"
              >
                Mening sertifikatlarim
              </h2>
            </div>
            {myCertificates.length > 0 && (
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                {myCertificates.length} ta sertifikat
              </span>
            )}
          </div>

          {myCertificates.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {myCertificates.map((item) => (
                <article
                  key={item.id}
                  className="group relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-white via-amber-50/50 to-violet-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-300/20" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20">
                        <Trophy className="h-5 w-5" />
                      </span>
                      <span className="rounded-full border border-violet-100 bg-white/80 px-2.5 py-1 text-xs font-bold text-violet-700">
                        {item.score}%
                      </span>
                    </div>
                    <h3 className="mt-4 line-clamp-2 min-h-12 font-display text-base font-bold text-slate-900">
                      {item.courseName}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500">
                      Berilgan sana: {formatActivityTime(item.issuedAt)}
                    </p>
                    <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-wide text-slate-400">
                      ID: {item.verificationCode}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setCertificate({
                          fullName: item.recipientName,
                          courseName: item.courseName,
                          completedAt: item.issuedAt,
                          score: item.score,
                          verificationCode: item.verificationCode,
                        })
                      }
                      className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-violet-700"
                    >
                      <Download className="h-4 w-4" />
                      Ko‘rish va yuklab olish
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
              <Trophy className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">
                Hozircha sertifikat mavjud emas
              </p>
              <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-slate-500">
                Kursdagi barcha darslarni yakunlang va nashr qilingan testlardan
                muvaffaqiyatli o‘ting. Sertifikat avtomatik ravishda shu yerda
                paydo bo‘ladi.
              </p>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: continue + courses */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue card */}
            {lastCourse && lastEnrollment && (
              <div className="bg-slate-900 rounded-2xl p-5 sm:p-7 text-white relative overflow-hidden shadow-xl shadow-slate-900/15">
                <div
                  className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(13,148,136,0.3),transparent)]"
                  aria-hidden="true"
                />
                <div className="relative">
                  <p className="eyebrow text-violet-300 mb-2">{t("continue")}</p>
                  <h2 className="font-display font-bold text-2xl mb-1">
                    {lastCourse.title}
                  </h2>
                  {lastLesson && (
                    <p className="text-slate-400 text-sm mb-4">
                      {lastLesson.title}
                    </p>
                  )}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>{t("progress")}</span>
                      <span>{lastEnrollment.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full">
                      <div
                        className="h-1.5 bg-violet-400 rounded-full progress-bar"
                        style={{ width: `${lastEnrollment.progress}%` }}
                        role="progressbar"
                        aria-valuenow={lastEnrollment.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${lastEnrollment.progress}% ${t("completedLower")}`}
                      />
                    </div>
                  </div>
                  <Link
                    to={`/courses/${lastCourse.id}`}
                    className="inline-flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-500 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    {t("continue")}
                  </Link>
                </div>
              </div>
            )}

            {/* Enrolled courses */}
            <div>
              <h2 className="font-display font-semibold text-lg text-slate-900 mb-4">
                {t("myCourses")}
              </h2>
              {enrolledCourses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm mb-4">
                    {t("noCoursesEnrolled")}
                  </p>
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 text-violet-600 font-semibold text-sm hover:text-violet-700"
                  >
                    {t("viewCourses")}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolledCourses.map((course) => {
                    const enrollment = getEnrollment(course.id)
                    return (
                      <div
                        key={course.id}
                        className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 hover:border-violet-200 transition-colors"
                      >
                        <img
                          src={course.thumbnail}
                          alt=""
                          className="w-16 h-16 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-sm truncate">
                            {course.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {course.teacherName}
                          </p>
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>
                                {enrollment?.completedLessons.length || 0} /{" "}
                                {course.lessonsCount} {t("lessonLower")}
                              </span>
                              <span>{enrollment?.progress || 0}%</span>
                            </div>
                            <div className="h-1 bg-slate-100 rounded-full">
                              <div
                                className="h-1 bg-violet-500 rounded-full"
                                style={{
                                  width: `${enrollment?.progress || 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {enrollment?.certificateEligible &&
                            enrollment.certificateScore !== undefined &&
                            user && (
                            <button
                              type="button"
                              onClick={() =>
                                setCertificate({
                                  fullName: `${user.firstName} ${user.lastName}`,
                                  courseName: course.title,
                                  completedAt:
                                    enrollment.completedAt ||
                                    enrollment.lastActivityAt,
                                  score: enrollment.certificateScore!,
                                  verificationCode:
                                    enrollment.certificateVerificationCode,
                                })
                              }
                              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-50 px-3 text-xs font-bold text-violet-700 hover:bg-violet-100"
                            >
                              <Trophy className="h-4 w-4" />
                              Sertifikat
                            </button>
                          )}
                          <Link
                            to={`/courses/${course.id}`}
                            className="rounded-lg p-2 text-violet-600 transition-colors hover:bg-violet-50"
                            aria-label={`${course.title} ${t("continueCourse")}`}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: chart + activity */}
          <div className="space-y-6">
            {/* Activity chart */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-violet-600" />
                <h2 className="font-display font-semibold text-slate-900">
                  {t("weeklyActivity")}
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart
                  data={activityData}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#0D9488"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: "12px",
                      borderRadius: "8px",
                      border: "1px solid #E2E8F0",
                    }}
                    formatter={(v) => [
                      `${v} ta`,
                      "Faoliyat",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="activities"
                    stroke="#0D9488"
                    strokeWidth={2}
                    fill="url(#tealGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h2 className="font-display font-semibold text-slate-900 mb-4">
                {t("recentActivity")}
              </h2>
              <ul className="space-y-3">
                {dashboardStats.recentActivity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 text-sm">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        item.type === "quiz"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                      aria-hidden="true"
                    >
                      {item.type === "quiz" ? (
                        <BarChart2 className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </span>
                    <div>
                      <p className="text-slate-700">
                        {item.type === "quiz"
                          ? `${item.title} — ${item.score}%`
                          : `${item.title} darsi yakunlandi`}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.context}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatActivityTime(item.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
                {dashboardStats.recentActivity.length === 0 && (
                  <li className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                    Hozircha faoliyat mavjud emas.
                  </li>
                )}
              </ul>
            </div>

            {/* Recommended */}
            <div className="bg-violet-50 rounded-2xl border border-violet-100 p-5">
              <h2 className="font-display font-semibold text-slate-900 mb-3">
                {t("recommended")}
              </h2>
              {courses
                .filter((c) => !enrollments.find((e) => e.courseId === c.id))
                .slice(0, 2)
                .map((course) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="flex items-center gap-3 mb-3 last:mb-0 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={course.thumbnail}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {course.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {course.lessonsCount} {t("lessonLower")}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>
      {certificate && (
        <CertificatePreview
          fullName={certificate.fullName}
          courseName={certificate.courseName}
          completedAt={certificate.completedAt}
          score={certificate.score}
          verificationCode={certificate.verificationCode}
          onClose={() => setCertificate(null)}
        />
      )}
      <AccessibilityPanel />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  color: "teal" | "green" | "amber" | "purple"
}) {
  const colors = {
    teal: "bg-violet-50 text-violet-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  }
  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
      role="listitem"
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}
      >
        {icon}
      </div>
      <div className="font-display font-bold text-2xl text-slate-900">
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
      <div className="text-xs font-medium text-slate-400 mt-1">{label}</div>
    </div>
  )
}
