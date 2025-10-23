import express from "express"
import cors from "cors"
import authRoutes from "@/server/routes/auth"
import deviceRoutes from "@/server/routes/devices"
import automationRoutes from "@/server/routes/automations"

const app = express()

// Middleware
app.use(express.json())
app.use(cors())

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/devices", deviceRoutes)
app.use("/api/automations", automationRoutes)

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "darksmart-api" })
})

export default app
