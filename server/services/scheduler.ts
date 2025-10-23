import cron from "node-cron"
import { sql } from "@/lib/db"

export class AutomationScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map()

  async initialize() {
    console.log("[v0] Initializing automation scheduler...")

    // Load all enabled automations from database
    const automations = await sql`
      SELECT a.id, a.device_id, a.schedule_time, a.action, a.user_id
      FROM automations a
      WHERE a.enabled = true
    `

    for (const automation of automations) {
      this.scheduleAutomation(automation)
    }

    console.log(`[v0] Loaded ${automations.length} automations`)
  }

  scheduleAutomation(automation: any) {
    const { id, device_id, schedule_time, action, user_id } = automation

    // Parse time (HH:MM format)
    const [hours, minutes] = schedule_time.split(":").map(Number)

    // Create cron expression (runs daily at specified time)
    const cronExpression = `${minutes} ${hours} * * *`

    const job = cron.schedule(cronExpression, async () => {
      console.log(`[v0] Executing automation ${id} at ${schedule_time}`)

      try {
        // Update device state
        const isOn = action === "on"
        await sql`
          UPDATE devices
          SET status = jsonb_set(status, '{on}', ${isOn}::jsonb),
              last_updated = CURRENT_TIMESTAMP
          WHERE id = ${device_id} AND user_id = ${user_id}
        `

        // TODO: Send MQTT message to physical device
        // TODO: Report state to Google Home

        console.log(`[v0] Automation ${id} executed successfully`)
      } catch (error) {
        console.error(`[v0] Automation ${id} execution error:`, error)
      }
    })

    this.jobs.set(id, job)
  }

  stopAutomation(automationId: string) {
    const job = this.jobs.get(automationId)
    if (job) {
      job.stop()
      this.jobs.delete(automationId)
      console.log(`[v0] Stopped automation ${automationId}`)
    }
  }

  stopAll() {
    for (const [id, job] of this.jobs.entries()) {
      job.stop()
    }
    this.jobs.clear()
    console.log("[v0] Stopped all automations")
  }
}
