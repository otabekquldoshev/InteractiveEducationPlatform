import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import {
  ChevronDown,
  ChevronUp,
  Play,
  CheckCircle,
  FileText,
  Clock,
  Users,
  Star,
  BookOpen,
  ChevronLeft,
  Lock,
} from "lucide-react"
import { useCatalog } from "../contexts/CatalogContext"
import { useAuth } from "../contexts/AuthContext"
import { useEnrollment } from "../hooks/useEnrollment"
import Navbar from "../components/layout/Navbar"
import AccessibilityPanel from "../components/AccessibilityPanel"
import { useLanguage } from "../contexts/LanguageContext"
import { api } from "../lib/api"

export default function CoursePage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { courses, modules: catalogModules, reload } = useCatalog()
  const { getEnrollment, enroll } = useEnrollment(user?.id)
  const navigate = useNavigate()
  const [openModules, setOpenModules] = useState<Set<string>>(new Set(["m1"]))
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [ratingBusy, setRatingBusy] = useState(false)
  const [ratingMessage, setRatingMessage] = useState("")
  const { t } = useLanguage()

  const course = courses.find((c) => c.id === id)
  const modules = catalogModules.filter((m) => m.courseId === id)
  const enrollment = id ? getEnrollment(id) : undefined

  useEffect(() => {
    if (!id || !user) {
      setUserRating(0)
      return
    }
    api<{ rating: number }>(`/learning/courses/${id}/rating`)
      .then((result) => setUserRating(result.rating))
      .catch(() => setUserRating(0))
  }, [id, user])

  if (!course) {
    return (
      <div className="min-h-screen bg-[#fff9fb] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">{t("courseNotFound")}</p>
          <Link to="/courses" className="text-violet-600 font-semibold">
            {t("backToCourses")}
          </Link>
        </div>
      </div>
    )
  }

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  const handleEnroll = () => {
    if (!user) {
      navigate("/login")
      return
    }
    enroll(course.id)
  }

  const handleStartLesson = (lessonId: string, type: string) => {
    if (type === "quiz") {
      navigate(`/quiz/${lessonId}`)
    } else {
      navigate(`/lesson/${lessonId}`)
    }
  }

  const rateCourse = async (score: number) => {
    if (!user) {
      navigate("/login")
      return
    }
    if (!enrollment) {
      setRatingMessage(t("course_enroll_before_rating"))
      return
    }
    setRatingBusy(true)
    setRatingMessage("")
    try {
      await api(`/learning/courses/${course.id}/rating`, {
        method: "PUT",
        body: { score },
      })
      setUserRating(score)
      setRatingMessage(t("course_rating_saved"))
      await reload()
    } catch (error) {
      setRatingMessage(
        error instanceof Error ? error.message : t("course_rating_failed"),
      )
    } finally {
      setRatingBusy(false)
    }
  }

  const levelMap: Record<string, string> = {
    boshlangich: t("levelBeginner"),
    orta: t("levelIntermediate"),
    yuqori: t("levelAdvanced"),
  }

  return (
    <div className="min-h-screen bg-[#fff9fb]">
      <Navbar />
      <main>
        {/* Hero */}
        <div className="bg-slate-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              to="/courses"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {t("allSubjects")}
            </Link>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-violet-900 text-violet-300 px-2.5 py-1 rounded-full font-medium">
                    {course.category}
                  </span>
                  <span className="text-xs text-slate-400">
                    {levelMap[course.level] || course.level}
                  </span>
                </div>
                <h1 className="font-display font-bold text-3xl mb-4">
                  {course.title}
                </h1>
                <p className="text-slate-300 leading-relaxed mb-6">
                  {course.description}
                </p>
                <div className="flex items-center gap-5 text-sm text-slate-300 flex-wrap mb-6">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-violet-400" />
                    {course.modulesCount} {t("module")} · {course.lessonsCount}{" "}
                    {t("lesson")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-violet-400" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-violet-400" />
                    {course.enrolledCount.toLocaleString()} {t("students")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    {course.rating}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  {t("author")}{" "}
                  <span className="text-white font-medium">
                    {course.teacherName}
                  </span>
                </p>
                <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">
                    {t("course_rate_title")}
                  </p>
                  <div
                    className="mt-2 flex items-center gap-1"
                    onMouseLeave={() => setHoverRating(0)}
                    role="group"
                    aria-label={t("course_rate_aria")}
                  >
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        disabled={ratingBusy}
                        onMouseEnter={() => setHoverRating(score)}
                        onFocus={() => setHoverRating(score)}
                        onBlur={() => setHoverRating(0)}
                        onClick={() => void rateCourse(score)}
                        className="rounded-md p-1 disabled:opacity-50"
                        aria-label={`${score} ${t("star_unit")}`}
                        aria-pressed={userRating === score}
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            score <= (hoverRating || userRating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-slate-500"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs text-slate-400">
                      {course.rating || 0} · {course.ratingsCount || 0}{" "}
                      {t("rating_unit")}
                    </span>
                  </div>
                  {ratingMessage && (
                    <p className="mt-2 text-xs text-violet-300" role="status">
                      {ratingMessage}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full rounded-2xl object-cover aspect-video shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Module list */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-xl text-slate-900">
                  {t("courseContent")}
                </h2>
                {enrollment && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-24 h-1.5 bg-slate-200 rounded-full">
                      <div
                        className="h-1.5 bg-violet-500 rounded-full"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                    <span>{enrollment.progress}%</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {modules.map((module) => {
                  const isOpen = openModules.has(module.id)
                  const completedCount = module.lessons.filter((l) =>
                    enrollment?.completedLessons.includes(l.id),
                  ).length
                  return (
                    <div
                      key={module.id}
                      className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-[#fff9fb] transition-colors"
                        aria-expanded={isOpen}
                      >
                        <div>
                          <h3 className="font-display font-semibold text-slate-900">
                            {module.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {module.lessons.length} {t("lesson")} ·{" "}
                            {completedCount}/{module.lessons.length}{" "}
                            {t("completed")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {completedCount === module.lessons.length &&
                            module.lessons.length > 0 && (
                              <CheckCircle
                                className="w-5 h-5 text-green-500"
                                aria-label={t("moduleCompleted")}
                              />
                            )}
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <ul className="border-t border-slate-100">
                          {module.lessons.map((lesson, i) => {
                            const completed =
                              enrollment?.completedLessons.includes(lesson.id)
                            const isLocked = !enrollment && i > 0
                            const isTestLocked = !completed
                            const typeIcon =
                              lesson.type === "quiz"
                                ? "📝"
                                : lesson.type === "text"
                                  ? "📄"
                                  : "▶"
                            return (
                              <li key={lesson.id}>
                                <button
                                  onClick={() =>
                                    !isLocked &&
                                    handleStartLesson(lesson.id, lesson.type)
                                  }
                                  disabled={isLocked}
                                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm transition-colors ${
                                    isLocked
                                      ? "text-slate-300 cursor-not-allowed"
                                      : completed
                                        ? "text-violet-700 hover:bg-violet-50"
                                        : "text-slate-700 hover:bg-[#fff9fb]"
                                  }`}
                                  aria-label={`${lesson.title}${
                                    completed ? t("completedSuffix") : ""
                                  }${isLocked ? t("lockedSuffix") : ""}`}
                                >
                                  <span
                                    className="w-6 text-center text-sm"
                                    aria-hidden="true"
                                  >
                                    {completed ? (
                                      <CheckCircle className="w-4 h-4 text-violet-500 inline" />
                                    ) : isLocked ? (
                                      <Lock className="w-4 h-4 text-slate-300 inline" />
                                    ) : (
                                      typeIcon
                                    )}
                                  </span>
                                  <span className="flex-1 text-left">
                                    {lesson.title}
                                  </span>
                                  {lesson.duration && (
                                    <span className="text-xs text-slate-400">
                                      {lesson.duration}
                                    </span>
                                  )}
                                </button>
                                {lesson.quiz && lesson.type !== "quiz" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      !isTestLocked &&
                                      handleStartLesson(lesson.id, "quiz")
                                    }
                                    disabled={isTestLocked}
                                    className={`flex w-full items-center gap-3 border-t border-violet-100 bg-violet-50/60 px-5 py-3 pl-14 text-sm font-semibold transition-colors ${
                                      isTestLocked
                                        ? "cursor-not-allowed text-slate-300"
                                        : "text-violet-700 hover:bg-violet-100"
                                    }`}
                                  >
                                    <span aria-hidden="true">📝</span>
                                    <span className="flex-1 text-left">
                                      {lesson.quiz.title}
                                    </span>
                                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-600">
                                      {isTestLocked
                                        ? "Video tugagach"
                                        : "Test"}
                                    </span>
                                  </button>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <div className="bg-white rounded-2xl border border-slate-100 p-6 sticky top-20">
                {enrollment ? (
                  <>
                    <div className="text-center mb-5">
                      <div className="text-3xl font-display font-bold text-violet-600 mb-1">
                        {enrollment.progress}%
                      </div>
                      <p className="text-sm text-slate-500">{t("completed")}</p>
                      <div className="h-2 bg-slate-100 rounded-full mt-3">
                        <div
                          className="h-2 bg-violet-500 rounded-full"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                    </div>
                    <Link
                      to={`/lesson/${enrollment.lastLessonId || modules[0]?.lessons[0]?.id}`}
                      className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-violet-700 transition-colors mb-4"
                    >
                      <Play className="w-4 h-4" />
                      {t("continueCourse")}
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-display font-bold text-slate-900 mb-1 text-center">
                      {t("freeCourse")}
                    </p>
                    <p className="text-sm text-slate-500 text-center mb-5">
                      {t("enrollForFullAccess")}
                    </p>
                    <button
                      onClick={handleEnroll}
                      className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-violet-700 transition-colors mb-4"
                    >
                      {t("enrollCourse")}
                    </button>
                  </>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    {course.lessonsCount} {t("lessonsCountText")}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {course.duration} {t("totalTime")}
                  </div>
                  {course.hasSubtitles && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-slate-400">CC</span>
                      {t("multiLanguageSubtitles")}
                    </div>
                  )}
                  {course.hasTranscript && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <FileText className="w-4 h-4 text-slate-400" />
                      {t("interactiveTranscript")}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex gap-1.5 flex-wrap">
                    {course.hasSubtitles && (
                      <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-lg">
                        {t("ccSubtitles")}
                      </span>
                    )}
                    {course.hasAudio && (
                      <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-lg">
                        {t("audio")}
                      </span>
                    )}
                    {course.hasTranscript && (
                      <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-lg">
                        {t("transcript")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <AccessibilityPanel />
    </div>
  )
}
