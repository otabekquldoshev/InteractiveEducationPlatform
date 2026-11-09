import { useEffect, useState } from "react"
import { Edit2, Loader2, Plus, Save, Trash2 } from "lucide-react"
import type { Lesson, Module, Question } from "../../types"
import { api } from "../../lib/api"
import { useLanguage } from "../../contexts/LanguageContext"

type QuizDetails = {
  id: string
  title: string
  passingScore: number
  interruptAtSeconds: number | null
  status: string
  questions: Question[]
}
type Props = {
  modules: Module[]
  selectedLesson?: Lesson
  lessonId: string
  setLessonId: (id: string) => void
  run: (action: () => Promise<void>, success: string) => Promise<boolean>
  busy: boolean
  onCreateLesson: () => void
}

export default function QuizManager({
  modules,
  selectedLesson,
  lessonId,
  setLessonId,
  run,
  busy,
  onCreateLesson,
}: Props) {
  const { t } = useLanguage()
  const [quiz, setQuiz] = useState<QuizDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [questionId, setQuestionId] = useState<string | null>(null)
  const [selectedQuizId, setSelectedQuizId] = useState("")
  const [creating, setCreating] = useState(false)
  const lessonQuizzes =
    selectedLesson?.quizzes?.length
      ? selectedLesson.quizzes
      : selectedLesson?.quiz
        ? [selectedLesson.quiz]
        : []

  useEffect(() => {
    const firstQuizId =
      selectedLesson?.quizzes?.[0]?.id || selectedLesson?.quiz?.id || ""
    setSelectedQuizId(firstQuizId)
    setCreating(!firstQuizId)
    setQuestionId(null)
  }, [selectedLesson?.id])

  const loadQuiz = async () => {
    if (!selectedQuizId || creating) {
      setQuiz(null)
      return
    }
    setLoading(true)
    setLoadError("")
    try {
      const result = await api<{ quiz: QuizDetails }>(
        `/quizzes/${selectedQuizId}`,
      )
      setQuiz(normalizeQuiz(result.quiz))
    } catch (error) {
      setQuiz(null)
      setLoadError(error instanceof Error ? error.message : t("action_failed"))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void loadQuiz()
  }, [selectedQuizId, creating])

  const submitNewQuiz = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedLesson) return
    const form = event.currentTarget
    const data = new FormData(form)
    const interruptAtSeconds = readInterruptTime(form, selectedLesson.type)
    if (interruptAtSeconds === undefined) return
    void run(async () => {
      const result = await api<{ quiz: QuizDetails }>(
        `/quizzes/lesson/${selectedLesson.id}`,
        {
          method: "POST",
          body: {
            title: data.get("title"),
            passingScore: Number(data.get("passingScore")),
            interruptAtSeconds,
            status: "draft",
            questions: [],
          },
        },
      )
      setQuiz(normalizeQuiz(result.quiz))
      setSelectedQuizId(result.quiz.id)
      setCreating(false)
    }, t("quiz_created"))
  }

  const saveQuiz = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!quiz) return
    const form = event.currentTarget
    const data = new FormData(form)
    const interruptAtSeconds = readInterruptTime(
      form,
      selectedLesson?.type || "text",
    )
    if (interruptAtSeconds === undefined) return
    void run(async () => {
      await api(`/quizzes/${quiz.id}`, {
        method: "PATCH",
        body: {
          title: data.get("title"),
          passingScore: Number(data.get("passingScore")),
          interruptAtSeconds,
          status: data.get("status"),
        },
      })
      await loadQuiz()
    }, t("quiz_updated"))
  }

  const saveQuestion = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!quiz) return
    const form = event.currentTarget
    const data = new FormData(form)
    const optionTexts = String(data.get("options") || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
    const options = optionTexts.map((text, index) => ({
      id: `option-${index + 1}`,
      text,
    }))
    const type = String(data.get("type")) as Question["type"]
    const correctField = form.elements.namedItem("correct") as HTMLInputElement
    correctField.setCustomValidity("")
    const correctNumbers = Array.from(
      new Set(
        String(data.get("correct") || "")
          .split(/[\s,;]+/)
          .filter(Boolean)
          .map(Number),
      ),
    )
    const invalidCorrect = correctNumbers.some(
      (value) =>
        !Number.isInteger(value) || value < 1 || value > options.length,
    )
    if (
      options.length < 2 ||
      options.length > 26 ||
      invalidCorrect ||
      correctNumbers.length === 0 ||
      (type !== "multiple" && correctNumbers.length !== 1) ||
      (type === "multiple" && correctNumbers.length < 2) ||
      (type === "truefalse" && options.length !== 2)
    ) {
      correctField.setCustomValidity(
        type === "multiple"
          ? "Kamida 2 ta to‘g‘ri variant raqamini vergul bilan kiriting (masalan: 1,3)."
          : "Mavjud variantlardan bitta to‘g‘ri raqam kiriting.",
      )
      correctField.reportValidity()
      return
    }
    const existing = quiz.questions.find((item) => item.id === questionId)
    const body = {
      text: data.get("text"),
      type,
      options,
      correctAnswers: correctNumbers.map((number) => options[number - 1].id),
      explanation: String(data.get("explanation") || "").trim() || undefined,
      order:
        existing?.order ||
        Math.max(0, ...quiz.questions.map((item) => item.order || 0)) + 1,
      points: Number(data.get("points")),
    }
    void run(
      async () => {
        await api(
          questionId
            ? `/quizzes/questions/${questionId}`
            : `/quizzes/${quiz.id}/questions`,
          { method: questionId ? "PATCH" : "POST", body },
        )
        setQuestionId(null)
        form.reset()
        await loadQuiz()
      },
      questionId ? t("question_updated") : t("question_added"),
    )
  }

  const editQuestion = (question: Question) => {
    setQuestionId(question.id)
    requestAnimationFrame(() =>
      document
        .getElementById("question-form")
        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700">
          {t("lesson")}
          <select
            value={lessonId}
            onChange={(event) => setLessonId(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <option value="">{t("select_lesson")}</option>
            {modules.map((module) => (
              <optgroup key={module.id} label={module.title}>
                {module.lessons.length ? (
                  module.lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.type === "video" ? "🎬" : "📄"} {lesson.title}
                    </option>
                  ))
                ) : (
                  <option disabled value={`empty-${module.id}`}>
                    — {t("no_lessons")}
                  </option>
                )}
              </optgroup>
            ))}
          </select>
        </label>
        {modules.length > 0 && !selectedLesson && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              Test yaratish uchun avval modul ichida dars yarating.
            </p>
            <button
              type="button"
              onClick={onCreateLesson}
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              {t("new_lesson")}
            </button>
          </div>
        )}
      </div>
      {selectedLesson && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-semibold text-slate-700">
              Shu darsdagi testlar ({lessonQuizzes.length})
              <select
                value={creating ? "__new" : selectedQuizId}
                onChange={(event) => {
                  const isNew = event.target.value === "__new"
                  setCreating(isNew)
                  setSelectedQuizId(isNew ? "" : event.target.value)
                  setQuestionId(null)
                }}
                className="mt-1 w-full rounded-xl border border-violet-200 bg-white px-4 py-3"
              >
                {lessonQuizzes.map((item, index) => (
                  <option key={item.id} value={item.id}>
                    {index + 1}. {item.title}
                    {typeof item.interruptAtSeconds === "number"
                      ? ` — ${formatInterruptTime(item.interruptAtSeconds)}`
                      : " — video oxirida"}
                  </option>
                ))}
                <option value="__new">＋ Yangi test qo‘shish</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                setCreating(true)
                setSelectedQuizId("")
                setQuiz(null)
                setQuestionId(null)
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Yangi vaqtli test
            </button>
          </div>
          <p className="mt-2 text-xs text-violet-700">
            Testlar soni cheklanmagan. Har biriga videoning boshqa vaqtini belgilang.
          </p>
        </div>
      )}
      {loading ? (
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-rose-600" />
      ) : loadError ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
        >
          {loadError}
        </div>
      ) : !selectedLesson ? (
        <Empty text={t("select_lesson")} />
      ) : creating || !quiz ? (
        <form
          key={`create-${selectedLesson.id}`}
          onSubmit={submitNewQuiz}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="font-display font-bold text-slate-900">
            {t("new_quiz")}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              name="title"
              label={t("quiz_name")}
              defaultValue={`${selectedLesson.title}${t("quiz_suffix")}`}
            />
            <Field
              name="passingScore"
              label={t("passing_score_percent")}
              type="number"
              defaultValue="70"
              min={70}
              max={100}
            />
            <QuizPlacementFields lesson={selectedLesson} />
          </div>
          <button
            disabled={busy}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            {t("create_quiz")}
          </button>
        </form>
      ) : (
        <>
          {quiz.status !== "published" && (
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-amber-950">
                  Bu test hozir o‘quvchilarga ko‘rinmaydi
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  {quiz.questions.length === 0
                    ? "Avval kamida bitta savol qo‘shing, keyin testni nashr qiling."
                    : "O‘quvchilar kurs sahifasida ko‘rishi uchun testni nashr qiling."}
                </p>
              </div>
              <button
                type="button"
                disabled={busy || quiz.questions.length === 0}
                onClick={() =>
                  void run(async () => {
                    await api(`/quizzes/${quiz.id}`, {
                      method: "PATCH",
                      body: { status: "published" },
                    })
                    await loadQuiz()
                  }, "Test nashr qilindi va o‘quvchilarga ko‘rinadi")
                }
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Nashr qilish
              </button>
            </div>
          )}
          {quiz.status === "published" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              Test nashr qilingan — o‘quvchilar kurs va dars sahifasidan uni
              ochishi mumkin.
            </div>
          )}
          <form
            key={`settings-${quiz.id}`}
            onSubmit={saveQuiz}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-900">
                {t("quiz_settings")}
              </h3>
              <button
                type="button"
                onClick={() =>
                  window.confirm(`${quiz.title}\n\n${t("delete")}?`) &&
                  void run(async () => {
                    await api(`/quizzes/${quiz.id}`, { method: "DELETE" })
                    setQuiz(null)
                    const nextQuiz = lessonQuizzes.find(
                      (item) => item.id !== quiz.id,
                    )
                    setSelectedQuizId(nextQuiz?.id || "")
                    setCreating(!nextQuiz)
                    setQuestionId(null)
                  }, t("quiz_deleted"))
                }
                className="inline-flex items-center gap-1 text-sm font-semibold text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                {t("delete")}
              </button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field name="title" label={t("name")} defaultValue={quiz.title} />
              <Field
                name="passingScore"
                label={t("passing_score")}
                type="number"
                defaultValue={String(quiz.passingScore)}
                min={70}
                max={100}
              />
              <QuizPlacementFields
                lesson={selectedLesson}
                interruptAtSeconds={quiz.interruptAtSeconds}
              />
              <label className="text-sm font-semibold text-slate-700">
                {t("status")}
                <select
                  name="status"
                  defaultValue={quiz.status.toLowerCase()}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal"
                >
                  <option value="draft">{t("status_draft")}</option>
                  <option value="published">{t("status_published")}</option>
                  <option value="hidden">{t("status_hidden")}</option>
                </select>
              </label>
            </div>
            <button
              disabled={busy}
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white"
            >
              <Save className="h-4 w-4" />
              {t("save")}
            </button>
          </form>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-display font-bold text-slate-900">
              {t("questions")} ({quiz.questions.length})
            </h3>
            <div className="mt-4 space-y-2">
              {quiz.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex items-start gap-3 rounded-xl bg-[#fff9fb] p-3"
                >
                  <span className="text-xs font-mono text-slate-400">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {question.text}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {question.options.map((item) => item.text).join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => editQuestion(question)}
                    className="p-2 text-rose-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      window.confirm(`${question.text}\n\n${t("delete")}?`) &&
                      void run(async () => {
                        await api(`/quizzes/questions/${question.id}`, {
                          method: "DELETE",
                        })
                        await loadQuiz()
                      }, t("question_deleted"))
                    }
                    className="p-2 text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <QuestionForm
            key={questionId || "new"}
            question={quiz.questions.find((item) => item.id === questionId)}
            onSubmit={saveQuestion}
            onCancel={() => setQuestionId(null)}
            busy={busy}
          />
        </>
      )}
    </div>
  )
}

function QuizPlacementFields({
  lesson,
  interruptAtSeconds,
}: {
  lesson: Lesson
  interruptAtSeconds?: number | null
}) {
  const isVideo = lesson.type === "video"
  const [placement, setPlacement] = useState(
    isVideo && interruptAtSeconds !== null ? "during" : "after",
  )
  return (
    <>
      <label className="text-sm font-semibold text-slate-700">
        Test qachon chiqadi?
        <select
          name="placement"
          value={placement}
          onChange={(event) => setPlacement(event.target.value)}
          disabled={!isVideo}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal disabled:bg-slate-100"
        >
          {isVideo && <option value="during">Video ichida (majburiy)</option>}
          <option value="after">Video tugagandan keyin</option>
        </select>
      </label>
      {isVideo && placement === "during" ? (
        <label className="text-sm font-semibold text-slate-700">
          Videoning aniq vaqti (daq:soniya)
          <input
            name="interruptTime"
            defaultValue={formatInterruptTime(interruptAtSeconds ?? 30)}
            required
            inputMode="numeric"
            pattern="[0-9]+:[0-5][0-9]"
            placeholder="02:30"
            className="mt-1 w-full rounded-xl border-2 border-rose-300 bg-rose-50 px-4 py-3 font-mono text-base font-semibold text-rose-950 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
          />
          <span className="mt-1 block text-xs font-normal text-slate-600">
            Masalan: 00:30, 02:15 yoki 10:05. Video aynan shu vaqtda to‘xtaydi.
          </span>
        </label>
      ) : isVideo ? (
        <div className="rounded-xl border border-slate-200 bg-[#fff9fb] p-3 text-sm text-slate-600">
          Test video to‘liq tugagandan keyin ochiladi. Video ichida chiqarish uchun
          yuqoridan “Video ichida”ni tanlang.
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Bu matnli dars. Vaqt belgilash uchun 🎬 video darsni tanlang.
        </div>
      )}
    </>
  )
}

function formatInterruptTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`
}

function readInterruptTime(
  form: HTMLFormElement,
  lessonType: Lesson["type"],
): number | null | undefined {
  const data = new FormData(form)
  if (lessonType !== "video" || data.get("placement") !== "during") return null
  const input = form.elements.namedItem("interruptTime") as HTMLInputElement
  input.setCustomValidity("")
  const match = String(data.get("interruptTime") || "").match(
    /^(\d+):([0-5]\d)$/,
  )
  const seconds = match ? Number(match[1]) * 60 + Number(match[2]) : 0
  if (!match || seconds < 1) {
    input.setCustomValidity(
      "Vaqtni daqiqa:soniya formatida kiriting (masalan, 02:30).",
    )
    input.reportValidity()
    return undefined
  }
  return seconds
}

function QuestionForm({
  question,
  onSubmit,
  onCancel,
  busy,
}: {
  question?: Question
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  busy: boolean
}) {
  const { t } = useLanguage()
  const correctIndexes = question
    ? question.correctAnswers
        .map((id) => question.options.findIndex((item) => item.id === id) + 1)
        .filter((value) => value > 0)
        .join(",")
    : "1"
  return (
    <form
      id="question-form"
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h3 className="font-display font-bold text-slate-900">
        {question ? t("edit_question") : t("new_question")}
      </h3>
      <div className="mt-4 space-y-4">
        <Field
          name="text"
          label={t("question_text")}
          defaultValue={question?.text}
        />
        <label className="block text-sm font-semibold text-slate-700">
          {t("options_newline")}
          <textarea
            name="options"
            required
            minLength={3}
            rows={5}
            defaultValue={
              question?.options.map((item) => item.text).join("\n") || ""
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            {t("question_type")}
            <select
              name="type"
              defaultValue={question?.type || "single"}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal"
            >
              <option value="single">{t("single_answer")}</option>
              <option value="multiple">{t("multiple_answer")}</option>
              <option value="truefalse">{t("true_false")}</option>
            </select>
          </label>
          <Field
            name="correct"
            label={t("correct_option_number")}
            defaultValue={correctIndexes}
            pattern="[0-9,; ]+"
          />
        </div>
        <p className="-mt-2 text-xs text-slate-500">
          {t("multiple_answer")}: 1,3 kabi bir nechta raqam kiriting.
        </p>
        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
          <Field
            name="points"
            label="Ball"
            type="number"
            defaultValue={String(question?.points || 1)}
            min={1}
            max={100}
          />
          <label className="block text-sm font-semibold text-slate-700">
            Izoh (ixtiyoriy)
            <input
              name="explanation"
              defaultValue={question?.explanation || ""}
              maxLength={3000}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal"
            />
          </label>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          disabled={busy}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white"
        >
          <Save className="h-4 w-4" />
          {question ? t("update") : t("add_question")}
        </button>
        {question && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 text-sm font-semibold"
          >
            {t("cancel")}
          </button>
        )}
      </div>
    </form>
  )
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
  min,
  max,
  pattern,
}: {
  name: string
  label: string
  defaultValue?: string
  type?: string
  min?: number
  max?: number
  pattern?: string
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required
        min={min}
        max={max}
        pattern={pattern}
        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal"
      />
    </label>
  )
}

function normalizeQuiz(quiz: QuizDetails): QuizDetails {
  return {
    ...quiz,
    status: quiz.status.toLowerCase(),
    questions: quiz.questions.map((item) => ({
      ...item,
      type: item.type
        .toLowerCase()
        .replace("true_false", "truefalse") as Question["type"],
    })),
  }
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-[#fff9fb] p-8 text-center text-sm text-slate-500">
      {text}
    </div>
  )
}
