import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload as object, config.jwtSecret, { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload
}
