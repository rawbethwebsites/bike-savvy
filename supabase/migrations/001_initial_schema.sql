-- Bike Savvy Database Schema
-- PostgreSQL schema for booking management, customers, instructors, resources, and audit logging

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Booking status
CREATE TYPE booking_status AS ENUM (
  'draft',
  'held',
  'pending_payment',
  'confirmed',
  'checked_in',
  'completed',
  'cancelled',
  'no_show',
  'reschedule_required'
);

-- User role
CREATE TYPE user_role AS ENUM (
  'owner',
  'operations_staff',
  'instructor',
  'demo_viewer'
);

-- Licence journey stage
CREATE TYPE licence_stage AS ENUM (
  'assessment',
  'learner_preparation',
  'learner_test',
  'practical_training',
  'licence_preparation',
  'test_scheduled',
  'completed'
);

-- Payment status
CREATE TYPE payment_status AS ENUM (
  'unpaid',
  'deposit_paid',
  'paid',
  'refunded',
  'partially_refunded'
);

-- ============================================================================
-- USERS & AUTH
-- ============================================================================

-- Dashboard users table (extends Supabase auth.users)
CREATE TABLE dashboard_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'operations_staff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Telegram account linking
CREATE TABLE telegram_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dashboard_user_id UUID NOT NULL REFERENCES dashboard_users(id) ON DELETE CASCADE,
  telegram_user_id BIGINT NOT NULL UNIQUE,
  chat_id BIGINT NOT NULL,
  is_linked BOOLEAN NOT NULL DEFAULT false,
  linked_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_telegram UNIQUE (dashboard_user_id, telegram_user_id)
);

-- ============================================================================
-- CORE BUSINESS ENTITIES
-- ============================================================================

-- Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  setup_buffer_minutes INTEGER NOT NULL DEFAULT 15,
  travel_buffer_minutes INTEGER NOT NULL DEFAULT 0,
  price_cents INTEGER NOT NULL,
  deposit_cents INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 1,
  prerequisites TEXT[],
  required_resources TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Instructors
CREATE TABLE instructors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES dashboard_users(id),
  qualifications TEXT[],
  certified_courses UUID[],  -- Array of course IDs (no FK constraint on arrays)
  working_hours_start TIME NOT NULL DEFAULT '08:00',
  working_hours_end TIME NOT NULL DEFAULT '17:00',
  working_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}', -- 1=Mon, 7=Sun
  hourly_rate_cents INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Motorcycles & Resources
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'motorcycle', 'training_area', 'classroom', etc.
  model TEXT,
  license_plate TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  permitted_courses UUID[] REFERENCES courses(id),
  maintenance_schedule JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  riding_level TEXT, -- 'beginner', 'intermediate', 'advanced'
  riding_experience TEXT,
  has_own_motorcycle BOOLEAN NOT NULL DEFAULT false,
  own_motorcycle_details TEXT,
  learner_license_number TEXT,
  learner_license_expiry DATE,
  licence_stage licence_stage NOT NULL DEFAULT 'assessment',
  communication_consent BOOLEAN NOT NULL DEFAULT true,
  communication_preference TEXT DEFAULT 'whatsapp', -- 'whatsapp', 'sms', 'email'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- BOOKINGS
-- ============================================================================

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  instructor_id UUID REFERENCES instructors(id),
  status booking_status NOT NULL DEFAULT 'draft',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  price_cents INTEGER NOT NULL,
  deposit_paid_cents INTEGER NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  refund_status TEXT,
  source TEXT NOT NULL DEFAULT 'dashboard', -- 'dashboard', 'telegram', 'phone', 'walk_in'
  created_by UUID NOT NULL REFERENCES dashboard_users(id),
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES dashboard_users(id),
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES dashboard_users(id),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES dashboard_users(id),
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Ensure end_time is after start_time
  CONSTRAINT valid_booking_times CHECK (end_time > start_time)
);

-- Booking resources (many-to-many for motorcycles/resources needed)
CREATE TABLE booking_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_booking_resource UNIQUE (booking_id, resource_id)
);

-- ============================================================================
-- AVAILABILITY BLOCKS
-- ============================================================================

-- Time blocks for leave, maintenance, etc.
CREATE TABLE availability_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID REFERENCES instructors(id),
  resource_id UUID REFERENCES resources(id),
  block_type TEXT NOT NULL, -- 'leave', 'break', 'maintenance', 'closure', 'manual_hold'
  reason TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_pattern JSONB, -- e.g., {"type": "weekly", "days": [1,3,5]}
  created_by UUID NOT NULL REFERENCES dashboard_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_block_times CHECK (end_time > start_time)
);

-- ============================================================================
-- PAYMENTS
-- ============================================================================

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  amount_cents INTEGER NOT NULL,
  payment_method TEXT NOT NULL, -- 'cash', 'card', 'eft', 'snapscan', 'zapper'
  payment_type TEXT NOT NULL, -- 'deposit', 'balance', 'full', 'refund'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  transaction_reference TEXT,
  paid_at TIMESTAMPTZ,
  processed_by UUID REFERENCES dashboard_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- LICENCE TRACKER
-- ============================================================================

-- Licence milestones
CREATE TABLE licence_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stage licence_stage NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  scheduled_date DATE,
  completed_date DATE,
  instructor_notes TEXT,
  outcome TEXT,
  next_recommended_action TEXT,
  created_by UUID NOT NULL REFERENCES dashboard_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- MESSAGES & TEMPLATES
-- ============================================================================

-- Message templates
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'confirmation', 'reminder', 'cancellation', 'payment'
  subject TEXT,
  body_template TEXT NOT NULL,
  variables TEXT[], -- e.g., ['customer_name', 'booking_date', 'instructor_name']
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sent messages log
CREATE TABLE sent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  booking_id UUID REFERENCES bookings(id),
  template_id UUID REFERENCES message_templates(id),
  channel TEXT NOT NULL, -- 'whatsapp', 'sms', 'email', 'telegram'
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  delivered_at TIMESTAMPTZ,
  failed_reason TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

-- Audit events - append-only log of all changes
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'status_change'
  entity_type TEXT NOT NULL, -- 'booking', 'customer', 'instructor', etc.
  entity_id UUID NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES dashboard_users(id),
  actor_channel TEXT NOT NULL DEFAULT 'dashboard', -- 'dashboard', 'telegram', 'api'
  before_values JSONB,
  after_values JSONB,
  request_context JSONB, -- IP, user agent, Telegram message ID, etc.
  correlation_id TEXT, -- For tracking related events
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_actor ON audit_events(actor_user_id);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at);

-- ============================================================================
-- TELEGRAM CONVERSATIONS
-- ============================================================================

-- Telegram conversation log
CREATE TABLE telegram_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_user_id BIGINT NOT NULL,
  chat_id BIGINT NOT NULL,
  message_id INTEGER NOT NULL,
  update_id INTEGER NOT NULL,
  intent TEXT,
  command TEXT,
  message_text TEXT,
  response_text TEXT,
  status TEXT NOT NULL DEFAULT 'processed', -- 'processed', 'failed', 'ignored'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Telegram action proposals (for preview/confirmation flow)
CREATE TABLE telegram_action_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_user_id BIGINT NOT NULL,
  chat_id BIGINT NOT NULL,
  action_type TEXT NOT NULL, -- 'create_booking', 'reschedule', 'cancel', 'block_time'
  action_data JSONB NOT NULL,
  before_values JSONB,
  after_values JSONB,
  validation_result JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  confirmation_token TEXT NOT NULL UNIQUE,
  is_confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  is_rejected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- CONSTRAINTS & INDEXES
-- ============================================================================

-- Prevent overlapping bookings for instructor
CREATE OR REPLACE FUNCTION check_instructor_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE instructor_id = NEW.instructor_id
    AND id != NEW.id
    AND status IN ('confirmed', 'checked_in', 'held', 'pending_payment')
    AND (
      (NEW.start_time >= start_time AND NEW.start_time < end_time)
      OR (NEW.end_time > start_time AND NEW.end_time <= end_time)
      OR (NEW.start_time <= start_time AND NEW.end_time >= end_time)
    )
  ) THEN
    RAISE EXCEPTION 'Instructor is not available during this time slot';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_instructor_availability
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_instructor_availability();

-- Prevent overlapping bookings for customer
CREATE OR REPLACE FUNCTION check_customer_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE customer_id = NEW.customer_id
    AND id != NEW.id
    AND status IN ('confirmed', 'checked_in', 'held', 'pending_payment')
    AND (
      (NEW.start_time >= start_time AND NEW.start_time < end_time)
      OR (NEW.end_time > start_time AND NEW.end_time <= end_time)
      OR (NEW.start_time <= start_time AND NEW.end_time >= end_time)
    )
  ) THEN
    RAISE EXCEPTION 'Customer already has a booking during this time slot';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_customer_availability
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_customer_availability();

-- Prevent overlapping resource allocation
CREATE OR REPLACE FUNCTION check_resource_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM booking_resources br
    JOIN bookings b ON br.booking_id = b.id
    WHERE br.resource_id IN (SELECT resource_id FROM booking_resources WHERE booking_id = NEW.id)
    AND b.id != NEW.id
    AND b.status IN ('confirmed', 'checked_in', 'held', 'pending_payment')
    AND (
      (NEW.start_time >= b.start_time AND NEW.start_time < b.end_time)
      OR (NEW.end_time > b.start_time AND NEW.end_time <= b.end_time)
      OR (NEW.start_time <= b.start_time AND NEW.end_time >= b.end_time)
    )
  ) THEN
    RAISE EXCEPTION 'Resource is not available during this time slot';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_resource_availability
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_resource_availability();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_dashboard_users_updated_at BEFORE UPDATE ON dashboard_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_instructors_updated_at BEFORE UPDATE ON instructors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_resources_updated_at BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (for demo)
-- ============================================================================

-- Insert demo instructor users
-- Note: In production, these would be created via Supabase Auth signup

-- Demo courses
INSERT INTO courses (name, description, duration_minutes, setup_buffer_minutes, price_cents, deposit_cents, prerequisites) VALUES
('Beginner Rider Introduction', 'Basic motorcycle handling and safety', 120, 15, 85000, 25000, ARRAY[]::TEXT[]),
('Learner License Preparation', 'Prepare for learner license test', 180, 15, 120000, 50000, ARRAY['Beginner Rider Introduction']),
('Practical Riding Skills', 'Intermediate riding techniques', 240, 30, 180000, 50000, ARRAY['Learner License Preparation']),
('Licence Test Preparation', 'Final preparation for practical licence test', 180, 15, 150000, 50000, ARRAY['Practical Riding Skills']);

-- Commented seed data for instructors and resources
-- These would be populated via the dashboard or migration scripts
