-- Core HR employee data model

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- Lookup / Reference Tables
-- ─────────────────────────────────────────

CREATE TABLE locations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city          TEXT,
  state         TEXT,
  zip           TEXT,
  country       TEXT NOT NULL DEFAULT 'US',
  is_remote     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE departments (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT NOT NULL,
  description          TEXT,
  cost_center          TEXT,
  parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE job_titles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  pay_grade   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Enum Types
-- ─────────────────────────────────────────

CREATE TYPE employment_status AS ENUM (
  'active', 'on_leave', 'terminated', 'inactive'
);

CREATE TYPE employment_type AS ENUM (
  'full_time', 'part_time', 'contractor', 'intern', 'seasonal'
);

CREATE TYPE pay_type AS ENUM ('salary', 'hourly');

CREATE TYPE address_type AS ENUM ('home', 'mailing');

CREATE TYPE history_event_type AS ENUM (
  'hire', 'rehire', 'promotion', 'demotion', 'transfer',
  'title_change', 'department_change', 'termination',
  'leave_start', 'leave_end', 'status_change', 'compensation_change'
);

-- ─────────────────────────────────────────
-- Employees (core record)
-- ─────────────────────────────────────────

CREATE SEQUENCE employee_number_seq START 1000;

CREATE TABLE employees (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_number    TEXT UNIQUE NOT NULL DEFAULT '',
  first_name         TEXT NOT NULL,
  last_name          TEXT NOT NULL,
  preferred_name     TEXT,
  date_of_birth      DATE,
  personal_email     TEXT,
  work_email         TEXT,
  personal_phone     TEXT,
  work_phone         TEXT,
  profile_photo_url  TEXT,
  status             employment_status NOT NULL DEFAULT 'active',
  employment_type    employment_type   NOT NULL DEFAULT 'full_time',
  hire_date          DATE NOT NULL,
  termination_date   DATE,
  termination_reason TEXT,
  department_id      UUID REFERENCES departments(id) ON DELETE SET NULL,
  job_title_id       UUID REFERENCES job_titles(id)  ON DELETE SET NULL,
  location_id        UUID REFERENCES locations(id)   ON DELETE SET NULL,
  manager_id         UUID REFERENCES employees(id)   ON DELETE SET NULL,
  pay_type           pay_type NOT NULL DEFAULT 'salary',
  salary             NUMERIC(12, 2),
  hourly_rate        NUMERIC(8, 2),
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-generate employee numbers (EMP-1000, EMP-1001, ...)
CREATE OR REPLACE FUNCTION set_employee_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employee_number = '' THEN
    NEW.employee_number := 'EMP-' || LPAD(nextval('employee_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_employee_number
  BEFORE INSERT ON employees
  FOR EACH ROW EXECUTE FUNCTION set_employee_number();

-- ─────────────────────────────────────────
-- Employee Sub-tables
-- ─────────────────────────────────────────

CREATE TABLE employee_addresses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  address_type  address_type NOT NULL DEFAULT 'home',
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  zip           TEXT NOT NULL,
  country       TEXT NOT NULL DEFAULT 'US',
  is_primary    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE emergency_contacts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone        TEXT NOT NULL,
  email        TEXT,
  is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE salary_history (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id    UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  pay_type       pay_type NOT NULL,
  salary         NUMERIC(12, 2),
  hourly_rate    NUMERIC(8, 2),
  change_reason  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE employment_history (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id    UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  event_type     history_event_type NOT NULL,
  event_date     DATE NOT NULL,
  previous_value JSONB,
  new_value      JSONB,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────

CREATE INDEX idx_employees_department_id   ON employees(department_id);
CREATE INDEX idx_employees_manager_id      ON employees(manager_id);
CREATE INDEX idx_employees_status          ON employees(status);
CREATE INDEX idx_employees_last_name       ON employees(last_name);
CREATE INDEX idx_employees_hire_date       ON employees(hire_date);
CREATE INDEX idx_emp_addresses_emp_id      ON employee_addresses(employee_id);
CREATE INDEX idx_emergency_contacts_emp_id ON emergency_contacts(employee_id);
CREATE INDEX idx_salary_history_emp_id     ON salary_history(employee_id);
CREATE INDEX idx_employment_history_emp_id ON employment_history(employee_id);

-- ─────────────────────────────────────────
-- updated_at triggers
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_job_titles_updated_at
  BEFORE UPDATE ON job_titles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_employee_addresses_updated_at
  BEFORE UPDATE ON employee_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
