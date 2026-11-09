import { Router } from "express"
import {
  LessonType,
  PublishStatus,
  QuestionType,
  UserRole,
} from "@prisma/client"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { ApiError, pathParam, validate } from "../lib/http.js"
import { allowRoles, requireAuth } from "../middleware/auth.js"
import { calculateEnrollmentMetrics, ensureCertificate } from "./learning.js"

export const quizzesRouter = Router()

async function ownedQuiz(
  quizId: string,
  auth: NonNullable<Express.Request["auth"]>,
) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { lesson: { include: { module: { include: { course: true } } } } },
  })
  if (!quiz) throw new ApiError(404, "Test topilmadi")
  return quiz
}

async function validateQuizPlacement(
  lesson: { id: string; type: LessonType },
  interruptAtSeconds: number | null,
  ignoreQuizId?: string,
  requireVideo = false,
) {
  if (interruptAtSeconds !== null && lesson.type !== LessonType.VIDEO)
    throw new ApiError(422, "Video ichidagi test faqat video darsga qo‘shiladi")

  const duplicate = await prisma.quiz.findFirst({
    where: {
      lessonId: lesson.id,
      interruptAtSeconds,
      ...(ignoreQuizId && { id: { not: ignoreQuizId } }),
    },
    select: { id: true },
  })
  if (duplicate)
    throw new ApiError(
      409,
      interruptAtSeconds === null
        ? "Bu dars uchun video oxiridagi test allaqachon mavjud"
        : "Bu vaqtda boshqa test allaqachon mavjud",
    )

  if (interruptAtSeconds !== null) {
    const video = await prisma.video.findUnique({
      where: { lessonId: lesson.id },
      select: { duration: true },
    })
    if (!video && requireVideo)
      throw new ApiError(
        422,
        "Video ichidagi testni nashr qilishdan oldin dars videosini yuklang",
      )
    if (video?.duration && interruptAtSeconds >= video.duration)
      throw new ApiError(
        422,
        "Test vaqti video davomiyligidan oldin bo‘lishi kerak",
      )
  }
}

quizzesRouter.get("/:id", requireAuth, async (req, res) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: pathParam(req.params.id) },
    include: {
      questions: { orderBy: { order: "asc" } },
      lesson: { select: { id: true, type: true } },
    },
  })
  if (
    !quiz ||
    (req.auth!.role === UserRole.STUDENT &&
      quiz.status !== PublishStatus.PUBLISHED)
  )
    throw new ApiError(404, "Test topilmadi")
  if (
    req.auth!.role === UserRole.STUDENT &&
    quiz.lesson.type !== LessonType.QUIZ &&
    quiz.interruptAtSeconds === null
  ) {
    const watched = await prisma.lessonCompletion.findFirst({
      where: {
        lessonId: quiz.lesson.id,
        enrollment: { userId: req.auth!.sub },
      },
    })
    if (!watched)
      throw new ApiError(
        409,
        "Testni boshlash uchun avval videoni oxirigacha ko‘ring",
      )
  }
  const questions = quiz.questions.map(
    ({ correctAnswers, explanation, ...question }) =>
      req.auth!.role === UserRole.STUDENT
        ? question
        : { ...question, correctAnswers, explanation },
  )
  const alreadyPassed =
    req.auth!.role === UserRole.STUDENT
      ? Boolean(
          await prisma.quizAttempt.findFirst({
            where: { quizId: quiz.id, userId: req.auth!.sub, passed: true },
            select: { id: true },
          }),
        )
      : false
  res.json({ quiz: { ...quiz, questions, alreadyPassed } })
})

const questionFields = {
  text: z.string().trim().min(2).max(2000),
  type: z.enum(["single", "multiple", "truefalse"]),
  options: z
    .array(z.object({ id: z.string().min(1), text: z.string().trim().min(1) }))
    .min(2)
    .max(26),
  correctAnswers: z.array(z.string().min(1)).min(1),
  explanation: z.string().max(3000).optional(),
  order: z.number().int().positive(),
  points: z.number().int().min(1).max(100).default(1),
}
const questionSchema = z
  .object(questionFields)
  .superRefine((question, context) => {
    const optionIds = question.options.map((option) => option.id)
    if (new Set(optionIds).size !== optionIds.length)
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "Variant identifikatorlari takrorlanmasligi kerak",
      })
    if (
      new Set(question.correctAnswers).size !== question.correctAnswers.length
    )
      context.addIssue({
        code: "custom",
        path: ["correctAnswers"],
        message: "To'g'ri javoblar takrorlangan",
      })
    if (question.correctAnswers.some((answer) => !optionIds.includes(answer)))
      context.addIssue({
        code: "custom",
        path: ["correctAnswers"],
        message: "To'g'ri javob variantlar ichida bo'lishi kerak",
      })
    if (question.type !== "multiple" && question.correctAnswers.length !== 1)
      context.addIssue({
        code: "custom",
        path: ["correctAnswers"],
        message: "Bu savol turida bitta to'g'ri javob bo'lishi kerak",
      })
    if (question.type === "multiple" && question.correctAnswers.length < 2)
      context.addIssue({
        code: "custom",
        path: ["correctAnswers"],
        message: "Ko'p javobli savolda kamida ikkita to'g'ri javob kerak",
      })
    if (question.type === "truefalse" && question.options.length !== 2)
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "To'g'ri/noto'g'ri savolda aynan ikkita variant kerak",
      })
  })

quizzesRouter.post(
  "/lesson/:lessonId",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const input = validate(
      z.object({
        title: z.string().min(2).max(180),
        passingScore: z.number().int().min(70).max(100).default(70),
        interruptAtSeconds: z
          .number()
          .int()
          .min(1)
          .max(86_400)
          .nullable()
          .default(null),
        status: z.enum(["draft", "published", "hidden"]).default("draft"),
        questions: z.array(questionSchema).default([]),
      }),
      req.body,
    )
    const lesson = await prisma.lesson.findUnique({
      where: { id: pathParam(req.params.lessonId) },
      include: { module: { include: { course: true } } },
    })
    if (!lesson) throw new ApiError(404, "Dars topilmadi")
    if (input.status === "published" && input.questions.length === 0)
      throw new ApiError(
        422,
        "Kamida bitta savol qo‘shmasdan testni nashr qilib bo‘lmaydi",
      )
    await validateQuizPlacement(
      lesson,
      input.interruptAtSeconds,
      undefined,
      input.status === "published",
    )
    const quiz = await prisma.quiz.create({
      data: {
        lessonId: lesson.id,
        title: input.title,
        passingScore: input.passingScore,
        interruptAtSeconds: input.interruptAtSeconds,
        status: input.status.toUpperCase() as PublishStatus,
        questions: {
          create: input.questions.map((item) => ({
            ...item,
            type:
              item.type === "truefalse"
                ? QuestionType.TRUE_FALSE
                : item.type.toUpperCase() as QuestionType,
          })),
        },
      },
      include: { questions: true },
    })
    res.status(201).json({ quiz })
  },
)

quizzesRouter.patch(
  "/:id",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const quiz = await ownedQuiz(pathParam(req.params.id), req.auth!)
    const input = validate(
      z.object({
        title: z.string().min(2).max(180).optional(),
        passingScore: z.number().int().min(70).max(100).optional(),
        interruptAtSeconds: z
          .number()
          .int()
          .min(1)
          .max(86_400)
          .nullable()
          .optional(),
        status: z.enum(["draft", "published", "hidden"]).optional(),
      }),
      req.body,
    )
    const { status, ...changes } = input
    const effectiveInterrupt =
      input.interruptAtSeconds === undefined
        ? quiz.interruptAtSeconds
        : input.interruptAtSeconds
    await validateQuizPlacement(
      { id: quiz.lesson.id, type: quiz.lesson.type },
      effectiveInterrupt,
      quiz.id,
      status === "published" ||
        (status === undefined && quiz.status === PublishStatus.PUBLISHED),
    )
    if (status === "published") {
      const questionCount = await prisma.question.count({
        where: { quizId: quiz.id },
      })
      if (questionCount === 0)
        throw new ApiError(
          422,
          "Kamida bitta savol qo'shmasdan testni nashr qilib bo'lmaydi",
        )
    }
    res.json({
      quiz: await prisma.quiz.update({
        where: { id: quiz.id },
        data: {
          ...changes,
          ...(status && { status: status.toUpperCase() as PublishStatus }),
        },
      }),
    })
  },
)

quizzesRouter.delete(
  "/:id",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const quiz = await ownedQuiz(pathParam(req.params.id), req.auth!)
    await prisma.quiz.delete({ where: { id: quiz.id } })
    res.status(204).end()
  },
)

quizzesRouter.post(
  "/:id/questions",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const quiz = await ownedQuiz(pathParam(req.params.id), req.auth!)
    const input = validate(questionSchema, req.body)
    const question = await prisma.question.create({
      data: {
        ...input,
        quizId: quiz.id,
        type:
          input.type === "truefalse"
            ? QuestionType.TRUE_FALSE
            : input.type.toUpperCase() as QuestionType,
      },
    })
    res.status(201).json({ question })
  },
)

quizzesRouter.patch(
  "/questions/:questionId",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const questionId = pathParam(req.params.questionId)
    const existing = await prisma.question.findUnique({
      where: { id: questionId },
    })
    if (!existing) throw new ApiError(404, "Savol topilmadi")
    await ownedQuiz(existing.quizId, req.auth!)
    const changes = validate(z.object(questionFields).partial(), req.body)
    const input = validate(questionSchema, {
      text: changes.text ?? existing.text,
      type:
        changes.type ??
        existing.type.toLowerCase().replace("true_false", "truefalse"),
      options: changes.options ?? existing.options,
      correctAnswers: changes.correctAnswers ?? existing.correctAnswers,
      explanation: changes.explanation ?? existing.explanation ?? undefined,
      order: changes.order ?? existing.order,
      points: changes.points ?? existing.points,
    })
    const { type, ...validated } = input
    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...validated,
        ...(type && {
          type:
            type === "truefalse"
              ? QuestionType.TRUE_FALSE
              : type.toUpperCase() as QuestionType,
        }),
      },
    })
    res.json({ question })
  },
)

quizzesRouter.delete(
  "/questions/:questionId",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const questionId = pathParam(req.params.questionId)
    const existing = await prisma.question.findUnique({
      where: { id: questionId },
    })
    if (!existing) throw new ApiError(404, "Savol topilmadi")
    await ownedQuiz(existing.quizId, req.auth!)
    await prisma.question.delete({ where: { id: questionId } })
    res.status(204).end()
  },
)

quizzesRouter.post(
  "/:id/submit",
  requireAuth,
  allowRoles(UserRole.STUDENT),
  async (req, res) => {
    const { answers } = validate(
      z.object({ answers: z.record(z.string(), z.array(z.string())) }),
      req.body,
    )
    const quiz = await prisma.quiz.findFirst({
      where: { id: pathParam(req.params.id), status: PublishStatus.PUBLISHED },
      include: {
        questions: true,
        lesson: {
          select: {
            id: true,
            type: true,
            module: { select: { courseId: true } },
          },
        },
      },
    })
    if (!quiz) throw new ApiError(404, "Test topilmadi")
    if (
      quiz.lesson.type !== LessonType.QUIZ &&
      quiz.interruptAtSeconds === null
    ) {
      const watched = await prisma.lessonCompletion.findFirst({
        where: {
          lessonId: quiz.lesson.id,
          enrollment: { userId: req.auth!.sub },
        },
      })
      if (!watched)
        throw new ApiError(
          409,
          "Testni topshirish uchun avval videoni oxirigacha ko‘ring",
        )
    }
    let score = 0
    const feedback = quiz.questions.map((question) => {
      const expected = [...question.correctAnswers as string[]].sort()
      const supplied = [...(answers[question.id] || [])].sort()
      const correct = JSON.stringify(expected) === JSON.stringify(supplied)
      if (correct) score += question.points
      return {
        questionId: question.id,
        correct,
        correctAnswers: expected,
        explanation: question.explanation,
      }
    })
    const total = quiz.questions.reduce(
      (sum, question) => sum + question.points,
      0,
    )
    const percentage = total ? Math.round((score / total) * 100) : 0
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: req.auth!.sub,
        answers,
        score,
        total,
        percentage,
        passed: percentage >= Math.max(70, quiz.passingScore),
      },
    })
    await prisma.activityLog.create({
      data: {
        userId: req.auth!.sub,
        action: "SUBMIT_QUIZ",
        entity: "Quiz",
        entityId: quiz.id,
        metadata: { percentage },
      },
    })
    if (attempt.passed && quiz.interruptAtSeconds === null) {
      const courseId = quiz.lesson.module.courseId
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: req.auth!.sub, courseId } },
      })
      if (enrollment) {
        await prisma.lessonCompletion.upsert({
          where: {
            enrollmentId_lessonId: {
              enrollmentId: enrollment.id,
              lessonId: quiz.lesson.id,
            },
          },
          update: {},
          create: {
            enrollmentId: enrollment.id,
            lessonId: quiz.lesson.id,
          },
        })
        const metrics = await calculateEnrollmentMetrics(
          enrollment.id,
          enrollment.userId,
          enrollment.courseId,
        )
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: {
            progress: metrics.progress,
            lastLessonId: quiz.lesson.id,
            lastActivityAt: new Date(),
          },
        })
        await ensureCertificate(enrollment.userId, enrollment.courseId, metrics)
      }
    }
    res.status(201).json({ result: { ...attempt, feedback } })
  },
)

quizzesRouter.get("/:id/attempts", requireAuth, async (req, res) => {
  const quizId = pathParam(req.params.id)
  const where =
    req.auth!.role === UserRole.STUDENT
      ? { quizId, userId: req.auth!.sub }
      : { quizId }
  res.json({
    attempts: await prisma.quizAttempt.findMany({
      where,
      orderBy: { completedAt: "desc" },
    }),
  })
})
