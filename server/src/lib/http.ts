import type { NextFunction, Request, Response } from "express"
import { ZodError, type ZodType } from "zod"
import multer from "multer"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

export const validate = <T>(schema: ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value)
  if (!result.success)
    throw new ApiError(
      422,
      "Kiritilgan ma'lumotlar noto'g'ri",
      result.error.flatten(),
    )
  return result.data
}

export const pathParam = (value: string | string[]) =>
  Array.isArray(value) ? value[0] : value

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, "Endpoint topilmadi"))
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof multer.MulterError) {
    return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 422).json({
      error:
        error.code === "LIMIT_FILE_SIZE"
          ? "Fayl ruxsat etilgan hajmdan katta"
          : "Faylni yuklashda xato",
      details: error.message,
    })
  }
  if (error instanceof ApiError) {
    return res
      .status(error.status)
      .json({ error: error.message, details: error.details })
  }
  if (error instanceof ZodError) {
    return res
      .status(422)
      .json({ error: "Validatsiya xatosi", details: error.flatten() })
  }
  const message = error instanceof Error ? error.message : "Noma'lum xato"
  console.error(error)
  return res.status(500).json({
    error: "Serverda ichki xato",
    ...(process.env.NODE_ENV === "development" && { details: message }),
  })
}
