import dotenv from "dotenv"
dotenv.config()

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

async function initializeDatabase() {
  try {
    console.log("[v0] Starting database initialization...")

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        google_linked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    console.log("[v0] Users table created")

    // Create devices table
    await sql`
      CREATE TABLE IF NOT EXISTS devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id VARCHAR(50) UNIQUE NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        location VARCHAR(255),
        status JSONB DEFAULT '{"on": false}',
        traits TEXT[] DEFAULT ARRAY['action.devices.traits.OnOff'],
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_device_type CHECK (type IN ('Smart Outlet', 'Smart Switch', 'Smart Sensor', 'Smart Plug Bridge', 'Smart Valve'))
      );
    `
    console.log("[v0] Devices table created")

    // Create automations table
    await sql`
      CREATE TABLE IF NOT EXISTS automations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        schedule_time TIME NOT NULL,
        action VARCHAR(50) NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_action CHECK (action IN ('on', 'off'))
      );
    `
    console.log("[v0] Automations table created")

    // Create oauth_tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        access_token VARCHAR(500) NOT NULL,
        refresh_token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    console.log("[v0] OAuth tokens table created")

    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);`
    await sql`CREATE INDEX IF NOT EXISTS idx_automations_device_id ON automations(device_id);`
    await sql`CREATE INDEX IF NOT EXISTS idx_automations_user_id ON automations(user_id);`
    await sql`CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON oauth_tokens(user_id);`
    console.log("[v0] Indexes created")

    console.log("[v0] Database initialization completed successfully")
  } catch (error) {
    console.error("[v0] Database initialization error:", error)
    process.exit(1)
  }
}

initializeDatabase()
