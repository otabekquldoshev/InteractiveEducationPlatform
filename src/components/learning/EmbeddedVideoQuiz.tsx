import { useState } from "react"
import { CheckCircle, LockKeyhole, RotateCcw, XCircle } from "lucide-react"
import type { Question } from "../../types"
import { api } from "../../lib/api"

export type EmbeddedQuiz = {
  id: string
  title: string
  passingScore: number
  isRequired: boolean
  interruptAtSeconds: number
  alreadyPassed: boolean
  questions: Question[]
}

type SubmissionResult = {
  percentage: number
  passed: boolean
  feedback: Array<{ questionId: string; correct: boolean }>
}

export default function EmbeddedVideoQuiz({
  quiz,
  onPassed,
  onSkip,
}: {
  quiz: EmbeddedQuiz
  onPassed: () => void
  onSkip: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<SubmissionResult | null>(null)

  const selectAnswer = (question: Question, optionId: string) => {
    setError("")
    setAnswers((current) => {
      if (question.type !== "multiple")
        return { ...current, [question.id]: [optionId] }
      const selected = current[question.id] || []
      return {
        ...current,
        [question.id]: selected.includes(optionId)
          ? selected.filter((id) => id !== optionId)
          : [...selected, optionId],
      }
    })
  }

  const submit = async () => {
    const unanswered = quiz.questions.some(
      (question) => !(answers[question.id]?.length > 0),
    )
    if (unanswered) {
      setError("Davom etish uchun barcha savollarga javob bering.")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const response = await api<{ result: SubmissionResult }>(
        `/quizzes/${quiz.id}/submit`,
        { method: "POST", body: { answers } },
      )
      setResult(response.result)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Test natijasini saqlab bo‘lmadi",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const retry = () => {
    setAnswers({})
    setResult(null)
    setError("")
  }

  return (
    <div className="absolute inset-0 z-50 overflow-y-auto bg-slate-950/95 p-4 text-slate-900 backdrop-blur-sm sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-quiz-title"
        className="mx-auto my-auto max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
      >
        <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Bilimni tekshirish nuqtasi
            </p>
            <h2
              id="video-quiz-title"
              className="mt-1 text-xl font-bold text-slate-950"
            >
              {quiz.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {quiz.isRequired
                ? `Video davom etishi uchun testdan kamida ${quiz.passingScore}% natija oling.`
                : "Bu test ixtiyoriy. Xohlasangiz javob bering yoki videoni davom ettiring."}
            </p>
          </div>
        </div>

        {result ? (
          <div className="py-4 text-center" aria-live="polite">
            {result.passed ? (
              <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
            ) : (
              <XCircle className="mx-auto h-16 w-16 text-red-500" />
            )}
            <h3 className="mt-4 text-2xl font-bold text-slate-950">
              {result.passed
                ? "Ajoyib, testdan o‘tdingiz!"
                : "Hali yetarli emas"}
            </h3>
            <p className="mt-2 text-slate-600">
              Natija: <strong>{result.percentage}%</strong> · To‘g‘ri javoblar:{" "}
              {result.feedback.filter((item) => item.correct).length}/
              {quiz.questions.length}
            </p>
            {result.passed ? (
              <button
                type="button"
                onClick={onPassed}
                autoFocus
                className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-700"
              >
                <CheckCircle className="h-5 w-5" />
                Videoni davom ettirish
              </button>
            ) : (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={retry}
                  autoFocus
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-rose-600 px-6 font-semibold text-white hover:bg-rose-700"
                >
                  <RotateCcw className="h-5 w-5" />
                  Qayta urinib ko‘rish
                </button>
                {!quiz.isRequired && (
                  <button
                    type="button"
                    onClick={onSkip}
                    className="min-h-12 rounded-xl border border-slate-300 px-6 font-semibold text-slate-700"
                  >
                    Videoni davom ettirish
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-5">
              {quiz.questions.map((question, questionIndex) => (
                <fieldset
                  key={question.id}
                  className="rounded-xl bg-[#fff9fb] p-4"
                >
                  <legend className="px-1 font-semibold text-slate-900">
                    {questionIndex + 1}. {question.text}
                  </legend>
                  {question.type === "multiple" && (
                    <p className="mb-2 mt-1 text-xs text-slate-500">
                      Bir nechta javobni tanlash mumkin.
                    </p>
                  )}
                  <div className="mt-3 grid gap-2">
                    {question.options.map((option) => {
                      const checked = (answers[question.id] || []).includes(
                        option.id,
                      )
                      return (
                        <label
                          key={option.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm transition-colors ${
                            checked
                              ? "border-rose-500 bg-rose-50 text-rose-900"
                              : "border-slate-200 bg-white hover:border-rose-200"
                          }`}
                        >
                          <input
                            type={
                              question.type === "multiple"
                                ? "checkbox"
                                : "radio"
                            }
                            name={`embedded-${question.id}`}
                            checked={checked}
                            onChange={() => selectAnswer(question, option.id)}
                            className="h-4 w-4 accent-rose-600"
                          />
                          {option.text}
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={() => void submit()}
              disabled={submitting}
              className="mt-5 min-h-12 w-full rounded-xl bg-rose-600 px-5 font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? "Tekshirilmoqda..." : "Javoblarni tekshirish"}
            </button>
            {!quiz.isRequired && (
              <button
                type="button"
                onClick={onSkip}
                className="mt-3 min-h-11 w-full rounded-xl border border-slate-300 px-5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hozir o‘tkazib yuborish
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
