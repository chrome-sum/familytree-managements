BEGIN;

DO $$
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'Table public.users does not exist. Run base schema migration first.';
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

-- Backfill anything null/invalid to viewer.
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

