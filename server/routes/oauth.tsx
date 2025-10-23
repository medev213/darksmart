import express, { type Request, type Response } from "express"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { sql } from "@/lib/db"

const router = express.Router()

const CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
  TOKEN_EXPIRY: 3600, // 1 hour
  REFRESH_TOKEN_EXPIRY: 30 * 24 * 60 * 60, // 30 days
  OAUTH_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  OAUTH_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  BASE_URL: process.env.BASE_URL || "https://api.darksmart.pro",
}

function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString("base64url")
}

function verifyClient(clientId: string, clientSecret?: string): boolean {
  if (clientId !== CONFIG.OAUTH_CLIENT_ID) {
    return false
  }
  if (clientSecret && clientSecret !== CONFIG.OAUTH_CLIENT_SECRET) {
    return false
  }
  return true
}

function createAccessToken(userId: string, clientId: string, scope: string): string {
  const payload = {
    sub: userId,
    client_id: clientId,
    scope: scope,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + CONFIG.TOKEN_EXPIRY,
  }
  return jwt.sign(payload, CONFIG.JWT_SECRET)
}

function verifyAccessToken(token: string): any {
  try {
    return jwt.verify(token, CONFIG.JWT_SECRET)
  } catch (err) {
    return null
  }
}

router.get("/authorize", async (req: Request, res: Response) => {
  try {
    const { client_id, redirect_uri, state, response_type, scope } = req.query

    if (!client_id || !redirect_uri || !state || response_type !== "code") {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Missing or invalid required parameters",
      })
    }

    if (!verifyClient(client_id as string)) {
      return res.status(401).json({
        error: "unauthorized_client",
        error_description: "Invalid client_id",
      })
    }

    // Store session for authorization flow
    const sessionId = generateToken(16)
    const sessionKey = `oauth_session_${sessionId}`

    // In production, use Redis or database for session storage
    // For now, we'll use a simple in-memory approach with expiration
    const sessionData = {
      clientId: client_id,
      redirectUri: redirect_uri,
      state: state,
      scope: (scope as string) || "openid email profile",
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    }

    // TODO: Store in Redis or database
    // await redis.setex(sessionKey, 600, JSON.stringify(sessionData))

    // Render login form
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>DarkSmart Authorization</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
          }
          .container {
            background: #1a1f3a;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            max-width: 400px;
            width: 90%;
            border: 1px solid #2d3548;
          }
          h1 {
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
            color: #d4af37;
          }
          .subtitle {
            color: #a0a0a0;
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
          }
          .scope-list {
            background: #0a0e27;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            border: 1px solid #2d3548;
          }
          .scope-item {
            display: flex;
            align-items: center;
            margin: 0.5rem 0;
            font-size: 0.9rem;
            color: #e8e8e8;
          }
          .scope-item:before {
            content: "✓";
            color: #d4af37;
            font-weight: bold;
            margin-right: 0.5rem;
          }
          input {
            width: 100%;
            padding: 0.75rem;
            margin-bottom: 1rem;
            border: 1px solid #2d3548;
            border-radius: 6px;
            font-size: 1rem;
            box-sizing: border-box;
            background: #0a0e27;
            color: #e8e8e8;
          }
          input:focus {
            outline: none;
            border-color: #d4af37;
          }
          button {
            width: 100%;
            padding: 0.75rem;
            background: #d4af37;
            color: #0a0e27;
            border: none;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }
          button:hover {
            background: #b8941f;
          }
          .error {
            color: #ef4444;
            font-size: 0.9rem;
            margin-top: 0.5rem;
            display: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Link DarkSmart</h1>
          <p class="subtitle">Google Home wants to access your DarkSmart account</p>
          
          <div class="scope-list">
            <div class="scope-item">Control your smart home devices</div>
            <div class="scope-item">View device status</div>
            <div class="scope-item">Access your profile information</div>
          </div>

          <form id="loginForm" method="POST" action="/oauth/authorize">
            <input type="hidden" name="session_id" value="${sessionId}">
            <input 
              type="email" 
              name="email" 
              placeholder="Email" 
              required 
              autocomplete="email"
            >
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              required 
              autocomplete="current-password"
            >
            <button type="submit">Authorize</button>
            <div class="error" id="error"></div>
          </form>
        </div>

        <script>
          document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const error = document.getElementById('error');
            
            try {
              const response = await fetch('/oauth/authorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData)
              });
              
              const data = await response.json();
              
              if (data.redirect_uri) {
                window.location.href = data.redirect_uri;
              } else {
                error.textContent = data.error_description || 'Authorization failed';
                error.style.display = 'block';
              }
            } catch (err) {
              error.textContent = 'Network error. Please try again.';
              error.style.display = 'block';
            }
          });
        </script>
      </body>
      </html>
    `)
  } catch (error) {
    console.error("[v0] Authorization error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

router.post("/authorize", async (req: Request, res: Response) => {
  try {
    const { session_id, email, password } = req.body

    if (!session_id || !email || !password) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Missing required fields",
      })
    }

    // TODO: Retrieve session from Redis/database
    // const sessionData = await redis.get(`oauth_session_${session_id}`)

    // Authenticate user
    const users = await sql`SELECT id, password_hash FROM users WHERE email = ${email}`
    if (users.length === 0) {
      return res.status(401).json({
        error: "access_denied",
        error_description: "Invalid credentials",
      })
    }

    const user = users[0]
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return res.status(401).json({
        error: "access_denied",
        error_description: "Invalid credentials",
      })
    }

    // Generate authorization code
    const authCode = generateToken(32)
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store auth code in database
    await sql`
      INSERT INTO oauth_tokens (user_id, access_token, refresh_token, expires_at)
      VALUES (${user.id}, ${authCode}, '', ${codeExpiry})
    `

    // Build redirect URI
    const redirectUrl = new URL(req.body.redirect_uri || "")
    redirectUrl.searchParams.set("code", authCode)
    redirectUrl.searchParams.set("state", req.body.state || "")

    res.json({ redirect_uri: redirectUrl.toString() })
  } catch (error) {
    console.error("[v0] Authorization POST error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

router.post("/token", async (req: Request, res: Response) => {
  try {
    const { grant_type, code, redirect_uri, client_id, client_secret, refresh_token } = req.body

    if (!verifyClient(client_id, client_secret)) {
      return res.status(401).json({
        error: "invalid_client",
        error_description: "Invalid client credentials",
      })
    }

    // Handle authorization_code grant
    if (grant_type === "authorization_code") {
      if (!code || !redirect_uri) {
        return res.status(400).json({
          error: "invalid_request",
          error_description: "Missing code or redirect_uri",
        })
      }

      // Verify auth code
      const tokens = await sql`
        SELECT user_id FROM oauth_tokens 
        WHERE access_token = ${code} AND expires_at > NOW()
      `

      if (tokens.length === 0) {
        return res.status(400).json({
          error: "invalid_grant",
          error_description: "Invalid or expired authorization code",
        })
      }

      const userId = tokens[0].user_id

      // Generate new tokens
      const accessToken = createAccessToken(userId, client_id, "openid email profile")
      const newRefreshToken = generateToken(32)
      const expiresAt = new Date(Date.now() + CONFIG.REFRESH_TOKEN_EXPIRY * 1000)

      // Store tokens
      await sql`
        UPDATE oauth_tokens
        SET access_token = ${accessToken}, refresh_token = ${newRefreshToken}, expires_at = ${expiresAt}
        WHERE user_id = ${userId}
      `

      return res.json({
        access_token: accessToken,
        refresh_token: newRefreshToken,
        token_type: "Bearer",
        expires_in: CONFIG.TOKEN_EXPIRY,
      })
    }

    // Handle refresh_token grant
    if (grant_type === "refresh_token") {
      if (!refresh_token) {
        return res.status(400).json({
          error: "invalid_request",
          error_description: "Missing refresh_token",
        })
      }

      const tokens = await sql`
        SELECT user_id FROM oauth_tokens WHERE refresh_token = ${refresh_token}
      `

      if (tokens.length === 0) {
        return res.status(400).json({
          error: "invalid_grant",
          error_description: "Invalid refresh token",
        })
      }

      const userId = tokens[0].user_id
      const accessToken = createAccessToken(userId, client_id, "openid email profile")

      await sql`
        UPDATE oauth_tokens
        SET access_token = ${accessToken}
        WHERE user_id = ${userId}
      `

      return res.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: CONFIG.TOKEN_EXPIRY,
      })
    }

    res.status(400).json({
      error: "unsupported_grant_type",
      error_description: "Only authorization_code and refresh_token grants are supported",
    })
  } catch (error) {
    console.error("[v0] Token error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

router.post("/revoke", async (req: Request, res: Response) => {
  try {
    const { token, client_id, client_secret } = req.body

    if (!verifyClient(client_id, client_secret)) {
      return res.status(401).json({
        error: "invalid_client",
      })
    }

    if (!token) {
      return res.status(400).json({
        error: "invalid_request",
      })
    }

    // Revoke token
    await sql`
      UPDATE oauth_tokens
      SET access_token = '', refresh_token = ''
      WHERE access_token = ${token} OR refresh_token = ${token}
    `

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("[v0] Revoke error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

router.get("/tokeninfo", (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "invalid_token",
        error_description: "Missing or invalid authorization header",
      })
    }

    const token = authHeader.substring(7)
    const tokenData = verifyAccessToken(token)

    if (!tokenData) {
      return res.status(401).json({
        error: "invalid_token",
        error_description: "Token is invalid or expired",
      })
    }

    res.json({
      user_id: tokenData.sub,
      client_id: tokenData.client_id,
      scope: tokenData.scope,
      expires_in: tokenData.exp - Math.floor(Date.now() / 1000),
    })
  } catch (error) {
    console.error("[v0] Token info error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

export default router
