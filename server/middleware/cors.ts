import type { Request, Response, NextFunction } from "express"

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = ["https://darksmart.pro", "https://www.darksmart.pro", "http://localhost:3000"]

  const origin = req.headers.origin

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  res.setHeader("Access-Control-Allow-Credentials", "true")

  if (req.method === "OPTIONS") {
    return res.sendStatus(200)
  }

  next()
}
