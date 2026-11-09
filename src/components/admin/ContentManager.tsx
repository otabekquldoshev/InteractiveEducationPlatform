import { useEffect, useMemo, useRef, useState } from "react"
import {
  BookOpen,
  Camera,
  ChevronDown,
  Edit2,
  FileText,
  Film,
  HelpCircle,
  ImagePlus,
  Layers3,
  Languages,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Square,
  Trash2,
  Upload,
} from "lucide-react"
import { useCatalog } from "../../contexts/CatalogContext"
import { useAuth } from "../../contexts/AuthContext"
import { api, uploadForm } from "../../lib/api"
import type { Lesson, Module } from "../../types"
import QuizManager from "./QuizManager"
import { useLanguage } from "../../contexts/LanguageContext"
import TextToSurdoTranslator from "../surdo/TextToSurdoTranslator"

type Section = "structure" | "media" | "quizzes"
type ContentEditorState = { kind: "module"; item?: Module } | {
  kind: "lesson"
  module: Module
  item?: Lesson
}
type DeleteTarget = { kind: "module"; item: Module } | {
  kind: "lesson"
  item: Lesson
}

export default function ContentManager({
  initialSection = "structure",
  initialCourseId = "",
  initialLessonId = "",
  onSectionChange,
  onCourseChange,
  onLessonChange,
}: {
  initialSection?: Section
  initialCourseId?: string
  initialLessonId?: string
  onSectionChange?: (section: Section) => void
  onCourseChange?: (courseId: string) => void
  onLessonChange?: (lessonId: string) => void
}) {
  const { user } = useAuth()
  const { courses, modules, reload, isLoading } = useCatalog()
  const { t } = useLanguage()
  const [section, setSection] = useState<Section>(initialSection)
  const visibleCourses = useMemo(
    () => (user?.role === "admin" ? courses : []),
    [courses, user],
  )
  const [courseId, setCourseId] = useState(initialCourseId)
  const [lessonId, setLessonId] = useState(initialLessonId)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{
    text: string
    type: "success" | "error"
  } | null>(null)
  const [editor, setEditor] = useState<ContentEditorState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const changeSection = (nextSection: Section) => {
    setSection(nextSection)
    onSectionChange?.(nextSection)
  }
  const changeLesson = (nextLessonId: string) => {
    setLessonId(nextLessonId)
    onLessonChange?.(nextLessonId)
  }
  const changeCourse = (nextCourseId: string) => {
    setCourseId(nextCourseId)
    onCourseChange?.(nextCourseId)
    changeLesson("")
  }

  useEffect(() => {
    if (!visibleCourses.some((course) => course.id === courseId)) {
      const coursesWithLessons = new Set(
        modules
          .filter((module) => module.lessons.length > 0)
          .map((module) => module.courseId),
      )
      const coursesWithQuizzes = new Set(
        modules
          .filter((module) =>
            module.lessons.some(
              (lesson) =>
                Boolean(lesson.quizzes?.length) || Boolean(lesson.quiz),
            ),
          )
          .map((module) => module.courseId),
      )
      const coursesWithVideoQuizzes = new Set(
        modules
          .filter((module) =>
            module.lessons.some(
              (lesson) =>
                lesson.type === "video" &&
                (Boolean(lesson.quizzes?.length) || Boolean(lesson.quiz)),
            ),
          )
          .map((module) => module.courseId),
      )
      const coursesWithVideos = new Set(
        modules
          .filter((module) =>
            module.lessons.some((lesson) => Boolean(lesson.video?.videoUrl)),
          )
          .map((module) => module.courseId),
      )
      const preferredCourse =
        (section === "quizzes" &&
          visibleCourses.find((course) =>
            coursesWithVideoQuizzes.has(course.id),
          )) ||
        (section === "quizzes" &&
          visibleCourses.find((course) => coursesWithQuizzes.has(course.id))) ||
        (section === "media" &&
          visibleCourses.find((course) => coursesWithVideos.has(course.id))) ||
        visibleCourses.find((course) => coursesWithLessons.has(course.id)) ||
        visibleCourses[0]
      const nextCourseId = preferredCourse?.id || ""
      setCourseId(nextCourseId)
      onCourseChange?.(nextCourseId)
      setLessonId("")
      onLessonChange?.("")
    }
  }, [visibleCourses, modules, courseId, section])

  const courseModules = modules.filter((module) => module.courseId === courseId)
  const lessons = courseModules.flatMap((module) => module.lessons)
  const preferredLesson =
    (section === "quizzes" &&
      lessons.find(
        (lesson) =>
          lesson.type === "video" &&
          (Boolean(lesson.quizzes?.length) || Boolean(lesson.quiz)),
      )) ||
    (section === "quizzes" &&
      lessons.find((lesson) => lesson.type === "video")) ||
    (section === "media" &&
      lessons.find((lesson) => Boolean(lesson.video?.videoUrl))) ||
    lessons[0]
  const selectedLesson =
    lessons.find((lesson) => lesson.id === lessonId) || preferredLesson

  useEffect(() => {
    if (selectedLesson && selectedLesson.id !== lessonId)
      changeLesson(selectedLesson.id)
    if (!selectedLesson && lessonId) changeLesson("")
  }, [selectedLesson, lessonId])

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true)
    setMessage(null)
    try {
      await action()
      await reload()
      setMessage({ text: success, type: "success" })
      return true
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : t("action_failed"),
        type: "error",
      })
      return false
    } finally {
      setBusy(false)
    }
  }

  const addModule = () => {
    if (courseId) setEditor({ kind: "module" })
  }

  const editModule = (module: Module) => {
    setEditor({ kind: "module", item: module })
  }

  const deleteModule = (module: Module) => {
    setDeleteTarget({ kind: "module", item: module })
  }

  const addLesson = (module: Module) => {
    setEditor({ kind: "lesson", module })
  }

  const editLesson = (lesson: Lesson) => {
    const module = courseModules.find((item) => item.id === lesson.moduleId)
    if (module) setEditor({ kind: "lesson", module, item: lesson })
  }

  const toggleLesson = (lesson: Lesson & { status?: string }) => {
    const status = lesson.status === "published" ? "hidden" : "published"
    void run(
      () =>
        api(`/courses/lessons/${lesson.id}`, {
          method: "PATCH",
          body: { status },
        }),
      status === "published" ? t("lesson_published") : t("lesson_hidden"),
    )
  }

  const deleteLesson = (lesson: Lesson) => {
    setDeleteTarget({ kind: "lesson", item: lesson })
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow text-rose-600">{t("content_crud")}</p>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-900">
              {t("course_modules_and_materials")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("course_modules_description")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              {
                id: "structure",
                label: t("modules_and_lessons"),
                icon: BookOpen,
              },
              { id: "media", label: t("video_and_images"), icon: Film },
              { id: "quizzes", label: t("quizzes"), icon: HelpCircle },
            ] as const).map((item) => (
              <button
                key={item.id}
                onClick={() => changeSection(item.id)}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${
                  section === item.id
                    ? "bg-rose-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          {t("course")}
          <span className="relative mt-1 block">
            <select
              value={courseId}
              onChange={(event) => changeCourse(event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">{t("select_course")}</option>
              {visibleCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} · {course.status || t("draft")}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
          </span>
        </label>
        {message && (
          <p
            role="status"
            className={`mt-3 rounded-xl px-4 py-2.5 text-sm ${
              message.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>

      {!courseId ? (
        <Empty
          text={isLoading ? t("loading_courses") : t("create_or_select_course")}
        />
      ) : section === "structure" ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-violet-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
                <Layers3 className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">
                  {courseModules.length} {t("module")} · {lessons.length}{" "}
                  {t("lesson_lowercase")}
                </p>
                <p className="text-xs text-slate-500">
                  {t("create_module_add_lessons")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                disabled={!selectedLesson || busy}
                onClick={() => changeSection("media")}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 disabled:opacity-40"
              >
                <Film className="h-4 w-4" />
                {t("upload_video")}
              </button>
              <button
                disabled={!selectedLesson || busy}
                onClick={() => changeSection("quizzes")}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 disabled:opacity-40"
              >
                <HelpCircle className="h-4 w-4" />
                {t("create_quiz")}
              </button>
              <button
                disabled={busy}
                onClick={addModule}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {t("add_module")}
              </button>
            </div>
          </div>
          {courseModules.length === 0 && (
            <Empty text={t("no_modules_in_course")} />
          )}
          {courseModules.map((module) => (
            <div
              key={module.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-[#fff9fb] px-4 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-sm font-bold text-rose-700">
                  {module.order}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-slate-900">
                    {module.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {module.lessons.length} {t("lessons_count")}
                  </p>
                </div>
                <IconButton
                  label={t("edit")}
                  onClick={() => editModule(module)}
                >
                  <Edit2 />
                </IconButton>
                <IconButton
                  label={t("delete")}
                  danger
                  onClick={() => deleteModule(module)}
                >
                  <Trash2 />
                </IconButton>
                <button
                  onClick={() => addLesson(module)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("new_lesson")}
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {module.lessons.length === 0 ? (
                  <p className="p-5 text-sm text-slate-400">
                    {t("no_lessons")}
                  </p>
                ) : (
                  module.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
                    >
                      <span className="text-xs font-mono text-slate-400">
                        {lesson.order.toString().padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">
                          {lesson.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {lesson.type} ·{" "}
                          {(lesson as Lesson & { status?: string }).status ||
                            t("draft")}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleLesson(lesson)}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        {(lesson as Lesson & { status?: string }).status ===
                        "published"
                          ? t("hide")
                          : t("publish")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          changeLesson(lesson.id)
                          changeSection("media")
                        }}
                        className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${
                          lesson.video
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                        }`}
                      >
                        <Film className="h-3.5 w-3.5" />
                        {lesson.video ? t("replace_video") : t("upload_video")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          changeLesson(lesson.id)
                          changeSection("quizzes")
                        }}
                        className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${
                          lesson.quizzes?.length
                            ? "bg-violet-50 text-violet-700"
                            : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        }`}
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                        {lesson.quizzes?.length
                          ? `${lesson.quizzes.length} ta test`
                          : t("create_quiz")}
                      </button>
                      <IconButton
                        label={t("edit")}
                        onClick={() => editLesson(lesson)}
                      >
                        <Edit2 />
                      </IconButton>
                      <IconButton
                        label={t("delete")}
                        danger
                        onClick={() => deleteLesson(lesson)}
                      >
                        <Trash2 />
                      </IconButton>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : section === "media" ? (
        <MediaManager
          modules={courseModules}
          selectedLesson={selectedLesson}
          lessonId={lessonId}
          setLessonId={changeLesson}
          run={run}
          reload={reload}
          busy={busy}
          onCreateLesson={() => changeSection("structure")}
        />
      ) : (
        <QuizManager
          modules={courseModules}
          selectedLesson={selectedLesson}
          lessonId={lessonId}
          setLessonId={changeLesson}
          run={run}
          busy={busy}
          onCreateLesson={() => changeSection("structure")}
        />
      )}
      {busy && (
        <div className="fixed bottom-24 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm text-white shadow-xl">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("saving")}
        </div>
      )}
      {editor && (
        <ContentEditor
          key={
            editor.kind === "module"
              ? `module-${editor.item?.id || "new"}`
              : `lesson-${editor.item?.id || "new"}-${editor.module.id}`
          }
          editor={editor}
          onClose={() => setEditor(null)}
          onSave={async (values) => {
            setBusy(true)
            setMessage(null)
            let nextEditor: ContentEditorState | null = null
            try {
              if (editor.kind === "module") {
                const order =
                  editor.item?.order ||
                  Math.max(0, ...courseModules.map((item) => item.order)) + 1
                const result = await api<{ module: Module }>(
                  editor.item
                    ? `/courses/modules/${editor.item.id}`
                    : `/courses/${courseId}/modules`,
                  {
                    method: editor.item ? "PATCH" : "POST",
                    body: { title: values.title, order },
                  },
                )
                if (!editor.item)
                  nextEditor = {
                    kind: "lesson",
                    module: { ...result.module, lessons: [] },
                  }
                setMessage({
                  text: editor.item ? t("module_updated") : t("module_created"),
                  type: "success",
                })
              } else {
                const order =
                  editor.item?.order ||
                  Math.max(
                    0,
                    ...editor.module.lessons.map((item) => item.order),
                  ) + 1
                const result = await api<{ lesson: Lesson }>(
                  editor.item
                    ? `/courses/lessons/${editor.item.id}`
                    : `/courses/modules/${editor.module.id}/lessons`,
                  {
                    method: editor.item ? "PATCH" : "POST",
                    body: {
                      title: values.title,
                      description: values.description,
                      content: values.content,
                      type: values.type,
                      status: values.status,
                      order,
                    },
                  },
                )
                changeLesson(result.lesson.id)
                if (values.video instanceof File && values.video.size > 0) {
                  const form = new FormData()
                  form.append("video", values.video)
                  form.append("title", String(values.title))
                  await api(`/media/lessons/${result.lesson.id}/video`, {
                    method: "POST",
                    body: form,
                  })
                }
                if (values.image instanceof File && values.image.size > 0) {
                  const form = new FormData()
                  form.append("image", values.image)
                  await api(`/media/lessons/${result.lesson.id}/image`, {
                    method: "POST",
                    body: form,
                  })
                }
                const msg = `${
                  editor.item ? t("lesson_updated") : t("lesson_created")
                }${
                  values.video instanceof File && values.video.size
                    ? " " + t("and_video_uploaded")
                    : ""
                }`
                setMessage({ text: msg, type: "success" })
              }
              await reload()
              setEditor(nextEditor)
            } catch (error) {
              const text =
                error instanceof Error ? error.message : t("save_failed")
              setMessage({ text, type: "error" })
              throw error
            } finally {
              setBusy(false)
            }
          }}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          target={deleteTarget}
          busy={busy}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            const endpoint =
              deleteTarget.kind === "module"
                ? `/courses/modules/${deleteTarget.item.id}`
                : `/courses/lessons/${deleteTarget.item.id}`
            await run(
              () => api(endpoint, { method: "DELETE" }),
              deleteTarget.kind === "module"
                ? t("module_deleted")
                : t("lesson_deleted"),
            )
            setDeleteTarget(null)
          }}
        />
      )}
    </section>
  )
}

function DeleteDialog({
  target,
  busy,
  onClose,
  onConfirm,
}: {
  target: DeleteTarget
  busy: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const { t } = useLanguage()
  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/55 p-4"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="font-display text-xl font-bold text-slate-900">
          {t("confirm_delete")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          “{target.item.title}”{" "}
          {target.kind === "module"
            ? t("module_and_all_lessons")
            : t("lesson_single")}{" "}
          {t("will_be_permanently_deleted")}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            disabled={busy}
            onClick={onClose}
            className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            disabled={busy}
            onClick={() => void onConfirm()}
            className="min-h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? t("deleting") : t("delete")}
          </button>
        </div>
      </div>
    </div>
  )
}

function ContentEditor({
  editor,
  onClose,
  onSave,
}: {
  editor: ContentEditorState
  onClose: () => void
  onSave: (values: Record<string, string | File>) => Promise<void>
}) {
  const { t } = useLanguage()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    const values = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    ) as Record<string, string | File>
    try {
      await onSave(values)
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : t("save_error"),
      )
    } finally {
      setSaving(false)
    }
  }
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-slate-900">
            {editor.kind === "module"
              ? editor.item
                ? t("edit_module")
                : t("new_module")
              : editor.item
                ? t("edit_lesson")
                : t("new_lesson")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-xl bg-slate-100 text-xl"
          >
            ×
          </button>
        </div>
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <label className="block text-sm font-semibold text-slate-700">
          {t("name")}
          <input
            name="title"
            defaultValue={editor.item?.title}
            required
            minLength={2}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-rose-500"
          />
        </label>
        {editor.kind === "lesson" && (
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              {t("short_description")}
              <textarea
                name="description"
                defaultValue={editor.item?.description}
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              {t("lesson_text")}
              <textarea
                name="content"
                defaultValue={editor.item?.content}
                rows={7}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm font-semibold text-slate-700">
                {t("type")}
                <select
                  name="type"
                  defaultValue={editor.item?.type || "text"}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal"
                >
                  <option value="text">{t("text")}</option>
                  <option value="video">{t("video")}</option>
                  <option value="quiz">{t("quiz")}</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">
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
            <div className="grid gap-4 sm:grid-cols-2">
              <UploadField
                name="video"
                label={t("lesson_video")}
                accept="video/mp4,video/webm,.mp4,.webm"
                hint={t("video_format_hint")}
              />
              <UploadField
                name="image"
                label={t("lesson_image")}
                accept="image/jpeg,image/png,image/webp,image/avif"
                hint={t("image_format_hint")}
              />
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold"
          >
            {t("cancel")}
          </button>
          <button
            disabled={saving}
            className="min-h-11 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? t("saving_lesson_and_media") : t("save")}
          </button>
        </div>
      </form>
    </div>
  )
}

function UploadField({
  name,
  label,
  accept,
  hint,
}: {
  name: string
  label: string
  accept: string
  hint: string
}) {
  return (
    <label className="block rounded-xl border-2 border-dashed border-rose-200 bg-rose-50/50 p-4 text-sm font-semibold text-slate-700">
      <span className="flex items-center gap-2">
        <Upload className="h-4 w-4 text-rose-600" />
        {label}
      </span>
      <input
        name={name}
        type="file"
        accept={accept}
        className="mt-3 block w-full text-xs font-normal file:mr-2 file:rounded-lg file:border-0 file:bg-rose-600 file:px-3 file:py-2 file:font-semibold file:text-white"
      />
      <span className="mt-2 block text-xs font-normal text-slate-500">
        {hint}
      </span>
    </label>
  )
}

function LessonSelect({
  modules,
  value,
  onChange,
}: {
  modules: Module[]
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useLanguage()
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {t("lesson")}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
      >
        <option value="">{t("select_lesson")}</option>
        {modules.map((module) => (
          <optgroup key={module.id} label={module.title}>
            {module.lessons.length ? (
              module.lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.video?.videoUrl ? "🎬 Mavjud video — " : "＋ Video yo‘q — "}
                  {lesson.title}
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
  )
}

function MediaManager({
  modules,
  selectedLesson,
  lessonId,
  setLessonId,
  run,
  reload,
  busy,
  onCreateLesson,
}: {
  modules: Module[]
  selectedLesson?: Lesson
  lessonId: string
  setLessonId: (id: string) => void
  run: (action: () => Promise<void>, success: string) => Promise<boolean>
  reload: () => Promise<void>
  busy: boolean
  onCreateLesson: () => void
}) {
  const { t } = useLanguage()
  const existingVideoCount = modules
    .flatMap((module) => module.lessons)
    .filter((lesson) => Boolean(lesson.video?.videoUrl)).length
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoInputKey, setVideoInputKey] = useState(0)
  const [videoProgress, setVideoProgress] = useState<number | null>(null)
  const [videoError, setVideoError] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [materialFile, setMaterialFile] = useState<File | null>(null)
  const [signLanguageFile, setSignLanguageFile] = useState<File | null>(null)
  const [signInputKey, setSignInputKey] = useState(0)
  const [subtitleLanguage, setSubtitleLanguage] = useState("uz-UZ")
  const subtitle = selectedLesson?.video?.subtitles?.find(
    (item) => item.language === subtitleLanguage,
  )
  const [subtitleText, setSubtitleText] = useState("")
  const [surdoScript, setSurdoScript] = useState("")
  const [surdoScriptEdited, setSurdoScriptEdited] = useState(false)
  const syncedVideoDurations = useRef(new Set<string>())
  const subtitleSample = `WEBVTT

1
00:00:00.000 --> 00:00:05.000
Darsimizga xush kelibsiz.

2
00:00:05.000 --> 00:00:10.000
Bugun yangi mavzuni o‘rganamiz.`
  const interpreterScript = useMemo(() => {
    const hasEnteredSubtitle =
      Boolean(subtitle?.content) || subtitleText !== subtitleSample
    const enteredSubtitle = hasEnteredSubtitle ? subtitleText : ""
    const subtitleSource = enteredSubtitle
      .replace(/^WEBVTT\s*/i, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(
        (line) =>
          line &&
          !/^\d+$/.test(line) &&
          !/^\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->/.test(line),
      )
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .trim()

    return (
      selectedLesson?.content ||
      subtitleSource ||
      selectedLesson?.description ||
      selectedLesson?.title ||
      ""
    )
  }, [selectedLesson, subtitle?.content, subtitleText])
  useEffect(
    () => setSubtitleText(subtitle?.content || subtitleSample),
    [subtitle?.content, selectedLesson?.id, subtitleLanguage],
  )

  useEffect(() => {
    setSurdoScriptEdited(false)
  }, [selectedLesson?.id])

  useEffect(() => {
    if (!surdoScriptEdited) setSurdoScript(interpreterScript)
  }, [interpreterScript, surdoScriptEdited])

  useEffect(() => {
    setVideoFile(null)
    setImageFile(null)
    setMaterialFile(null)
    setSignLanguageFile(null)
    setVideoError("")
    setVideoProgress(null)
    setVideoInputKey((value) => value + 1)
    setSignInputKey((value) => value + 1)
  }, [selectedLesson?.id])

  const chooseVideo = (file: File | null) => {
    setVideoError("")
    setVideoProgress(null)
    if (!file) {
      setVideoFile(null)
      return
    }
    const extension = file.name.split(".").pop()?.toLowerCase()
    if (!["mp4", "webm"].includes(extension || "")) {
      setVideoFile(null)
      setVideoError("Faqat MP4 yoki WebM video tanlang.")
      return
    }
    if (file.size > 500 * 1024 * 1024) {
      setVideoFile(null)
      setVideoError("Video hajmi 500 MB dan oshmasligi kerak.")
      return
    }
    setVideoFile(file)
  }

  const uploadVideo = async () => {
    if (!selectedLesson || !videoFile) return
    const form = new FormData()
    form.append("video", videoFile)
    form.append("title", selectedLesson.title)
    setVideoProgress(0)
    const uploaded = await run(async () => {
      await uploadForm(
        `/media/lessons/${selectedLesson.id}/video`,
        form,
        setVideoProgress,
      )
    }, t("video_uploaded"))
    if (uploaded) {
      setVideoFile(null)
      setVideoInputKey((value) => value + 1)
    }
    setVideoProgress(null)
  }
  const syncVideoDuration = async (
    video: NonNullable<Lesson["video"]>,
    measuredDuration: number,
  ) => {
    if (!video || !Number.isFinite(measuredDuration)) return
    const duration = Math.max(1, Math.round(measuredDuration))
    if (
      video.duration === duration ||
      syncedVideoDurations.current.has(video.id)
    )
      return
    syncedVideoDurations.current.add(video.id)
    try {
      await api(`/media/videos/${video.id}`, {
        method: "PATCH",
        body: { duration },
      })
      await reload()
    } catch (error) {
      syncedVideoDurations.current.delete(video.id)
      setVideoError(
        error instanceof Error
          ? error.message
          : "Video davomiyligini saqlab bo‘lmadi",
      )
    }
  }
  const uploadImage = () => {
    if (!selectedLesson || !imageFile) return
    const form = new FormData()
    form.append("image", imageFile)
    void run(
      () =>
        api(`/media/lessons/${selectedLesson.id}/image`, {
          method: "POST",
          body: form,
        }),
      t("lesson_image_uploaded"),
    )
  }
  const uploadMaterial = () => {
    if (!selectedLesson || !materialFile) return
    const form = new FormData()
    form.append("file", materialFile)
    form.append("name", materialFile.name)
    void run(
      () =>
        api(`/media/lessons/${selectedLesson.id}/attachments`, {
          method: "POST",
          body: form,
        }),
      t("material_uploaded"),
    )
  }
  const uploadSignLanguage = async () => {
    if (!selectedLesson?.video || !signLanguageFile) return
    const form = new FormData()
    form.append("video", signLanguageFile)
    const uploaded = await run(
      () =>
        uploadForm(
          `/media/videos/${selectedLesson.video!.id}/sign-language`,
          form,
        ),
      "Imo-ishora videosi yuklandi",
    )
    if (uploaded) {
      setSignLanguageFile(null)
      setSignInputKey((value) => value + 1)
    }
  }

  const generateSubtitles = () => {
    if (!selectedLesson?.video) return
    void run(async () => {
      const result = await api<{ subtitle: { content: string } }>(
        `/media/videos/${selectedLesson.video!.id}/subtitles/generate`,
        {
          method: "POST",
          body: { language: subtitleLanguage },
        },
      )
      setSubtitleText(result.subtitle.content)
    }, "Subtitr dars matnidan avtomatik yaratildi")
  }

  const saveVideoScript = async () => {
    if (!selectedLesson || !surdoScript.trim()) return
    const saved = await run(
      () =>
        api(`/courses/lessons/${selectedLesson.id}`, {
          method: "PATCH",
          body: { content: surdoScript.trim() },
        }),
      "Video matni saqlandi",
    )
    if (saved) setSurdoScriptEdited(false)
  }
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <LessonSelect
          modules={modules}
          value={lessonId}
          onChange={setLessonId}
        />
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <Film className="h-4 w-4 shrink-0" />
          <strong>{existingVideoCount} ta mavjud video</strong>
          <span className="text-emerald-700">
            — ro‘yxatda “🎬 Mavjud video” deb belgilangan.
          </span>
        </div>
        {modules.length > 0 && !selectedLesson && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              Video biriktirish uchun modul ichida dars yarating.
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
      {selectedLesson ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <MediaCard
            title={t("video_lesson")}
            hint={t("video_lesson_hint")}
            icon={<Film className="h-5 w-5" />}
          >
            {selectedLesson.status !== "published" && (
              <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">
                  Video saqlanadi, lekin bu dars hozir qoralama holatida.
                </p>
                <p className="mt-1 text-xs text-amber-800">
                  Talabalar videoni ko‘rishi uchun darsni nashr qiling.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(
                      () =>
                        api(`/courses/lessons/${selectedLesson.id}`, {
                          method: "PATCH",
                          body: { status: "published" },
                        }),
                      "Dars nashr qilindi — video talabalarga ko‘rinadi",
                    )
                  }
                  className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-amber-600 px-4 font-semibold text-white disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Darsni nashr qilish
                </button>
              </div>
            )}
            {selectedLesson.video?.videoUrl ? (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                      Mavjud video topildi
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedLesson.video.title || selectedLesson.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {selectedLesson.video.mimeType || "video/mp4"}
                      {selectedLesson.video.size
                        ? ` · ${formatBytes(selectedLesson.video.size)}`
                        : ""}
                    </p>
                  </div>
                  <a
                    href={selectedLesson.video.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-700"
                  >
                    Alohida ochish
                  </a>
                </div>
                <video
                  key={selectedLesson.video.videoUrl}
                  src={selectedLesson.video.videoUrl}
                  controls
                  preload="metadata"
                  onLoadedMetadata={(event) =>
                    void syncVideoDuration(
                      selectedLesson.video!,
                      event.currentTarget.duration,
                    )
                  }
                  className="mt-3 aspect-video w-full rounded-xl bg-black"
                />
              </div>
            ) : (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Bu darsga hali video biriktirilmagan.
              </div>
            )}
            <p className="mb-2 text-sm font-semibold text-slate-700">
              {selectedLesson.video
                ? "Mavjud videoni almashtirish"
                : "Yangi video yuklash"}
            </p>
            <input
              key={videoInputKey}
              type="file"
              accept="video/mp4,video/webm,.mp4,.webm"
              onChange={(event) => chooseVideo(event.target.files?.[0] || null)}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-rose-600 file:px-4 file:py-2 file:font-semibold file:text-white"
            />
            {videoError && (
              <p
                role="alert"
                className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {videoError}
              </p>
            )}
            {videoFile && !videoError && (
              <div className="mt-3 rounded-xl bg-[#fff9fb] p-3 text-xs text-slate-600">
                <div className="flex justify-between gap-3">
                  <span className="truncate font-semibold">
                    {videoFile.name}
                  </span>
                  <span className="shrink-0">
                    {formatBytes(videoFile.size)}
                  </span>
                </div>
                {videoProgress !== null && (
                  <div
                    className="mt-2"
                    aria-label={`Yuklanmoqda: ${videoProgress}%`}
                  >
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-rose-600 transition-[width]"
                        style={{ width: `${videoProgress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right font-semibold text-rose-700">
                      {videoProgress}%
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={!videoFile || busy}
                onClick={() => void uploadVideo()}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-40"
              >
                <Upload className="h-4 w-4" />
                {selectedLesson.video ? t("replace_video") : t("upload_video")}
              </button>
              {selectedLesson.video && (
                <button
                  onClick={() =>
                    void run(
                      () =>
                        api(`/media/videos/${selectedLesson.video!.id}`, {
                          method: "DELETE",
                        }),
                      t("video_deleted"),
                    )
                  }
                  className="min-h-10 rounded-xl px-3 text-sm font-semibold text-red-600"
                >
                  {t("delete")}
                </button>
              )}
            </div>
          </MediaCard>
          <MediaCard
            title="Imo-ishora tili videosi"
            hint="Video matnini teleprompterdan kuzatib, surdo-tarjimonni kamerada yozib oling yoki tayyor yozuvni yuklang. Tarjima o‘quvchi videosi bilan sinxron ko‘rsatiladi."
            icon={<Languages className="h-5 w-5" />}
            className="xl:col-span-2"
          >
            <TextToSurdoTranslator
              value={surdoScript}
              onTextChange={(nextText) => {
                setSurdoScript(nextText)
                setSurdoScriptEdited(true)
              }}
              inputLabel="Video matni"
              inputPlaceholder="Videodagi nutq matnini kiriting..."
            />
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                disabled={!surdoScript.trim() || !surdoScriptEdited || busy}
                onClick={() => void saveVideoScript()}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Video matnini saqlash
              </button>
              {!surdoScriptEdited && surdoScript.trim() && (
                <span className="text-xs font-medium text-emerald-700">
                  Matn saqlangan
                </span>
              )}
            </div>
            {selectedLesson.video ? (
              <div className="mt-5">
                <SignLanguageRecorder
                  key={selectedLesson.id}
                  script={surdoScript}
                  disabled={busy}
                  onRecorded={setSignLanguageFile}
                />
                <div className="my-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  yoki tayyor video
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <input
                  key={signInputKey}
                  type="file"
                  accept="video/mp4,video/webm,.mp4,.webm"
                  onChange={(event) =>
                    setSignLanguageFile(event.target.files?.[0] || null)
                  }
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:font-semibold file:text-white"
                />
                {signLanguageFile && (
                  <p className="mt-3 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700">
                    {signLanguageFile.name} ·{" "}
                    {formatBytes(signLanguageFile.size)}
                  </p>
                )}
                {selectedLesson.video.signLanguageUrl && (
                  <video
                    key={selectedLesson.video.signLanguageUrl}
                    src={selectedLesson.video.signLanguageUrl}
                    controls
                    muted
                    preload="metadata"
                    className="mt-4 aspect-video w-full rounded-xl bg-black"
                  />
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!signLanguageFile || busy}
                    onClick={() => void uploadSignLanguage()}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    <Upload className="h-4 w-4" />
                    {selectedLesson.video.signLanguageUrl
                      ? "Videoni almashtirish"
                      : "Imo-ishora videosini yuklash"}
                  </button>
                  {selectedLesson.video.signLanguageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        void run(
                          () =>
                            api(
                              `/media/videos/${selectedLesson.video!.id}/sign-language`,
                              { method: "DELETE" },
                            ),
                          "Imo-ishora videosi o‘chirildi",
                        )
                      }
                      className="min-h-10 px-3 text-sm font-semibold text-red-600"
                    >
                      {t("delete")}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <Empty text="Video yozish yoki yuklash uchun avval asosiy dars videosini yuklang. Matn → Surdo tarjimon esa videosiz ham ishlaydi." />
              </div>
            )}
          </MediaCard>
          <MediaCard
            title={t("lesson_image")}
            hint={t("image_lesson_hint")}
            icon={<ImagePlus className="h-5 w-5" />}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(event) =>
                setImageFile(event.target.files?.[0] || null)
              }
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:font-semibold file:text-white"
            />
            {selectedLesson.imageUrl && (
              <img
                src={selectedLesson.imageUrl}
                alt={selectedLesson.title}
                className="mt-4 aspect-video w-full rounded-xl object-cover"
              />
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={!imageFile || busy}
                onClick={uploadImage}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white disabled:opacity-40"
              >
                <ImagePlus className="h-4 w-4" />
                {selectedLesson.imageUrl
                  ? t("replace_image")
                  : t("upload_image")}
              </button>
              {selectedLesson.imageUrl?.startsWith("/api/media/assets/") && (
                <button
                  onClick={() =>
                    void run(
                      () =>
                        api(`/media/lessons/${selectedLesson.id}/image`, {
                          method: "DELETE",
                        }),
                      t("image_deleted"),
                    )
                  }
                  className="min-h-10 rounded-xl px-3 text-sm font-semibold text-red-600"
                >
                  {t("delete")}
                </button>
              )}
            </div>
          </MediaCard>
          <MediaCard
            title={t("additional_materials")}
            hint={t("materials_hint")}
            icon={<FileText className="h-5 w-5" />}
          >
            <input
              type="file"
              onChange={(event) =>
                setMaterialFile(event.target.files?.[0] || null)
              }
              className="block w-full text-sm"
            />
            <button
              disabled={!materialFile || busy}
              onClick={uploadMaterial}
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 disabled:opacity-40"
            >
              <FileText className="h-4 w-4" />
              {t("upload_material")}
            </button>
            <div className="mt-3 space-y-2">
              {selectedLesson.attachments?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center rounded-lg bg-[#fff9fb] px-3 py-2 text-sm"
                >
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 truncate text-rose-700"
                  >
                    {item.name}
                  </a>
                  <button
                    onClick={() =>
                      void run(
                        () =>
                          api(`/media/attachments/${item.id}`, {
                            method: "DELETE",
                          }),
                        t("material_deleted"),
                      )
                    }
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </MediaCard>
          <MediaCard
            title="Avtomatik subtitr"
            hint="Har bir subtitr matni bilan birga boshlanish va tugash vaqtini belgilang yoki dars matnidan avtomatik yarating."
            icon={<FileText className="h-5 w-5" />}
          >
            {selectedLesson.video ? (
              <>
                <div className="mb-3 grid gap-3 sm:grid-cols-[180px_1fr] sm:items-end">
                  <label className="text-sm font-semibold text-slate-700">
                    Subtitr tili
                    <select
                      value={subtitleLanguage}
                      onChange={(event) =>
                        setSubtitleLanguage(event.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal"
                    >
                      <option value="uz-UZ">O‘zbekcha</option>
                      <option value="ru-RU">Русский</option>
                      <option value="en-US">English</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={generateSubtitles}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Dars matnidan avtomatik yaratish
                  </button>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  Subtitr matni va vaqt kodlari (WebVTT)
                  <textarea
                    value={subtitleText}
                    onChange={(event) => setSubtitleText(event.target.value)}
                    placeholder={subtitleSample}
                    rows={13}
                    spellCheck={false}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-mono text-xs leading-6 outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </label>
                <div className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">
                  Format: <code>00:00:00.000 --&gt; 00:00:05.000</code>. Keyingi
                  qatorda shu vaqt oralig‘ida ko‘rinadigan matn yoziladi.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!subtitleText.trim() || busy}
                    onClick={() =>
                      void run(
                        () =>
                          api(
                            `/media/videos/${selectedLesson.video!.id}/subtitles/${subtitleLanguage}`,
                            {
                              method: "PUT",
                              body: { content: subtitleText, enabled: true },
                            },
                          ),
                        t("subtitle_saved"),
                      )
                    }
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    <Save className="h-4 w-4" />
                    {t("save")}
                  </button>
                </div>
              </>
            ) : (
              <Empty text={t("upload_video_for_subtitle")} />
            )}
          </MediaCard>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50 p-8 text-center">
          <Film className="mx-auto h-10 w-10 text-rose-600" />
          <h3 className="mt-3 font-display text-lg font-bold text-slate-900">
            Video yuklash uchun avval dars yarating
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Video modul ichidagi darsga biriktiriladi. Modul va darsni
            yaratgach, shu yerda MP4 yoki WebM faylni yuklaysiz.
          </p>
          <button
            type="button"
            onClick={onCreateLesson}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700"
          >
            <Plus className="h-4 w-4" />
            Modul va dars yaratish
          </button>
        </div>
      )}
    </div>
  )
}

function SignLanguageRecorder({
  script,
  disabled,
  onRecorded,
}: {
  script: string
  disabled: boolean
  onRecorded: (file: File) => void
}) {
  const previewRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState("")

  const stopTimer = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current)
    timerRef.current = null
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (previewRef.current) previewRef.current.srcObject = null
    setCameraReady(false)
  }

  useEffect(
    () => () => {
      stopTimer()
      streamRef.current?.getTracks().forEach((track) => track.stop())
    },
    [],
  )

  const openCamera = async () => {
    setError("")
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Bu brauzer kameradan yozib olishni qo‘llab-quvvatlamaydi.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (previewRef.current) {
        previewRef.current.srcObject = stream
        await previewRef.current.play()
      }
      setCameraReady(true)
    } catch {
      setError("Kameraga ruxsat berilmadi. Brauzer sozlamasidan ruxsat bering.")
    }
  }

  const startRecording = () => {
    const stream = streamRef.current
    if (!stream || typeof MediaRecorder === "undefined") {
      setError("Bu brauzer video yozishni qo‘llab-quvvatlamaydi.")
      return
    }
    const candidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4",
    ]
    const mimeType = candidates.find((type) =>
      MediaRecorder.isTypeSupported(type),
    )
    try {
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "video/webm"
        const extension = type.includes("mp4") ? "mp4" : "webm"
        const blob = new Blob(chunksRef.current, { type })
        if (blob.size) {
          onRecorded(
            new File([blob], `surdo-tarjima-${Date.now()}.${extension}`, {
              type,
            }),
          )
        }
        stopTimer()
        setRecording(false)
      }
      recorderRef.current = recorder
      recorder.start(500)
      setElapsed(0)
      timerRef.current = window.setInterval(
        () => setElapsed((value) => value + 1),
        1000,
      )
      setRecording(true)
      setError("")
    } catch {
      setError("Video yozishni boshlashda xatolik yuz berdi.")
    }
  }

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop()
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl bg-slate-950">
          <video
            ref={previewRef}
            muted
            playsInline
            aria-label="Surdo-tarjimon kamera tasviri"
            className="aspect-video w-full object-cover [transform:scaleX(-1)]"
          />
        </div>
        <div className="flex min-h-36 flex-col rounded-xl bg-white p-3 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
            Video matni · teleprompter
          </p>
          <div className="mt-2 max-h-32 flex-1 overflow-y-auto text-sm leading-6 text-slate-700">
            {script || (
              <span className="text-slate-400">
                Avval dars yoki subtitr matnini kiriting.
              </span>
            )}
          </div>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!cameraReady ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void openCamera()}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white disabled:opacity-40"
          >
            <Camera className="h-4 w-4" />
            Kamerani yoqish
          </button>
        ) : recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white"
          >
            <Square className="h-4 w-4 fill-current" />
            Yozishni tugatish
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={disabled || !script}
              onClick={startRecording}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-40"
            >
              <span className="h-3 w-3 rounded-full bg-white" />
              Tarjimani yozish
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="min-h-10 rounded-xl px-3 text-sm font-semibold text-slate-600"
            >
              Kamerani o‘chirish
            </button>
          </>
        )}
        {recording && (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-700">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
            {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
            {String(elapsed % 60).padStart(2, "0")}
          </span>
        )}
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Tarjima asosiy video bilan bir vaqtda boshlanishi uchun yozishni video
        matnining boshidan boshlang. Yozuv tayyor bo‘lgach, quyidagi yuklash
        tugmasini bosing.
      </p>
    </div>
  )
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function MediaCard({
  title,
  hint,
  icon,
  children,
  className = "",
}: {
  title: string
  hint: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          {icon}
        </span>
        <div>
          <h3 className="font-display font-bold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">{hint}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function IconButton({
  label,
  danger,
  onClick,
  children,
}: {
  label: string
  danger?: boolean
  onClick: () => void
  children: React.ReactElement<{ className?: string }>
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
        danger
          ? "text-red-500 hover:bg-red-50"
          : "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
      }`}
    >
      {children}
    </button>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-[#fff9fb] p-8 text-center text-sm text-slate-500">
      {text}
    </div>
  )
}
