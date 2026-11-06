# DEMO_BUG_FIX_REPORT.md

**AI Business Secretary &amp; Accountant — Demo — Post-QA Fix Log**
Fixes applied: 2026-11-06 · Scope: `/home/user/ai-business-secretary-demo/` only (isolated demo; no production code, DB, credentials, auth, or external systems touched) · Author: Senior QA pass

All fixes are minimal, demo-scoped and reversible. **No redesign, no new features, no dependency upgrades.** Every fix was verified by the automated suite (`scripts/qa-full.mjs`, `scripts/qa-smoke.mjs`) and/or `npm run build` + `npm run typecheck` results recorded below and in `DEMO_FINAL_QA_REPORT.md`.

---

## Fix log

### BUG-001 — AI "monthly revenue and expenses" answered by the expenses intent — FIXED
- **Severity:** P2 · **File:** `src/ai/mockAI.ts`
- **Root cause:** the `/expense|kharcha/` intent was evaluated before the monthly-overview intent, so any command containing “expenses” (including “Show monthly revenue and expenses.”) was captured by it.
- **Fix:** the monthly-overview block now runs before the expenses block. No behaviour change for genuine expense queries (verified: Command 2 still routes to expenses).
- **Verified:** qa-full P5 Command 8 → PASS (month-wise table). Command 2 → PASS.

### BUG-002 — New Bank Transfer defaulted to HBL → HBL, so the first click always failed validation — FIXED
- **Severity:** P2 · **File:** `src/pages/Transactions.tsx` (`freshDraft`)
- **Root cause:** default `toAccountId` was `'hbl'` while `fromAccountId` was `'hbl'`; the form's own validation ("Source and destination must differ.") correctly blocked the submit — the product was right, the default was wrong.
- **Fix:** default destination is now Meezan for a transfer drafted from HBL.
- **Verified:** qa-full P4B — all 8 transaction types post (extra=8); liquidity invariance PASS; TB/BS/CF balanced after postings; Bank-transfer nets zero PASS.

### BUG-003 — Dashboard monthly cash-flow chart subtracted internal moves from inflow but not outflow — FIXED
- **Severity:** P2 · **File:** `src/data/stats.ts` (`monthlySeries`)
- **Root cause:** `cashIn -= internalMoves` was paired with `cashOut -= 0`, so deposits/withdrawals/transfers rendered as pure “money out” with no balancing inflow — inconsistent with the `cashFlow()` report.
- **Fix:** internal moves are now subtracted from both sides (a deposit debits the destination bank and credits cash; both legs net to zero economically).
- **Verified:** build + typecheck PASS; dashboard renders with zero console errors; Cash Flow report closing still equals live liquidity (qa-full P4C PASS).

### BUG-004 — Duplicate-approval idempotency relied on render-closure state — HARDENED (P1)
- **Severity:** P1 (hardening; **not** a reproduced failure — the double-click test already passed because the Approve button unmounts via the tab switch)
- **File:** `src/state/DemoContext.tsx` (`approveAction`)
- **Root cause:** the `status !== 'pending'` guard read `approvals` captured at render time; a sufficiently rapid batched double-fire could append the same posted transaction twice.
- **Fix:** the atomic `setPersisted` updater now re-checks the *persisted* approval's status and returns state unchanged if it is not pending. Ledger cannot double-post regardless of click timing. UX/toast flow unchanged.
- **Verified:** qa-full P7 — “Rapid double Approve posts at most one transaction” → matching posts=1, extras=9 → PASS.

### BUG-005 — Documents accepted 0-byte and &gt;15 MB uploads — FIXED
- **Severity:** P2 · **File:** `src/pages/Documents.tsx` (`onFiles`)
- **Root cause:** only the MIME check existed; no size guard. Empty files produced a preview card and oversized files bloated the localStorage-persisted document register.
- **Fix:** reject 0-byte files and files &gt;15 MB with clear error toasts **before** any state is mutated.
- **Verified:** qa-full P6 — “Empty (0-byte) file rejected” PASS; “Oversize (&gt;15 MB) file rejected” → toast=true, img=0 → PASS. Valid PNG/PDF/TXT flows unchanged (PASS).

### BUG-007 — AI amount parser rejected sub-1,000 amounts (“Rs. 777” → clarification, no draft) — FIXED
- **Severity:** P3 (found during regression re-run) · **File:** `src/ai/mockAI.ts`
- **Root cause:** `parseAmount` required ≥4 digits or comma grouping (`\d{4,}`), so any payment under Rs 1,000 was treated as unparseable.
- **Fix:** minimum raised from 4-digit to 1+ digit plain numbers (`\d+`); comma-grouped and 4+ digit forms unchanged. Only the prepare-payment branch consumes `parseAmount`; invalid-amount clarifications (“Rs. abc”) still behave identically (verified PASS).
- **Verified:** qa-full P9 — “AI financial action cannot bypass approval queue” using `Rs. 777 to Ali Suppliers` → approvals +1 → **PASS**.

### BUG-008 — After rejecting a draft, the rejection reason was not shown (no view switch) — FIXED
- **Severity:** P3 (found during regression re-run) · **File:** `src/pages/Approvals.tsx` (`doReject`)
- **Root cause:** `doReject` closed the modal but stayed on the Pending tab, leaving the user on an empty “Nothing waiting for approval” screen with no visible confirmation of the reason they just typed. (The reason *is* rendered on rejected cards — the user simply never landed on that tab.)
- **Fix:** after rejection, switch to the Rejected tab — mirroring the existing Approve → Completed tab pattern.
- **Verified:** qa-full P7 — “Rejected card shows reason” → PASS.

---

## Test-harness corrections (not product defects)

1. **Purchases KPI scope** — asserted FY purchases against the This-Month card → moved to the FY pill (recomputed 2,160,000).
2. **Unknown-party AI probe** — `Unknown Merchant XYZ` legitimately fuzzy-matched XYZ Distributors → probe reworded collision-free.
3. **Reject-flow navigation** — AI was invoked while Approvals was on screen → harness now navigates first.
4. **Liquidity-delta expectation** — harness counted credit-mode sales/purchases as cash movements → now mode-aware (cash/bank mode only). Expected Δ = 12,500 = actual; the product was correct.
5. **Sample-extraction amount assertion** — `innerText` does not include input values → assertion reads `#x-amount` input value.
6. **Responsive sidebar expectation** — harness expected hamburger at ≤1200px, but the design shows a 74px icon rail from 761–1200px with the hamburger only ≤760px → expectation corrected to match the documented CSS breakpoints.

No assertion was weakened: all six corrections make the tests *stricter or more accurate*; none masks a product failure.

## Known limitations intentionally NOT fixed (out of scope)

| Item | Why not fixed |
|---|---|
| `npm audit`: 2 dev-toolchain vulnerabilities (vite ≤6.4.3 / esbuild ≤0.24.2, GHSA-67mh-4wv8-2f99) | Fix requires breaking Vite major upgrade — explicitly out of scope (“do not redesign/rebuild”). Not part of the static client deliverable; mitigate by never serving `vite dev` to untrusted networks and serving `dist/` instead. |
| Demo profit model excludes COGS (net profit = sales + other income − operating expenses; purchases debit inventory, not COGS) | Documented design simplification of this deterministic demo; changing the accounting model would alter every reported figure and invalidate the verified baseline — out of scope. Flagged in FINAL report §Known Limitations. |
| Fixed “today” = 2026-11-06; FY fixed to FY2026-27 | Deliberate demo determinism so figures reconcile with the seed dataset. |
| Uploads are never OCR’d/extracted | Honest demo limitation (labelled “No OCR/Vision connected” in UI); not a defect. |
| No RBAC/auth by design | Local demo; approvals are an illustration, not a control. |

## Regression evidence (post-fix, 2026-11-06)

```
npm run build      → PASS  (tsc --noEmit && vite build; dist 302 kB JS, 85.6 kB gzipped)
npm run typecheck  → PASS (within build)
node scripts/qa-smoke.mjs → 27/27 PASS, 0 console errors, 0 warnings
node scripts/qa-full.mjs  → 97/97  PASS, 0 console errors, 0 warnings (~94s)
  All phases green incl. P4B (8/8 types posted, TB = 12,943,800 both sides,
  BS balances, CF closing = live liquidity), P5 (9/9 AI commands),
  P6 (documents), P7 (approvals), P8 (responsive ×4), P9 (security).
```
