import type { NextFunction, Request, Response } from "express"
import type { UserRole } from "@prisma/client"
import { ApiError } from "../lib/http.js"
import { verifyAccessToken, type TokenUser } from "../lib/security.js"

declare global {
  namespace Express {
    interface Request {
      auth?: TokenUser
    }
  }
}

function readBearer(req: Request) {
  const [kind, token] = (req.headers.authorization || "").split(" ")
  return kind === "Bearer" && token ? token : null
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readBearer(req)
  if (!token) return next()
  try {
    req.auth = verifyAccessToken(token)
  } catch {}
  next()
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readBearer(req)
  if (!token) return next(new ApiError(401, "Tizimga kirish talab qilinadi"))
  try {
    req.auth = verifyAccessToken(token)
    next()
  } catch {
    next(new ApiError(401, "Sessiya yaroqsiz yoki muddati tugagan"))
  }
}

export const allowRoles =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth)
      return next(new ApiError(401, "Tizimga kirish talab qilinadi"))
    if (!roles.includes(req.auth.role as UserRole))
      return next(new ApiError(403, "Bu amal uchun ruxsat yo'q"))
    next()
  }
