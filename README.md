# RationSaathi — Public Distribution Entitlement & Dispute Assistant

RationSaathi is a civic technology application engineered to empower Public Distribution System (PDS) beneficiaries. Public distribution programs allocate subsidized food grains and essential commodities to households according to statutory rules (e.g., 5.00 kg wheat, 3.00 kg rice per family member monthly).

Arithmetic in this engine is **100% deterministic, exact, and line-by-line auditable**, powered by `Decimal.js` (28-digit precision, half-up rounding) to eliminate IEEE 754 binary floating-point drift and AI hallucination risk in math calculations.

---

## Key Features & Capabilities

1. **Air-Gap Manual Verification Gate**:
   - AI OCR parses receipt images and text into draft candidate suggestions with confidence scores.
   - Database writes are strictly prohibited until the beneficiary explicitly reviews and confirms the data (`user_verified = true`).

2. **Multi-Scheme Database Engine**:
   - Live scheme rules stored in Supabase PostgreSQL (`entitlement_rules`) with dynamic multi-commodity calculations:
     - **NFSA (Priority Household)**: 5.00 kg Wheat, 3.00 kg Rice, 1.00 kg Sugar / member
     - **PMGKAY (Free Grain)**: 7.00 kg Wheat, 5.00 kg Rice / member
     - **Antyodaya Anna Yojana (AAY)**: 8.75 kg Wheat, 6.25 kg Rice, 1.00 kg Sugar / member
     - **State Annapurna Scheme**: 6.00 kg Wheat, 2.00 kg Dal / member
   - Dynamic baseline recalculation: changing schemes or family size automatically computes exact entitlements across all commodities.

3. **Flexible Evidence Workflows**:
   - **📷 Add Receipt Evidence**: Upload or camera-capture physical receipts for AI OCR parsing.
   - **⚡ Continue Without Receipt**: Directly record and verify received deliveries without requiring physical paper receipts.
   - **Scheme Commodity Selector**: Step 3 provides a dynamic commodity selector tailored to the active scheme.

4. **Sticky Floating Navigation Stepper**:
   - Stepper (`Setup` → `Add Evidence` → `Review & Save`) remains pinned to the top of the viewport with backdrop blur, eliminating excessive scrolling.

5. **Neutral, Policy-Compliant Reconciliation Reporting**:
   - Generates non-accusatory dispute summaries using standard administrative terminology (*Allocated Entitlement*, *Documented Goods Received*, *Recorded Difference*, *Evidence Reference*).
   - Enforces an automated banned-word guard prohibiting accusatory terms (`fraud`, `theft`, `stolen`, `corrupt`, etc.).
   - Includes 1-click client-side PDF generation and browser print layout.

6. **Offline Sync & Multi-User Support**:
   - Client-side IndexedDB caching records receipts offline and synchronizes automatically upon network reconnection.
   - User isolation powered by Supabase Auth and Row Level Security (RLS).
   - Multilingual localization support in English, Hindi (हिंदी), and Marathi (मराठी).

---

## Architecture & Core Modules

- **Database Schemas & Policies**:
  - [`migrations/001_initial_schema.sql`](file:///Users/sohamsantoshshinde/Documents/Hackthon/migrations/001_initial_schema.sql) — Core relational DDL (`entitlement_rules`, `households`, `receipt_evidence`, `distribution_ledger`).
  - [`migrations/rls_policies.sql`](file:///Users/sohamsantoshshinde/Documents/Hackthon/migrations/rls_policies.sql) — Row Level Security policies.
- **Deterministic Arithmetic**:
  - [`src/ruleEngine.ts`](file:///Users/sohamsantoshshinde/Documents/Hackthon/src/ruleEngine.ts) — Formula calculations using `Decimal.js`.
  - [`src/discrepancyEngine.ts`](file:///Users/sohamsantoshshinde/Documents/Hackthon/src/discrepancyEngine.ts) — Multi-visit partial delivery aggregation and shortfall classification.
- **OCR Air-Gap Pipeline**:
  - [`src/receiptParserService.ts`](file:///Users/sohamsantoshshinde/Documents/Hackthon/src/receiptParserService.ts) — Unconfirmed candidate extraction.
- **Offline Sync**:
  - [`src/offlineSyncManager.ts`](file:///Users/sohamsantoshshinde/Documents/Hackthon/src/offlineSyncManager.ts) — IndexedDB queue and browser reconnection listeners.
- **Reporting Engine**:
  - [`src/reportTemplate.ts`](file:///Users/sohamsantoshshinde/Documents/Hackthon/src/reportTemplate.ts) & [`src/pdfReportGenerator.ts`](file:///Users/sohamsantoshshinde/Documents/Hackthon/src/pdfReportGenerator.ts) — Neutral language validation and PDFKit generator.
- **Web App & UI Portal**:
  - [`public/index.html`](file:///Users/sohamsantoshshinde/Documents/Hackthon/public/index.html) — Mobile-first interactive portal.
  - [`src/server.ts`](file:///Users/sohamsantoshshinde/Documents/Hackthon/src/server.ts) & [`src/api.ts`](file:///Users/sohamsantoshshinde/Documents/Hackthon/src/api.ts) — Express backend gateway.

---

## Getting Started

### 1. Installation

```bash
git clone <repo-url>
cd RationSaathi
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
PORT=3000
```

### 3. Development Server

```bash
npm run dev
# Server accessible at http://localhost:3000
```

### 4. Production Build

```bash
npm run build
npm start
```

---

## Test Suites

```bash
# 1. Run unit, math precision, and air-gap security test suites (32 tests across 7 suites)
npm test

# 2. Run Playwright Chromium End-to-End validation (28 tests across Desktop Chrome + Mobile Viewport)
npm run test:e2e
```
