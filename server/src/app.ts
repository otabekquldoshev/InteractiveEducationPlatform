import path from "node:path"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import { rateLimit } from "express-rate-limit"
import { config } from "./config.js"
import { authRouter } from "./routes/auth.js"
import { coursesRouter } from "./routes/courses.js"
import { learningRouter } from "./routes/learning.js"
import { quizzesRouter } from "./routes/quizzes.js"
import { adminRouter } from "./routes/admin.js"
import { mediaRouter } from "./routes/media.js"
import { errorHandler, notFound } from "./lib/http.js"

export const app = express()
app.set("trust proxy", 1)
app.set("json replacer", (_key: string, value: unknown) =>
  typeof value === "bigint" ? Number(value) : value,
)
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))
app.use(
  cors({
    origin: config.CLIENT_ORIGIN.split(",").map((item) => item.trim()),
    credentials: true,
  }),
)
app.use(express.json({ limit: "2mb" }))
app.use(express.urlencoded({ extended: true, limit: "2mb" }))
app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "server/uploads"), {
    maxAge: "1d",
    immutable: false,
  }),
)
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60_000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
  authRouter,
)
app.get("/api/health", (_req, res) =>
  res.json({
    status: "ok",
    service: "eduaccess-api",
    time: new Date().toISOString(),
  }),
)
app.use("/api/courses", coursesRouter)
app.use("/api/learning", learningRouter)
app.use("/api/quizzes", quizzesRouter)
app.use("/api/admin", adminRouter)
app.use("/api/media", mediaRouter)

if (config.NODE_ENV === "production") {
  const frontendDirectory = path.resolve(process.cwd(), "dist")

  app.use(express.static(frontendDirectory, { maxAge: "1h" }))
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) return next()

    res.sendFile(path.join(frontendDirectory, "index.html"))
  })
}

app.use(notFound)
app.use(errorHandler)
