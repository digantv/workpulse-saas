# Setup Guide — Employee Attendance Portal

This guide helps you run the project on your machine from scratch. Follow the sections in order if you are new to Node.js or PostgreSQL.

**Sections:** [Latest work](#latest-completed-work) · [1 Overview](#1-project-overview) · [2 Tech stack](#2-tech-stack) · [3 Folder structure](#3-folder-structure) · [4 Backend setup](#4-backend-setup) · [5 Frontend setup](#5-frontend-setup) · [6 Install dependencies](#6-install-dependencies) · [7 PostgreSQL](#7-postgresql-setup) · [8 Configure `.env`](#8-how-to-configure-env) · [Database setup options](#database-setup-options) · [9 Migrations](#9-how-to-run-migrations) · [10 Start backend](#10-how-to-start-backend) · [11 Start frontend](#11-how-to-start-frontend) · [12 Common errors](#12-common-errors-and-fixes) · [13 Commands](#13-commands-list) · [Auth API](#authentication-api-session-cookies) · [Attendance API](#attendance-api) · [Leaves API](#leaves-api) · [Frontend app](#frontend-application-react)

---

## Latest completed work

### Backend

| # | Topic | What to do |
|---|--------|------------|
| 1 | **Dependencies** | From `backend/`, run **`npm install`**. Express, Sequelize, `pg`, **bcrypt**, security middleware, Winston, `sequelize-cli`, etc. |
| 2 | **Environment** | Copy **`backend/.env.example`** → **`backend/.env`** (see [§8](#8-how-to-configure-env)). |
| 3 | **PostgreSQL** | Create database and user (see [§7](#7-postgresql-setup)). |
| 4 | **`gen_random_uuid()`** | PG **13+** built-in, or **`pgcrypto`** on older PG ([§7.2](#72-gen_random_uuid-and-the-pgcrypto-extension)). |
| 5 | **Migrations** | **`npm run db:migrate`** ([§9](#9-how-to-run-migrations)). |
| 6 | **Tables** | **`employees`**, **`sessions`**, **`attendances`**, **`leave_requests`** ([§9.1](#91-tables-created-by-migrations)). |
| 7 | **Rollback** | **`npm run db:migrate:undo`** ([§9.2](#92-how-to-rollback-migrations)). |
| 8 | **Start API** | **`npm run dev`** or **`npm start`** ([§10](#10-how-to-start-backend)). |
| 9 | **Auth API** | Session cookie, bcrypt, idle timeout — [Authentication API](#authentication-api-session-cookies). |
| 10 | **Attendance API** | Check-in/out, today, timesheet — [Attendance API](#attendance-api). |
| 11 | **Leaves API** | CRUD-style leave routes — [Leaves API](#leaves-api). |

### Frontend (React + Vite)

| # | Topic | Notes |
|---|--------|--------|
| 1 | **Stack** | **Vite**, **React 18**, **React Router**, **Tailwind CSS**, **Axios** ([§2](#2-tech-stack), [Frontend application](#frontend-application-react)). |
| 2 | **Dependencies** | From **`frontend/`**, run **`npm install`** (see [§6](#6-install-dependencies)). |
| 3 | **Env** | Optional **`frontend/.env`**: copy **`frontend/.env.example`**; **`VITE_API_URL`** for direct API URL ([§5](#5-frontend-setup)). |
| 4 | **Session** | Axios **`withCredentials: true`**; **401** redirects to **`/login`**. |
| 5 | **Pages implemented** | **`LoginPage`** (form + validation), **`DashboardPage`** (attendance today / check-in / check-out), **`TimesheetPage`** (filters + table + stats), **`LeavePage`** (leave request form + history; **`GET`/`POST`** [`/api/v1/leaves`](#leaves-api)) — see [Frontend application](#frontend-application-react). |
| 6 | **Dev server** | **`npm run dev`** — default **http://localhost:5173**; proxies **`/api`** → backend **:4000** when **`VITE_API_URL`** is unset ([§11](#11-how-to-start-frontend)). |

---

## 1. Project overview

The **Employee Attendance Portal** is a full-stack web application:

- Employees sign in with a username and password.
- The backend provides secure REST APIs: **session auth**, **attendance** (check-in/out, today, timesheet), and **leave requests** (create, list, get by id), backed by PostgreSQL.
- Data is stored in **PostgreSQL**, accessed through **Sequelize**.

The repository includes a **`backend/`** API (Node.js + Express) and a **`frontend/`** **Vite + React** SPA under **`frontend/src/`** (session-aware login, dashboard, timesheet, and leave requests).

---

## 2. Tech stack

| Layer | Technology |
|--------|------------|
| Frontend | **Vite**, **React 18**, **React Router**, **Tailwind CSS**, **Axios** (`frontend/src/`) |
| Backend | Node.js (v18+), Express.js |
| Database | PostgreSQL |
| ORM | Sequelize + Sequelize CLI (migrations) |
| Config | dotenv (`.env` files) |
| Security / HTTP | Helmet, CORS, express-rate-limit, cookie-parser |
| Passwords | bcrypt (compare against `employees.password_hash`) |
| Sessions | DB table `sessions` + HttpOnly cookie + sliding idle timeout |
| Attendance | REST routes under `/api/v1/attendance` (`protectAuth`); data in **`attendances`**; optional **`ATTENDANCE_TIMEZONE`** for calendar day |
| Leave requests | REST routes under `/api/v1/leaves` (`protectAuth`); data in **`leave_requests`** |
| Logging | Winston |

---

## 3. Folder structure

High-level layout at the project root:

```text
attendance_portal/
├── README.md
├── SETUP_GUIDE.md          ← this file
├── database.sql            ← optional full schema + demo user (see Database setup options)
├── backend/                ← Node.js API
│   ├── server.js           ← starts HTTP server
│   ├── app.js              ← Express app (middleware, routes)
│   ├── package.json
│   ├── .env.example
│   ├── config/             ← env, database, Sequelize CLI config
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   │   └── v1/             ← versioned routes (e.g. auth, attendance, leaves)
│   ├── services/           ← e.g. auth.service.js, attendance.service.js, leave.service.js
│   ├── migrations/         ← Sequelize migrations
│   ├── seeders/
│   └── utils/
└── frontend/               ← Vite + React SPA
    ├── index.html
    ├── vite.config.js      ← dev proxy: /api → http://localhost:4000
    ├── tailwind.config.js
    ├── package.json
    ├── .env.example        ← optional VITE_API_URL
    └── src/
        ├── main.jsx
        ├── App.jsx         ← routes + protected layout
        ├── pages/          ← LoginPage, DashboardPage, TimesheetPage, LeavePage
        ├── components/     ← layout, auth, ui
        ├── services/       ← api client (axios + credentials), auth.service
        ├── context/        ← AuthContext
        ├── hooks/
        └── utils/
```

- **`backend/`** — API, DB, migrations.
- **`frontend/`** — Production UI: login, attendance dashboard, timesheet, and leave requests ([`LeavePage.jsx`](frontend/src/pages/LeavePage.jsx)).

---

## 4. Backend setup

**Before you begin:** install **Node.js 18+** ([nodejs.org](https://nodejs.org)), **PostgreSQL** ([postgresql.org/download](https://www.postgresql.org/download/)), and use a terminal (macOS Terminal, Windows PowerShell, or your editor’s terminal). Check versions with `node -v` and `npm -v`.

All backend commands assume your terminal’s **current directory** is the `backend` folder.

```bash
cd path/to/attendance_portal/backend
```

1. **Install dependencies** (see [6. Install dependencies](#6-install-dependencies)).
2. **Create a `.env` file** from the example (see [8. Configure `.env`](#8-how-to-configure-env)).
3. **Create the PostgreSQL database** (see [7. PostgreSQL setup](#7-postgresql-setup)).
4. **Run migrations** when migration files exist (see [9. How to run migrations](#9-how-to-run-migrations)).
5. **Start the server** (see [10. How to start backend](#10-how-to-start-backend)).

---

## 5. Frontend setup

The UI is a **Vite + React** app under **`frontend/`** with **`package.json`** and **`src/`** layout.

1. **Install:** from **`frontend/`**, run **`npm install`** ([§6](#6-install-dependencies)).
2. **Environment (optional):** copy **`frontend/.env.example`** to **`frontend/.env`**.
   - **`VITE_API_URL`** — If **set** (e.g. `http://localhost:4000`), Axios calls the API on that origin directly. Your backend **`CORS_ORIGINS`** must include the frontend origin (e.g. `http://localhost:5173`).
   - If **unset**, the app uses **same-origin** paths like **`/api/v1/...`**. The Vite dev server (**[`vite.config.js`](frontend/vite.config.js)**) **proxies `/api`** to **`http://localhost:4000`**, which keeps cookies simple in development.
3. **Run:** **`npm run dev`** ([§11](#11-how-to-start-frontend)).
4. **Auth:** The app uses **`credentials: 'include'`** (Axios **`withCredentials`**) for HttpOnly cookies. Unauthenticated API calls that return **401** redirect to **`/login`**.

**Implemented routes (high level):**

| Path | Page | Role |
|------|------|------|
| `/login` | Login | Username/password → session cookie |
| `/` | Dashboard | Today’s attendance, check-in / check-out |
| `/timesheet` | Timesheet | Month or date range, table + stats |
| `/leaves` | Leave | Request form (**start/end** dates, **type**, **reason**) + **history** (table on desktop, cards on mobile); uses **`GET`/`POST /api/v1/leaves`** |

Protected routes use **`AuthContext`** + **`ProtectedRoute`** (session required).

---

## 6. Install dependencies

### Backend

From the project root:

```bash
cd backend
npm install
```

This installs Express, Sequelize, PostgreSQL driver, **bcrypt**, dotenv, security packages, logger, and dev tools like `sequelize-cli`.

### Frontend

After you have a `package.json` in `frontend/`:

```bash
cd ../frontend
npm install
```

---

## 7. PostgreSQL setup

You need a **PostgreSQL server** and an **empty database** that the app will use. Tables and constraints are created by **Sequelize migrations** (not by hand).

### 7.1 Create the database

#### Option A — `psql` (command line)

1. Connect as a superuser (often `postgres`):

   ```bash
   psql -U postgres
   ```

2. Create a database and a user (adjust names/passwords):

   ```sql
   CREATE DATABASE attendance_portal;
   CREATE USER app_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE attendance_portal TO app_user;
   ```

3. Exit: `\q`

#### Option B — GUI tools

Use **pgAdmin**, **TablePlus**, or similar: create a new database named e.g. `attendance_portal`.

#### Connection string

Put host, port, database name, user, and password into **`backend/.env`** (see [§8](#8-how-to-configure-env)), either as **`DATABASE_URL`** or as separate **`DB_*`** variables.

### 7.2 gen_random_uuid() and the pgcrypto extension

Migrations default primary keys use **`gen_random_uuid()`**.

- **PostgreSQL 13 and newer:** `gen_random_uuid()` is **built into the server**. You usually **do not** need to install any extension for migrations to run.
- **PostgreSQL 12 and older:** `gen_random_uuid()` is **not** built in. Enable **`pgcrypto`** on your database (connect as a superuser or a role that can create extensions), then run:

  ```sql
  \c attendance_portal
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  ```

  That registers `gen_random_uuid()` for this database.

If a migration fails with an error like **`function gen_random_uuid() does not exist`**, either upgrade PostgreSQL to **13+** or run **`CREATE EXTENSION IF NOT EXISTS pgcrypto;`** as shown above.

**Alternative on older PostgreSQL:** you could use the **`uuid-ossp`** extension and change migrations to `uuid_generate_v4()` — but the shipped migrations expect **`gen_random_uuid()`**, so **`pgcrypto`** (or **PG 13+**) is the path that matches this repo.

---

## 8. How to configure `.env`

1. Copy the example file in the backend:

   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit **`.env`** with a text editor. Important variables:

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `development` locally; `production` on a live server. |
| `PORT` | API port (default **4000**). |
| `DATABASE_URL` | Full PostgreSQL URL (recommended). **Or** comment it out and use `DB_*` below. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Used when `DATABASE_URL` is not set. |
| `DB_SSL` | Set to `true` if your host requires SSL (many cloud providers). |
| `CORS_ORIGINS` | Comma-separated frontend URLs, **no spaces** (e.g. `http://localhost:5173,http://127.0.0.1:5173`). |
| `COOKIE_SECRET` | Secret for signed cookies. In **`NODE_ENV=production`**, must be **at least 32 characters**. |
| `SESSION_COOKIE_NAME` | Name of the HttpOnly session cookie (default **`session_token`**). |
| `SESSION_IDLE_MS` | Idle timeout in milliseconds (default **900000** = 15 minutes). Inactivity resets on each authenticated request. |
| `ATTENDANCE_TIMEZONE` | Optional **IANA** timezone for calendar “today” and default timesheet month (e.g. `Asia/Kolkata`, `America/New_York`). Defaults to **`UTC`** if unset. |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | Global API rate limit window and max requests per IP per window. |

**Example `DATABASE_URL` format:**

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/attendance_portal
```

Never commit `.env` — it is listed in `.gitignore`. Share only `.env.example` (without real secrets).

### Frontend `.env` (optional)

In **`frontend/`**, copy **`frontend/.env.example`** to **`frontend/.env`** if you need overrides:

| Variable | Purpose |
|----------|---------|
| **`VITE_API_URL`** | Full backend base URL with no trailing slash, e.g. **`http://localhost:4000`**. If **omitted**, the app calls **`/api/...`** on the same origin as the Vite dev server; **`vite.config.js`** proxies **`/api`** to the backend in development. |

---

## Database setup options

Pick **exactly one** way to initialize tables on your PostgreSQL database. **Do not** run Sequelize migrations and import **`database.sql`** on the same database.

### Option 1: Sequelize migrations

```bash
cd backend
npm run db:migrate
```

### Option 2: SQL file import

```bash
createdb attendance_portal
psql -U postgres -d attendance_portal -f database.sql
```

Adjust **`-U`**, database name, and the path to **`database.sql`** (repository root) as needed.

### Important

Use **only ONE** setup method (migrations **OR** SQL file), not both.

### Demo login

After **Option 2**, you can sign in with:

- **Username:** `admin`
- **Password:** `Admin@123`

---

## 9. How to run migrations

Use this path **only if** you chose **Option 1** in [Database setup options](#database-setup-options).

Migration files live in **`backend/migrations/`**. They create and update tables in a repeatable way.

Always run commands from the **`backend`** directory (where **`.sequelizerc`** and **`package.json`** are):

```bash
cd backend
npm run db:migrate
```

**Before the first migrate:** PostgreSQL must be running, your **`.env`** must point at the correct database, and **`gen_random_uuid()`** must be available (see [§7.2](#72-gen_random_uuid-and-the-pgcrypto-extension)).

Other useful commands:

```bash
npm run db:migrate:status   # list which migrations have run
```

### 9.1 Tables created by migrations

After **`npm run db:migrate`** completes successfully, you should see these tables (names are plural, `snake_case` columns):

| Table | Purpose |
|--------|---------|
| **`employees`** | Employee accounts: username, password hash, profile fields, active flag. |
| **`sessions`** | Login sessions: hashed session token, `last_activity_at` (sliding idle timeout), FK to `employees`. |
| **`attendances`** | Daily attendance per employee (unique per employee + calendar date), check-in/out, **`total_minutes`**, status. Used by the [Attendance API](#attendance-api). |
| **`leave_requests`** | Leave applications: date range, type, reason, status. Used by the [Leaves API](#leaves-api). |

You can confirm in **`psql`** with `\dt` or in a GUI tool.

**Note:** `employees.password_hash` must store a **bcrypt** hash (not plain text). Generate hashes in a seeder, script, or Node REPL using `bcrypt.hash('your-password', 10)` before inserting a test user.

### 9.2 How to rollback migrations

Rollback means **undoing** applied migrations, in **reverse order**, one step at a time.

**Undo the last migration only** (most common):

```bash
cd backend
npm run db:migrate:undo
```

Run it again if you need to step back through multiple migrations. **Warning:** rolling back **drops** tables and data created by that migration. Do not use undo on production unless you understand the impact and have backups.

**Check what ran:**

```bash
npm run db:migrate:status
```

There is no `undo all` script in this project by default; to roll back several steps, run **`npm run db:migrate:undo`** repeatedly until **`db:migrate:status`** shows the state you want.

---

## 10. How to start backend

From `backend/`:

**Development** (auto-restarts on file changes on supported Node versions):

```bash
npm run dev
```

**Production-style** (single process, no watch):

```bash
npm start
```

You should see a log line that the server is listening (default **port 4000**).

Quick checks:

- Health: open in a browser or use curl:  
  `http://localhost:4000/health`
- Auth endpoints (see [Authentication API](#authentication-api-session-cookies)):  
  `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- Attendance endpoints (session cookie required; see [Attendance API](#attendance-api)):  
  `POST /api/v1/attendance/checkin`, `POST /api/v1/attendance/checkout`, `GET /api/v1/attendance/today`, `GET /api/v1/attendance/timesheet`
- Leave endpoints (session cookie required; see [Leaves API](#leaves-api)):  
  `POST /api/v1/leaves`, `GET /api/v1/leaves`, `GET /api/v1/leaves/:id`
- **Web UI** (with backend + [frontend](#5-frontend-setup) running): **http://localhost:5173** — login at **`/login`**, then dashboard (**`/`**), timesheet (**`/timesheet`**), leave (**`/leaves`**).

---

## 11. How to start frontend

From **`frontend/`** (after **`npm install`**):

```bash
cd frontend
npm run dev
```

- Default dev URL: **http://localhost:5173** (Vite).
- Ensure the **backend** is running on **port 4000** (or match your proxy / `VITE_API_URL`).
- Add **`http://localhost:5173`** (and **`http://127.0.0.1:5173`** if you use it) to **`CORS_ORIGINS`** in **`backend/.env`**.
- The app uses **Axios** with **`withCredentials: true`** so **HttpOnly** session cookies work. Prefer leaving **`VITE_API_URL`** unset in dev so requests go to **`/api/...`** and the **Vite proxy** forwards them to the API.

**Production build:** `npm run build` in **`frontend/`** outputs **`frontend/dist/`**; serve those static files behind HTTPS in production and configure the API base URL / proxy as needed.

---

## 12. Common errors and fixes

| Symptom | Likely cause | What to try |
|--------|----------------|-------------|
| `ECONNREFUSED` to PostgreSQL | DB not running or wrong host/port | Start PostgreSQL; check `DB_HOST` / `DB_PORT` / `DATABASE_URL`. |
| `password authentication failed` | Wrong user/password | Fix credentials in `.env`; ensure the role owns or can access the database. |
| `database "..." does not exist` | DB not created | Create the database (see [7. PostgreSQL setup](#7-postgresql-setup)). |
| `function gen_random_uuid() does not exist` | Old PostgreSQL or missing extension | Use **PostgreSQL 13+**, or run **`CREATE EXTENSION IF NOT EXISTS pgcrypto;`** on the database ([§7.2](#72-gen_random_uuid-and-the-pgcrypto-extension)). |
| Server exits on start with cookie error | Production without strong secret | Set `COOKIE_SECRET` to **32+ random characters** when `NODE_ENV=production`. |
| `Port 4000 already in use` | Another process uses the port | Change `PORT` in `.env` or stop the other process. |
| Browser shows CORS error | Frontend origin not allowed | Add your exact dev URL to `CORS_ORIGINS` (scheme + host + port). |
| `sequelize-cli: command not found` | CLI not installed globally | Use `npm run db:migrate` from `backend/` (uses local CLI). |
| `Cannot find module ...` | Dependencies not installed | Run `npm install` in `backend/`. |
| SSL errors to cloud DB | SSL not configured | Set `DB_SSL=true` and use provider’s connection docs. |
| Login always fails / invalid password | `password_hash` not bcrypt | Store a bcrypt hash in `employees.password_hash` (see [§9.1](#91-tables-created-by-migrations)). |
| `401` on `/api/v1/auth/me` | Missing, invalid, or idle-expired session | Log in again with `POST /auth/login`; ensure **`credentials: 'include'`** from the browser. |
| `409` on check-in / check-out | Business rule (e.g. already checked in/out) | Use **`GET /api/v1/attendance/today`** to see today’s state. |
| `401` on attendance routes | Same as auth — no valid session | Log in first; use **`credentials: 'include'`** on requests. |
| `404` on `GET /api/v1/leaves/:id` | Not your leave or bad id | Lists only return your rows; check **id** and ownership. |
| Wrong “today” or month boundaries | Timezone mismatch | Set **`ATTENDANCE_TIMEZONE`** in `.env` to your org’s IANA zone (see [§8](#8-how-to-configure-env)). |

---

## Authentication API (session cookies)

These routes live under **`/api/v1/auth`** (full base URL: `http://localhost:4000/api/v1/auth` if the API runs on port 4000).

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/login` | Body: JSON `{ "username", "password" }`. On success, sets an **HttpOnly** cookie (name from `SESSION_COOKIE_NAME`) and returns the public user object. |
| `POST` | `/logout` | Clears the session cookie and removes the session row in the database (if the cookie was valid). |
| `GET` | `/me` | Returns the current user if the session cookie is valid and not past the **idle** limit. Requires a valid session. |

**Behavior (summary):**

- Passwords are verified with **bcrypt** against `employees.password_hash`.
- A random session token is issued; only a **hash** of the token is stored in **`sessions`**.
- The browser holds the raw token in an **HttpOnly** cookie (not accessible to JavaScript).
- **Idle timeout:** if no authenticated request refreshes the session for longer than **`SESSION_IDLE_MS`** (default 15 minutes), the session is invalid and returns **401**.
- Each successful authenticated request **updates** `last_activity_at` (sliding window).

**Try with curl (cookie jar):**

```bash
# Login (replace user/password; user must exist in DB with bcrypt password_hash)
curl -c cookies.txt -b cookies.txt -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"secret"}'

curl -b cookies.txt http://localhost:4000/api/v1/auth/me
```

---

## Attendance API

**What this adds (backend):**

- **Routes:** [`backend/routes/v1/attendance.routes.js`](backend/routes/v1/attendance.routes.js) — mounted at **`/api/v1/attendance`** from [`backend/routes/v1/index.js`](backend/routes/v1/index.js).
- **Controller:** [`backend/controllers/attendance.controller.js`](backend/controllers/attendance.controller.js).
- **Service:** [`backend/services/attendance.service.js`](backend/services/attendance.service.js) — business rules and queries against the **`attendances`** model.
- **Auth:** All paths use the existing **`protectAuth`** middleware (session cookie required).

**Rules implemented:**

- **One check-in per employee per calendar day** (same timezone as **`ATTENDANCE_TIMEZONE`**, default UTC); second check-in returns **409**.
- **Check-out only after check-in** for that day; **409** if already checked out, **400** if there was no check-in.
- **`total_minutes`** is computed on check-out from check-in and check-out timestamps.

All routes below require **`protectAuth`**: send the same **HttpOnly session cookie** as for auth (`credentials: 'include'` in the browser). Base path: **`/api/v1/attendance`**.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/checkin` | Creates today’s attendance row with **check-in** time. **One check-in per employee per calendar day** (timezone: **`ATTENDANCE_TIMEZONE`**, default `UTC`). |
| `POST` | `/checkout` | Sets **check-out** time and **`total_minutes`** for today. Only after check-in; fails if already checked out. |
| `GET` | `/today` | Returns today’s **`date`**, **`status`**, and optional **`attendance`** object. |
| `GET` | `/timesheet` | Lists attendance in a range; see query parameters below. |

**Today `status` values:** `NOT_CHECKED_IN`, `CHECKED_IN`, `CHECKED_OUT`.

**Timesheet query parameters:**

- **`month=YYYY-MM`** — Filter to that calendar month (e.g. `month=2025-04`).
- **`start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`** — Inclusive date range (both required if you use range).
- If you pass **neither**, the API defaults to the **current month** in **`ATTENDANCE_TIMEZONE`** (documented in [§8](#8-how-to-configure-env)).

**Example (after login with cookie jar):**

```bash
curl -b cookies.txt -X POST http://localhost:4000/api/v1/attendance/checkin
curl -b cookies.txt http://localhost:4000/api/v1/attendance/today
curl -b cookies.txt "http://localhost:4000/api/v1/attendance/timesheet?month=2025-04"
curl -b cookies.txt "http://localhost:4000/api/v1/attendance/timesheet?start_date=2025-04-01&end_date=2025-04-30"
curl -b cookies.txt -X POST http://localhost:4000/api/v1/attendance/checkout
```

---

## Leaves API

**What this adds (backend):**

- **Routes:** [`backend/routes/v1/leaves.routes.js`](backend/routes/v1/leaves.routes.js) — mounted at **`/api/v1/leaves`** from [`backend/routes/v1/index.js`](backend/routes/v1/index.js).
- **Controller:** [`backend/controllers/leave.controller.js`](backend/controllers/leave.controller.js).
- **Service:** [`backend/services/leave.service.js`](backend/services/leave.service.js) — validation and queries on **`leave_requests`** (scoped to the logged-in employee).
- **Auth:** All paths use **`protectAuth`** (session cookie required).

**Rules implemented:**

- **POST** body: **`start_date`**, **`end_date`** (`YYYY-MM-DD`), **`leave_type`** (`SICK` \| `CASUAL` \| `PAID` \| `UNPAID`), **`reason`** (required, non-empty).
- **`end_date`** cannot be before **`start_date`**.
- New rows get **`status: PENDING`** by default.
- **List** and **get by id** return **only the current employee’s** leave requests; another user’s id returns **404**.

**Endpoints** (base path **`/api/v1/leaves`**):

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/` | Create a leave request (JSON body). |
| `GET` | `/` | List **your** requests, **newest first** (`created_at` descending). Optional query: **`status=PENDING`** (or `APPROVED`, `REJECTED`). |
| `GET` | `/:id` | Get **one** request by UUID if it belongs to you. |

**Examples (after login with cookie jar):**

```bash
curl -b cookies.txt -X POST http://localhost:4000/api/v1/leaves \
  -H "Content-Type: application/json" \
  -d '{"start_date":"2025-04-10","end_date":"2025-04-12","leave_type":"CASUAL","reason":"Family event"}'

curl -b cookies.txt "http://localhost:4000/api/v1/leaves"
curl -b cookies.txt "http://localhost:4000/api/v1/leaves?status=PENDING"
curl -b cookies.txt "http://localhost:4000/api/v1/leaves/<leave-uuid>"
```

---

## Frontend application (React)

**Location:** [`frontend/`](frontend/) — Vite entry [`index.html`](frontend/index.html), source under [`frontend/src/`](frontend/src/).

**Libraries:** React 18, **react-router-dom** (protected routes + layout), **Tailwind CSS** (see [`tailwind.config.js`](frontend/tailwind.config.js)), **Axios** via [`frontend/src/services/api/client.js`](frontend/src/services/api/client.js) (`withCredentials`, **401** → `/login` except when already on login).

**Auth:** [`AuthContext`](frontend/src/context/AuthContext.jsx) exposes **`login`**, **`logout`**, **`refreshUser`** (calls **`GET /api/v1/auth/me`**). [`ProtectedRoute`](frontend/src/components/auth/ProtectedRoute.jsx) wraps authenticated pages; [`AppShell`](frontend/src/components/layout/AppShell.jsx) provides navigation.

**Pages:**

| File | Route | Behavior |
|------|--------|----------|
| [`LoginPage.jsx`](frontend/src/pages/LoginPage.jsx) | `/login` | Username/password form, validation, **`login()`** from context, redirect **`/`** on success |
| [`DashboardPage.jsx`](frontend/src/pages/DashboardPage.jsx) | `/` | **`GET /api/v1/attendance/today`**, check-in/out, status cards |
| [`TimesheetPage.jsx`](frontend/src/pages/TimesheetPage.jsx) | `/timesheet` | **`GET /api/v1/attendance/timesheet`** (month or range), stats + table |
| [`LeavePage.jsx`](frontend/src/pages/LeavePage.jsx) | `/leaves` | **`GET /api/v1/leaves`** — list **your** requests (newest first) for history. **`POST /api/v1/leaves`** — submit **`start_date`**, **`end_date`**, **`leave_type`** (`SICK` \| `CASUAL` \| `PAID` \| `UNPAID`), **`reason`**. Client validation: required fields; **end date ≥ start date**. UI: gradient hero + form card (matches Dashboard/Timesheet styling), **loading** skeleton on first load, **submitting** state, **success/error** alerts, **form reset** after successful submit, **silent refetch** of the list so history updates without flashing the skeleton. History shows **type**, **date range**, **reason**, **status** badge (PENDING / APPROVED / REJECTED), **created** timestamp; responsive **table** vs **cards**. |

---

## 13. Commands list

Run from the correct folder (`backend` or `frontend`) as noted.

| Command | Where | Description |
|---------|--------|-------------|
| `npm install` | `backend/` | Install backend dependencies. |
| `npm install` | `frontend/` | Install frontend dependencies (after `package.json` exists). |
| `npm run dev` | `backend/` | Start API in development with watch. |
| `npm start` | `backend/` | Start API in production mode. |
| `npm run db:migrate` | `backend/` | Apply Sequelize migrations. |
| `npm run db:migrate:status` | `backend/` | Show migration status. |
| `npm run db:migrate:undo` | `backend/` | Roll back the **last** migration (may drop tables/data). |
| `npm run dev` | `frontend/` | Vite dev server (default **port 5173**). |
| `npm run build` | `frontend/` | Production build → **`dist/`**. |

---

## Quick start checklist

1. Install Node.js 18+ and PostgreSQL (13+ recommended, or 12 with `pgcrypto` — see [§7.2](#72-gen_random_uuid-and-the-pgcrypto-extension)).
2. **Backend:** `cd backend && npm install` · `cp .env.example .env` · create an empty database · apply schema with **either** **`npm run db:migrate`** **or** **`psql ... -f database.sql`** ([Database setup options](#database-setup-options), not both) · `npm run dev` (API on **:4000**).
3. **Frontend:** `cd frontend && npm install` · optional `cp .env.example .env` · ensure **`CORS_ORIGINS`** includes **http://localhost:5173** in **`backend/.env`**.
4. Open **http://localhost:5173**, sign in (demo **`admin` / `Admin@123`** if you used the SQL file), then use **Dashboard**, **Timesheet**, and **Leave** ([Frontend application](#frontend-application-react)).

If something still fails, copy the **full error message** from the terminal and check which step above it matches.
