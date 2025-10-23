import app from "@/server/app"
import oauthRoutes from "@/server/routes/oauth"
import fulfillmentRoutes from "@/server/routes/fulfillment"
import { rateLimit } from "@/server/middleware/rate-limit"
import { corsMiddleware } from "@/server/middleware/cors"
import { AutomationScheduler } from "@/server/services/scheduler"

const PORT = process.env.PORT || 5050

app.use(corsMiddleware)
app.use(rateLimit(60000, 100)) // 100 requests per minute

app.use("/oauth", oauthRoutes)
app.use("/fulfillment", fulfillmentRoutes)

const scheduler = new AutomationScheduler()

const server = app.listen(PORT, async () => {
  console.log(`DarkSmart API running on port ${PORT}`)
  console.log(`OAuth endpoints: http://localhost:${PORT}/oauth`)
  console.log(`Fulfillment endpoint: http://localhost:${PORT}/fulfillment`)

  // Initialize scheduler
  await scheduler.initialize()
})

process.on("SIGTERM", () => {
  console.log("[v0] SIGTERM received, shutting down gracefully...")
  scheduler.stopAll()
  server.close(() => {
    console.log("[v0] Server closed")
    process.exit(0)
  })
})

export default server
