-- =============================================================================
-- Employee Attendance Portal — PostgreSQL schema
-- Generated to match Sequelize migrations in backend/migrations/
-- =============================================================================
-- Usage: create an empty database, then:
--   psql -U <user> -d attendance_portal -f database.sql
--
-- Rerunnable: drops and recreates tables/types (destructive). Use on empty or
-- disposable databases only. Do not combine with Sequelize migrations on the
-- same database (pick one setup method).
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Tear down (dependency order)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

DROP TYPE IF EXISTS enum_leave_requests_status CASCADE;
DROP TYPE IF EXISTS enum_leave_requests_leave_type CASCADE;
DROP TYPE IF EXISTS enum_attendances_status CASCADE;

-- ---------------------------------------------------------------------------
-- Enum types (Sequelize naming)
-- ---------------------------------------------------------------------------
CREATE TYPE enum_attendances_status AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY');

CREATE TYPE enum_leave_requests_leave_type AS ENUM (
  'SICK',
  'CASUAL',
  'PAID',
  'UNPAID'
);

CREATE TYPE enum_leave_requests_status AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

-- ---------------------------------------------------------------------------
-- employees
-- ---------------------------------------------------------------------------
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  username VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT employees_username_key UNIQUE (username)
);

CREATE INDEX employees_email_idx ON employees (email);

CREATE INDEX employees_is_active_idx ON employees (is_active);

-- ---------------------------------------------------------------------------
-- sessions
-- ---------------------------------------------------------------------------
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees (id) ON UPDATE CASCADE ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sessions_token_hash_key UNIQUE (token_hash)
);

CREATE INDEX sessions_employee_id_idx ON sessions (employee_id);

CREATE INDEX sessions_last_activity_at_idx ON sessions (last_activity_at);

-- ---------------------------------------------------------------------------
-- attendances
-- ---------------------------------------------------------------------------
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees (id) ON UPDATE CASCADE ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  total_minutes INTEGER,
  status enum_attendances_status NOT NULL DEFAULT 'PRESENT',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT attendances_employee_id_attendance_date_unique UNIQUE (employee_id, attendance_date)
);

CREATE INDEX attendances_employee_id_idx ON attendances (employee_id);

CREATE INDEX attendances_attendance_date_idx ON attendances (attendance_date);

CREATE INDEX attendances_status_idx ON attendances (status);

-- ---------------------------------------------------------------------------
-- leave_requests
-- ---------------------------------------------------------------------------
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees (id) ON UPDATE CASCADE ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type enum_leave_requests_leave_type NOT NULL,
  reason TEXT NOT NULL,
  status enum_leave_requests_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX leave_requests_employee_id_idx ON leave_requests (employee_id);

CREATE INDEX leave_requests_date_range_idx ON leave_requests (start_date, end_date);

CREATE INDEX leave_requests_status_idx ON leave_requests (status);

CREATE INDEX leave_requests_leave_type_idx ON leave_requests (leave_type);

-- ---------------------------------------------------------------------------
-- Demo user (password: Admin@123 — bcrypt, 10 rounds)
-- ---------------------------------------------------------------------------
INSERT INTO employees (id, username, password_hash, full_name, email, is_active)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  'admin',
  '$2b$10$S/O72JwmFwDyuycA4TJDhelbceVkwpCJDg2E6aC81Rnw9.4OK3rXS',
  'Demo User',
  'admin@test.com',
  TRUE
)
ON CONFLICT (username) DO UPDATE
SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

COMMIT;
