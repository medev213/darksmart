"use client"

import { Home, Zap, Wifi, Settings } from "lucide-react"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const tabs = [
    { id: "devices", label: "My Devices", icon: Home },
    { id: "automations", label: "Automations", icon: Zap },
    { id: "google-home", label: "Google Home", icon: Wifi },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-sm p-6 flex flex-col">
      <div className="mb-8">
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center gold-glow">
          <span className="text-primary-foreground font-bold text-lg">DS</span>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground gold-glow"
                  : "text-muted hover:bg-card hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted">v1.0.0</p>
      </div>
    </aside>
  )
}
