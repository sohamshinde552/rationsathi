# RationSaathi — Technical Architecture & Documentation

> **RationSaathi** is a Public Distribution System (PDS) entitlement & dispute assistant that helps Indian citizens verify their ration entitlements, log distribution receipts, and detect shortfalls with evidence.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Frontend](#3-frontend)
4. [Backend](#4-backend)
5. [Database — Supabase PostgreSQL](#5-database--supabase-postgresql)
6. [Core Processing Engines](#6-core-processing-engines)
7. [The Air-Gap Principle](#7-the-air-gap-principle)
8. [Scheme Data](#8-scheme-data)
9. [API Reference](#9-api-reference)
10. [Testing](#10-testing)
11. [Deployment](#11-deployment)
12. [Environment Variables](#12-environment-variables)
13. [Project File Structure](#13-project-file-structure)

---

## 1. Project Overview

| Field         | Detail                                                         |
|---------------|----------------------------------------------------------------|
| **Project**   | RationSaathi                                                   |
| **Domain**    | Public Distribution System (PDS) — Government Food Welfare    |
| **Purpose**   | Help citizens track ration entitlements, log receipts, detect shortfalls |
| **Type**      | Hackathon Project                                              |
| **Repo**      | https://github.com/sohamshinde552/rationsathi                 |
| **Live URL**  | Deployed on Vercel (linked to GitHub main branch)             |

### Problem Statement
Millions of PDS beneficiaries in India do not know exactly how much food grain they are entitled to each month under schemes like NFSA, PMGKAY, and AAY. When short-delivered or given wrong quantities, they have no structured way to document and dispute it.

### Solution
RationSaathi provides:
- **Entitlement Calculator** — exact per-household baseline using scheme rules from a live database
- **Receipt Evidence Capture** — upload or paste receipt text; OCR extracts commodity quantities
- **Verified Ledger** — only user-confirmed entries enter the distribution record (air-gap enforced)
- **Discrepancy Audit Report** — per-commodity shortfall/late-delivery analysis with PDF export

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                         │
│                                                             │
│   public/index.html  ─  Vanilla JS SPA                     │
│   ┌──────────┐  ┌───────────┐  ┌──────────────────────┐   │
│   │ Step 1   │  │  Step 2   │  │      Step 3          │   │
│   │ Setup    │→ │ Evidence  │→ │  Verify & Save       │   │
│   │ Scheme   │  │ OCR Parse │  │  Commodity Dropdown  │   │
│   └──────────┘  └───────────┘  └──────────────────────┘   │
│                                                             │
│   Offline Sync Manager  ←→  localStorage queue             │
└──────────────────────────┬──────────────────────────────────┘
                           │  HTTP fetch /api/*
┌──────────────────────────▼──────────────────────────────────┐
│                  BACKEND (Node.js Server)                   │
│                                                             │
│   Express 5 + TypeScript  →  compiled dist/server.js       │
│                                                             │
│   ┌──────────────┐  ┌────────────────┐  ┌───────────────┐ │
│   │  Rule Engine │  │ Discrepancy    │  │ Receipt       │ │
│   │  decimal.js  │  │ Engine         │  │ Parser (OCR)  │ │
│   │  28-digit    │  │ SHORTFALL /    │  │ Regex-based   │ │
│   │  precision   │  │ LATE_DELIVERY  │  │ PDS keywords  │ │
│   └──────────────┘  └────────────────┘  └───────────────┘ │
│                                                             │
│   ┌──────────────┐  ┌────────────────┐                     │
│   │ Ledger       │  │ PDF Report     │                     │
│   │ Service      │  │ Generator      │                     │
│   │ (Supabase)   │  │ (PDFKit)       │                     │
│   └──────────────┘  └────────────────┘                     │
└──────────────────────────┬──────────────────────────────────┘
                           │  @supabase/supabase-js
┌──────────────────────────▼──────────────────────────────────┐
│                  DATABASE (Supabase PostgreSQL)              │
│                                                             │
│   households  │  distribution_ledger  │  entitlement_rules  │
│                                                             │
│   Row Level Security: auth.uid() = user_id                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend

### Technology
- **Language:** Vanilla JavaScript (ES2022)
- **No framework** — no React, no Vue, no Angular
- **No frontend build step** — single HTML file served as a static asset
- **File:** `public/index.html` (~1300+ lines with inline `<style>` and `<script>`)

### 3-Step Workflow

#### Step 1 — Setup
- User enters household ID and family member count
- Selects a PDS scheme from a **database-driven dropdown**
- On page load, `fetchDatabaseSchemes()` calls `GET /api/schemes` to populate options from Supabase
- Quota display updates dynamically when scheme changes

#### Step 2 — Evidence
Two workflow paths:
- **"Add Receipt Evidence"** — shows file upload/paste area; OCR parses the receipt via `POST /api/receipts/parse`
- **"Continue Without Receipt"** — skips evidence, goes directly to Step 3

#### Step 3 — Verify & Save
- A scheme-driven commodity **dropdown** lists items from the active scheme's entitlement rules
- User confirms the item name, quantity received, and date
- On submit: `POST /api/receipts/verify` (enforces air-gap check)
- Ledger table re-renders with updated entries and discrepancy status

### Sticky Stepper Navigation
```css
.stepper {
  position: sticky;
  top: 10px;
  z-index: 100;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.95);
}
```
Users can switch steps without scrolling back to the top.

### Key Frontend Functions

| Function | Purpose |
|---|---|
| `fetchDatabaseSchemes()` | Loads all schemes from `/api/schemes` on bootstrap |
| `populateSchemeDropdown()` | Fills the `<select>` with DB scheme names |
| `updateSchemeQuotaDisplay()` | Shows per-member entitlement for the selected scheme |
| `populateCommodityDropdownForActiveScheme()` | Fills Step 3 dropdown with scheme's commodities |
| `toggleEvidenceMode(true/false)` | Switches between evidence-upload and skip-evidence flow |
| `renderLedgerTable()` | Draws the distribution ledger table with per-commodity discrepancy |
| `handleCommoditySelectChange()` | Syncs dropdown → text input (bidirectional) |
| `syncCommoditySelectWithCustomInput()` | Syncs text input → dropdown (bidirectional) |
| `fetchHouseholdLedger()` | Calls `GET /api/ledger` and refreshes the ledger display |

### Offline Sync Manager (`src/offlineSyncManager.ts`)
- Queues ledger write operations in `localStorage` when the device is offline
- Monitors `window.addEventListener('online', ...)` 
- Replays the queue via `POST /api/receipts/verify` when connectivity is restored
- Prevents data loss for users in low-connectivity rural areas

---

## 4. Backend

### Technology Stack

| Package | Version | Role |
|---|---|---|
| `express` | ^5.3.0 | HTTP server & routing |
| `typescript` | ^5.7.3 | Type safety & compilation |
| `@supabase/supabase-js` | ^2.117.3 | Database client |
| `decimal.js` | ^10.4.3 | Exact fixed-point arithmetic |
| `pdfkit` | ^0.20.2 | PDF report generation |
| `cors` | ^2.8.6 | Cross-origin headers |
| `dotenv` | ^18.0.7 | Environment variable loading |

### Entry Point — `src/server.ts`
```typescript
import { app } from './api';

// Serve static frontend
app.use(express.static(path.join(__dirname, '../public')));

// Export app for Vercel @vercel/node serverless
// Only call app.listen() in local/dev (not on Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

export default app;
```

### Build & Run

```bash
npm run build    # tsc — compiles src/ → dist/
npm run dev      # ts-node src/server.ts (development, hot type-checking)
npm start        # node dist/server.js (production)
```

---

## 5. Database — Supabase PostgreSQL

### Connection Clients
Two Supabase clients are initialized in `src/lib/supabaseClient.ts`:

| Client | Key Used | RLS | Used For |
|---|---|---|---|
| `supabase` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Enforced | User-scoped reads/writes |
| `supabaseAdmin` | `SUPABASE_SERVICE_ROLE_KEY` | **Bypassed** | Admin ops, seeding, test resets |

### Table: `households`

| Column | Type | Notes |
|---|---|---|
| `household_id` | `text PRIMARY KEY` | Ration card number |
| `head_of_family_name` | `text` | Head of household |
| `family_member_count` | `integer` | Used in baseline calculation |
| `ration_card_type` | `text` | PHH, AAY, BPL, etc. |
| `user_id` | `uuid FK` | Links to Supabase Auth `auth.users` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### Table: `distribution_ledger`

| Column | Type | Notes |
|---|---|---|
| `transaction_id` | `uuid PRIMARY KEY` | Auto-generated |
| `household_id` | `text FK` | References `households` |
| `item_name` | `text` | Wheat, Rice, Sugar, Dal, etc. |
| `quantity_received` | `numeric` | Stored as exact decimal |
| `date_received` | `date` | ISO date of distribution |
| `user_verified` | `boolean` | **Must be `true`** — air-gap enforced |
| `evidence_id` | `text` | Optional receipt reference |
| `user_id` | `uuid FK` | For RLS enforcement |
| `created_at` | `timestamptz` | |

### Table: `entitlement_rules`

| Column | Type | Notes |
|---|---|---|
| `rule_id` | `text PRIMARY KEY` | e.g. `NFSA-WHEAT-PHH` |
| `scheme_name` | `text` | NFSA, PMGKAY, AAY, State Annapurna |
| `item_name` | `text` | Commodity name |
| `qty_per_member` | `numeric` | Monthly entitlement per member |
| `unit` | `text` | kg, liter |
| `period_days` | `integer` | Default: 30 |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### Row Level Security (RLS)

All tables have RLS enabled. Critical policy on `distribution_ledger`:

```sql
-- SELECT policy
CREATE POLICY "Users can view their own ledger"
ON distribution_ledger FOR SELECT
USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users can insert their own records"
ON distribution_ledger FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 6. Core Processing Engines

### 6.1 Rule Engine — `src/ruleEngine.ts`

Calculates the **exact baseline entitlement** for a household under a given scheme rule.

**Formula:**
```
Total Baseline = family_member_count × qty_per_member
```

**Why `decimal.js` instead of plain JavaScript math?**

JavaScript uses IEEE 754 binary floating point. This causes representation drift:
```javascript
// Plain JS — WRONG for public entitlements
4 * 8.75 = 35.000000000000004  ❌

// decimal.js — CORRECT
new Decimal(4).mul(8.75) = 35.00  ✅
```

The engine is configured with `precision: 28` and `ROUND_HALF_UP` rounding.

**Validation guards:**
- Rejects negative family member counts
- Rejects non-integer member counts
- Rejects NaN or Infinity rule quantities

---

### 6.2 Discrepancy Engine — `src/discrepancyEngine.ts`

The core audit brain. Produces a `DiscrepancyAuditReport` for a household over a date range.

**Processing pipeline:**

```
Step 1 — Filter: Keep only entries where user_verified = true
         AND date_received within [start_date, end_date]
         AND household_id matches

Step 2 — Aggregate: Sum quantities per commodity using Decimal.js

Step 3 — Compute shortfall:
         Shortfall = max(Baseline − Received, 0)

Step 4 — Classify each commodity line:
         ├── LATE_DELIVERY   → any transaction after deadline_date
         ├── UNCLEAR_RECORD  → entry exists but evidence_id is null
         ├── SHORTFALL       → received < baseline
         └── FULL_DELIVERY   → received ≥ baseline
```

**Status Matrix:**

| Status | Meaning |
|---|---|
| `FULL_DELIVERY` | Received quantity meets or exceeds the entitlement |
| `SHORTFALL` | Received quantity is less than entitlement |
| `LATE_DELIVERY` | Distribution happened after the scheme's deadline |
| `UNCLEAR_RECORD` | Entry exists but no receipt evidence was linked |

---

### 6.3 Receipt Parser Service — `src/receiptParserService.ts`

Regex-based OCR extractor for Indian PDS ration receipts.

**Inputs accepted:**
- `raw_text` — pasted receipt text
- `image_url` — URL to a receipt image (hooks to Cloud Vision / Gemini in production)
- `image_base64` — base64-encoded receipt image

**Date extraction patterns:**
```
ISO format:   2024-05-12
DMY format:   12/05/2024  or  12-05-2024
Short year:   12/5/24  →  normalized to 2024-05-12
```

**Commodity keyword dictionary:**
```
wheat, atta, gehu, rice, chawal, sugar, cheeni,
dal, pulses, oil, kerosene, gram, salt, ragi, jowar, bajra
```

**Quantity unit patterns:**
```
5.5 kg  |  10kg  |  2 LTR  |  15 g  |  2 liter  |  3 packet
```

**Confidence scoring:**

| Scenario | Confidence |
|---|---|
| Item + quantity + unit all found | `0.88` |
| Item found but quantity unclear | `0.35` |
| Nothing recognizable | `0.10` |

> **Production note:** In a production deployment, `image_url` / `image_base64` payloads would be routed to **Google Cloud Vision API** or **Gemini Vision** for real OCR. The regex extractor serves as the current implementation and fallback.

---

### 6.4 PDF Report Generator — `src/pdfReportGenerator.ts`

Uses **PDFKit** to generate downloadable discrepancy audit reports.

**Report contents:**
- Household ID, head of family name, member count
- Scheme name and audit period
- Per-commodity table: Baseline | Received | Shortfall | Status
- Summary totals
- Generation timestamp

---

## 7. The Air-Gap Principle

This is the most critical design decision in the system. **No unverified or system-generated data is ever written to the distribution ledger.**

```
User submits receipt (image or text)
         │
         ▼
POST /api/receipts/parse
         │
         ▼  Returns CANDIDATES only (flagged as unconfirmed)
         │  → candidate_items: [{ item_name, extracted_qty, confidence }]
         │
User reviews the parsed suggestions in the UI
User manually confirms or corrects values
         │
         ▼
POST /api/receipts/verify
         │
         ├── user_verified !== true  →  400 "Air-gap violation" ❌
         ├── household_id missing    →  400 Validation error ❌
         ├── items array empty       →  400 Validation error ❌
         │
         ▼  All checks pass
Decimal.js quantity validation
         │
         ▼
Write to distribution_ledger (Supabase + in-memory cache)
         │
         ▼  ✅ Entry committed
```

The backend enforces this in `src/api.ts`:
```typescript
if (!payload || payload.user_verified !== true) {
  res.status(400).json({
    success: false,
    error: 'Air-gap violation: user_verified must be explicitly set to TRUE to commit to the distribution ledger.',
  });
  return;
}
```

---

## 8. Scheme Data

Four schemes are seeded into the `entitlement_rules` Supabase table:

| Rule ID | Scheme | Item | Qty/Member | Unit |
|---|---|---|---|---|
| `NFSA-WHEAT-PHH` | NFSA | Wheat | 5 | kg |
| `NFSA-RICE-PHH` | NFSA | Rice | 3 | kg |
| `NFSA-SUGAR-PHH` | NFSA | Sugar | 1 | kg |
| `PMGKAY-WHEAT-AAY` | PMGKAY (Free Grain) | Wheat | 7 | kg |
| `PMGKAY-RICE-AAY` | PMGKAY (Free Grain) | Rice | 5 | kg |
| `AAY-WHEAT-SPECIAL` | Antyodaya Anna Yojana (AAY) | Wheat | 8.75 | kg |
| `AAY-RICE-SPECIAL` | Antyodaya Anna Yojana (AAY) | Rice | 6.25 | kg |
| `AAY-SUGAR-SPECIAL` | Antyodaya Anna Yojana (AAY) | Sugar | 1 | kg |
| `ANNAPURNA-WHEAT` | State Annapurna Scheme | Wheat | 6 | kg |
| `ANNAPURNA-PULSES` | State Annapurna Scheme | Dal/Pulses | 2 | kg |

> Adding a new row to `entitlement_rules` in Supabase automatically makes it appear in the app's scheme dropdown on next page load — no code changes required.

---

## 9. API Reference

Base URL (local): `http://localhost:3000`

### `POST /api/receipts/parse`
Submit receipt evidence for OCR extraction. Returns **unconfirmed candidates only**.

**Request body:**
```json
{
  "raw_text": "Fair Price Shop\nDate: 12/10/2024\nWheat: 15 kg\nRice: 10 kg",
  "image_url": "https://...",     // optional
  "image_base64": "data:image/..." // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "candidate_items": [
      { "item_name": "Wheat", "extracted_qty": 15, "extracted_unit": "kg", "confidence": 0.88 },
      { "item_name": "Rice",  "extracted_qty": 10, "extracted_unit": "kg", "confidence": 0.88 }
    ],
    "extracted_date": "2024-10-12",
    "raw_text": "...",
    "parsing_notes": []
  }
}
```

---

### `POST /api/receipts/verify`
Air-gap gateway. Commits a verified entry to the distribution ledger.

**Request body:**
```json
{
  "household_id": "RATION-001",
  "evidence_id": "EVD-abc123",
  "date_received": "2024-10-12",
  "user_verified": true,
  "items": [
    { "item_name": "Wheat", "quantity_received": 15, "unit": "kg" }
  ]
}
```

**Response (success):**
```json
{
  "success": true,
  "data": { "saved_entries": [...] }
}
```

**Response (air-gap violation):**
```json
{
  "success": false,
  "error": "Air-gap violation: user_verified must be explicitly set to TRUE..."
}
```

---

### `GET /api/ledger?household_id=RATION-001`
Fetch all ledger entries for a household.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "transaction_id": "uuid",
      "household_id": "RATION-001",
      "item_name": "Wheat",
      "quantity_received": "15.00",
      "date_received": "2024-10-12",
      "user_verified": true,
      "evidence_id": "EVD-abc123"
    }
  ]
}
```

---

### `GET /api/schemes`
Returns all entitlement rules from the database. Falls back to 4 hardcoded defaults if DB is unavailable.

**Response:**
```json
{
  "success": true,
  "data": [
    { "rule_id": "NFSA-WHEAT-PHH", "scheme_name": "NFSA", "item_name": "Wheat", "qty_per_member": 5, "unit": "kg", "period_days": 30 },
    ...
  ]
}
```

---

### `POST /api/auth/login`
Create or authenticate a user via Supabase Auth.

**Request body:**
```json
{
  "household_id": "RATION-001",
  "head_of_family_name": "Ravi Kumar",
  "family_member_count": 4,
  "ration_card_type": "PHH"
}
```

---

### `POST /api/ledger/clear`
Reset the ledger (in-memory + Supabase). **Used only in test environments.**

---

## 10. Testing

### Unit Tests — Jest

**Framework:** Jest + ts-jest  
**Config:** `jest.config.js`  
**Run:** `npm test`  
**Count:** 32 tests across 7 suites

Modules tested:
- `ruleEngine.ts` — baseline calculation edge cases (zero members, large families, decimal qty)
- `discrepancyEngine.ts` — all 4 classification statuses, date window filtering, Decimal summation
- `receiptParserService.ts` — date extraction, keyword matching, confidence scoring
- `api.ts` (via `supertest`) — air-gap enforcement, route validation

### End-to-End Tests — Playwright

**Framework:** `@playwright/test`  
**Config:** `playwright.config.ts`  
**Run:** `npm run test:e2e`  
**Count:** 28 tests across 4 spec files

Key test specs:
- `chromeValidation.spec.ts` — Air-gap, Multi-visit math, Neutral language, Offline sync, Mobile console cleanliness
- `frontendRescue.spec.ts` — UI element visibility, user profile badge
- `accessibility.spec.ts` — Touch targets ≥44px, keyboard nav
- `ledgerFlow.spec.ts` — Full 3-step ledger entry flow

**Critical configs:**
```typescript
// playwright.config.ts
workers: 1  // Prevents parallel ledger state collisions
webServer: {
  command: 'npx ts-node src/server.ts',
  port: 3000,
  reuseExistingServer: !process.env.CI
}
```

---

## 11. Deployment

### Vercel (Production)

**Platform:** Vercel (GitHub integration — auto-deploys on `git push main`)

**`vercel.json` routing:**
```json
{
  "version": 2,
  "builds": [
    { "src": "dist/server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/dist/server.js" },
    { "src": "/(.*\\.(css|js|png|jpg|svg|ico|woff2?|ttf|eot))", "dest": "/public/$1" },
    { "src": "/(.*)", "dest": "/dist/server.js" }
  ]
}
```

- All `/api/*` routes → Express server (serverless function)
- Static assets → `public/` directory
- Everything else → Express server (which serves `index.html`)

**Why `dist/` is committed to git:**  
Vercel needs the compiled `dist/server.js` to deploy. The build output is included in the repo so Vercel's `@vercel/node` adapter can directly reference it without running `tsc` during deployment.

### Local Development

```bash
git clone https://github.com/sohamshinde552/rationsathi.git
cd rationsathi
npm install
cp .env.local.example .env.local  # Fill in Supabase keys
npm run dev                         # Starts at http://localhost:3000
```

---

## 12. Environment Variables

These must be set in `.env.local` (local) and in Vercel Dashboard → Settings → Environment Variables (production):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key — safe to expose, RLS enforced |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** service role key — bypasses RLS, server-only |

> ⚠️ **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or commit it to git.**

---

## 13. Project File Structure

```
rationsathi/
│
├── public/
│   ├── index.html          ← Entire frontend SPA (HTML + CSS + JS)
│   └── locales/            ← i18n translation files
│
├── src/
│   ├── server.ts           ← Express entry point (exports app for Vercel)
│   ├── api.ts              ← All REST routes + in-memory ledger cache
│   ├── types.ts            ← TypeScript interfaces for all entities
│   ├── ruleEngine.ts       ← Baseline entitlement calculator (Decimal.js)
│   ├── discrepancyEngine.ts← Shortfall audit engine
│   ├── receiptParserService.ts ← OCR receipt text parser
│   ├── pdfReportGenerator.ts   ← PDFKit report builder
│   ├── offlineSyncManager.ts   ← localStorage queue + replay
│   ├── reportTemplate.ts   ← Report HTML/text templates
│   ├── index.ts            ← Module barrel exports
│   │
│   ├── lib/
│   │   └── supabaseClient.ts   ← Supabase client initialization (anon + admin)
│   │
│   ├── services/
│   │   └── ledgerService.ts    ← DB operations: insert, fetch, upsert
│   │
│   ├── components/         ← TypeScript component definitions
│   └── context/            ← Auth context (Supabase + Mock)
│
├── dist/                   ← Compiled JS output (committed for Vercel)
│
├── tests/                  ← Jest unit tests (7 suites, 32 tests)
├── e2e/                    ← Playwright E2E tests (4 specs, 28 tests)
├── migrations/             ← SQL migration files for Supabase
│
├── vercel.json             ← Vercel deployment config
├── tsconfig.json           ← TypeScript compiler config
├── jest.config.js          ← Jest test config
├── playwright.config.ts    ← Playwright E2E config
├── package.json            ← Dependencies and scripts
├── .gitignore              ← Excludes node_modules, .env*, etc.
└── README.md               ← Project setup & usage guide
```

---

*Document generated: October 2026 | RationSaathi Hackathon Project*
