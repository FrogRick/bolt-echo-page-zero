-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscription_tiers table
CREATE TABLE subscription_tiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly NUMERIC NOT NULL,
    max_buildings INTEGER NOT NULL,
    max_new_buildings_per_month INTEGER NOT NULL
);

-- Create organizations table
CREATE TABLE organizations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subscription_tier TEXT NOT NULL,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE profiles (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    subscription_tier TEXT NOT NULL,
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create buildings table
CREATE TABLE buildings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    description TEXT,
    organization_id TEXT REFERENCES organizations(id),
    user_id TEXT REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create floor_plans table
CREATE TABLE floor_plans (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id TEXT NOT NULL REFERENCES buildings(id),
    name TEXT NOT NULL,
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create elements table
CREATE TABLE elements (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    floor_plan_id TEXT NOT NULL REFERENCES floor_plans(id),
    type TEXT NOT NULL,
    x NUMERIC NOT NULL,
    y NUMERIC NOT NULL,
    width NUMERIC,
    height NUMERIC,
    rotation NUMERIC,
    size NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create building_notes table
CREATE TABLE building_notes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id TEXT NOT NULL REFERENCES buildings(id),
    user_id TEXT NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization_members table
CREATE TABLE organization_members (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    user_id TEXT REFERENCES profiles(id),
    invited_email TEXT,
    invitation_token TEXT,
    role TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization_buildings table
CREATE TABLE organization_buildings (
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    building_id TEXT NOT NULL REFERENCES buildings(id),
    PRIMARY KEY (organization_id, building_id)
);

-- Create user_building_counts table
CREATE TABLE user_building_counts (
    user_id TEXT PRIMARY KEY REFERENCES profiles(id),
    current_month TEXT NOT NULL,
    buildings_created_this_month INTEGER DEFAULT 0
);

-- Create functions
CREATE OR REPLACE FUNCTION accept_org_invitation(token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE organization_members
    SET status = 'active',
        invitation_token = NULL
    WHERE invitation_token = token;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION invite_org_member(org_id TEXT, email TEXT, invite_role TEXT DEFAULT 'member')
RETURNS TEXT AS $$
DECLARE
    token TEXT;
BEGIN
    token := encode(gen_random_bytes(32), 'hex');
    INSERT INTO organization_members (organization_id, invited_email, invitation_token, role, status)
    VALUES (org_id, email, token, invite_role, 'pending');
    RETURN token;
END;
$$ LANGUAGE plpgsql; 