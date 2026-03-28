-- Production-safe RBAC migration for users.role
-- Safe to run multiple times.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'Table public.users does not exist. Run base schema first.';
  END IF;
END $$;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role TEXT;

-- Normalize legacy role values.
UPDATE public.users
SET role = CASE
  WHEN role IS NULL THEN NULL
  WHEN lower(trim(role)) IN ('admin', 'editor', 'viewer') THEN lower(trim(role))
  WHEN lower(trim(role)) IN ('contributor', 'kontributor') THEN 'editor'
  ELSE NULL
END;

-- Backfill null/invalid values.
UPDATE public.users
SET role = 'viewer'
WHERE role IS NULL;

ALTER TABLE public.users
ALTER COLUMN role SET DEFAULT 'viewer';

ALTER TABLE public.users
ALTER COLUMN role SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_role_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'editor', 'viewer'));
  END IF;
END $$;

COMMIT;

-- Verification queries (optional, safe to keep in SQL Editor run)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'role';

SELECT role, COUNT(*) AS total
FROM public.users
GROUP BY role
ORDER BY role;

