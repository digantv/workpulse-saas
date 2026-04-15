# Employee Attendance Portal

Full-stack web application for employee **authentication**, **daily attendance** (check-in / check-out), **timesheet history**, and **leave requests**. The API is a Node.js + Express service backed by **PostgreSQL**; the client is a **Vite + React** SPA with session-based auth (HttpOnly cookies).

---

## Table of contents

- [Project overview](#project-overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Folder structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Run the backend](#run-the-backend)
- [Run the frontend](#run-the-frontend)
- [Database setup options](#database-setup-options)
- [Database migrations](#database-migrations)
- [Test credentials](#test-credentials)
- [API summary](#api-summary)
- [Screenshots](#screenshots)
- [Troubleshooting](#troubleshooting)

---

## Project overview

Organizations use this portal so employees can sign in securely, record attendance for the current calendar day (in a configurable **IANA timezone**), review historical attendance with filters, and submit leave requests that start in a **pending** state for downstream processing.

The backend exposes versioned REST endpoints under **`/api/v1`**, protected routes use a **session cookie** and middleware that enforces a **sliding idle timeout**. The frontend uses **Axios** with **`withCredentials`** so cookies are sent automatically; responses **`401`** redirect to **`/login`**.

---

## Features

| Area | Capabilities |
|------|----------------|
| **Authentication** | Login / logout; session stored in DB; bcrypt password verification; idle timeout (`SESSION_IDLE_MS`). |
| **Dashboard** | Today’s date, welcome message, attendance status, check-in/out actions, success and error feedback. |
| **Timesheet** | Filter by calendar month or custom date range; summary stats; sortable-style table of records. |
| **Leave** | Create leave requests (`SICK`, `CASUAL`, `PAID`, `UNPAID`); client-side validation; history (table on desktop, cards on mobile); status badges. |
| **Security & ops** | Helmet, CORS, rate limiting, structured logging (Winston); health check endpoint for monitoring. |

---

## Tech stack

| Layer | Technology |
|--------|------------|
| **Frontend** | Vite, React 18, React Router, Tailwind CSS, Axios |
| **Backend** | Node.js 18+, Express.js |
| **Database** | PostgreSQL |
| **ORM** | Sequelize + Sequelize CLI (migrations) |
| **Auth** | HttpOnly cookie + `sessions` table; bcrypt for `employees.password_hash` |
| **Config** | dotenv (`backend/.env`, optional `frontend/.env`) |

---

## Folder structure

```text
attendance_portal/
├── README.md
├── SETUP_GUIDE.md              # Extended setup narrative (optional)
├── database.sql                # Optional full schema + demo user (see Database setup options)
├── backend/
│   ├── server.js               # HTTP server entry
│   ├── app.js                  # Express app, middleware, routes
│   ├── package.json
│   ├── .env.example
│   ├── config/                 # Env + Sequelize CLI config
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/v1/              # Versioned API (auth, attendance, leaves)
│   ├── services/
│   ├── migrations/
│   ├── seeders/
│   └── utils/
└── frontend/
    ├── index.html
    ├── vite.config.js          # Dev proxy: /api → http://localhost:4000
    ├── tailwind.config.js
    ├── package.json
    ├── .env.example
    └── src/
        ├── App.jsx
        ├── pages/               # Login, Dashboard, Timesheet, Leave
        ├── components/          # layout, auth, ui
        ├── services/            # API client (axios + credentials)
        ├── context/             # AuthContext
        ├── hooks/
        └── utils/
```

---

## Prerequisites

- **Node.js** 18 or newer ([nodejs.org](https://nodejs.org))
- **PostgreSQL** — 13+ recommended (see [migrations](#database-migrations) for `gen_random_uuid()`)
- **npm** (bundled with Node)

Verify:

```bash
node -v
npm -v
```

---

## Setup

1. **Clone the repository** and open a terminal at the project root.

2. **Create a PostgreSQL database** (empty). Example with `psql`:

   ```sql
   CREATE DATABASE attendance_portal;
   CREATE USER app_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE attendance_portal TO app_user;
   ```

   On PostgreSQL 12 or older, you may need `CREATE EXTENSION IF NOT EXISTS pgcrypto;` on that database so `gen_random_uuid()` exists (see [Troubleshooting](#troubleshooting)).

3. **Backend environment**

   ```bash
   cd backend
   cp .env.example .env
   ```

   Edit **`backend/.env`** with your database URL or `DB_*` fields and **CORS** origins (see [Environment variables](#environment-variables)).

4. **Install backend dependencies**

   ```bash
   npm install
   ```

5. **Initialize the database** — pick **one** method from [Database setup options](#database-setup-options) (Sequelize migrations **or** `database.sql`).

6. **Frontend**

   ```bash
   cd ../frontend
   npm install
   cp .env.example .env   # optional; see VITE_API_URL below
   ```

7. **Start both servers** (two terminals): [backend](#run-the-backend) on port **4000**, [frontend](#run-the-frontend) on **5173**. Open **http://localhost:5173** and sign in ([test credentials](#test-credentials); the SQL import includes a [demo account](#database-setup-options)).

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` locally; `production` in production. |
| `PORT` | API port (default **4000**). |
| `DATABASE_URL` | Full PostgreSQL connection URL (recommended). If unset, use `DB_*` below. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Individual DB settings when `DATABASE_URL` is not used. |
| `DB_SSL` | `true` if the database requires SSL (common on cloud hosts). |
| `CORS_ORIGINS` | Comma-separated frontend origins, **no spaces** (e.g. `http://localhost:5173,http://127.0.0.1:5173`). |
| `COOKIE_SECRET` | Secret for signed cookies. For `NODE_ENV=production`, use **at least 32 characters**. |
| `SESSION_COOKIE_NAME` | HttpOnly session cookie name (default `session_token`). |
| `SESSION_IDLE_MS` | Idle timeout in ms (default **900000** = 15 minutes). |
| `ATTENDANCE_TIMEZONE` | IANA timezone for “today” and default timesheet month (e.g. `Asia/Kolkata`). Defaults to **UTC** if unset. |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | Global rate limit window and max requests per IP per window. |

Example:

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/attendance_portal
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Never commit real secrets; **`.env`** is gitignored.

### Frontend (`frontend/.env`, optional)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL **without** trailing slash (e.g. `http://localhost:4000`). If **omitted**, the app calls **`/api/...`** on the Vite dev origin and **`vite.config.js`** proxies **`/api`** to the backend—simplest for local development. |

---

## Run the backend

From **`backend/`**:

```bash
npm run dev      # development (file watch)
# or
npm start        # production-style (no watch)
```

- Default URL: **http://localhost:4000**
- Health: **GET** `http://localhost:4000/health`

---

## Run the frontend

From **`frontend/`**:

```bash
npm run dev
```

- Dev URL: **http://localhost:5173**
- Production build: `npm run build` → output in **`frontend/dist/`** (serve behind HTTPS in production and align API URL / proxy with your host).

Ensure **`CORS_ORIGINS`** in the backend includes the exact origin you use (scheme + host + port).

---

## Database setup options

Choose **exactly one** way to create tables on your PostgreSQL database. Do **not** run migrations and import **`database.sql`** on the same database.

### Option 1: Sequelize migrations

From **`backend/`** (after **`npm install`** and configuring **`backend/.env`**):

```bash
cd backend
npm run db:migrate
```

### Option 2: SQL file import

Create an empty database, then load the root-level **`database.sql`** (schema matches migrations and includes a demo user):

```bash
createdb attendance_portal
psql -U postgres -d attendance_portal -f database.sql
```

Adjust **`-U`**, database name, and path to **`database.sql`** as needed. The script enables **`pgcrypto`** (for **`gen_random_uuid()`**), creates enums, tables, indexes, and foreign keys, then inserts the demo employee.

### Important

Use **only one** setup method (**migrations** **or** **SQL file**), not both.

### Demo login

After **Option 2**, you can sign in with:

| Field | Value |
|--------|--------|
| **Username** | `admin` |
| **Password** | `Admin@123` |

---

## Database migrations

Use this section when you chose **Option 1** in [Database setup options](#database-setup-options).

Run from **`backend/`**:

| Command | Purpose |
|---------|---------|
| `npm run db:migrate` | Apply all pending migrations. |
| `npm run db:migrate:status` | Show which migrations have run. |
| `npm run db:migrate:undo` | Roll back the **last** migration only (destructive). |

**Tables created** (typical names):

| Table | Role |
|-------|------|
| `employees` | User accounts; `password_hash` must be bcrypt. |
| `sessions` | Session tokens (hashed), `last_activity_at`. |
| `attendances` | One row per employee per calendar day (timezone from `ATTENDANCE_TIMEZONE`). |
| `leave_requests` | Leave applications and status. |

Primary keys use **`gen_random_uuid()`**. On PostgreSQL **13+** this is built in. On **12 or older**, enable **`pgcrypto`** (`CREATE EXTENSION IF NOT EXISTS pgcrypto;`) on the database.

---

## Test credentials

- **If you used [Option 2: SQL file import](#database-setup-options)** — use the [demo login](#database-setup-options) (`admin` / `Admin@123`).

- **If you used [Option 1: Sequelize migrations](#database-migrations)** — there is no seeded user. Insert an employee with a **bcrypt** hash in **`password_hash`** (never store plain text).

  **Generate a hash** (from `backend/` after `npm install`):

  ```bash
  node -e "const bcrypt=require('bcrypt'); bcrypt.hash('YourPassword123',10).then(console.log)"
  ```

  Insert a row into **`employees`** with **`username`**, **`password_hash`**, **`full_name`**, and **`email`** (see `backend/migrations/*-create-employees.js`). Example:

  ```sql
  INSERT INTO employees (username, password_hash, full_name, email)
  VALUES (
    'demo_user',
    '$2b$10$...paste bcrypt hash here...',
    'Demo User',
    'demo@example.com'
  );
  ```

  Then log in at **`/login`** with your chosen username and password.

If login always fails, verify the stored hash is bcrypt and matches the password you type.

---

## API summary

Base path: **`/api/v1`**. Authenticated routes expect the **session cookie** from **`POST /api/v1/auth/login`** (`credentials: 'include'` in the browser).

### Health

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | No |

### Authentication (`/api/v1/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/login` | Body: `{ "username", "password" }`; sets HttpOnly session cookie. |
| POST | `/logout` | Clears session. |
| GET | `/me` | Current user if session is valid and not idle-expired. |

### Attendance (`/api/v1/attendance`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/checkin` | One check-in per employee per calendar day (`409` if duplicate). |
| POST | `/checkout` | Check-out and `total_minutes` (`409` / `400` per rules). |
| GET | `/today` | Today’s status: `NOT_CHECKED_IN`, `CHECKED_IN`, `CHECKED_OUT`. |
| GET | `/timesheet` | Query: `month=YYYY-MM` **or** `start_date` + `end_date` (`YYYY-MM-DD`); default is current month in `ATTENDANCE_TIMEZONE`. |

### Leaves (`/api/v1/leaves`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Body: `start_date`, `end_date`, `leave_type` (`SICK` \| `CASUAL` \| `PAID` \| `UNPAID`), `reason`. |
| GET | `/` | List current user’s requests; optional `?status=PENDING` (or `APPROVED`, `REJECTED`). |
| GET | `/:id` | Single request by UUID (**404** if not yours). |

**Example (curl with cookie jar after login):**

```bash
curl -c cookies.txt -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_user","password":"YourPassword123"}'

curl -b cookies.txt http://localhost:4000/api/v1/auth/me
curl -b cookies.txt http://localhost:4000/api/v1/attendance/today
```

---

## Screenshots

_Add screenshots here for submission (recommended):_

| Screen | Suggested capture |
|--------|-------------------|
| Login | Sign-in page |
| Dashboard | Today’s attendance and actions |
| Timesheet | Filters + stats + records table |
| Leave | New request form + history |

_Place image files in a folder such as `docs/screenshots/` and link them here, for example:_

```markdown
![Dashboard](docs/screenshots/dashboard.png)
```

---

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| `ECONNREFUSED` to PostgreSQL | DB running; `DATABASE_URL` / `DB_*` host and port. |
| `password authentication failed` | DB user/password in `.env`. |
| `database "..." does not exist` | Create the database before migrating. |
| `function gen_random_uuid() does not exist` | Use PostgreSQL 13+, or `CREATE EXTENSION IF NOT EXISTS pgcrypto;` on PG ≤ 12. |
| CORS error in browser | Add the exact frontend URL to `CORS_ORIGINS` (no spaces). |
| `401` on `/api/v1/auth/me` or protected routes | Log in again; session idle timeout; ensure `credentials: 'include'` on API calls. |
| Login never succeeds | `employees.password_hash` must be bcrypt; user must exist. |
| Mixed DB setup (migrations + `database.sql`) | Use [only one method](#database-setup-options); conflicts duplicate tables or `SequelizeMeta`. |
| `409` on check-in/out | Business rules—use `GET /api/v1/attendance/today` to inspect state. |
| `404` on `GET /api/v1/leaves/:id` | UUID wrong or leave belongs to another user. |
| Wrong “today” or month | Set `ATTENDANCE_TIMEZONE` to your organization’s IANA zone. |
| `Port 4000 already in use` | Change `PORT` in `.env` or stop the conflicting process. |
| Production exit on cookie/secret error | Set `COOKIE_SECRET` to 32+ random characters when `NODE_ENV=production`. |

---

## Quick reference commands

| Command | Directory | Description |
|---------|-------------|-------------|
| `npm install` | `backend/`, `frontend/` | Install dependencies. |
| `npm run dev` | `backend/` | API with watch. |
| `npm start` | `backend/` | API without watch. |
| `npm run db:migrate` | `backend/` | Apply migrations. |
| `npm run db:migrate:undo` | `backend/` | Undo last migration. |
| `npm run dev` | `frontend/` | Vite dev server (port 5173). |
| `npm run build` | `frontend/` | Production build → `dist/`. |

---

For additional step-by-step notes and curl examples, see **`SETUP_GUIDE.md`** in this repository.
