import { Context, Next } from 'hono'
import { verifyToken, JwtPayload } from '../lib/jwt.js'

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: no token provided' }, 401)
  }

  const token = authHeader.slice(7)
  try {
    const payload = verifyToken(token)
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: 'Unauthorized: invalid or expired token' }, 401)
  }
}

export function roleMiddleware(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user: JwtPayload | undefined = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    if (!roles.includes(user.role)) {
      return c.json({ error: 'Forbidden: insufficient permissions' }, 403)
    }
    await next()
  }
}
