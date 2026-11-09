import { Router } from "express"
import { UserRole } from "@prisma/client"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { ApiError, validate } from "../lib/http.js"
import { hashPassword } from "../lib/security.js"
import { publicUser } from "../lib/serializers.js"
import { allowRoles, requireAuth } from "../middleware/auth.js"

export const adminRouter = Router()
adminRouter.use(requireAuth, allowRoles(UserRole.ADMIN))

adminRouter.get("/stats", async (_req, res) => {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const learningActions = ["COMPLETE_LESSON", "SUBMIT_QUIZ"]
  const [
    students,
    courses,
    lessons,
    videos,
    completedLessons,
    activeSessions,
    recentLearningActivities,
  ] = await Promise.all([
      prisma.user.count({ where: { role: UserRole.STUDENT } }),
      prisma.course.count(),
      prisma.lesson.count(),
      prisma.video.count(),
      prisma.lessonCompletion.count(),
      prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
      prisma.activityLog.findMany({
        where: {
          createdAt: { gte: last24Hours },
          action: { in: learningActions },
          userId: { not: null },
        },
        select: { userId: true },
      }),
    ])
  const activeStudents24h = new Set(
    recentLearningActivities.map((item) => item.userId),
  ).size
  const recentActivity = await prisma.activityLog.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { firstName: true, lastName: true } } },
  })
  res.json({
    stats: {
      students,
      courses,
      lessons,
      videos,
      completedLessons,
      activeSessions,
      activeStudents24h,
      learningActivities24h: recentLearningActivities.length,
    },
    recentActivity,
  })
})

adminRouter.get("/users", async (req, res) => {
  const query = validate(
    z.object({
      role: z.enum(["student", "admin"]).optional(),
      search: z.string().optional(),
    }),
    req.query,
  )
  const users = await prisma.user.findMany({
    where: {
      ...(query.role && { role: query.role.toUpperCase() as UserRole }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search } },
          { lastName: { contains: query.search } },
          { email: { contains: query.search } },
        ],
      }),
    },
    orderBy: { createdAt: "desc" },
  })
  res.json({ users: users.map(publicUser) })
})

adminRouter.post("/users", async (req, res) => {
  const input = validate(
    z.object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      email: z.email().transform((v) => v.toLowerCase()),
      password: z.string().min(8),
      role: z.enum(["student", "admin"]),
    }),
    req.body,
  )
  if (await prisma.user.findUnique({ where: { email: input.email } }))
    throw new ApiError(409, "Email band")
  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role.toUpperCase() as UserRole,
    },
  })
  res.status(201).json({ user: publicUser(user) })
})

adminRouter.patch("/users/:id", async (req, res) => {
  const targetId = req.params.id
  const input = validate(
    z.object({
      firstName: z.string().min(2).optional(),
      lastName: z.string().min(2).optional(),
      role: z.enum(["student", "admin"]).optional(),
      active: z.boolean().optional(),
    }),
    req.body,
  )
  if (
    targetId === req.auth!.sub &&
    (input.active === false || input.role === "student")
  )
    throw new ApiError(
      409,
      "O‘z administrator hisobingizni bloklay yoki rolini pasaytira olmaysiz",
    )
  const existing = await prisma.user.findUnique({ where: { id: targetId } })
  if (!existing) throw new ApiError(404, "Foydalanuvchi topilmadi")
  if (
    existing.role === UserRole.ADMIN &&
    existing.active &&
    (input.active === false || input.role === "student")
  ) {
    const activeAdminCount = await prisma.user.count({
      where: { role: UserRole.ADMIN, active: true },
    })
    if (activeAdminCount <= 1)
      throw new ApiError(
        409,
        "Tizimda kamida bitta faol administrator qolishi kerak",
      )
  }
  const { role, ...profile } = input
  const user = await prisma.user
    .update({
      where: { id: targetId },
      data: {
        ...profile,
        ...(role && { role: role.toUpperCase() as UserRole }),
      },
    })
    .catch(() => null)
  if (!user) throw new ApiError(404, "Foydalanuvchi topilmadi")
  res.json({ user: publicUser(user) })
})

adminRouter.delete("/users/:id", async (req, res) => {
  if (req.params.id === req.auth!.sub)
    throw new ApiError(409, "O'z hisobingizni o'chira olmaysiz")
  const target = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!target) throw new ApiError(404, "Foydalanuvchi topilmadi")
  if (target.role === UserRole.ADMIN && target.active) {
    const activeAdminCount = await prisma.user.count({
      where: { role: UserRole.ADMIN, active: true },
    })
    if (activeAdminCount <= 1)
      throw new ApiError(
        409,
        "Tizimda kamida bitta faol administrator qolishi kerak",
      )
  }
  const ownedCourseCount = await prisma.course.count({
    where: { teacherId: target.id },
  })
  if (ownedCourseCount > 0)
    throw new ApiError(
      409,
      `Bu administratorga ${ownedCourseCount} ta fan biriktirilgan. Avval fanlarni boshqa administratorga o‘tkazing yoki hisobni bloklang`,
    )
  await prisma.user.delete({ where: { id: req.params.id } }).catch(() => {
    throw new ApiError(404, "Foydalanuvchi topilmadi")
  })
  res.status(204).end()
})

adminRouter.get("/progress", async (_req, res) => {
  const progress = await prisma.enrollment.findMany({
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      course: { select: { id: true, title: true } },
      completions: { select: { lessonId: true, completedAt: true } },
    },
    orderBy: { lastActivityAt: "desc" },
  })
  res.json({ progress })
})

adminRouter.get("/reports", async (_req, res) => {
  const now = new Date()
  const activeSince = new Date(now)
  activeSince.setDate(activeSince.getDate() - 30)

  const [
    enrollments,
    attempts,
    accessibilityProfiles,
    students,
    activeStudents,
  ] = await Promise.all([
    prisma.enrollment.findMany({
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        course: { select: { id: true, title: true } },
        completions: { select: { lessonId: true } },
      },
      orderBy: { lastActivityAt: "desc" },
    }),
    prisma.quizAttempt.findMany({
      select: {
        percentage: true,
        passed: true,
        completedAt: true,
        quiz: { select: { id: true, title: true } },
      },
      orderBy: { completedAt: "desc" },
    }),
    prisma.accessibilitySetting.findMany({
      select: {
        highContrast: true,
        reducedMotion: true,
        dyslexiaFont: true,
        largeButtons: true,
        alwaysShowSubtitles: true,
        textToSpeech: true,
      },
    }),
    prisma.user.count({ where: { role: UserRole.STUDENT } }),
    prisma.user.count({
      where: {
        role: UserRole.STUDENT,
        enrollments: { some: { lastActivityAt: { gte: activeSince } } },
      },
    }),
  ])

  const courseMap = new Map<string, {
    id: string
    title: string
    students: number
    progressTotal: number
    completed: number
  }>()
  for (const enrollment of enrollments) {
    const current = courseMap.get(enrollment.courseId) || {
      id: enrollment.course.id,
      title: enrollment.course.title,
      students: 0,
      progressTotal: 0,
      completed: 0,
    }
    current.students += 1
    current.progressTotal += enrollment.progress
    if (enrollment.progress >= 100) current.completed += 1
    courseMap.set(enrollment.courseId, current)
  }

  const enabledAccessibility = accessibilityProfiles.reduce(
    (total, profile) =>
      total + Object.values(profile).filter((value) => value === true).length,
    0,
  )
  const averageProgress = enrollments.length
    ? Math.round(
        enrollments.reduce((total, item) => total + item.progress, 0) /
          enrollments.length,
      )
    : 0
  const averageQuizScore = attempts.length
    ? Math.round(
        attempts.reduce((total, item) => total + item.percentage, 0) /
          attempts.length,
      )
    : 0

  res.json({
    summary: {
      students,
      activeStudents,
      enrollments: enrollments.length,
      averageProgress,
      completedEnrollments: enrollments.filter((item) => item.progress >= 100)
        .length,
      quizAttempts: attempts.length,
      averageQuizScore,
      passedQuizAttempts: attempts.filter((item) => item.passed).length,
      accessibilityProfiles: accessibilityProfiles.length,
      enabledAccessibility,
    },
    coursePerformance: Array.from(courseMap.values())
      .map((item) => ({
        id: item.id,
        title: item.title,
        students: item.students,
        averageProgress: item.students
          ? Math.round(item.progressTotal / item.students)
          : 0,
        completed: item.completed,
      }))
      .sort((a, b) => b.students - a.students),
    recentLearners: enrollments.slice(0, 10).map((item) => ({
      id: item.id,
      student: `${item.user.firstName} ${item.user.lastName}`,
      email: item.user.email,
      course: item.course.title,
      progress: item.progress,
      completedLessons: item.completions.length,
      lastActivityAt: item.lastActivityAt,
    })),
  })
})
