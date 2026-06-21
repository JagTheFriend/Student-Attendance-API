import { serve } from '@hono/node-server'
import { swaggerUI } from '@hono/swagger-ui'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { config } from './config.js'
import { openApiSpec } from './openapi.js'
import { auth } from './routes/auth.js'
import { students } from './routes/students.js'
import { subjects } from './routes/subjects.js'
import { attendance } from './routes/attendance.js'

const app = new Hono()

app.use('/api/*', cors())

app.get('/', (c) => c.redirect('/docs'))

app.get('/openapi.json', (c) => c.json(openApiSpec))
app.get('/docs', swaggerUI({ url: '/openapi.json' }))

app.route('/api/auth', auth)
app.route('/api/students', students)
app.route('/api/subjects', subjects)
app.route('/api/attendance', attendance)

console.log(`Server running at http://localhost:${config.port}`)
console.log(`Swagger docs at http://localhost:${config.port}/docs`)

serve({ fetch: app.fetch, port: config.port })
