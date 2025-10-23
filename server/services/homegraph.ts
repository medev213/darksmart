import axios from "axios"

export class HomeGraphClient {
  private accessToken: string
  private agentUserId: string

  constructor(accessToken: string, agentUserId: string) {
    this.accessToken = accessToken
    this.agentUserId = agentUserId
  }

  async reportState(deviceId: string, state: Record<string, any>) {
    try {
      const response = await axios.post(
        "https://homegraph.googleapis.com/v1/devices:reportStateAndNotification",
        {
          requestId: `${deviceId}-${Date.now()}`,
          agentUserId: this.agentUserId,
          payload: {
            devices: {
              states: {
                [deviceId]: state,
              },
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      )

      console.log("[v0] HomeGraph report state response:", response.data)
      return response.data
    } catch (error) {
      console.error("[v0] HomeGraph report state error:", error)
      throw error
    }
  }

  async requestSync() {
    try {
      const response = await axios.post(
        "https://homegraph.googleapis.com/v1/devices:requestSync",
        {
          agentUserId: this.agentUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      )

      console.log("[v0] HomeGraph request sync response:", response.data)
      return response.data
    } catch (error) {
      console.error("[v0] HomeGraph request sync error:", error)
      throw error
    }
  }

  async deleteAgentUser() {
    try {
      const response = await axios.post(
        "https://homegraph.googleapis.com/v1/agentUsers:delete",
        {
          agentUserId: this.agentUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      )

      console.log("[v0] HomeGraph delete agent user response:", response.data)
      return response.data
    } catch (error) {
      console.error("[v0] HomeGraph delete agent user error:", error)
      throw error
    }
  }
}
