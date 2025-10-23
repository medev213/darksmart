import express, { type Response } from "express"
import { sql } from "@/lib/db"
import { requireAuth, type AuthRequest } from "@/server/middleware/auth"
import { getDeviceTypeFromProductId, getTraitsForDeviceType } from "@/server/utils/device-types"

const router = express.Router()

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { deviceId, name, location } = req.body

    if (!deviceId || !name) {
      return res.status(400).json({ error: "Device ID and name required" })
    }

    const deviceType = getDeviceTypeFromProductId(deviceId)
    const traits = getTraitsForDeviceType(deviceType)

    const result = await sql`
      INSERT INTO devices (device_id, user_id, name, type, location, traits)
      VALUES (${deviceId}, ${req.userId}, ${name}, ${deviceType}, ${location || ""}, ${traits})
      RETURNING *
    `

    res.status(201).json(result[0])
  } catch (error) {
    console.error("[v0] Add device error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const devices = await sql`
      SELECT * FROM devices WHERE user_id = ${req.userId}
      ORDER BY created_at DESC
    `
    res.json(devices)
  } catch (error) {
    console.error("[v0] Get devices error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const devices = await sql`
      SELECT * FROM devices WHERE id = ${req.params.id} AND user_id = ${req.userId}
    `

    if (devices.length === 0) {
      return res.status(404).json({ error: "Device not found" })
    }

    res.json(devices[0])
  } catch (error) {
    console.error("[v0] Get device error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

router.patch("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, location } = req.body

    const result = await sql`
      UPDATE devices
      SET name = COALESCE(${name}, name),
          location = COALESCE(${location}, location),
          last_updated = CURRENT_TIMESTAMP
      WHERE id = ${req.params.id} AND user_id = ${req.userId}
      RETURNING *
    `

    if (result.length === 0) {
      return res.status(404).json({ error: "Device not found" })
    }

    res.json(result[0])
  } catch (error) {
    console.error("[v0] Update device error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await sql`
      DELETE FROM devices WHERE id = ${req.params.id} AND user_id = ${req.userId}
      RETURNING id
    `

    if (result.length === 0) {
      return res.status(404).json({ error: "Device not found" })
    }

    res.json({ message: "Device deleted" })
  } catch (error) {
    console.error("[v0] Delete device error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

router.post("/:id/control", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { action } = req.body

    if (!action || !["on", "off"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" })
    }

    const isOn = action === "on"

    const result = await sql`
      UPDATE devices
      SET status = jsonb_set(status, '{on}', ${isOn}::jsonb),
          last_updated = CURRENT_TIMESTAMP
      WHERE id = ${req.params.id} AND user_id = ${req.userId}
      RETURNING *
    `

    if (result.length === 0) {
      return res.status(404).json({ error: "Device not found" })
    }

    // TODO: Send MQTT message to physical device
    // TODO: Report state to Google Home

    res.json(result[0])
  } catch (error) {
    console.error("[v0] Control device error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

router.get("/:id/status", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const devices = await sql`
      SELECT id, name, status, last_updated FROM devices
      WHERE id = ${req.params.id} AND user_id = ${req.userId}
    `

    if (devices.length === 0) {
      return res.status(404).json({ error: "Device not found" })
    }

    res.json(devices[0])
  } catch (error) {
    console.error("[v0] Get status error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router
