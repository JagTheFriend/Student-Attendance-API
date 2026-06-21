export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Student Attendance Management API',
    version: '1.0.0',
    description: 'API for managing student attendance records with JWT authentication, role-based access, and reporting.',
  },
  servers: [
    { url: 'https://student-attendance-api-kxi9.onrender.com', description: 'Production server' },
    { url: 'http://localhost:3000', description: 'Development server' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'TEACHER'] },
        },
      },
      Student: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string' },
          studentId: { type: 'string' },
          dateOfBirth: { type: 'string', nullable: true },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
      },
      Subject: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          code: { type: 'string' },
          description: { type: 'string', nullable: true },
        },
      },
      Attendance: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          studentId: { type: 'string' },
          subjectId: { type: 'string' },
          date: { type: 'string' },
          status: { type: 'string', enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string', minLength: 6 },
                  name: { type: 'string' },
                  role: { type: 'string', enum: ['ADMIN', 'TEACHER'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered successfully' },
          400: { description: 'Validation failed' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and get JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/students': {
      get: {
        tags: ['Students'],
        summary: 'List all students',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'List of students' } },
      },
      post: {
        tags: ['Students'],
        summary: 'Create a new student',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'studentId'],
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string' },
                  studentId: { type: 'string' },
                  dateOfBirth: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Student created' } },
      },
    },
    '/api/students/{id}': {
      get: {
        tags: ['Students'],
        summary: 'Get student by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Student details' }, 404: { description: 'Not found' } },
      },
      put: {
        tags: ['Students'],
        summary: 'Update student',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Student updated' } },
      },
      delete: {
        tags: ['Students'],
        summary: 'Delete student (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Student deleted' } },
      },
    },
    '/api/subjects': {
      get: {
        tags: ['Subjects'],
        summary: 'List all subjects',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'List of subjects' } },
      },
      post: {
        tags: ['Subjects'],
        summary: 'Create a subject (Admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'code'],
                properties: {
                  name: { type: 'string' },
                  code: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Subject created' } },
      },
    },
    '/api/subjects/{id}': {
      get: {
        tags: ['Subjects'],
        summary: 'Get subject by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Subject details' } },
      },
      put: {
        tags: ['Subjects'],
        summary: 'Update subject (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Subject updated' } },
      },
      delete: {
        tags: ['Subjects'],
        summary: 'Delete subject (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Subject deleted' } },
      },
    },
    '/api/attendance/mark': {
      post: {
        tags: ['Attendance'],
        summary: 'Mark attendance for a student',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['studentId', 'subjectId', 'date', 'status'],
                properties: {
                  studentId: { type: 'string' },
                  subjectId: { type: 'string' },
                  date: { type: 'string' },
                  status: { type: 'string', enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Attendance marked' } },
      },
    },
    '/api/attendance/bulk': {
      post: {
        tags: ['Attendance'],
        summary: 'Mark attendance in bulk',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['records'],
                properties: {
                  records: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['studentId', 'subjectId', 'date', 'status'],
                      properties: {
                        studentId: { type: 'string' },
                        subjectId: { type: 'string' },
                        date: { type: 'string' },
                        status: { type: 'string', enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Bulk attendance processed' } },
      },
    },
    '/api/attendance': {
      get: {
        tags: ['Attendance'],
        summary: 'View attendance records',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'studentId', in: 'query', schema: { type: 'string' } },
          { name: 'subjectId', in: 'query', schema: { type: 'string' } },
          { name: 'from', in: 'query', schema: { type: 'string' } },
          { name: 'to', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Attendance records' } },
      },
    },
    '/api/attendance/report/monthly': {
      get: {
        tags: ['Attendance'],
        summary: 'Monthly attendance report',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'month', in: 'query', schema: { type: 'integer' } },
          { name: 'year', in: 'query', schema: { type: 'integer' } },
          { name: 'studentId', in: 'query', schema: { type: 'string' } },
          { name: 'subjectId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Monthly report' } },
      },
    },
    '/api/attendance/absent': {
      get: {
        tags: ['Attendance'],
        summary: 'Filter absent students by date',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'date', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'subjectId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Absent students' } },
      },
    },
    '/api/attendance/percentage': {
      get: {
        tags: ['Attendance'],
        summary: 'Attendance percentage calculation',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'studentId', in: 'query', schema: { type: 'string' } },
          { name: 'subjectId', in: 'query', schema: { type: 'string' } },
          { name: 'from', in: 'query', schema: { type: 'string' } },
          { name: 'to', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Attendance percentage' } },
      },
    },
    '/api/attendance/export': {
      get: {
        tags: ['Attendance'],
        summary: 'Export attendance report as CSV',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'format', in: 'query', schema: { type: 'string', default: 'csv' } },
          { name: 'studentId', in: 'query', schema: { type: 'string' } },
          { name: 'subjectId', in: 'query', schema: { type: 'string' } },
          { name: 'from', in: 'query', schema: { type: 'string' } },
          { name: 'to', in: 'query', schema: { type: 'string' } },
          { name: 'month', in: 'query', schema: { type: 'string' } },
          { name: 'year', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'CSV file download' } },
      },
    },
  },
}
