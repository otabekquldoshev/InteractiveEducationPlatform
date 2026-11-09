import { Router } from "express"
import { PublishStatus, UserRole } from "@prisma/client"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { ApiError, pathParam, validate } from "../lib/http.js"
import { allowRoles, requireAuth } from "../middleware/auth.js"

export const learningRouter = Router()
learningRouter.use(requireAuth)

export type EnrollmentMetrics = {
  progress: number
  certificateEligible: boolean
  certificateScore?: number
  completedAt?: string
}

export async function calculateEnrollmentMetrics(
  enrollmentId: string,
  userId: string,
  courseId: string,
): Promise<EnrollmentMetrics> {
  const lessons = await prisma.lesson.findMany({
    where: { module: { courseId }, status: PublishStatus.PUBLISHED },
    select: {
      id: true,
      quizzes: { select: { id: true, status: true, passingScore: true } },
    },
  })
  const completions = await prisma.lessonCompletion.findMany({
    where: { enrollmentId },
    select: { lessonId: true, completedAt: true },
  })
  // Sertifikat hisobi testning joylashuviga bog‘liq emas: alohida yakuniy,
  // video tugagandan keyingi va video ichidagi barcha nashr qilingan testlar
  // o‘quvchining eng yaxshi natijasi bilan hisobga olinadi.
  const publishedQuizzes = lessons
    .flatMap((lesson) => lesson.quizzes)
    .filter((quiz): quiz is NonNullable<typeof quiz> =>
      Boolean(quiz && quiz.status === PublishStatus.PUBLISHED),
    )
  const attempts = publishedQuizzes.length
    ? await prisma.quizAttempt.findMany({
        where: {
          userId,
          quizId: { in: publishedQuizzes.map((quiz) => quiz.id) },
        },
        select: { quizId: true, percentage: true, completedAt: true },
      })
    : []
  const bestAttempts = new Map<string, {
    percentage: number
    completedAt: Date
  }>()
  for (const attempt of attempts) {
    const current = bestAttempts.get(attempt.quizId)
    if (!current || attempt.percentage > current.percentage)
      bestAttempts.set(attempt.quizId, attempt)
  }
  const completedLessonIds = new Set(
    completions.map((completion) => completion.lessonId),
  )
  const effectiveCompleted = lessons.filter((lesson) => {
    if (!completedLessonIds.has(lesson.id)) return false
    const requiredQuizzes = lesson.quizzes.filter(
      (quiz) => quiz.status === PublishStatus.PUBLISHED,
    )
    return requiredQuizzes.every((quiz) => {
      const best = bestAttempts.get(quiz.id)
      return Boolean(best) && best!.percentage >= Math.max(70, quiz.passingScore)
    })
  }).length
  const progress = lessons.length
    ? Math.min(100, Math.round((effectiveCompleted / lessons.length) * 100))
    : 0
  const certificateEligible =
    progress === 100 &&
    lessons.length > 0 &&
    publishedQuizzes.every(
      (quiz) =>
        (bestAttempts.get(quiz.id)?.percentage || 0) >=
        Math.max(70, quiz.passingScore),
    )
  const certificateScore = certificateEligible
    ? publishedQuizzes.length
      ? Math.round(
          publishedQuizzes.reduce(
            (sum, quiz) => sum + (bestAttempts.get(quiz.id)?.percentage || 0),
            0,
          ) / publishedQuizzes.length,
        )
      : 100
    : undefined
  const completionTimes = [
    ...completions.map((entry) => entry.completedAt.getTime()),
    ...Array.from(bestAttempts.values()).map((entry) =>
      entry.completedAt.getTime(),
    ),
  ]
  return {
    progress,
    certificateEligible,
    certificateScore,
    completedAt:
      certificateEligible && completionTimes.length
        ? new Date(Math.max(...completionTimes)).toISOString()
        : undefined,
  }
}

export async function ensureCertificate(
  userId: string,
  courseId: string,
  metrics: EnrollmentMetrics,
) {
  // Issuance is idempotent: a learner receives one permanent certificate per course.
  if (!metrics.certificateEligible || metrics.certificateScore === undefined)
    return null
  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
  })
  if (existing) return existing
  const [user, course] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    }),
    prisma.course.findUnique({
      where: { id: courseId },
      select: { title: true },
    }),
  ])
  if (!user || !course) return null
  return prisma.certificate
    .create({
      data: {
        userId,
        courseId,
        recipientName: `${user.firstName} ${user.lastName}`.trim(),
        courseName: course.title,
        score: metrics.certificateScore,
        issuedAt: metrics.completedAt
          ? new Date(metrics.completedAt)
          : new Date(),
      },
    })
    .catch(() =>
      prisma.certificate.findUnique({
        where: { userId_courseId: { userId, courseId } },
      }),
    )
}

function certificateDto(item: {
  id: string
  verificationCode: string
  userId: string
  courseId: string
  recipientName: string
  courseName: string
  score: number
  issuedAt: Date
}) {
  return {
    ...item,
    issuedAt: item.issuedAt.toISOString(),
  }
}

function enrollmentDto(
  item: {
    id: string
    userId: string
    courseId: string
    progress: number
    lastLessonId: string | null
    enrolledAt: Date
    lastActivityAt: Date
    completions: Array<{ lessonId: string; completedAt: Date }>
  },
  metrics?: EnrollmentMetrics,
) {
  return {
    id: item.id,
    userId: item.userId,
    courseId: item.courseId,
    progress: metrics?.progress ?? item.progress,
    lastLessonId: item.lastLessonId || undefined,
    enrolledAt: item.enrolledAt.toISOString().slice(0, 10),
    lastActivityAt: item.lastActivityAt.toISOString(),
    completedAt: metrics?.completedAt,
    certificateEligible: metrics?.certificateEligible || false,
    certificateScore: metrics?.certificateScore,
    completedLessons: item.completions.map((entry) => entry.lessonId),
  }
}

learningRouter.get("/enrollments", async (req, res) => {
  const items = await prisma.enrollment.findMany({
    where:
      req.auth!.role === UserRole.STUDENT
        ? { userId: req.auth!.sub }
        : undefined,
    include: {
      completions: { select: { lessonId: true, completedAt: true } },
    },
    orderBy: { lastActivityAt: "desc" },
  })
  const enrollments = await Promise.all(
    items.map(async (item) => {
      const metrics = await calculateEnrollmentMetrics(
        item.id,
        item.userId,
        item.courseId,
      )
      if (item.progress !== metrics.progress)
        await prisma.enrollment.update({
          where: { id: item.id },
          data: { progress: metrics.progress },
        })
      const certificate = await ensureCertificate(
        item.userId,
        item.courseId,
        metrics,
      )
      return {
        ...enrollmentDto(item, metrics),
        certificateId: certificate?.id,
        certificateVerificationCode: certificate?.verificationCode,
      }
    }),
  )
  res.json({ enrollments })
})

learningRouter.get(
  "/certificates",
  allowRoles(UserRole.STUDENT),
  async (req, res) => {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.auth!.sub },
      select: { id: true, userId: true, courseId: true },
    })
    await Promise.all(
      enrollments.map(async (enrollment) => {
        const metrics = await calculateEnrollmentMetrics(
          enrollment.id,
          enrollment.userId,
          enrollment.courseId,
        )
        await ensureCertificate(enrollment.userId, enrollment.courseId, metrics)
      }),
    )
    const certificates = await prisma.certificate.findMany({
      where: { userId: req.auth!.sub },
      orderBy: { issuedAt: "desc" },
    })
    res.json({ certificates: certificates.map(certificateDto) })
  },
)

learningRouter.get(
  "/dashboard-stats",
  allowRoles(UserRole.STUDENT),
  async (req, res) => {
    const userId = req.auth!.sub
    const startOfPeriod = new Date()
    startOfPeriod.setHours(0, 0, 0, 0)
    startOfPeriod.setDate(startOfPeriod.getDate() - 6)

    const [attempts, completions] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: { userId },
        select: {
          id: true,
          quizId: true,
          percentage: true,
          completedAt: true,
          quiz: {
            select: {
              title: true,
              lesson: {
                select: {
                  module: {
                    select: { course: { select: { title: true } } },
                  },
                },
              },
            },
          },
        },
        orderBy: { completedAt: "desc" },
      }),
      prisma.lessonCompletion.findMany({
        where: { enrollment: { userId } },
        select: {
          id: true,
          completedAt: true,
          lesson: {
            select: {
              title: true,
              module: {
                select: { course: { select: { title: true } } },
              },
            },
          },
        },
        orderBy: { completedAt: "desc" },
      }),
    ])

    const bestAttemptByQuiz = new Map<string, number>()
    for (const attempt of attempts) {
      bestAttemptByQuiz.set(
        attempt.quizId,
        Math.max(
          bestAttemptByQuiz.get(attempt.quizId) || 0,
          attempt.percentage,
        ),
      )
    }
    const bestScores = Array.from(bestAttemptByQuiz.values())
    const averageQuizScore = bestScores.length
      ? Math.round(
          bestScores.reduce((sum, percentage) => sum + percentage, 0) /
            bestScores.length,
        )
      : 0

    const dateKey = (date: Date) =>
      [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-")
    const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfPeriod)
      date.setDate(startOfPeriod.getDate() + index)
      return { date: dateKey(date), activities: 0 }
    })
    const activityByDate = new Map(
      weeklyActivity.map((item) => [item.date, item]),
    )
    for (const item of [...attempts, ...completions]) {
      if (item.completedAt < startOfPeriod) continue
      const day = activityByDate.get(dateKey(item.completedAt))
      if (day) day.activities += 1
    }

    const recentActivity = [
      ...completions.map((completion) => ({
        id: `lesson-${completion.id}`,
        type: "lesson" as const,
        title: completion.lesson.title,
        context: completion.lesson.module.course.title,
        createdAt: completion.completedAt,
      })),
      ...attempts.map((attempt) => ({
        id: `quiz-${attempt.id}`,
        type: "quiz" as const,
        title: attempt.quiz.title,
        context: attempt.quiz.lesson.module.course.title,
        score: attempt.percentage,
        createdAt: attempt.completedAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      }))

    res.json({
      averageQuizScore,
      quizResultsCount: bestScores.length,
      weeklyActivity,
      recentActivity,
    })
  },
)

learningRouter.post(
  "/enrollments",
  allowRoles(UserRole.STUDENT),
  async (req, res) => {
    const { courseId } = validate(
      z.object({ courseId: z.string().min(1) }),
      req.body,
    )
    const course = await prisma.course.findFirst({
      where: { id: courseId, status: PublishStatus.PUBLISHED },
    })
    if (!course) throw new ApiError(404, "Nashr qilingan fan topilmadi")
    const item = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: req.auth!.sub, courseId } },
      update: {},
      create: { userId: req.auth!.sub, courseId },
      include: {
        completions: { select: { lessonId: true, completedAt: true } },
      },
    })
    const metrics = await calculateEnrollmentMetrics(
      item.id,
      item.userId,
      item.courseId,
    )
    res.status(201).json({ enrollment: enrollmentDto(item, metrics) })
  },
)

learningRouter.post(
  "/enrollments/:courseId/lessons/:lessonId/complete",
  allowRoles(UserRole.STUDENT),
  async (req, res) => {
    const courseId = pathParam(req.params.courseId)
    const lessonId = pathParam(req.params.lessonId)
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        module: { courseId },
        status: PublishStatus.PUBLISHED,
      },
      include: {
        quizzes: {
          select: { id: true, status: true, interruptAtSeconds: true },
        },
      },
    })
    if (!lesson) throw new ApiError(404, "Dars topilmadi")
    const checkpoints = lesson.quizzes.filter(
      (quiz) =>
        quiz.status === PublishStatus.PUBLISHED &&
        quiz.interruptAtSeconds !== null,
    )
    if (checkpoints.length) {
      const passedCheckpoints = await prisma.quizAttempt.findMany({
        where: {
          quizId: { in: checkpoints.map((quiz) => quiz.id) },
          userId: req.auth!.sub,
          passed: true,
        },
        distinct: ["quizId"],
        select: { quizId: true },
      })
      if (passedCheckpoints.length !== checkpoints.length)
        throw new ApiError(
          409,
          "Videoni yakunlash uchun ichki testdan muvaffaqiyatli o‘ting",
        )
    }
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.auth!.sub, courseId } },
    })
    if (!enrollment) throw new ApiError(409, "Avval fanga yoziling")
    await prisma.lessonCompletion.upsert({
      where: {
        enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
      },
      update: {},
      create: { enrollmentId: enrollment.id, lessonId },
    })
    const metrics = await calculateEnrollmentMetrics(
      enrollment.id,
      enrollment.userId,
      enrollment.courseId,
    )
    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        lastLessonId: lessonId,
        progress: metrics.progress,
        lastActivityAt: new Date(),
      },
      include: {
        completions: { select: { lessonId: true, completedAt: true } },
      },
    })
    const certificate = await ensureCertificate(
      enrollment.userId,
      enrollment.courseId,
      metrics,
    )
    await prisma.activityLog.create({
      data: {
        userId: req.auth!.sub,
        action: "COMPLETE_LESSON",
        entity: "Lesson",
        entityId: lessonId,
        metadata: { courseId },
      },
    })
    res.json({
      enrollment: {
        ...enrollmentDto(updated, metrics),
        certificateId: certificate?.id,
        certificateVerificationCode: certificate?.verificationCode,
      },
    })
  },
)

learningRouter.get("/courses/:courseId/rating", async (req, res) => {
  const courseId = pathParam(req.params.courseId)
  const rating = await prisma.courseRating.findUnique({
    where: { userId_courseId: { userId: req.auth!.sub, courseId } },
  })
  res.json({ rating: rating?.score || 0 })
})

learningRouter.put(
  "/courses/:courseId/rating",
  allowRoles(UserRole.STUDENT),
  async (req, res) => {
    const courseId = pathParam(req.params.courseId)
    const { score } = validate(
      z.object({ score: z.number().int().min(1).max(5) }),
      req.body,
    )
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.auth!.sub, courseId } },
    })
    if (!enrollment)
      throw new ApiError(409, "Kursni baholash uchun avval unga yoziling")
    const result = await prisma.$transaction(async (transaction) => {
      const rating = await transaction.courseRating.upsert({
        where: { userId_courseId: { userId: req.auth!.sub, courseId } },
        update: { score },
        create: { userId: req.auth!.sub, courseId, score },
      })
      const aggregate = await transaction.courseRating.aggregate({
        where: { courseId },
        _avg: { score: true },
        _count: { score: true },
      })
      const average = Number((aggregate._avg.score || 0).toFixed(1))
      await transaction.course.update({
        where: { id: courseId },
        data: { rating: average },
      })
      return { rating: rating.score, average, count: aggregate._count.score }
    })
    await prisma.activityLog.create({
      data: {
        userId: req.auth!.sub,
        action: "RATE_COURSE",
        entity: "Course",
        entityId: courseId,
        metadata: { score },
      },
    })
    res.json(result)
  },
)

learningRouter.get("/accessibility", async (req, res) => {
  const settings = await prisma.accessibilitySetting.upsert({
    where: { userId: req.auth!.sub },
    update: {},
    create: { userId: req.auth!.sub },
  })
  res.json({ settings })
})

const accessibilityInput = z.object({
  fontSize: z.number().int().min(80).max(150),
  highContrast: z.boolean(),
  darkMode: z.boolean(),
  reducedMotion: z.boolean(),
  dyslexiaFont: z.boolean(),
  lineSpacing: z.number().min(1).max(2.5),
  letterSpacing: z.number().min(0).max(5),
  largeButtons: z.boolean(),
  focusIndicator: z.boolean(),
  keyboardNavigation: z.boolean(),
  alwaysShowSubtitles: z.boolean(),
  textToSpeech: z.boolean(),
  speechRate: z.number().min(0.5).max(2),
})

learningRouter.put("/accessibility", async (req, res) => {
  const input = validate(accessibilityInput, req.body)
  const settings = await prisma.$transaction(async (tx) => {
    const saved = await tx.accessibilitySetting.upsert({
      where: { userId: req.auth!.sub },
      update: input,
      create: { userId: req.auth!.sub, ...input },
    })
    await tx.user.update({
      where: { id: req.auth!.sub },
      data: { accessibilitySetupDone: true },
    })
    return saved
  })
  res.json({ settings })
})
