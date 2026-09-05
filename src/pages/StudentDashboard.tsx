import { Link } from "react-router-dom";
import { BookOpen, CheckCircle, Trophy, Clock, Play, BarChart2, ChevronRight, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { useEnrollment } from "../hooks/useEnrollment";
import { DEMO_COURSES, DEMO_MODULES } from "../data/mockData";
import Navbar from "../components/layout/Navbar";
import AccessibilityPanel from "../components/AccessibilityPanel";
import { useLanguage } from "../contexts/LanguageContext";

const activityData = [
  { day: "Dush", minutes: 45 },
  { day: "Sesh", minutes: 20 },
  { day: "Chor", minutes: 60 },
  { day: "Pay", minutes: 30 },
  { day: "Jum", minutes: 75 },
  { day: "Shan", minutes: 15 },
  { day: "Yak", minutes: 50 },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { enrollments, getEnrollment } = useEnrollment(user?.id);

  const totalLessons = DEMO_MODULES.flatMap((m) => m.lessons).length;
  const completedLessons = enrollments.reduce((sum, e) => sum + e.completedLessons.length, 0);
  const certificates = enrollments.filter((e) => e.progress === 100).length;

  const enrolledCourses = DEMO_COURSES.filter((c) =>
    enrollments.find((e) => e.courseId === c.id)
  );

  // Find the most recently active enrollment
  const lastEnrollment = [...enrollments].sort(
    (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
  )[0];
  const lastCourse = lastEnrollment ? DEMO_COURSES.find((c) => c.id === lastEnrollment.courseId) : null;
  const lastLesson = lastEnrollment?.lastLessonId
    ? DEMO_MODULES.flatMap((m) => m.lessons).find((l) => l.id === lastEnrollment.lastLessonId)
    : null;

  return (
    <div className="min-h-screen page-shell mobile-safe">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="eyebrow text-teal-700 mb-2">{t("studentArea")}</p><h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-900">
            {t("welcome")}, {user?.firstName}! 👋
          </h1><p className="text-slate-500 text-sm mt-2">Bugun kichik qadam — ertaga katta natija.</p></div>
          <div className="flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-teal-900"><span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />{t("daily")}</div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" role="list" aria-label="O'quv statistikasi">
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
            value="80%"
            sub="test natijalari"
            color="amber"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label={t("certificates")}
            value={certificates}
            sub="olingan"
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: continue + courses */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue card */}
            {lastCourse && lastEnrollment && (
              <div className="bg-slate-900 rounded-2xl p-5 sm:p-7 text-white relative overflow-hidden shadow-xl shadow-slate-900/15">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(13,148,136,0.3),transparent)]" aria-hidden="true" />
                <div className="relative">
                  <p className="eyebrow text-teal-300 mb-2">{t("continue")}</p>
                  <h2 className="font-display font-bold text-2xl mb-1">{lastCourse.title}</h2>
                  {lastLesson && (
                    <p className="text-slate-400 text-sm mb-4">{lastLesson.title}</p>
                  )}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Progress</span>
                      <span>{lastEnrollment.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full">
                      <div
                        className="h-1.5 bg-teal-400 rounded-full progress-bar"
                        style={{ width: `${lastEnrollment.progress}%` }}
                        role="progressbar"
                        aria-valuenow={lastEnrollment.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${lastEnrollment.progress}% bajarildi`}
                      />
                    </div>
                  </div>
                  <Link
                    to={`/courses/${lastCourse.id}`}
                    className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-500 transition-colors"
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
                  <p className="text-slate-500 text-sm mb-4">Hali hech qanday kursga yozilmagansiz</p>
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 text-teal-600 font-semibold text-sm hover:text-teal-700"
                  >
                    Kurslarni ko'rish
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolledCourses.map((course) => {
                    const enrollment = getEnrollment(course.id);
                    return (
                      <div key={course.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 hover:border-teal-200 transition-colors">
                        <img
                          src={course.thumbnail}
                          alt=""
                          className="w-16 h-16 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-sm truncate">{course.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{course.teacherName}</p>
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>{enrollment?.completedLessons.length || 0} / {course.lessonsCount} dars</span>
                              <span>{enrollment?.progress || 0}%</span>
                            </div>
                            <div className="h-1 bg-slate-100 rounded-full">
                              <div
                                className="h-1 bg-teal-500 rounded-full"
                                style={{ width: `${enrollment?.progress || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <Link
                          to={`/courses/${course.id}`}
                          className="shrink-0 p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          aria-label={`${course.title} kursini davom ettirish`}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    );
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
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <h2 className="font-display font-semibold text-slate-900">Haftalik faollik</h2>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={activityData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                  <Tooltip
                    contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}
                    formatter={(v) => [`${v} daqiqa`, "Vaqt"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="#0D9488"
                    strokeWidth={2}
                    fill="url(#tealGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h2 className="font-display font-semibold text-slate-900 mb-4">Oxirgi faoliyat</h2>
              <ul className="space-y-3">
                {[
                  { icon: "▶️", text: "Excel asoslari darsi ko'rildi", time: "2 soat oldin" },
                  { icon: "📝", text: "Windows test topshirildi — 8/10", time: "Kecha" },
                  { icon: "📚", text: "Kompyuter savodxonligiga yozildingiz", time: "3 kun oldin" },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-lg shrink-0" aria-hidden="true">{item.icon}</span>
                    <div>
                      <p className="text-slate-700">{item.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended */}
            <div className="bg-teal-50 rounded-2xl border border-teal-100 p-5">
              <h2 className="font-display font-semibold text-slate-900 mb-3">Tavsiya etilgan</h2>
              {DEMO_COURSES.filter((c) => !enrollments.find((e) => e.courseId === c.id)).slice(0, 2).map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="flex items-center gap-3 mb-3 last:mb-0 hover:opacity-80 transition-opacity"
                >
                  <img src={course.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{course.title}</p>
                    <p className="text-xs text-slate-500">{course.lessonsCount} dars</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <AccessibilityPanel />
    </div>
  );
}

function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode; label: string; value: string | number; sub: string;
  color: "teal" | "green" | "amber" | "purple";
}) {
  const colors = {
    teal: "bg-teal-50 text-teal-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm" role="listitem">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <div className="font-display font-bold text-2xl text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
      <div className="text-xs font-medium text-slate-400 mt-1">{label}</div>
    </div>
  );
}
