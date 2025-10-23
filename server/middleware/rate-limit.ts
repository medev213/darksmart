import type { Request, Response, NextFunction } from "express"

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number }
}

const store: RateLimitStore = {}

export function rateLimit(windowMs = 60000, maxRequests = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || "unknown"
    const now = Date.now()

    if (!store[key]) {
      store[key] = { count: 1, resetTime: now + windowMs }
      return next()
    }

    if (now > store[key].resetTime) {
      store[key] = { count: 1, resetTime: now + windowMs }
      return next()
    }

    store[key].count++

    if (store[key].count > maxRequests) {
      return res.status(429).json({
        error: "too_many_requests",
        message: "Rate limit exceeded",
      })
    }

    next()
  }
}
