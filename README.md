# Student Attendance Management API

A backend API for managing student attendance records built with **TypeScript**, **Hono**, and **Prisma**.

## Features

- **JWT Authentication** Register and login with secure token-based auth
- **Student Management** Full CRUD with search and pagination
- **Subject Management** Full CRUD with pagination
- **Attendance Marking** Mark individual or bulk attendance (PRESENT, ABSENT, LATE, EXCUSED)
- **Attendance Reports** Monthly attendance summaries with per-student breakdown
- **Absent-Student Filtering** Find all absent students by date and subject
- **Attendance Percentage** Calculate attendance percentage with filters
- **CSV Export** Export attendance records as CSV
- **Role-Based Access** ADMIN and TEACHER roles with protected routes
- **Swagger Docs** Interactive API documentation at `/docs`

## Tech Stack

| Technology | Purpose |
|------------|---------|
| TypeScript | Language |
| [Hono](https://hono.dev/) | HTTP framework |
| [Prisma](https://www.prisma.io/) | ORM (SQLite) |
| JWT (jsonwebtoken) | Authentication |
| Zod | Request validation |
| Swagger UI | API documentation |

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone <repo-url>
cd student-attendance-management-api
npm install
```

### Setup

```bash
cp .env.example .env
```

Edit `.env` and set a secure `JWT_SECRET`.

### Database

```bash
npx prisma db push
```

This creates a SQLite database (`prisma/dev.db`) and generates the Prisma client.

### Run

```bash
npm run dev
```

Server starts at `http://localhost:3000`. Swagger docs at `http://localhost:3000/docs`.

## API Overview

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive a JWT token |

All other endpoints require a `Bearer` token in the `Authorization` header.

### Students

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/students` | List students (supports `?page=`, `?limit=`, `?search=`) |
| POST | `/api/students` | Create a student (ADMIN/TEACHER) |
| GET | `/api/students/:id` | Get student by ID |
| PUT | `/api/students/:id` | Update student (ADMIN/TEACHER) |
| DELETE | `/api/students/:id` | Delete student (ADMIN only) |

### Subjects

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/subjects` | List subjects (supports `?page=`, `?limit=`) |
| POST | `/api/subjects` | Create a subject (ADMIN only) |
| GET | `/api/subjects/:id` | Get subject by ID |
| PUT | `/api/subjects/:id` | Update subject (ADMIN only) |
| DELETE | `/api/subjects/:id` | Delete subject (ADMIN only) |

### Attendance

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/attendance/mark` | Mark attendance for a student |
| POST | `/api/attendance/bulk` | Mark attendance for multiple students |
| GET | `/api/attendance` | View attendance records (supports `?studentId=`, `?subjectId=`, `?from=`, `?to=`, `?page=`, `?limit=`) |
| GET | `/api/attendance/report/monthly` | Monthly attendance report (`?month=`, `?year=`, `?studentId=`, `?subjectId=`) |
| GET | `/api/attendance/absent` | Filter absent students (`?date=` required, `?subjectId=`) |
| GET | `/api/attendance/percentage` | Attendance percentage calculation |
| GET | `/api/attendance/export` | Export attendance as CSV |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start compiled production server |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:studio` | Open Prisma Studio (GUI database viewer) |

## Example Usage

### Register an admin user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@school.com","password":"securepass","name":"Admin","role":"ADMIN"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@school.com","password":"securepass"}'
```

Save the returned `token` for subsequent requests.

### Mark attendance

```bash
curl -X POST http://localhost:3000/api/attendance/mark \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"studentId":"<uuid>","subjectId":"<uuid>","date":"2026-06-21","status":"PRESENT"}'
```
