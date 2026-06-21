import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const students = new Hono()

students.use('*', authMiddleware)

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  studentId: z.string().min(1),
  dateOfBirth: z.string().optional(),
})

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  studentId: z.string().min(1).optional(),
  dateOfBirth: z.string().optional().nullable(),
})

students.get('/', async (c) => {
  const page = Number(c.req.query('page')) || 1
  const limit = Number(c.req.query('limit')) || 50
  const skip = (page - 1) * limit
  const search = c.req.query('search')

  const where = search
    ? {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
          { studentId: { contains: search } },
        ],
      }
    : {}

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.student.count({ where }),
  ])

  return c.json({ data, total, page, limit })
})

students.get('/:id', async (c) => {
  const id = c.req.param('id')
  const student = await prisma.student.findUnique({ where: { id } })
  if (!student) return c.json({ error: 'Student not found' }, 404)
  return c.json(student)
})

students.post('/', roleMiddleware('ADMIN', 'TEACHER'), async (c) => {
  const body = await c.req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
  }

  const { dateOfBirth, ...rest } = parsed.data

  const existing = await prisma.student.findFirst({
    where: { OR: [{ email: rest.email }, { studentId: rest.studentId }] },
  })
  if (existing) {
    return c.json({ error: 'Student with this email or ID already exists' }, 409)
  }

  const student = await prisma.student.create({
    data: {
      ...rest,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    },
  })

  return c.json(student, 201)
})

students.put('/:id', roleMiddleware('ADMIN', 'TEACHER'), async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
  }

  const existing = await prisma.student.findUnique({ where: { id } })
  if (!existing) return c.json({ error: 'Student not found' }, 404)

  const { dateOfBirth, ...rest } = parsed.data

  const student = await prisma.student.update({
    where: { id },
    data: {
      ...rest,
      dateOfBirth: dateOfBirth !== undefined
        ? (dateOfBirth ? new Date(dateOfBirth) : null)
        : undefined,
    },
  })

  return c.json(student)
})

students.delete('/:id', roleMiddleware('ADMIN'), async (c) => {
  const id = c.req.param('id')
  const existing = await prisma.student.findUnique({ where: { id } })
  if (!existing) return c.json({ error: 'Student not found' }, 404)

  await prisma.student.delete({ where: { id } })
  return c.json({ message: 'Student deleted successfully' })
})

export { students }
