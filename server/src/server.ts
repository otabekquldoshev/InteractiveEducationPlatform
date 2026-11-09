import { app } from "./app.js"
import { config } from "./config.js"
import { prisma } from "./lib/prisma.js"

const port = Number(process.env.PORT || config.API_PORT)

const server = app.listen(port, () => {
  console.log(
    `Imkon Ta’lim http://localhost:${port} manzilida ishlamoqda`,
  )
})

async function shutdown(signal: string) {
  console.log(`${signal}: server yopilmoqda...`)
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on("SIGINT", () => void shutdown("SIGINT"))
process.on("SIGTERM", () => void shutdown("SIGTERM"))
