import { Router } from "express"
import { LessonType, PublishStatus, UserRole } from "@prisma/client"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { ApiError, pathParam, validate } from "../lib/http.js"
import { courseDto } from "../lib/serializers.js"
import { allowRoles, optionalAuth, requireAuth } from "../middleware/auth.js"

export const coursesRouter = Router()

const courseInput = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(1000),
  detailedContent: z.string().max(50_000).optional().nullable(),
  thumbnail: z.url().optional().nullable().or(z.literal("")),
  category: z.string().trim().min(2).max(80),
  level: z.enum(["boshlangich", "orta", "yuqori"]).default("boshlangich"),
  duration: z.string().max(40).optional().nullable(),
  status: z.enum(["draft", "published", "hidden"]).default("draft"),
})

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
const statusOf = (value: string) => value.toUpperCase() as PublishStatus

async function uniqueSlug(title: string, ignoreId?: string) {
  const base = slugify(title) || "course"
  let slug = base
  let index = 2
  while (
    await prisma.course.findFirst({
      where: { slug, ...(ignoreId && { id: { not: ignoreId } }) },
    })
  )
    slug = `${base}-${index++}`
  return slug
}

async function assertCourseOwner(
  courseId: string,
  auth: NonNullable<Express.Request["auth"]>,
) {
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) throw new ApiError(404, "Fan topilmadi")
  return course
}

coursesRouter.get("/", optionalAuth, async (req, res) => {
  const query = validate(
    z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      status: z.string().optional(),
      mine: z.string().optional(),
    }),
    req.query,
  )
  const staff = req.auth?.role === "ADMIN"
  const courses = await prisma.course.findMany({
    where: {
      ...(!staff && { status: PublishStatus.PUBLISHED }),
      ...(staff && query.status && { status: statusOf(query.status) }),
      ...(query.category && { category: query.category }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search } },
          { description: { contains: query.search } },
        ],
      }),
    },
    include: {
      teacher: { select: { firstName: true, lastName: true } },
      modules: { include: { lessons: { select: { id: true } } } },
      _count: { select: { enrollments: true, ratings: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  res.json({ courses: courses.map(courseDto) })
})

coursesRouter.get("/:id", optionalAuth, async (req, res) => {
  const id = pathParam(req.params.id)
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      teacher: { select: { firstName: true, lastName: true } },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: {
              video: { include: { subtitles: true } },
              attachments: true,
              // A lesson may contain multiple timed video checkpoints.
              quizzes: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  passingScore: true,
                  interruptAtSeconds: true,
                },
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      },
      _count: { select: { enrollments: true, ratings: true } },
    },
  })
  if (!course) throw new ApiError(404, "Fan topilmadi")
  const canPreview = req.auth?.role === "ADMIN"
  if (course.status !== PublishStatus.PUBLISHED && !canPreview)
    throw new ApiError(404, "Fan topilmadi")
  const modules = course.modules.map((module) => ({
    id: module.id,
    courseId: course.id,
    title: module.title,
    order: module.order,
    lessons: module.lessons
      .filter(
        (lesson) => canPreview || lesson.status === PublishStatus.PUBLISHED,
      )
      .map((lesson) => ({
        id: lesson.id,
        moduleId: lesson.moduleId,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        imageUrl: lesson.imageUrl,
        type: lesson.type.toLowerCase(),
        order: lesson.order,
        status: lesson.status.toLowerCase(),
        videoUrl: lesson.video?.videoUrl,
        duration: lesson.video?.duration
          ? `${Math.floor(lesson.video.duration / 60)}:${String(lesson.video.duration % 60).padStart(2, "0")}`
          : undefined,
        video: lesson.video
          ? { ...lesson.video, size: Number(lesson.video.size) }
          : null,
        attachments: lesson.attachments.map((item) => ({
          ...item,
          size: Number(item.size),
        })),
        quizzes: lesson.quizzes
          .filter(
            (quiz) => canPreview || quiz.status === PublishStatus.PUBLISHED,
          )
          .map((quiz) => ({
            id: quiz.id,
            title: quiz.title,
            status: quiz.status.toLowerCase(),
            passingScore: quiz.passingScore,
            interruptAtSeconds: quiz.interruptAtSeconds,
          })),
        quiz: (() => {
          const visible = lesson.quizzes.filter(
            (quiz) => canPreview || quiz.status === PublishStatus.PUBLISHED,
          )
          const quiz =
            visible.find((item) => item.interruptAtSeconds === null) ||
            (lesson.type === LessonType.QUIZ ? visible[0] : undefined)
          return quiz
            ? {
                id: quiz.id,
                title: quiz.title,
                status: quiz.status.toLowerCase(),
                passingScore: quiz.passingScore,
                interruptAtSeconds: quiz.interruptAtSeconds,
              }
            : null
        })(),
      })),
  }))
  const hasSubtitles = course.modules.some((module) =>
    module.lessons.some((lesson) =>
      lesson.video?.subtitles.some((subtitle) => subtitle.enabled),
    ),
  )
  res.json({
    course: {
      ...courseDto(course),
      modules,
      hasSubtitles,
      hasTranscript: hasSubtitles,
      hasAudio: course.modules.some((module) =>
        module.lessons.some((lesson) => Boolean(lesson.video)),
      ),
    },
  })
})

coursesRouter.post(
  "/",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const input = validate(courseInput, req.body)
    const course = await prisma.course.create({
      data: {
        ...input,
        thumbnail: input.thumbnail || null,
        status: statusOf(input.status),
        teacherId: req.auth!.sub,
        slug: await uniqueSlug(input.title),
      },
    })
    await prisma.activityLog.create({
      data: {
        userId: req.auth!.sub,
        action: "CREATE",
        entity: "Course",
        entityId: course.id,
      },
    })
    res.status(201).json({ course: courseDto(course) })
  },
)

coursesRouter.patch(
  "/:id",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const id = pathParam(req.params.id)
    await assertCourseOwner(id, req.auth!)
    const input = validate(courseInput.partial(), req.body)
    const { status, ...changes } = input
    const course = await prisma.course.update({
      where: { id },
      data: {
        ...changes,
        ...(input.title && { slug: await uniqueSlug(input.title, id) }),
        ...(status && { status: statusOf(status) }),
        thumbnail: input.thumbnail || undefined,
      },
    })
    await prisma.activityLog.create({
      data: {
        userId: req.auth!.sub,
        action: "UPDATE",
        entity: "Course",
        entityId: course.id,
      },
    })
    res.json({ course: courseDto(course) })
  },
)

coursesRouter.delete(
  "/:id",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const id = pathParam(req.params.id)
    await assertCourseOwner(id, req.auth!)
    const media = await prisma.course.findUnique({
      where: { id },
      select: {
        thumbnailAssetId: true,
        modules: {
          select: {
            lessons: {
              select: {
                imageAssetId: true,
                video: {
                  select: { assetId: true, signLanguageAssetId: true },
                },
                attachments: { select: { assetId: true } },
              },
            },
          },
        },
      },
    })
    const assetIds = [
      media?.thumbnailAssetId,
      ...(media?.modules.flatMap((module) =>
        module.lessons.flatMap((lesson) => [
          lesson.imageAssetId,
          lesson.video?.assetId,
          lesson.video?.signLanguageAssetId,
          ...lesson.attachments.map((item) => item.assetId),
        ]),
      ) || []),
    ].filter((value): value is string => Boolean(value))
    await prisma.course.delete({ where: { id } })
    if (assetIds.length)
      await prisma.mediaAsset.deleteMany({ where: { id: { in: assetIds } } })
    await prisma.activityLog.create({
      data: {
        userId: req.auth!.sub,
        action: "DELETE",
        entity: "Course",
        entityId: id,
      },
    })
    res.status(204).end()
  },
)

coursesRouter.post(
  "/:courseId/modules",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const courseId = pathParam(req.params.courseId)
    await assertCourseOwner(courseId, req.auth!)
    const input = validate(
      z.object({
        title: z.string().trim().min(2).max(160),
        order: z.number().int().positive().optional(),
      }),
      req.body,
    )
    // The client may still have an older module list while the catalog is
    // refreshing. Never let that stale order value cause a unique-key error.
    const requestedOrderIsFree = input.order
      ? !(await prisma.module.findUnique({
          where: {
            courseId_order: { courseId, order: input.order },
          },
          select: { id: true },
        }))
      : false
    const lastModule = await prisma.module.aggregate({
      where: { courseId },
      _max: { order: true },
    })
    const order = requestedOrderIsFree
      ? input.order!
      : (lastModule._max.order || 0) + 1
    const module = await prisma.module.create({
      data: { title: input.title, order, courseId },
    })
    res.status(201).json({ module })
  },
)

coursesRouter.patch(
  "/modules/:moduleId",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const existing = await prisma.module.findUnique({
      where: { id: pathParam(req.params.moduleId) },
    })
    if (!existing) throw new ApiError(404, "Modul topilmadi")
    await assertCourseOwner(existing.courseId, req.auth!)
    const input = validate(
      z.object({
        title: z.string().min(2).max(160).optional(),
        order: z.number().int().positive().optional(),
      }),
      req.body,
    )
    res.json({
      module: await prisma.module.update({
        where: { id: existing.id },
        data: input,
      }),
    })
  },
)

coursesRouter.delete(
  "/modules/:moduleId",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const existing = await prisma.module.findUnique({
      where: { id: pathParam(req.params.moduleId) },
      include: { lessons: { include: { video: true, attachments: true } } },
    })
    if (!existing) throw new ApiError(404, "Modul topilmadi")
    await assertCourseOwner(existing.courseId, req.auth!)
    const assetIds = existing.lessons
      .flatMap((lesson) => [
        lesson.imageAssetId,
        lesson.video?.assetId,
        lesson.video?.signLanguageAssetId,
        ...lesson.attachments.map((item) => item.assetId),
      ])
      .filter((value): value is string => Boolean(value))
    await prisma.module.delete({ where: { id: existing.id } })
    if (assetIds.length)
      await prisma.mediaAsset.deleteMany({ where: { id: { in: assetIds } } })
    res.status(204).end()
  },
)

const lessonInput = z.object({
  title: z.string().min(2).max(180),
  description: z.string().max(1000).optional().nullable(),
  content: z.string().max(100_000).optional().nullable(),
  imageUrl: z.url().optional().nullable().or(z.literal("")),
  type: z.enum(["video", "text", "quiz"]).default("text"),
  order: z.number().int().positive(),
  status: z.enum(["draft", "published", "hidden"]).default("draft"),
})

coursesRouter.post(
  "/modules/:moduleId/lessons",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const module = await prisma.module.findUnique({
      where: { id: pathParam(req.params.moduleId) },
    })
    if (!module) throw new ApiError(404, "Modul topilmadi")
    await assertCourseOwner(module.courseId, req.auth!)
    const input = validate(lessonInput, req.body)
    const lesson = await prisma.lesson.create({
      data: {
        ...input,
        imageUrl: input.imageUrl || null,
        type: input.type.toUpperCase() as LessonType,
        status: statusOf(input.status),
        moduleId: module.id,
      },
    })
    res.status(201).json({ lesson })
  },
)

coursesRouter.patch(
  "/lessons/:lessonId",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const lesson = await prisma.lesson.findUnique({
      where: { id: pathParam(req.params.lessonId) },
      include: { module: true },
    })
    if (!lesson) throw new ApiError(404, "Dars topilmadi")
    await assertCourseOwner(lesson.module.courseId, req.auth!)
    const input = validate(lessonInput.partial(), req.body)
    const { type, status, ...changes } = input
    const updated = await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        ...changes,
        ...(type && { type: type.toUpperCase() as LessonType }),
        ...(status && { status: statusOf(status) }),
        imageUrl: input.imageUrl || undefined,
      },
    })
    res.json({ lesson: updated })
  },
)

coursesRouter.delete(
  "/lessons/:lessonId",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const lesson = await prisma.lesson.findUnique({
      where: { id: pathParam(req.params.lessonId) },
      include: { module: true, video: true, attachments: true },
    })
    if (!lesson) throw new ApiError(404, "Dars topilmadi")
    await assertCourseOwner(lesson.module.courseId, req.auth!)
    const assetIds = [
      lesson.imageAssetId,
      lesson.video?.assetId,
      lesson.video?.signLanguageAssetId,
      ...lesson.attachments.map((item) => item.assetId),
    ].filter((value): value is string => Boolean(value))
    await prisma.lesson.delete({ where: { id: lesson.id } })
    if (assetIds.length)
      await prisma.mediaAsset.deleteMany({ where: { id: { in: assetIds } } })
    res.status(204).end()
  },
)
