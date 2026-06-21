import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-not-for-production',
  jwtExpiresIn: '7d',
}
