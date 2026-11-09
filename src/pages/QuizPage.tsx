import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  Trophy,
  BookOpen,
} from "lucide-react"
import { useCatalog } from "../contexts/CatalogContext"
import type { Quiz } from "../types"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/layout/Navbar"
import AccessibilityPanel from "../components/AccessibilityPanel"
import { api } from "../lib/api"
import { useLanguage } from "../contexts/LanguageContext"
import { useEnrollment } from "../hooks/useEnrollment"
import CertificatePreview from "../components/certificate/CertificatePreview"

type Phase = "quiz" | "result"
type SubmissionResult = {
  score: number
  total: number
  percentage: number
  passed: boolean
  feedback: Array<{
    questionId: string
    correct: boolean
    correctAnswers: string[]
    explanation?: string
  }>
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { courses, modules } = useCatalog()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { completeLesson } = useEnrollment(user?.id)

  const allLessons = modules.flatMap((m) => m.lessons)
  const lesson = allLessons.find((l) => l.id === id)
  const module = lesson
    ? modules.find((m) => m.id === lesson.moduleId)
    : undefined
  const course = module
    ? courses.find((c) => c.id === module.courseId)
    : undefined

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [quizLoading, setQuizLoading] = useState(true)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [phase, setPhase] = useState<Phase>("quiz")
  const [showExplanation, setShowExplanation] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [result, setResult] = useState<SubmissionResult | null>(null)
  const [certificate, setCertificate] = useState<{
    fullName: string
    courseName: string
    completedAt: string
    score: number
    verificationCode?: string
  } | null>(null)

  useEffect(() => {
    const quizId =
      lesson?.quiz?.id ||
      lesson?.quizzes?.find((item) => item.interruptAtSeconds == null)?.id
    if (!quizId) {
      if (lesson) setQuizLoading(false)
      return
    }
    setQuizLoading(true)
    api<{ quiz: Quiz }>(`/quizzes/${quizId}`)
      .then(({ quiz: result }) =>
        setQuiz({
          ...result,
          moduleId: module?.id || "",
          questions: result.questions.map((question) => ({
            ...question,
            type: question.type
              .toLowerCase()
              .replace("true_false", "truefalse") as typeof question.type,
            correctAnswers: question.correctAnswers || [],
          })),
        }),
      )
      .catch((error) =>
        setSubmitError(
          error instanceof Error ? error.message : t("failedToLoadQuiz"),
        ),
      )
      .finally(() => setQuizLoading(false))
  }, [lesson, module?.id, t])

  if (quizLoading || !lesson) {
    return (
      <div className="min-h-screen bg-[#fff9fb] flex items-center justify-center">
        <p className="text-slate-500">{t("loadingQuiz")}</p>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-[#fff9fb] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">{t("quizNotFound")}</p>
          <Link to="/courses" className="text-violet-600 font-semibold">
            {t("backToCourses")}
          </Link>
        </div>
      </div>
    )
  }

  const question = quiz.questions[currentQ]
  const totalQ = quiz.questions.length
  const currentAnswers = answers[question.id] || []

  const selectAnswer = (optionId: string) => {
    if (phase === "result") return
    setSubmitError("")
    if (question.type === "single" || question.type === "truefalse") {
      setAnswers((a) => ({ ...a, [question.id]: [optionId] }))
    } else {
      const current = answers[question.id] || []
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      setAnswers((a) => ({ ...a, [question.id]: next }))
    }
  }

  const handleNext = async () => {
    setShowExplanation(false)
    if (currentAnswers.length === 0) {
      setSubmitError("Davom etishdan oldin javob variantini tanlang.")
      return
    }
    setSubmitError("")
    if (currentQ < totalQ - 1) setCurrentQ((q) => q + 1)
    else {
      setSubmitting(true)
      try {
        const response = await api<{ result: SubmissionResult }>(
          `/quizzes/${quiz.id}/submit`,
          { method: "POST", body: { answers } },
        )
        setQuiz((current) =>
          current
            ? {
                ...current,
                questions: current.questions.map((item) => {
                  const feedback = response.result.feedback.find(
                    (entry) => entry.questionId === item.id,
                  )
                  return feedback
                    ? {
                        ...item,
                        correctAnswers: feedback.correctAnswers,
                        explanation: feedback.explanation,
                      }
                    : item
                }),
              }
            : current,
        )
        setResult(response.result)
        setPhase("result")
        if (
          response.result.passed &&
          user &&
          course &&
          lesson &&
          (lesson.type === "quiz" || quiz.interruptAtSeconds == null)
        ) {
          const completed = await completeLesson(
            course.id,
            lesson.id,
            module?.lessons.length || 0,
          )
          if (
            completed?.progress === 100 &&
            completed.certificateEligible &&
            completed.certificateScore !== undefined
          ) {
            setCertificate({
              fullName: `${user.firstName} ${user.lastName}`,
              courseName: course.title,
              completedAt: completed.completedAt || completed.lastActivityAt,
              score: completed.certificateScore,
              verificationCode: completed.certificateVerificationCode,
            })
          }
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : t("failedToSaveResult"),
        )
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handlePrev = () => {
    setShowExplanation(false)
    if (currentQ > 0) setCurrentQ((q) => q - 1)
  }

  const reset = () => {
    setAnswers({})
    setCurrentQ(0)
    setPhase("quiz")
    setShowExplanation(false)
    setSubmitError("")
    setResult(null)
  }

  const getOptionState = (optId: string) => {
    const isSelected = currentAnswers.includes(optId)
    const isCorrectOpt = question.correctAnswers.includes(optId)
    if (showExplanation) {
      if (isCorrectOpt) return "correct"
      if (isSelected && !isCorrectOpt) return "wrong"
    }
    return isSelected ? "selected" : "default"
  }

  const optionStyles = {
    default:
      "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/30 text-slate-700",
    selected: "border-violet-500 bg-violet-50 text-violet-800",
    correct: "border-green-500 bg-green-50 text-green-800",
    wrong: "border-red-400 bg-red-50 text-red-700",
  }

  return (
    <div className="min-h-screen bg-[#fff9fb]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link
          to={course ? `/courses/${course.id}` : "/courses"}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-violet-600 text-sm mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {quiz.title}
        </Link>

        {phase === "quiz" ? (
          <div>
            {submitError && (
              <div
                role="alert"
                className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {submitError}
              </div>
            )}
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-slate-500 mb-2">
                <span>
                  {t("question")} {currentQ + 1} / {totalQ}
                </span>
                <span>
                  {Math.round((currentQ / totalQ) * 100)}% {t("completed")}
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full">
                <div
                  className="h-2 bg-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${(currentQ / totalQ) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={currentQ + 1}
                  aria-valuemin={1}
                  aria-valuemax={totalQ}
                />
              </div>
            </div>

            {/* Question card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full font-medium">
                  {question.type === "multiple"
                    ? t("multipleCorrectAnswers")
                    : question.type === "truefalse"
                      ? t("trueFalse")
                      : t("singleAnswer")}
                </span>
              </div>
              <h2 className="font-display font-semibold text-xl text-slate-900 leading-relaxed mb-6">
                {question.text}
              </h2>

              <fieldset>
                <legend className="sr-only">{t("selectAnswerOptions")}</legend>
                <div className="space-y-3" role="group">
                  {question.options.map((opt) => {
                    const state = getOptionState(opt.id)
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${optionStyles[state]}`}
                        aria-checked={currentAnswers.includes(opt.id)}
                      >
                        <input
                          type={
                            question.type === "multiple" ? "checkbox" : "radio"
                          }
                          name={`q-${question.id}`}
                          value={opt.id}
                          checked={currentAnswers.includes(opt.id)}
                          onChange={() => selectAnswer(opt.id)}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            currentAnswers.includes(opt.id)
                              ? state === "wrong"
                                ? "border-red-500 bg-red-500"
                                : "border-violet-500 bg-violet-500"
                              : "border-slate-300"
                          }`}
                        >
                          {state === "correct" && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                          {state === "wrong" && (
                            <XCircle className="w-3 h-3 text-white" />
                          )}
                          {state === "selected" && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{opt.text}</span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              {/* Explanation */}
              {showExplanation && question.explanation && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  {question.explanation}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handlePrev}
                disabled={currentQ === 0}
                className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-[#fff9fb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {t("previous")}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleNext}
                  type="button"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting
                    ? t("saving")
                    : currentQ === totalQ - 1
                      ? t("finish")
                      : t("next")}
                  {currentQ < totalQ - 1 && (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Result screen */
          <div className="text-center">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
                result?.passed ? "bg-green-50" : "bg-red-50"
              }`}
            >
              {result?.passed ? (
                <Trophy
                  className="w-12 h-12 text-yellow-500"
                  aria-hidden="true"
                />
              ) : (
                <XCircle
                  className="w-12 h-12 text-red-400"
                  aria-hidden="true"
                />
              )}
            </div>

            <h2 className="font-display font-bold text-3xl text-slate-900 mb-2">
              {result?.passed ? t("congratulations") : t("tryAgain")}
            </h2>
            <p className="text-slate-500 mb-6">
              {result?.feedback.filter((item) => item.correct).length || 0} /{" "}
              {totalQ} {t("correctAnswersCount")}
            </p>

            <div className="relative w-32 h-32 mx-auto mb-8">
              <svg
                className="w-32 h-32 -rotate-90"
                viewBox="0 0 128 128"
                aria-hidden="true"
              >
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="12"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  fill="none"
                  stroke={result?.passed ? "#0D9488" : "#F87171"}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - (result?.percentage || 0) / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display font-bold text-3xl text-slate-900">
                  {result?.percentage || 0}%
                </span>
              </div>
            </div>

            {/* Answer summary */}
            <div className="grid grid-cols-2 gap-4 mb-8 max-w-xs mx-auto">
              <div className="bg-green-50 rounded-2xl p-4 text-center">
                <div className="font-display font-bold text-2xl text-green-600">
                  {result?.feedback.filter((item) => item.correct).length || 0}
                </div>
                <div className="text-xs text-green-700 mt-1">
                  {t("correctAnswers")}
                </div>
              </div>
              <div className="bg-red-50 rounded-2xl p-4 text-center">
                <div className="font-display font-bold text-2xl text-red-500">
                  {totalQ -
                    (result?.feedback.filter((item) => item.correct).length ||
                      0)}
                </div>
                <div className="text-xs text-red-600 mt-1">
                  {t("wrongAnswers")}
                </div>
              </div>
            </div>

            {/* Detailed answers */}
            <div className="text-left bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 mb-8">
              {quiz.questions.map((q, i) => {
                const correct =
                  result?.feedback.find((item) => item.questionId === q.id)
                    ?.correct || false
                return (
                  <div key={q.id} className="p-4 flex items-start gap-3">
                    {correct ? (
                      <CheckCircle
                        className="w-5 h-5 text-green-500 shrink-0 mt-0.5"
                        aria-label={t("correct")}
                      />
                    ) : (
                      <XCircle
                        className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
                        aria-label={t("wrong")}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 mb-1">
                        {i + 1}. {q.text}
                      </p>
                      {!correct && (
                        <p className="text-xs text-slate-500">
                          {t("correctAnswerIs")}{" "}
                          {q.correctAnswers
                            .map((a) => q.options.find((o) => o.id === a)?.text)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-[#fff9fb] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {t("retake")}
              </button>
              <Link
                to={course ? `/courses/${course.id}` : "/dashboard"}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                {t("backToCourse")}
              </Link>
            </div>
          </div>
        )}
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
