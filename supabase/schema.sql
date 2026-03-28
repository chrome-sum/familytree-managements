-- Create people table
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    birth_date DATE,
    status TEXT DEFAULT 'alive' CHECK (status IN ('alive', 'deceased')),
    photo_url TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Separate table for unions (partnerships)
-- This allows a person to have multiple partners (polygamy/polyandry)
CREATE TABLE IF NOT EXISTS unions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner1_id UUID REFERENCES people(id) ON DELETE CASCADE,
    partner2_id UUID REFERENCES people(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'marriage',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure no duplicate unions
    UNIQUE(partner1_id, partner2_id)
);

-- Table for parents and children
-- A child is associated with a UNION of two parents.
-- This ensures a child always has two specific parents for each relationship.
CREATE TABLE IF NOT EXISTS parent_child (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    union_id UUID REFERENCES unions(id) ON DELETE CASCADE,
    child_id UUID REFERENCES people(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure no duplicate parent-child entries
    UNIQUE(union_id, child_id)
);

-- Add users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit trail for admin/editor actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    actor_email TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
