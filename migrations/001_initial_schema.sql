-- RationSaathi: Public Distribution Entitlement & Dispute Assistant
-- Migration: 001_initial_schema.sql
-- Description: Core relational schema for Households, Entitlement Rules, Evidence, and Ledger

-- Enable UUID extension if supported (PostgreSQL / Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENTITLEMENT RULES TABLE
-- Defines scheme-specific entitlement criteria. Exact decimal precision for quantities.
CREATE TABLE IF NOT EXISTS entitlement_rules (
    rule_id VARCHAR(64) PRIMARY KEY,
    scheme_name VARCHAR(120) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    qty_per_member NUMERIC(12, 4) NOT NULL CHECK (qty_per_member >= 0),
    unit VARCHAR(20) NOT NULL,
    period_days INTEGER NOT NULL CHECK (period_days > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for searching active rules by scheme and item
CREATE INDEX IF NOT EXISTS idx_entitlement_rules_scheme_item 
    ON entitlement_rules (scheme_name, item_name);

-- 2. HOUSEHOLDS TABLE
-- Registry of beneficiary households eligible for public distribution schemes.
CREATE TABLE IF NOT EXISTS households (
    household_id VARCHAR(64) PRIMARY KEY,
    head_of_family_name VARCHAR(255) NOT NULL,
    family_member_count INTEGER NOT NULL CHECK (family_member_count >= 0),
    ration_card_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for looking up households by card type
CREATE INDEX IF NOT EXISTS idx_households_card_type 
    ON households (ration_card_type);

-- 3. RECEIPT EVIDENCE TABLE
-- Audit evidence submitted for dispute resolution or receipt parsing.
CREATE TABLE IF NOT EXISTS receipt_evidence (
    evidence_id VARCHAR(64) PRIMARY KEY,
    household_id VARCHAR(64) NOT NULL REFERENCES households(household_id) ON DELETE CASCADE,
    image_url TEXT,
    pasted_text TEXT,
    raw_ocr_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast evidence lookup per household
CREATE INDEX IF NOT EXISTS idx_receipt_evidence_household_id 
    ON receipt_evidence (household_id);

-- 4. DISTRIBUTION LEDGER TABLE
-- Line-by-line distribution ledger with immutable audit trail and verification flag.
CREATE TABLE IF NOT EXISTS distribution_ledger (
    transaction_id VARCHAR(64) PRIMARY KEY,
    household_id VARCHAR(64) NOT NULL REFERENCES households(household_id) ON DELETE RESTRICT,
    evidence_id VARCHAR(64) REFERENCES receipt_evidence(evidence_id) ON DELETE SET NULL,
    item_name VARCHAR(100) NOT NULL,
    quantity_received NUMERIC(12, 4) NOT NULL CHECK (quantity_received >= 0),
    date_received DATE NOT NULL,
    user_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Composite indices for querying household disbursements across date ranges
CREATE INDEX IF NOT EXISTS idx_distribution_ledger_household_date 
    ON distribution_ledger (household_id, date_received);

CREATE INDEX IF NOT EXISTS idx_distribution_ledger_evidence_id 
    ON distribution_ledger (evidence_id);
