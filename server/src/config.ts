import "dotenv/config"
import { z } from "zod"

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  API_PORT: z.coerce.number().int().positive().default(3001),
  CLIENT_ORIGIN: z.string().default("http://localhost:8443"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(30),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(500),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error(
    "Environment sozlamalari noto'g'ri:",
    parsed.error.flatten().fieldErrors,
  )
  process.exit(1)
}

export const config = parsed.data
