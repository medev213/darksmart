import express, { type Response } from "express"
import { sql } from "@/lib/db"
import { requireAuth, type AuthRequest } from "@/server/middleware/auth"

const router = express.Router()

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { deviceId, name, scheduleTime, action } = req.body

    if (!deviceId || !name || !scheduleTime || !action) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    if (!["on", "off"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" })
    }

    // Verify device belongs to user
    const devices = await sql`
      SELECT id FROM devices WHERE id = ${deviceId} AND user_id = ${req.userId}
    `

    if (devices.length === 0) {
      return res.status(404).json({ error: "Device not found" })
    }

    const result = await sql`
      INSERT INTO automations (device_id, user_id, name, schedule_time, action)
      VALUES (${deviceId}, ${req.userId}, ${name}, ${scheduleTime}, ${action})
      RETURNING *
    `

    res.status(201).json(result[0])
  } catch (error) {
    console.error("[v0] Create automation error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const automations = await sql`
      SELECT a.* FROM automations a
      WHERE a.user_id = ${req.userId}
      ORDER BY a.created_at DESC
    `
    res.json(automations)
  } catch (error) {
    console.error("[v0] Get automations error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

router.patch("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, scheduleTime, action, enabled } = req.body

    const result = await sql`
      UPDATE automations
      SET name = COALESCE(${name}, name),
          schedule_time = COALESCE(${scheduleTime}, schedule_time),
          action = COALESCE(${action}, action),
          enabled = COALESCE(${enabled}, enabled),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.params.id} AND user_id = ${req.userId}
      RETURNING *
    `

    if (result.length === 0) {
      return res.status(404).json({ error: "Automation not found" })
    }

    res.json(result[0])
  } catch (error) {
    console.error("[v0] Update automation error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await sql`
      DELETE FROM automations WHERE id = ${req.params.id} AND user_id = ${req.userId}
      RETURNING id
    `

    if (result.length === 0) {
      return res.status(404).json({ error: "Automation not found" })
    }

    res.json({ message: "Automation deleted" })
  } catch (error) {
    console.error("[v0] Delete automation error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router
