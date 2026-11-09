import { Router } from "express"
import multer from "multer"
import path from "node:path"
import { LessonType, SubtitleStatus, UserRole } from "@prisma/client"
import { z } from "zod"
import { config } from "../config.js"
import { prisma } from "../lib/prisma.js"
import { ApiError, pathParam, validate } from "../lib/http.js"
import { allowRoles, requireAuth } from "../middleware/auth.js"

export const mediaRouter = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.MAX_UPLOAD_MB * 1024 * 1024 },
})
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
})
const assetUrl = (id: string) => `/api/media/assets/${id}`
const imageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
])

function videoMimeOf(file: Express.Multer.File) {
  const extension = path.extname(file.originalname).toLowerCase()
  if (
    !["video/mp4", "video/webm", "application/mp4"].includes(file.mimetype) &&
    ![".mp4", ".webm"].includes(extension)
  )
    throw new ApiError(415, "Faqat MP4 yoki WebM formatlari qabul qilinadi")
  return extension === ".mp4"
    ? "video/mp4"
    : extension === ".webm"
      ? "video/webm"
      : file.mimetype
}

function vttTime(value: number) {
  const seconds = Math.max(0, value)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = (seconds % 60).toFixed(3).padStart(6, "0")
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${remainder}`
}

function timedVtt(source: string, duration?: number | null) {
  const normalized = source.replace(/\s+/g, " ").trim()
  const sentences = normalized.match(/[^.!?]+[.!?]?/g) || [normalized]
  const chunks: string[] = []
  for (const sentence of sentences) {
    const words = sentence.trim().split(" ").filter(Boolean)
    while (words.length) chunks.push(words.splice(0, 12).join(" "))
  }
  const safeChunks = chunks.filter(Boolean)
  if (!safeChunks.length) throw new ApiError(422, "Subtitr uchun matn topilmadi")
  const total = duration || Math.max(5, safeChunks.length * 5)
  const segment = total / safeChunks.length
  return [
    "WEBVTT",
    "",
    ...safeChunks.flatMap((text, index) => [
      String(index + 1),
      `${vttTime(index * segment)} --> ${vttTime(Math.min(total, (index + 1) * segment))}`,
      text,
      "",
    ]),
  ].join("\n")
}

function validateVtt(content: string) {
  const timestamp = "\\d{2}:\\d{2}:\\d{2}\\.\\d{3}"
  const cues = [
    ...content.matchAll(new RegExp(`(${timestamp})\\s+-->\\s+(${timestamp})`, "g")),
  ]
  if (!content.trimStart().startsWith("WEBVTT") || cues.length === 0)
    throw new ApiError(
      422,
      "WebVTT formatida kamida bitta boshlanish va tugash vaqti bo‘lishi kerak",
    )
  const seconds = (value: string) => {
    const [hours, minutes, rest] = value.split(":")
    return Number(hours) * 3600 + Number(minutes) * 60 + Number(rest)
  }
  if (cues.some((cue) => seconds(cue[2]) <= seconds(cue[1])))
    throw new ApiError(422, "Subtitr tugash vaqti boshlanish vaqtidan katta bo‘lishi kerak")
  return content
}

async function createAsset(file: Express.Multer.File) {
  return prisma.mediaAsset.create({
    data: {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: BigInt(file.size),
      data: file.buffer,
    },
  })
}

async function removeAsset(id?: string | null) {
  if (id)
    await prisma.mediaAsset.delete({ where: { id } }).catch(() => undefined)
}

mediaRouter.get("/assets/:assetId", async (req, res) => {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: pathParam(req.params.assetId) },
  })
  if (!asset) throw new ApiError(404, "Media fayl topilmadi")
  const total = Number(asset.size)
  res.setHeader("Content-Type", asset.mimeType)
  res.setHeader(
    "Content-Disposition",
    `inline; filename*=UTF-8''${encodeURIComponent(asset.originalName)}`,
  )
  res.setHeader("Accept-Ranges", "bytes")
  res.setHeader("Cache-Control", "public, max-age=86400")
  const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/)
  if (!range) {
    res.setHeader("Content-Length", total)
    return res.send(asset.data)
  }
  const start = range[1] ? Number(range[1]) : 0
  const end = range[2] ? Math.min(Number(range[2]), total - 1) : total - 1
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < start ||
    start >= total
  ) {
    res.setHeader("Content-Range", `bytes */${total}`)
    return res.status(416).end()
  }
  res.status(206)
  res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`)
  res.setHeader("Content-Length", end - start + 1)
  return res.send(asset.data.subarray(start, end + 1))
})

async function ownedLesson(
  lessonId: string,
  auth: NonNullable<Express.Request["auth"]>,
) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  })
  if (!lesson) throw new ApiError(404, "Dars topilmadi")
  return lesson
}

async function existingCourse(courseId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) throw new ApiError(404, "Fan topilmadi")
  return course
}

mediaRouter.post(
  "/courses/:courseId/image",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  imageUpload.single("image"),
  async (req, res) => {
    const course = await existingCourse(pathParam(req.params.courseId))
    if (!req.file) throw new ApiError(422, "Rasm fayli tanlanmagan")
    if (!imageTypes.has(req.file.mimetype))
      throw new ApiError(
        415,
        "Faqat JPG, PNG, WebP yoki AVIF rasm qabul qilinadi",
      )
    const asset = await createAsset(req.file)
    const thumbnail = assetUrl(asset.id)
    await prisma.course.update({
      where: { id: course.id },
      data: { thumbnail, thumbnailAssetId: asset.id },
    })
    await removeAsset(course.thumbnailAssetId)
    res.status(201).json({
      image: {
        id: asset.id,
        url: thumbnail,
        name: asset.originalName,
        mimeType: asset.mimeType,
        size: Number(asset.size),
      },
    })
  },
)

mediaRouter.delete(
  "/courses/:courseId/image",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const course = await existingCourse(pathParam(req.params.courseId))
    await prisma.course.update({
      where: { id: course.id },
      data: { thumbnail: null, thumbnailAssetId: null },
    })
    await removeAsset(course.thumbnailAssetId)
    res.status(204).end()
  },
)

mediaRouter.post(
  "/lessons/:lessonId/image",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  imageUpload.single("image"),
  async (req, res) => {
    const lesson = await ownedLesson(pathParam(req.params.lessonId), req.auth!)
    if (!req.file) throw new ApiError(422, "Rasm fayli tanlanmagan")
    if (!imageTypes.has(req.file.mimetype))
      throw new ApiError(
        415,
        "Faqat JPG, PNG, WebP yoki AVIF rasm qabul qilinadi",
      )
    const asset = await createAsset(req.file)
    const imageUrl = assetUrl(asset.id)
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { imageUrl, imageAssetId: asset.id },
    })
    await removeAsset(lesson.imageAssetId)
    res.status(201).json({
      image: {
        id: asset.id,
        url: imageUrl,
        name: asset.originalName,
        mimeType: asset.mimeType,
        size: Number(asset.size),
      },
    })
  },
)

mediaRouter.delete(
  "/lessons/:lessonId/image",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const lesson = await ownedLesson(pathParam(req.params.lessonId), req.auth!)
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { imageUrl: null, imageAssetId: null },
    })
    await removeAsset(lesson.imageAssetId)
    res.status(204).end()
  },
)

mediaRouter.post(
  "/lessons/:lessonId/video",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  upload.single("video"),
  async (req, res) => {
    const lessonId = pathParam(req.params.lessonId)
    await ownedLesson(lessonId, req.auth!)
    if (!req.file) throw new ApiError(422, "Video fayl tanlanmagan")
    const file = req.file
    const videoMime = videoMimeOf(file)
    const input = validate(
      z.object({
        title: z.string().min(2).max(180),
        description: z.string().max(1000).optional(),
        duration: z.coerce.number().int().positive().optional(),
      }),
      req.body,
    )
    const previous = await prisma.video.findUnique({ where: { lessonId } })
    const asset = await createAsset(file)
    const video = await prisma
      .$transaction(async (transaction) => {
        const savedVideo = await transaction.video.upsert({
          where: { lessonId },
          update: {
            ...input,
            videoUrl: assetUrl(asset.id),
            assetId: asset.id,
            mimeType: videoMime,
            size: BigInt(file.size),
            published: true,
          },
          create: {
            ...input,
            lessonId,
            videoUrl: assetUrl(asset.id),
            assetId: asset.id,
            mimeType: videoMime,
            size: BigInt(file.size),
            published: true,
          },
        })
        await transaction.lesson.update({
          where: { id: lessonId },
          data: { type: LessonType.VIDEO },
        })
        return savedVideo
      })
      .catch(async (error) => {
        await removeAsset(asset.id)
        throw error
      })
    res.status(201).json({ video: { ...video, size: Number(video.size) } })
    // The new URL is already committed. Do not keep the browser waiting while
    // SQLite removes the previous large blob.
    void removeAsset(previous?.assetId)
  },
)

mediaRouter.post(
  "/videos/:videoId/sign-language",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  upload.single("video"),
  async (req, res) => {
    const video = await prisma.video.findUnique({
      where: { id: pathParam(req.params.videoId) },
    })
    if (!video) throw new ApiError(404, "Asosiy video topilmadi")
    await ownedLesson(video.lessonId, req.auth!)
    if (!req.file) throw new ApiError(422, "Imo-ishora videosi tanlanmagan")
    const mimeType = videoMimeOf(req.file)
    const asset = await createAsset(req.file)
    const updated = await prisma.video
      .update({
        where: { id: video.id },
        data: {
          signLanguageUrl: assetUrl(asset.id),
          signLanguageAssetId: asset.id,
          signLanguageMimeType: mimeType,
        },
      })
      .catch(async (error) => {
        await removeAsset(asset.id)
        throw error
      })
    res.status(201).json({
      video: { ...updated, size: Number(updated.size) },
    })
    void removeAsset(video.signLanguageAssetId)
  },
)

mediaRouter.delete(
  "/videos/:videoId/sign-language",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const video = await prisma.video.findUnique({
      where: { id: pathParam(req.params.videoId) },
    })
    if (!video) throw new ApiError(404, "Video topilmadi")
    await ownedLesson(video.lessonId, req.auth!)
    await prisma.video.update({
      where: { id: video.id },
      data: {
        signLanguageUrl: null,
        signLanguageAssetId: null,
        signLanguageMimeType: null,
      },
    })
    await removeAsset(video.signLanguageAssetId)
    res.status(204).end()
  },
)

mediaRouter.post(
  "/lessons/:lessonId/attachments",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  upload.single("file"),
  async (req, res) => {
    const lessonId = pathParam(req.params.lessonId)
    await ownedLesson(lessonId, req.auth!)
    if (!req.file) throw new ApiError(422, "Fayl tanlanmagan")
    const asset = await createAsset(req.file)
    const attachment = await prisma.attachment.create({
      data: {
        lessonId,
        name: req.body.name || req.file.originalname,
        fileUrl: assetUrl(asset.id),
        assetId: asset.id,
        mimeType: req.file.mimetype,
        size: BigInt(req.file.size),
      },
    })
    res
      .status(201)
      .json({ attachment: { ...attachment, size: Number(attachment.size) } })
  },
)

mediaRouter.patch(
  "/videos/:videoId",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const video = await prisma.video.findUnique({
      where: { id: pathParam(req.params.videoId) },
    })
    if (!video) throw new ApiError(404, "Video topilmadi")
    await ownedLesson(video.lessonId, req.auth!)
    const input = validate(
      z.object({
        title: z.string().min(2).max(180).optional(),
        description: z.string().max(1000).nullable().optional(),
        duration: z.number().int().positive().nullable().optional(),
        published: z.boolean().optional(),
      }),
      req.body,
    )
    const updated = await prisma.video.update({
      where: { id: video.id },
      data: input,
    })
    res.json({ video: { ...updated, size: Number(updated.size) } })
  },
)

mediaRouter.delete(
  "/videos/:videoId",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const video = await prisma.video.findUnique({
      where: { id: pathParam(req.params.videoId) },
    })
    if (!video) throw new ApiError(404, "Video topilmadi")
    await ownedLesson(video.lessonId, req.auth!)
    await prisma.$transaction([
      prisma.video.delete({ where: { id: video.id } }),
      prisma.lesson.update({
        where: { id: video.lessonId },
        data: { type: LessonType.TEXT },
      }),
    ])
    await Promise.all([
      removeAsset(video.assetId),
      removeAsset(video.signLanguageAssetId),
    ])
    res.status(204).end()
  },
)

mediaRouter.delete(
  "/attachments/:id",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const attachment = await prisma.attachment.findUnique({
      where: { id: pathParam(req.params.id) },
    })
    if (!attachment) throw new ApiError(404, "Material topilmadi")
    await ownedLesson(attachment.lessonId, req.auth!)
    await prisma.attachment.delete({ where: { id: attachment.id } })
    await removeAsset(attachment.assetId)
    res.status(204).end()
  },
)

mediaRouter.put(
  "/videos/:videoId/subtitles/:language",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const video = await prisma.video.findUnique({
      where: { id: pathParam(req.params.videoId) },
    })
    if (!video) throw new ApiError(404, "Video topilmadi")
    await ownedLesson(video.lessonId, req.auth!)
    const input = validate(
      z
        .object({
          content: z.string().min(1).max(1_000_000).optional(),
          text: z.string().min(1).max(1_000_000).optional(),
          enabled: z.boolean().default(true),
        })
        .refine((value) => value.content || value.text, {
          message: "Subtitr matni kiritilmagan",
        }),
      req.body,
    )
    const language = pathParam(req.params.language)
    const source = input.text || input.content || ""
    const content = source.trimStart().startsWith("WEBVTT")
      ? validateVtt(source)
      : timedVtt(source, video.duration)
    const subtitle = await prisma.subtitle.upsert({
      where: { videoId_language: { videoId: video.id, language } },
      update: { content, enabled: input.enabled, status: SubtitleStatus.READY },
      create: {
        content,
        enabled: input.enabled,
        videoId: video.id,
        language,
        status: SubtitleStatus.READY,
      },
    })
    res.json({ subtitle })
  },
)

mediaRouter.post(
  "/videos/:videoId/subtitles/generate",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const video = await prisma.video.findUnique({
      where: { id: pathParam(req.params.videoId) },
    })
    if (!video) throw new ApiError(404, "Video topilmadi")
    const lesson = await ownedLesson(video.lessonId, req.auth!)
    const { language, sourceText } = validate(
      z.object({
        language: z.string().default("uz-UZ"),
        sourceText: z.string().max(1_000_000).optional(),
      }),
      req.body,
    )
    const content = timedVtt(
      sourceText || lesson.content || lesson.description || lesson.title,
      video.duration,
    )
    const subtitle = await prisma.subtitle.upsert({
      where: { videoId_language: { videoId: video.id, language } },
      update: { content, enabled: true, status: SubtitleStatus.READY },
      create: {
        videoId: video.id,
        language,
        content,
        enabled: true,
        status: SubtitleStatus.READY,
      },
    })
    await prisma.activityLog.create({
      data: {
        userId: req.auth!.sub,
        action: "GENERATE_SUBTITLES",
        entity: "Video",
        entityId: video.id,
        metadata: { language },
      },
    })
    res.json({
      subtitle,
      message: "Dars matnidan subtitr avtomatik yaratildi",
    })
  },
)

mediaRouter.delete(
  "/subtitles/:id",
  requireAuth,
  allowRoles(UserRole.ADMIN),
  async (req, res) => {
    const subtitle = await prisma.subtitle.findUnique({
      where: { id: pathParam(req.params.id) },
      include: { video: true },
    })
    if (!subtitle) throw new ApiError(404, "Subtitr topilmadi")
    await ownedLesson(subtitle.video.lessonId, req.auth!)
    await prisma.subtitle.delete({ where: { id: subtitle.id } })
    res.status(204).end()
  },
)
