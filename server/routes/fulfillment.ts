import express, { type Request, type Response } from "express"
import jwt from "jsonwebtoken"
import { sql } from "@/lib/db"
import { getGoogleDeviceType, getTraitsForDeviceType } from "@/server/utils/device-types"

const router = express.Router()

function validateGoogleToken(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "unauthorized",
      error_description: "Missing or invalid authorization header",
    })
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    req.userId = decoded.sub
    next()
  } catch (err) {
    return res.status(401).json({
      error: "invalid_token",
      error_description: "Invalid or expired access token",
    })
  }
}

async function handleSync(userId: string, requestId: string) {
  const devices = await sql`
    SELECT id, device_id, name, type, location, traits, status
    FROM devices
    WHERE user_id = ${userId}
  `

  const googleDevices = devices.map((device: any) => ({
    id: device.id,
    type: getGoogleDeviceType(device.type),
    traits: device.traits || getTraitsForDeviceType(device.type),
    name: {
      name: device.name,
      nicknames: [device.location || ""].filter(Boolean),
    },
    willReportState: true,
    deviceInfo: {
      manufacturer: "DarkSmart",
      model: device.type,
      hwVersion: "1.0",
      swVersion: "1.0.0",
    },
    attributes: {
      queryOnlyOnOff: false,
    },
  }))

  return {
    requestId: requestId,
    payload: {
      agentUserId: userId,
      devices: googleDevices,
    },
  }
}

async function handleQuery(userId: string, requestId: string, devices: any[]) {
  const deviceIds = devices[0]?.ids || []
  const responseDevices: Record<string, any> = {}

  for (const deviceId of deviceIds) {
    const dbDevices = await sql`
      SELECT id, status, type FROM devices
      WHERE id = ${deviceId} AND user_id = ${userId}
    `

    if (dbDevices.length === 0) {
      responseDevices[deviceId] = {
        online: false,
        errorCode: "deviceNotFound",
      }
      continue
    }

    const device = dbDevices[0]
    responseDevices[deviceId] = {
      online: true,
      on: device.status?.on || false,
      ...device.status,
    }
  }

  return {
    requestId: requestId,
    payload: {
      devices: responseDevices,
    },
  }
}

async function handleExecute(userId: string, requestId: string, commands: any[]) {
  const commandResults = []

  for (const command of commands) {
    const deviceIds = command.devices.map((d: any) => d.id)
    const execution = command.execution[0]

    for (const deviceId of deviceIds) {
      const dbDevices = await sql`
        SELECT id, status, type FROM devices
        WHERE id = ${deviceId} AND user_id = ${userId}
      `

      if (dbDevices.length === 0) {
        commandResults.push({
          ids: [deviceId],
          status: "ERROR",
          errorCode: "deviceNotFound",
        })
        continue
      }

      const device = dbDevices[0]

      try {
        const newState = { ...device.status }
        let success = true

        switch (execution.command) {
          case "action.devices.commands.OnOff":
            newState.on = execution.params.on
            break

          case "action.devices.commands.BrightnessAbsolute":
            newState.brightness = execution.params.brightness
            break

          case "action.devices.commands.ColorAbsolute":
            if (execution.params.color?.spectrumRGB !== undefined) {
              newState.color = { spectrumRgb: execution.params.color.spectrumRGB }
            } else if (execution.params.color?.temperature !== undefined) {
              newState.color = { temperatureK: execution.params.color.temperature }
            }
            break

          case "action.devices.commands.ThermostatTemperatureSetpoint":
            newState.thermostatTemperatureSetpoint = execution.params.thermostatTemperatureSetpoint
            break

          case "action.devices.commands.ThermostatSetMode":
            newState.thermostatMode = execution.params.thermostatMode
            break

          case "action.devices.commands.LockUnlock":
            newState.isLocked = execution.params.lock
            break

          default:
            success = false
        }

        if (success) {
          // Update device state in database
          await sql`
            UPDATE devices
            SET status = ${JSON.stringify(newState)}, last_updated = CURRENT_TIMESTAMP
            WHERE id = ${deviceId}
          `

          // TODO: Send MQTT message to physical device
          // await mqttClient.publish(`device/${deviceId}/command`, JSON.stringify(newState))

          commandResults.push({
            ids: [deviceId],
            status: "SUCCESS",
            states: newState,
          })
        } else {
          commandResults.push({
            ids: [deviceId],
            status: "ERROR",
            errorCode: "functionNotSupported",
          })
        }
      } catch (error) {
        commandResults.push({
          ids: [deviceId],
          status: "ERROR",
          errorCode: "hardError",
          debugString: (error as Error).message,
        })
      }
    }
  }

  return {
    requestId: requestId,
    payload: {
      commands: commandResults,
    },
  }
}

async function handleDisconnect(userId: string, requestId: string) {
  // Revoke all OAuth tokens for this user
  await sql`
    UPDATE oauth_tokens
    SET access_token = '', refresh_token = ''
    WHERE user_id = ${userId}
  `

  // TODO: Call HomeGraph.deleteAgentUser API to notify Google
  // This ensures Google removes the user from their system

  return {
    requestId: requestId,
    payload: {},
  }
}

router.post("/", validateGoogleToken, async (req: Request, res: Response) => {
  try {
    const { requestId, inputs } = req.body
    const userId = (req as any).userId

    if (!requestId || !inputs || !inputs[0]) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Missing requestId or inputs",
      })
    }

    const intent = inputs[0].intent
    let response

    switch (intent) {
      case "action.devices.SYNC":
        response = await handleSync(userId, requestId)
        break

      case "action.devices.QUERY":
        response = await handleQuery(userId, requestId, inputs[0].payload.devices)
        break

      case "action.devices.EXECUTE":
        response = await handleExecute(userId, requestId, inputs[0].payload.commands)
        break

      case "action.devices.DISCONNECT":
        response = await handleDisconnect(userId, requestId)
        break

      default:
        return res.status(400).json({
          error: "invalid_intent",
          error_description: `Unsupported intent: ${intent}`,
        })
    }

    res.json(response)
  } catch (error) {
    console.error("[v0] Fulfillment error:", error)
    res.status(500).json({
      requestId: req.body?.requestId || "error",
      payload: {
        errorCode: "hardError",
        debugString: (error as Error).message,
      },
    })
  }
})

router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", service: "smarthome-fulfillment" })
})

export default router
