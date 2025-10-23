export interface User {
  id: string
  email: string
  password_hash: string
  google_linked: boolean
  created_at: Date
  updated_at: Date
}

export interface Device {
  id: string
  device_id: string
  user_id: string
  name: string
  type: "Smart Outlet" | "Smart Switch" | "Smart Sensor" | "Smart Plug Bridge" | "Smart Valve"
  location: string
  status: { on: boolean }
  traits: string[]
  last_updated: Date
  created_at: Date
}

export interface Automation {
  id: string
  device_id: string
  user_id: string
  name: string
  schedule_time: string
  action: "on" | "off"
  enabled: boolean
  created_at: Date
  updated_at: Date
}

export interface OAuthToken {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: Date
  created_at: Date
  updated_at: Date
}
