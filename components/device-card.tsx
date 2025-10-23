"use client"

import { Power, Edit2, Trash2 } from "lucide-react"

interface Device {
  id: string
  name: string
  type: string
  location: string
  status: { on: boolean }
  deviceId: string
}

interface DeviceCardProps {
  device: Device
  onToggle: () => void
}

export function DeviceCard({ device, onToggle }: DeviceCardProps) {
  return (
    <div className="device-card group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">{device.name}</h3>
          <p className="text-xs text-muted mt-1">{device.location}</p>
        </div>
        <span className="text-xs bg-card px-2 py-1 rounded text-muted">{device.type}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${device.status.on ? "bg-accent" : "bg-muted"}`} />
          <span className="text-sm text-muted">{device.status.on ? "On" : "Off"}</span>
        </div>

        <button
          onClick={onToggle}
          className={`p-2 rounded-lg transition-all duration-200 ${
            device.status.on ? "bg-accent/20 text-accent hover:bg-accent/30" : "bg-card text-muted hover:bg-card/80"
          }`}
        >
          <Power className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="flex-1 flex items-center justify-center gap-1 text-xs bg-card hover:bg-card/80 text-muted px-2 py-1 rounded transition-colors">
          <Edit2 className="w-3 h-3" />
          Edit
        </button>
        <button className="flex-1 flex items-center justify-center gap-1 text-xs bg-error/10 hover:bg-error/20 text-error px-2 py-1 rounded transition-colors">
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
      </div>
    </div>
  )
}
