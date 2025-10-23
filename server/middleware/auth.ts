import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

export interface AuthRequest extends Request {
  userId?: string
  clientId?: string
  scope?: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Missing authorization token",
    })
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    req.userId = decoded.sub
    req.clientId = decoded.client_id
    req.scope = decoded.scope
    next()
  } catch (error) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Invalid or expired token",
    })
  }
}
