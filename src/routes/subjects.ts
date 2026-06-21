import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const subjects = new Hono()

subjects.use('*', authMiddleware)

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
})

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
})

subjects.get('/', async (c) => {
  const page = Number(c.req.query('page')) || 1
  const limit = Number(c.req.query('limit')) || 50
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.subject.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.subject.count(),
  ])

  return c.json({ data, total, page, limit })
})

subjects.get('/:id', async (c) => {
  const id = c.req.param('id')
  const subject = await prisma.subject.findUnique({ where: { id } })
  if (!subject) return c.json({ error: 'Subject not found' }, 404)
  return c.json(subject)
})

subjects.post('/', roleMiddleware('ADMIN'), async (c) => {
  const body = await c.req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
  }

  const existing = await prisma.subject.findUnique({ where: { code: parsed.data.code } })
  if (existing) {
    return c.json({ error: 'Subject with this code already exists' }, 409)
  }

  const subject = await prisma.subject.create({ data: parsed.data })
  return c.json(subject, 201)
})

subjects.put('/:id', roleMiddleware('ADMIN'), async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
  }

  const existing = await prisma.subject.findUnique({ where: { id } })
  if (!existing) return c.json({ error: 'Subject not found' }, 404)

  const subject = await prisma.subject.update({
    where: { id },
    data: parsed.data,
  })

  return c.json(subject)
})

subjects.delete('/:id', roleMiddleware('ADMIN'), async (c) => {
  const id = c.req.param('id')
  const existing = await prisma.subject.findUnique({ where: { id } })
  if (!existing) return c.json({ error: 'Subject not found' }, 404)

  await prisma.subject.delete({ where: { id } })
  return c.json({ message: 'Subject deleted successfully' })
})

export { subjects }
