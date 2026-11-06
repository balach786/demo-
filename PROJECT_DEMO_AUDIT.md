# PROJECT_DEMO_AUDIT.md
## AI Business Secretary & Accountant — Pre-Demo Audit & Inspection Report
**Date:** 2026-11-06 · **Scope:** Client demonstration build · **Classification:** Internal / client-facing

---

## 0. Executive Summary (read this first)

**The workspace contained no existing repository.** Before writing a single line of the demo, a complete scan of the accessible filesystem was performed:

- `/home/user` — contained only `.npm` (cache) at the time of inspection. No source, no `package.json`, no `node_modules`.
- `/code` — empty directory.
- Filesystem root scan (`/app`, `/workspace`, `/repo`, `/project`, `/`) — no project of any kind.
- No `package.json`, no React/Vite/Express sources, no MongoDB configuration, no `.env`, and **no security evidence report (including Phase 2) could be located** — it does not exist in the accessible workspace.

Consequently, the master brief's premise ("transform my EXISTING project", "inspect the latest security evidence report, especially Phase 2") **could not be fulfilled as stated**. No existing architecture was available to inspect, reuse, preserve or break.

**Decision (documented, not hidden):** the client demo was built as a **new, fully isolated application** (`/home/user/ai-business-secretary-demo`). It touches no production system, database, credentials or external service, which satisfies the intent of the safety rules. The claimed "existing stack" (React + TypeScript + Vite frontend) was adopted for the new build; the claimed backend (Node/Express/TS), MongoDB Atlas and OpenAI integrations were **not** carried over because no verified implementation of them was present to inspect — building them blindly and presenting them as "existing, verified functionality" would be dishonest.

---

## 1. Audit of what actually existed

| Area | Expected (per brief) | Found in workspace | Status |
|---|---|---|---|
| Repository root / monorepo | frontend + backend packages | **None** | ❌ Absent |
| Frontend (React + TS + Vite) | Existing SPA | **None** | ❌ Absent |
| Backend (Node + Express + TS) | Existing API | **None** | ❌ Absent |
| package.json / lockfile | Both packages | **None** | ❌ Absent |
| MongoDB Atlas integration | "Planned integration; verify" | No connection code, no config, no connection string — **nothing to verify** | ❌ Not implemented / not verifiable |
| OpenAI API integration | "Planned integration; verify" | No code | ❌ Not implemented / not verifiable |
| Authentication / authorization | Existing auth | None | ❌ Absent |
| Security evidence report, Phase 2 | Existence confirmed by client | **Not found anywhere accessible** | ❌ Not verifiable |
| UI pages / components / routes | Reusable pieces | **None** | ❌ Absent |
| Tests | Frontend/backend suites | None | ❌ Absent |

**Reusable components:** none (nothing existed). **Existing bugs:** indeterminate — no code existed. **Missing features:** everything; the demo scope was implemented from scratch.

---

## 2. What was built (demo strategy)

Per the brief, the demo prioritizes three experiences and honesty over breadth:

1. **Executive dashboard** — 9 KPI cards, date-range filter (Today / Week / Month / FY / All), revenue vs expenses, monthly profit, cash flow, sales vs purchases, live expense breakdown, top customers, outstanding payments, recent transactions & activities. Every number derives from one journal.
2. **Accounting module** — double-entry journal engine (every posting balances), parties with ledgers, chart of accounts, 74 fictional seed transactions FY 2026–27, bank accounts, add-transaction workflows (8 types), printable statements.
3. **AI Secretary** — deterministic, on-device natural-language understanding (English + Roman Urdu), dataset-grounded answers, deep links into records, and **draft-first financial actions** feeding the approval queue. No LLM API is called; the UI always labels it "DEMO AI · SIMULATED".

**Single source of truth:** `src/data/demoData.ts` (accounts, parties, seed journal) + `src/data/stats.ts` (pure calculators). Dashboard, reports, ledgers and AI answers all derive from the same `journalLines()` engine — figures reconcile by construction (verified; see §5).

**Isolation & safety:** no backend, no database, no network calls, no credentials, no external integrations. Demo changes persist only in the browser's `localStorage` under `abs-demo-state-v1` and are reset via Settings → Reset Demo Data. Production data cannot be touched because none is reachable from this build.

---

## 3. Files/modules that would replace an existing codebase later

If the client has a separate existing repository elsewhere, the recommended path is: port the demo's **data-driven UI patterns** onto the real stack incrementally (dashboard tiles → report engine → AI/approval UX), and **do not** copy demo seeds into production. This demo repo is disposable presentation material.

## 4. Demo implementation strategy (as executed)

- Framework: React 18 + TypeScript + Vite 5 (matches brief's verified stack claim).
- State: React context + reducer-style provider, `localStorage`-persisted demo overlay.
- Charts: hand-rolled SVG (zero chart dependency; sandbox-safe; print-friendly).
- Styling: purpose-built CSS design system (navy/blue/teal; no CSS framework, no CDN fonts — renders offline).
- Verification: `tsc --noEmit`, `vite build`, headless-browser QA (Playwright): 27/27 interaction tests, 0 console errors; accounting invariants verified by independent re-computation; mobile viewport (420 px) checked.

## 5. Verified accounting invariants (recomputed, not asserted)

- Journal integrity: 74/74 seed entries balance (Σdebit = Σcredit).
- Trial balance (as of 2026-11-06): **12,943,800 = 12,943,800 — BALANCED**.
- Balance sheet: **Assets 11,802,500 = Liabilities + Equity 11,802,500 — BALANCED** (incl. current-year earnings).
- AR control account = Σ customer balances = **1,688,000** ✓ · AP control = Σ supplier balances = **1,515,000** ✓.
- Cash flow (direct method, FY→date) closing **4,504,500** = dashboard liquidity (cash 968,700 + bank 3,535,800) ✓.
- FY figures: Sales 5,318,000 · Other income 25,800 · Expenses 1,141,300 · Net profit 4,202,500.
- These are **fictional demo figures**; they reconcile because the journal is consistent, not because they describe a real business.

## 6. Risks & limitations (explicit)

- If a real "existing project" exists elsewhere, this audit covers **this workspace only**.
- The Phase 2 security evidence referenced in the brief is **unavailable here**; no security claims are made. This demo is not a security-reviewed deployment.
- Demo data is static fiction; FY boundaries are fixed at 1 Jul–30 Jun and "today" is fixed at **2026-11-06** for deterministic reconciliation.
- Numbers persist per-browser only; clearing site data resets the demo.
- No login/roles; approvals are simulated; documents use known sample values or manual entry (no OCR); AI is pattern-matching, not an LLM.

## 7. Files proposed for modification in a future "real" project

None — by design. When the client authorises production work, the seed data (`src/data/demoData.ts`), mock AI (`src/ai/mockAI.ts`) and demo persistence (`src/state/DemoContext.tsx`) get replaced by the real API/DB/LLM layers **behind the same UI contracts**; the demo is then retired.
