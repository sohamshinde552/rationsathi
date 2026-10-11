-- RationSaathi: Multi-User Auth & Row Level Security (RLS) Migration
-- File: migrations/rls_policies.sql
-- Description: Enables RLS and configures auth.uid() tenant isolation across all tables.

-- 1. Ensure user_id column exists on tenant tables
ALTER TABLE households 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE receipt_evidence 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE distribution_ledger 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE entitlement_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_ledger ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES FOR entitlement_rules (Public read-only policy for PDS schemes)
DROP POLICY IF EXISTS "Public read access for entitlement rules" ON entitlement_rules;
CREATE POLICY "Public read access for entitlement rules"
    ON entitlement_rules
    FOR SELECT
    TO authenticated, anon
    USING (true);

-- 4. POLICIES FOR households (Strict user isolation: auth.uid() = user_id)
DROP POLICY IF EXISTS "Users can only view their own household" ON households;
CREATE POLICY "Users can only view their own household"
    ON households
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own household" ON households;
CREATE POLICY "Users can insert their own household"
    ON households
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own household" ON households;
CREATE POLICY "Users can update their own household"
    ON households
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own household" ON households;
CREATE POLICY "Users can delete their own household"
    ON households
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5. POLICIES FOR receipt_evidence (Strict user isolation: auth.uid() = user_id)
DROP POLICY IF EXISTS "Users can only view their own receipts" ON receipt_evidence;
CREATE POLICY "Users can only view their own receipts"
    ON receipt_evidence
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own receipts" ON receipt_evidence;
CREATE POLICY "Users can insert their own receipts"
    ON receipt_evidence
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own receipts" ON receipt_evidence;
CREATE POLICY "Users can delete their own receipts"
    ON receipt_evidence
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 6. POLICIES FOR distribution_ledger (Strict user isolation: auth.uid() = user_id)
DROP POLICY IF EXISTS "Users can only view their own ledger entries" ON distribution_ledger;
CREATE POLICY "Users can only view their own ledger entries"
    ON distribution_ledger
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert verified entries to ledger" ON distribution_ledger;
CREATE POLICY "Users can insert verified entries to ledger"
    ON distribution_ledger
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        AND user_verified = true
    );

-- Fast lookup indexes for isolated queries
CREATE INDEX IF NOT EXISTS idx_households_user_id ON households(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_evidence_user_id ON receipt_evidence(user_id);
CREATE INDEX IF NOT EXISTS idx_distribution_ledger_user_id ON distribution_ledger(user_id);
