"use client"

import { Bell, User, LogOut } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border bg-card/30 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">DarkSmart Cloud</h1>
          <p className="text-sm text-muted">Welcome back, User</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-card rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-muted" />
          </button>
          <button className="p-2 hover:bg-card rounded-lg transition-colors">
            <User className="w-5 h-5 text-muted" />
          </button>
          <button className="p-2 hover:bg-card rounded-lg transition-colors">
            <LogOut className="w-5 h-5 text-muted" />
          </button>
        </div>
      </div>
    </header>
  )
}
