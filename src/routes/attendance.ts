import { Hono, Context } from 'hono'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'
import type { JwtPayload } from '../lib/jwt.js'

function getUser(c: Context): JwtPayload {
  return c.get('user') as JwtPayload
}

const attendance = new Hono()

attendance.use('*', authMiddleware)

const markSchema = z.object({
  studentId: z.string().uuid(),
  subjectId: z.string().uuid(),
  date: z.string(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
})

const bulkSchema = z.object({
  records: z.array(z.object({
    studentId: z.string().uuid(),
    subjectId: z.string().uuid(),
    date: z.string(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  })),
})

attendance.post('/mark', roleMiddleware('ADMIN', 'TEACHER'), async (c) => {
  const body = await c.req.json()
  const parsed = markSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
  }

  const { studentId, subjectId, date, status } = parsed.data
  const user = getUser(c)

  const [student, subject] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.subject.findUnique({ where: { id: subjectId } }),
  ])
  if (!student) return c.json({ error: 'Student not found' }, 404)
  if (!subject) return c.json({ error: 'Subject not found' }, 404)

  const recordDate = new Date(date)
  recordDate.setHours(0, 0, 0, 0)

  const existing = await prisma.attendance.findUnique({
    where: { studentId_subjectId_date: { studentId, subjectId, date: recordDate } },
  })

  let record
  if (existing) {
    record = await prisma.attendance.update({
      where: { id: existing.id },
      data: { status, markedById: user.userId },
      include: { student: true, subject: true },
    })
  } else {
    record = await prisma.attendance.create({
      data: { studentId, subjectId, date: recordDate, status, markedById: user.userId },
      include: { student: true, subject: true },
    })
  }

  return c.json(record, existing ? 200 : 201)
})

attendance.post('/bulk', roleMiddleware('ADMIN', 'TEACHER'), async (c) => {
  const body = await c.req.json()
  const parsed = bulkSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
  }

  const user = getUser(c)
  const results: unknown[] = []
  const errors: { index: number; error: string }[] = []

  for (let i = 0; i < parsed.data.records.length; i++) {
    const { studentId, subjectId, date, status } = parsed.data.records[i]

    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) { errors.push({ index: i, error: 'Student not found' }); continue }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!subject) { errors.push({ index: i, error: 'Subject not found' }); continue }

    const recordDate = new Date(date)
    recordDate.setHours(0, 0, 0, 0)

    const existing = await prisma.attendance.findUnique({
      where: { studentId_subjectId_date: { studentId, subjectId, date: recordDate } },
    })

    let record
    if (existing) {
      record = await prisma.attendance.update({
        where: { id: existing.id },
        data: { status, markedById: user.userId },
      })
    } else {
      record = await prisma.attendance.create({
        data: { studentId, subjectId, date: recordDate, status, markedById: user.userId },
      })
    }
    results.push(record)
  }

  return c.json({ success: results.length, errors, total: parsed.data.records.length })
})

attendance.get('/', async (c) => {
  const studentId = c.req.query('studentId')
  const subjectId = c.req.query('subjectId')
  const from = c.req.query('from')
  const to = c.req.query('to')
  const page = Number(c.req.query('page')) || 1
  const limit = Number(c.req.query('limit')) || 50
  const skip = (page - 1) * limit

  const where: Prisma.AttendanceWhereInput = {}
  if (studentId) where.studentId = studentId
  if (subjectId) where.subjectId = subjectId
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to)
  }

  const [data, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: { student: true, subject: true, markedBy: { select: { id: true, name: true, email: true } } },
    }),
    prisma.attendance.count({ where }),
  ])

  return c.json({ data, total, page, limit })
})

attendance.get('/report/monthly', async (c) => {
  const month = Number(c.req.query('month')) || new Date().getMonth() + 1
  const year = Number(c.req.query('year')) || new Date().getFullYear()
  const studentId = c.req.query('studentId')
  const subjectId = c.req.query('subjectId')

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  const where: Prisma.AttendanceWhereInput = {
    date: { gte: startDate, lte: endDate },
  }
  if (studentId) where.studentId = studentId
  if (subjectId) where.subjectId = subjectId

  const records = await prisma.attendance.findMany({
    where,
    include: { student: true, subject: true },
    orderBy: { date: 'asc' },
  })

  const summary: Record<string, {
    student: { id: string; firstName: string; lastName: string; studentId: string }
    total: number; present: number; absent: number; late: number; excused: number
    percentage: number
  }> = {}

  for (const r of records) {
    const key = r.studentId
    if (!summary[key]) {
      summary[key] = {
        student: {
          id: r.student.id,
          firstName: r.student.firstName,
          lastName: r.student.lastName,
          studentId: r.student.studentId,
        },
        total: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 0,
      }
    }
    summary[key].total++
    if (r.status === 'PRESENT') summary[key].present++
    else if (r.status === 'ABSENT') summary[key].absent++
    else if (r.status === 'LATE') summary[key].late++
    else if (r.status === 'EXCUSED') summary[key].excused++
  }

  for (const key of Object.keys(summary)) {
    const s = summary[key]
    s.percentage = s.total > 0 ? Math.round((s.present / s.total) * 10000) / 100 : 0
  }

  return c.json({
    month,
    year,
    startDate,
    endDate,
    records: Object.values(summary),
    totalStudents: Object.keys(summary).length,
  })
})

attendance.get('/absent', async (c) => {
  const subjectId = c.req.query('subjectId')
  const dateStr = c.req.query('date')

  if (!dateStr) return c.json({ error: 'date query parameter is required' }, 400)

  const queryDate = new Date(dateStr)
  queryDate.setHours(0, 0, 0, 0)

  const where: Prisma.AttendanceWhereInput = {
    date: queryDate,
    status: 'ABSENT',
  }
  if (subjectId) where.subjectId = subjectId

  const records = await prisma.attendance.findMany({
    where,
    include: { student: true, subject: true },
  })

  return c.json({ date: dateStr, subjectId: subjectId || 'all', absentStudents: records })
})

attendance.get('/percentage', async (c) => {
  const studentId = c.req.query('studentId')
  const subjectId = c.req.query('subjectId')
  const from = c.req.query('from')
  const to = c.req.query('to')

  const where: Prisma.AttendanceWhereInput = {}
  if (studentId) where.studentId = studentId
  if (subjectId) where.subjectId = subjectId
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    }
  }

  const records = await prisma.attendance.findMany({ where })

  const total = records.length
  const present = records.filter(r => r.status === 'PRESENT').length
  const absent = records.filter(r => r.status === 'ABSENT').length
  const late = records.filter(r => r.status === 'LATE').length
  const excused = records.filter(r => r.status === 'EXCUSED').length
  const percentage = total > 0 ? Math.round((present / total) * 10000) / 100 : 0

  return c.json({
    studentId: studentId || 'all',
    subjectId: subjectId || 'all',
    total,
    present,
    absent,
    late,
    excused,
    percentage,
  })
})

attendance.get('/export', async (c) => {
  const format = c.req.query('format') || 'csv'
  const studentId = c.req.query('studentId')
  const subjectId = c.req.query('subjectId')
  const from = c.req.query('from')
  const to = c.req.query('to')
  const month = c.req.query('month')
  const year = c.req.query('year')

  const where: Prisma.AttendanceWhereInput = {}

  if (month && year) {
    const m = Number(month)
    const y = Number(year)
    where.date = {
      gte: new Date(y, m - 1, 1),
      lte: new Date(y, m, 0, 23, 59, 59, 999),
    }
  } else if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    }
  }
  if (studentId) where.studentId = studentId
  if (subjectId) where.subjectId = subjectId

  const records = await prisma.attendance.findMany({
    where,
    include: { student: true, subject: true, markedBy: { select: { name: true } } },
    orderBy: { date: 'asc' },
  })

  if (format === 'csv') {
    const header = 'Student ID,First Name,Last Name,Email,Subject Code,Subject Name,Date,Status,Marked By\n'
    const rows = records.map(r =>
      `${r.student.studentId},${r.student.firstName},${r.student.lastName},${r.student.email},${r.subject.code},${r.subject.name},${r.date.toISOString().split('T')[0]},${r.status},${r.markedBy.name}`
    ).join('\n')

    c.header('Content-Type', 'text/csv')
    c.header('Content-Disposition', `attachment; filename="attendance-report-${month || 'all'}-${year || 'all'}.csv"`)
    return c.body(header + rows)
  }

  return c.json(records)
})

export { attendance }
