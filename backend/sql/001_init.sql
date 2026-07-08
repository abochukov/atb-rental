-- PostgreSQL schema for car rental backend (MVP)
-- Run with: psql -U postgres -d car_rental -f sql/001_init.sql

CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE SCHEMA IF NOT EXISTS fleet;
SET search_path TO fleet, public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status') THEN
    CREATE TYPE vehicle_status AS ENUM ('active', 'maintenance', 'inactive');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM (
      'draft',
      'pending',
      'confirmed',
      'active',
      'completed',
      'cancelled'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type') THEN
    CREATE TYPE discount_type AS ENUM ('percent', 'fixed');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS users (
  id               BIGSERIAL PRIMARY KEY,
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  email            CITEXT UNIQUE,
  phone            TEXT,
  driver_license_no TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
  id               BIGSERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  address_line     TEXT,
  city             TEXT NOT NULL,
  country          TEXT NOT NULL DEFAULT 'BG',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id               BIGSERIAL PRIMARY KEY,
  plate_number     TEXT NOT NULL UNIQUE,
  vin              TEXT UNIQUE,
  brand            TEXT NOT NULL,
  model            TEXT NOT NULL,
  year             INT,
  category         TEXT,
  transmission     TEXT,
  fuel_type        TEXT,
  seats            INT,
  odometer_km      INT,
  status           vehicle_status NOT NULL DEFAULT 'active',
  default_pickup_location_id BIGINT REFERENCES locations(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicle_rates (
  id               BIGSERIAL PRIMARY KEY,
  vehicle_id       BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  currency         CHAR(3) NOT NULL DEFAULT 'EUR',
  price_day        NUMERIC(10,2) NOT NULL CHECK (price_day >= 0),
  price_week       NUMERIC(10,2) NOT NULL CHECK (price_week >= 0),
  price_month      NUMERIC(10,2) NOT NULL CHECK (price_month >= 0),
  valid_from       TIMESTAMPTZ NOT NULL,
  valid_to         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_to IS NULL OR valid_to > valid_from)
);

CREATE TABLE IF NOT EXISTS discounts (
  id               BIGSERIAL PRIMARY KEY,
  code             TEXT NOT NULL UNIQUE,
  type             discount_type NOT NULL,
  value            NUMERIC(10,2) NOT NULL CHECK (value >= 0),
  valid_from       TIMESTAMPTZ NOT NULL,
  valid_to         TIMESTAMPTZ,
  max_uses         INT,
  per_user_limit   INT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_to IS NULL OR valid_to > valid_from)
);

CREATE TABLE IF NOT EXISTS bookings (
  id               BIGSERIAL PRIMARY KEY,
  vehicle_id       BIGINT NOT NULL REFERENCES vehicles(id),
  user_id          BIGINT REFERENCES users(id),
  discount_id      BIGINT REFERENCES discounts(id),
  pickup_location_id BIGINT NOT NULL REFERENCES locations(id),
  return_location_id BIGINT NOT NULL REFERENCES locations(id),
  pickup_at        TIMESTAMPTZ NOT NULL,
  return_at        TIMESTAMPTZ NOT NULL,
  rental_period    TSTZRANGE GENERATED ALWAYS AS (tstzrange(pickup_at, return_at, '[)')) STORED,
  status           booking_status NOT NULL DEFAULT 'draft',

  guest_first_name TEXT,
  guest_last_name  TEXT,
  guest_email      CITEXT,
  guest_phone      TEXT,
  guest_driver_license_no TEXT,

  base_price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency         CHAR(3) NOT NULL DEFAULT 'EUR',

  notes            TEXT,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (return_at > pickup_at),
  CHECK (final_price >= 0),
  CHECK (
    user_id IS NOT NULL
    OR (guest_first_name IS NOT NULL AND guest_last_name IS NOT NULL AND guest_email IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS booking_status_history (
  id               BIGSERIAL PRIMARY KEY,
  booking_id       BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  old_status       booking_status,
  new_status       booking_status NOT NULL,
  changed_by       BIGINT REFERENCES users(id),
  reason           TEXT,
  changed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicle_block_periods (
  id               BIGSERIAL PRIMARY KEY,
  vehicle_id       BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  blocked_from     TIMESTAMPTZ NOT NULL,
  blocked_to       TIMESTAMPTZ NOT NULL,
  blocked_period   TSTZRANGE GENERATED ALWAYS AS (tstzrange(blocked_from, blocked_to, '[)')) STORED,
  reason           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (blocked_to > blocked_from)
);

-- Prevent overlapping bookings for the same vehicle when booking blocks inventory.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_no_overlap_active_states'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_no_overlap_active_states
      EXCLUDE USING gist (
        vehicle_id WITH =,
        rental_period WITH &&
      )
      WHERE (status IN ('pending', 'confirmed', 'active'));
  END IF;
END$$;

-- Prevent overlapping maintenance/manual blocks for the same vehicle.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vehicle_blocks_no_overlap'
  ) THEN
    ALTER TABLE vehicle_block_periods
      ADD CONSTRAINT vehicle_blocks_no_overlap
      EXCLUDE USING gist (
        vehicle_id WITH =,
        blocked_period WITH &&
      );
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_pickup_return
  ON bookings (vehicle_id, pickup_at, return_at);

CREATE INDEX IF NOT EXISTS idx_bookings_status
  ON bookings (status);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id
  ON bookings (user_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_rates_vehicle_id
  ON vehicle_rates (vehicle_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_rates_validity
  ON vehicle_rates (valid_from, valid_to);

CREATE INDEX IF NOT EXISTS idx_vehicle_blocks_vehicle_id
  ON vehicle_block_periods (vehicle_id);
