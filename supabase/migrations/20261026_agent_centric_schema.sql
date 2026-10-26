-- ==============================================================================
-- Migration: 20261026_agent_centric_schema.sql
-- Description: Agent-Centric (B2B2C) Architecture & 4-Tier RBAC Policies
-- Spec: TICKET-001 (PostgreSQL Schema Migration & 4-Tier RBAC Policies)
-- ==============================================================================

-- 1. Create 4-Tier RBAC User Role Enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_role') THEN
        CREATE TYPE agent_role AS ENUM ('OWNER', 'HEARDER', 'ADMIN', 'STUFF');
    END IF;
END $$;

-- 2. Ensure profiles table exists & alter with admin_id and role
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_user_id VARCHAR(64) UNIQUE,
    user_code VARCHAR(64) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role agent_role NOT NULL DEFAULT 'ADMIN',
    admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    telephone VARCHAR(32),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure admin_id and role exist on profiles if table pre-existed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'admin_id') THEN
        ALTER TABLE profiles ADD COLUMN admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role agent_role NOT NULL DEFAULT 'ADMIN';
    END IF;
END $$;

-- 3. Ensure tickets / n_batch table exists & alter with ticket_name, admin_id, created_by, commission_rate
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL,
    ticket_name VARCHAR(100) NOT NULL DEFAULT 'ทั่วไป',
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    commission_rate NUMERIC(5,2) DEFAULT 0.00,
    gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    win_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure ticket items / lines table exists
CREATE TABLE IF NOT EXISTS ticket_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    number_string VARCHAR(10) NOT NULL,
    bet_type VARCHAR(20) NOT NULL, -- '2top', '2down', '2tod', '3top', '3down', '3tod', 'runtop', 'rundown'
    price NUMERIC(10,2) NOT NULL,
    reward_rate NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    is_won BOOLEAN DEFAULT FALSE,
    win_amount NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check and alter columns if table pre-existed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'ticket_name') THEN
        ALTER TABLE tickets ADD COLUMN ticket_name VARCHAR(100) NOT NULL DEFAULT 'ทั่วไป';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'admin_id') THEN
        ALTER TABLE tickets ADD COLUMN admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'created_by') THEN
        ALTER TABLE tickets ADD COLUMN created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'commission_rate') THEN
        ALTER TABLE tickets ADD COLUMN commission_rate NUMERIC(5,2) DEFAULT 0.00;
    END IF;
END $$;

-- 4. Create admin_round_balances table for Rolling Credit Settlement
CREATE TABLE IF NOT EXISTS admin_round_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL,
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    previous_balance NUMERIC(12,2) DEFAULT 0.00,
    current_gross_bet NUMERIC(12,2) DEFAULT 0.00,
    current_commission NUMERIC(12,2) DEFAULT 0.00,
    current_net_bet NUMERIC(12,2) DEFAULT 0.00,
    current_win_reward NUMERIC(12,2) DEFAULT 0.00,
    settlement_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'BALANCED', 'ROLLED_OVER'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_admin_period UNIQUE (admin_id, period_id)
);

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_round_balances ENABLE ROW LEVEL SECURITY;

-- Helper function to check role of authenticated user
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS agent_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view profile" ON profiles;
CREATE POLICY "Users can view profile" ON profiles
    FOR SELECT USING (
        id = auth.uid() OR
        auth.get_user_role() IN ('OWNER', 'HEARDER') OR
        (auth.get_user_role() = 'ADMIN' AND admin_id = auth.uid())
    );

-- Tickets Policies
-- Stuff can insert batches tagged with their Admin's admin_id
-- Admin can view/insert their tickets
-- Hearder has full SELECT access across all admins
DROP POLICY IF EXISTS "Ticket Insert Policy" ON tickets;
CREATE POLICY "Ticket Insert Policy" ON tickets
    FOR INSERT WITH CHECK (
        (auth.get_user_role() = 'ADMIN' AND admin_id = auth.uid() AND created_by = auth.uid()) OR
        (auth.get_user_role() = 'STUFF' AND admin_id = (SELECT p.admin_id FROM profiles p WHERE p.id = auth.uid()) AND created_by = auth.uid()) OR
        auth.get_user_role() IN ('OWNER', 'HEARDER')
    );

DROP POLICY IF EXISTS "Ticket Select Policy" ON tickets;
CREATE POLICY "Ticket Select Policy" ON tickets
    FOR SELECT USING (
        auth.get_user_role() IN ('OWNER', 'HEARDER') OR
        (auth.get_user_role() = 'ADMIN' AND admin_id = auth.uid()) OR
        (auth.get_user_role() = 'STUFF' AND created_by = auth.uid())
    );

-- Ticket Items Policies
DROP POLICY IF EXISTS "Ticket Items Access" ON ticket_items;
CREATE POLICY "Ticket Items Access" ON ticket_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_items.ticket_id AND (
                auth.get_user_role() IN ('OWNER', 'HEARDER') OR
                (auth.get_user_role() = 'ADMIN' AND t.admin_id = auth.uid()) OR
                (auth.get_user_role() = 'STUFF' AND t.created_by = auth.uid())
            )
        )
    );

-- Admin Round Balances Policies
-- CRITICAL RULE: Stuff CANNOT select admin_round_balances
-- Admin can only access their own balance
-- Hearder has full SELECT access
DROP POLICY IF EXISTS "Admin Round Balances Select" ON admin_round_balances;
CREATE POLICY "Admin Round Balances Select" ON admin_round_balances
    FOR SELECT USING (
        auth.get_user_role() IN ('OWNER', 'HEARDER') OR
        (auth.get_user_role() = 'ADMIN' AND admin_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admin Round Balances Mutate" ON admin_round_balances;
CREATE POLICY "Admin Round Balances Mutate" ON admin_round_balances
    FOR ALL USING (
        auth.get_user_role() IN ('OWNER', 'HEARDER')
    );

-- Composite indexes for high throughput query performance
CREATE INDEX IF NOT EXISTS idx_tickets_admin_period ON tickets(admin_id, period_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_name ON tickets(ticket_name);
CREATE INDEX IF NOT EXISTS idx_ticket_items_number_bet_type ON ticket_items(number_string, bet_type);
CREATE INDEX IF NOT EXISTS idx_admin_balances_admin_period ON admin_round_balances(admin_id, period_id);
