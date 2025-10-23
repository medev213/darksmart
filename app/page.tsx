"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { DeviceGrid } from "@/components/device-grid"
import { Header } from "@/components/header"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("devices")

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "devices" && <DeviceGrid />}
          {activeTab === "automations" && <AutomationsView />}
          {activeTab === "google-home" && <GoogleHomeView />}
          {activeTab === "settings" && <SettingsView />}
        </div>
      </main>
    </div>
  )
}

function AutomationsView() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-primary">Automations</h2>
      <div className="glass-effect rounded-lg p-6">
        <p className="text-muted">No automations configured yet. Create one to get started.</p>
      </div>
    </div>
  )
}

function GoogleHomeView() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-primary">Google Home Integration</h2>
      <div className="glass-effect rounded-lg p-6">
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
          Link Google Home
        </button>
      </div>
    </div>
  )
}

function SettingsView() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-primary">Account Settings</h2>
      <div className="glass-effect rounded-lg p-6">
        <p className="text-muted">Settings coming soon.</p>
      </div>
    </div>
  )
}
