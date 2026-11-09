import { Router } from "express"
import type { Request } from "express"
import { UserRole } from "@prisma/client"
import { z } from "zod"
import { prisma } from "../lib/prisma.js"
import { ApiError, validate } from "../lib/http.js"
import {
  hashPassword,
  hashToken,
  randomToken,
  signAccessToken,
  verifyPassword,
} from "../lib/security.js"
import { publicUser } from "../lib/serializers.js"
import { requireAuth } from "../middleware/auth.js"
import { config } from "../config.js"

export const authRouter = Router()

const credentials = z.object({
  email: z.string().trim().min(3).max(160),
  password: z.string().min(4).max(128),
  role: z.enum(["student", "admin"]).optional(),
})

const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
})

async function issueSession(user: { id: string; role: UserRole }, req: Request) {
  const refreshToken = randomToken()
  await prisma.session.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      userAgent: req.headers["user-agent"]?.slice(0, 500),
      ipAddress: req.ip,
      expiresAt: new Date(Date.now() + config.REFRESH_TOKEN_DAYS * 86_400_000),
    },
  })
  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    refreshToken,
  }
}

authRouter.post("/register", async (req, res) => {
  const input = validate(registerSchema, req.body)
  const exists = await prisma.user.findUnique({ where: { email: input.email } })
  if (exists) throw new ApiError(409, "Bu email allaqachon ro'yxatdan o'tgan")
  const { password, ...profile } = input
  const user = await prisma.user.create({
    data: {
      ...profile,
      passwordHash: await hashPassword(password),
      role: UserRole.STUDENT,
    },
  })
  const tokens = await issueSession(user, req)
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "REGISTER",
      entity: "User",
      entityId: user.id,
    },
  })
  res.status(201).json({ user: publicUser(user), ...tokens })
})

authRouter.post("/login", async (req, res) => {
  const input = validate(credentials, req.body)
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.email.toLowerCase() }, { username: input.email }],
    },
  })
  if (!user || !(await verifyPassword(input.password, user.passwordHash)))
    throw new ApiError(401, "Email/login yoki parol noto'g'ri")
  if (!user.active) throw new ApiError(403, "Hisob bloklangan")
  if (input.role && user.role.toLowerCase() !== input.role)
    throw new ApiError(403, "Tanlangan rol ushbu hisobga mos emas")
  const tokens = await issueSession(user, req)
  await prisma.activityLog.create({
    data: { userId: user.id, action: "LOGIN", entity: "Session" },
  })
  res.json({ user: publicUser(user), ...tokens })
})

authRouter.post("/refresh", async (req, res) => {
  const { refreshToken } = validate(
    z.object({ refreshToken: z.string().min(32) }),
    req.body,
  )
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { user: true },
  })
  if (!session || session.expiresAt <= new Date() || !session.user.active)
    throw new ApiError(401, "Yangilash tokeni yaroqsiz")
  const nextToken = randomToken()
  await prisma.session.update({
    where: { id: session.id },
    data: {
      tokenHash: hashToken(nextToken),
      expiresAt: new Date(Date.now() + config.REFRESH_TOKEN_DAYS * 86_400_000),
    },
  })
  res.json({
    accessToken: signAccessToken({
      sub: session.user.id,
      role: session.user.role,
    }),
    refreshToken: nextToken,
  })
})

authRouter.post("/logout", async (req, res) => {
  const parsed = z
    .object({ refreshToken: z.string().min(32) })
    .safeParse(req.body)
  if (parsed.success)
    await prisma.session.deleteMany({
      where: { tokenHash: hashToken(parsed.data.refreshToken) },
    })
  res.status(204).end()
})

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } })
  if (!user || !user.active) throw new ApiError(401, "Foydalanuvchi topilmadi")
  res.json({ user: publicUser(user) })
})

authRouter.patch("/me", requireAuth, async (req, res) => {
  const input = validate(
    z.object({
      firstName: z.string().trim().min(2).max(60).optional(),
      lastName: z.string().trim().min(2).max(60).optional(),
      avatarUrl: z.url().nullable().optional(),
      accessibilitySetupDone: z.boolean().optional(),
    }),
    req.body,
  )
  const user = await prisma.user
    .update({ where: { id: req.auth!.sub }, data: input })
    .catch(() => null)
  if (!user) throw new ApiError(404, "Foydalanuvchi topilmadi")
  res.json({ user: publicUser(user) })
})
