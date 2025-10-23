import express, { type Request, type Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sql } from "@/lib/db"

const router = express.Router()

router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" })
    }

    // Check if user exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existing.length > 0) {
      return res.status(409).json({ error: "User already exists" })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const result = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${passwordHash})
      RETURNING id, email, created_at
    `

    res.status(201).json({
      user: result[0],
      message: "User created successfully",
    })
  } catch (error) {
    console.error("[v0] Signup error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" })
    }

    // Find user
    const users = await sql`SELECT id, password_hash FROM users WHERE email = ${email}`
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const user = users[0]

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Create JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        email: email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      process.env.JWT_SECRET!,
    )

    res.json({
      token,
      user: { id: user.id, email },
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router
