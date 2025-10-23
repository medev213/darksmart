"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { DeviceCard } from "./device-card"

export function DeviceGrid() {
  const [devices, setDevices] = useState([
    {
      id: "1",
      name: "Living Room Light",
      type: "Smart Switch",
      location: "Living Room",
      status: { on: false },
      deviceId: "200001",
    },
    {
      id: "2",
      name: "TV Plug",
      type: "Smart Outlet",
      location: "Living Room",
      status: { on: true },
      deviceId: "100001",
    },
    {
      id: "3",
      name: "Bedroom Sensor",
      type: "Smart Sensor",
      location: "Bedroom",
      status: { on: true },
      deviceId: "300001",
    },
  ])

  const toggleDevice = (id: string) => {
    setDevices(devices.map((device) => (device.id === id ? { ...device, status: { on: !device.status.on } } : device)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Devices</h2>
          <p className="text-sm text-muted mt-1">{devices.length} devices connected</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors gold-glow">
          <Plus className="w-4 h-4" />
          Add Device
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <DeviceCard key={device.id} device={device} onToggle={() => toggleDevice(device.id)} />
        ))}
      </div>
    </div>
  )
}
