# DEMO_QA_INITIAL_REPORT.md

**AI Business Secretary &amp; Accountant — Demo Build — Pre-Fix QA Snapshot**
QA date: 2026-11-06 (Asia/Karachi) · Environment: local dev server `npm run dev` → http://0.0.0.0:5173 (HTTP 200 verified) · Browser: Playwright Chromium headless, 1920×1080 default · Scope: `/home/user/ai-business-secretary-demo/` only.

> This is the **pre-fix baseline** required by the approved master prompt. It records what was actually executed and observed on 2026-11-06 **before any product source was modified** (zero `src/` changes so far in the QA phase). A post-fix follow-up exists in `DEMO_BUG_FIX_REPORT.md` and `DEMO_FINAL_QA_REPORT.md`.
> The demo is a **client demonstration build with simulated data**. Results here describe the demo only; they are NOT evidence of production readiness.

---

## 1. Environment &amp; startup

| Check | Result |
|---|---|
| `npm run dev` serves the app | **PASS** — HTTP 200 from `http://localhost:5173` |
| Startup &amp; DEMO-MODE visibility checks (15 assertions) | **PASS** |
| `npm run build` (`tsc --noEmit` && `vite build`) | **PASS** (last full run pre-QA; see §9) |
| `npm run typecheck` | **PASS** (pre-QA) |
| Formal unit/integration test framework | **NOT AVAILABLE** — no Jest/Vitest config, no test script in `package.json`. QA is browser-driven automation (Playwright) + manual code review + arithmetic verification. Stated plainly: there is no existing automated test suite to "keep green"; PASS/FAIL claims in this report come from the Playwright suites below. |
| Backend / database | **NONE by design** — frontend-only. No MongoDB, no Atlas, no credentials referenced anywhere in `src/`. `grep` for `sk-…`, `api_key`, `secret`, `password`, `private_key`, `token` returns only descriptive copy (e.g. "no LLM/API call"). No `.env*` files. No `fetch` / `XMLHttpRequest` / `axios` / `WebSocket` calls in `src/`. No `dangerouslySetInnerHTML` / `innerHTML`. |
| npm audit | 2 vulnerabilities (1 moderate, 1 high) — both in the **dev toolchain only** (`esbuild` ≤0.24.2 / `vite` ≤6.4.3, GHSA-67mh-4wv8-2f99, dev-server request forgery). `npm audit fix --force` would require a breaking Vite major upgrade — out of scope and not applied. The built demo is static files; clients should never run `vite dev`. Flagged in final report, versions left unchanged. |

## 2. What was tested (method)

Two Playwright suites (headless Chromium, deterministic seed — each run starts from a fresh `localStorage`):

1. **`scripts/qa-smoke.mjs`** — pre-existing smoke suite: 27 assertions covering page load, navigation, DEMO pill, dashboard KPIs, reports, approvals. **Ran: 27/27 PASS.**
2. **`scripts/qa-full.mjs`** — new deep suite (P2–P9 phases): startup checks, dashboard KPI/filter/recent-txn/top-customer/outstanding assertions vs an independently recomputed journal, party listing/search/detail, transaction-form validation, all-8-transaction-types posting, liquidity invariance (deposit/withdrawal/transfer), Trial Balance / Balance Sheet / Cash Flow / P&amp;L recomputation after postings, bank-card balances, 9 AI commands + 6 edge cases, document seed samples + upload/reject behaviours, approval workflow (edit draft → approve → double-approve → reject), 4 responsive viewports, security UI checks.

Independent recomputation: seed schedules were compiled to `/tmp/verify-seed/` and an `expected.mjs` module recomputes KPIs, P&amp;L, TB, BS, CF, account/party balances and Today/Week/Month/FY windows from `demoData.ts`; the UI is then asserted against those numbers (not against other UI output).

## 3. Baseline (fresh-seed) figures — journal recomputation vs UI

| Metric | Independently recomputed | Shown in UI | Match |
|---|---|---|---|
| Cash balance | 968,700 | 968,700 | ✅ |
| Bank balance (HBL 1,910,800 + Meezan 1,625,000) | 3,535,800 | 3,535,800 | ✅ |
| Today's sales (2026-11-06) | 178,000 | 178,000 | ✅ |
| Week sales | 274,000 | 274,000 | ✅ |
| Month (Nov-2026) sales | 542,000 | 542,000 | ✅ |
| FY2026-27 sales (20 txns) | 5,318,000 | 5,318,000 | ✅ |
| FY expenses | 1,141,300 | 1,141,300 | ✅ |
| FY net profit | 4,202,500 | 4,202,500 | ✅ |
| Accounts receivable | 1,688,000 | 1,688,000 | ✅ |
| Accounts payable | 1,515,000 | 1,515,000 | ✅ |
| Inventory | 3,110,000 | 3,110,000 | ✅ |
| Trial Balance | 12,943,800 = 12,943,800 | balanced | ✅ |
| Balance Sheet | 11,802,500 = 11,802,500 | balances | ✅ |
| Cash-flow closing | 4,504,500 = cash + bank | closing balance shown equals live liquidity | ✅ |
| Party: Ahmed (net receivable) | 988,000 | matches | ✅ |
| Party: Ali Traders (net payable) | −535,000 | matches | ✅ |
| Party: ABC Traders (net payable) | −245,000 | matches | ✅ |

**Arithmetic verification: PASS on all seed figures above.** Dashboard figures, TB/BS/CF, P&amp;L and party balances are internally consistent and agree with an independent recomputation.

## 4. Defects found (pre-fix)

### BUG-001 — P2 (functional) — AI "monthly revenue and expenses" command intercepted by the expenses intent
- **File:** `src/ai/mockAI.ts` — intent routing evaluates the `expenses` regex (`/expense/`) before the monthly-overview intent, so command *"Show monthly revenue and expenses."* returns the **November-2026 expense total only** instead of the month-wise sales-vs-expense overview. Other month-overview wording may be similarly shadowed.
- **Evidence:** qa-full run #1, P5 Command 8 — expected month-wise table, observed expenses-answer payload (value 1,141,300, Nov-2026 scope).
- **Repro:** open AI Command Center → type `Show monthly revenue and expenses.`
- **Impact:** demo misinforms a client watching the AI answer; the wrong intent silently wins. No data corruption.
- **Fix (applied post-initial-report):** evaluate the monthly-overview intent before the generic expenses intent.

### BUG-002 — P2 (functional, UX default) — New Transfer defaults source == destination, so first submission always fails validation
- **File:** `src/pages/Transactions.tsx` (`freshDraft`) — default `fromAccountId = 'hbl'` and `toAccountId = 'hbl'` for `transfer`; form validation ("Source and destination must differ.") correctly blocks the very first click of "Post to Demo Ledger".
- **Evidence:** standalone debug run 2026-11-06 — `transfer → field-errors: ["Source and destination must differ."]`. (Transaction type otherwise posts fine once destination is changed — validation itself is working correctly.)
- **Repro:** Transactions → Add Transaction → Type = Bank Transfer → Post without touching accounts → error toast, no posting.
- **Impact:** every demo of a bank transfer starts with a guaranteed validation error; misleading for the client.
- **Fix (applied post-initial-report):** default destination to Meezan for a transfer drafted from HBL.

### BUG-003 — P2 (reporting/visual) — Monthly cash-flow chart understates outflow inconsistency with Cash Flow report
- **File:** `src/data/stats.ts` — `monthlySeries` subtracts internal transfer moves from `cashIn` but not from `cashOut`, so e.g. Jul-2026 renders money-in 835,000 vs money-out 487,500 where the deposit leg inflating outflow has no matching inflow. Inconsistent with the `cashFlow()` report definition.
- **Repro:** Dashboard cash-flow chart vs Reports → Cash Flow for the same month.
- **Impact:** visual inconsistency; not a ledger error; the underlying GL and Cash Flow report are correct.
- **Fix (applied post-initial-report):** subtract internal moves from both `cashIn` and `cashOut`.

### BUG-004 — P1 (robustness/hardening) — Duplicate-approval defence relies on render-closure state
- **File:** `src/state/DemoContext.tsx` — `approveAction` checks `target.status !== 'pending'` using state captured at render time rather than inside the `setPersisted` updater; the double-approve test passed only because the Approve button unmounts (tab switches) after the first click. A sufficiently rapid batched double-fire could post twice (demo-only consequence; no external system is touched).
- **Evidence:** qa-full run #1 — approve → double-click Approve → exactly one extra posting (PASS, margin 1) — passes today, but the guard is not in the atomic update path.
- **Fix (applied post-initial-report):** idempotency re-checked **inside** the `setPersisted` updater (no behaviour change, defence in depth).

### BUG-005 — P2 (input validation) — Documents page accepts 0-byte and oversize uploads
- **File:** `src/pages/Documents.tsx` — upload handler does not reject empty (0-byte) files or files above a sane demo limit (>15 MB).
- **Evidence:** qa-full run #1 — 0-byte PNG and a 16 MB PNG both produced a success toast + new document entry instead of rejection.
- **Impact:** silent junk records in the demo document register. Local-only; nothing leaves the browser.
- **Fix (applied post-initial-report):** reject 0-byte and >15 MB with a clear error toast, before any state mutation.

### BUG-006 — P3 (AI/UX) — none additional observed
All other AI edge cases behaved: empty message ignored; unknown command → graceful fallback with suggestions; invalid amount → clarification prompt; repeated identical prepare-commands → separate drafts; unknown party → no party matched; both tracked.

### Test-harness issues (NOT product bugs — documented for honesty)
- Purchases KPI assertion compared an FY-scoped figure against the This-Month card → **harness scope error**, fixed in `qa-full.mjs`, assertion moved to the FY pill. (FY purchases recompute = 2,160,000.)
- "Unknown-party" AI probe used `Unknown Merchant XYZ`, which legitimately fuzzy-matches XYZ Distributors (first-word collision) — probe reworded to a collision-free unknown, not a product issue.
- Reject-flow test invoked the AI Command Center while the Approvals page was on screen → navigation step added to the harness.
- qa-full run #1 crashed between P7 and P8 due to the harness nav error; **P8 (responsive, 4 viewports), P9 (security UI scan) and the console-error tally were not executed in run #1** and are therefore not claimed.

## 5. Results by phase (run #1, pre-fix)

| Phase | Result |
|---|---|
| P2 Startup / DEMO pill / nav (15 checks) | **PASS** |
| P2 Dashboard KPIs & arithmetic (all rows in §3) | **PASS** |
| P3 Parties listing/search/detail | **PASS** |
| P4A Transaction validation (negative amount / zero / credit-sale-without-party / short description) | **PASS** — all blocked with field errors |
| P4B All 8 transaction types post; liquidity invariance holds | **FAIL** — see below |
| P4B Trial Balance / Balance Sheet / Cash Flow / P&amp;L after postings | **TB 12,943,800 = 12,943,800 PASS**; **BS balances PASS**; **CF closing = live liquidity PASS**; 7 of 8 types posted before the run crashed |
| P4B Bank-card balances (HBL / Meezan / cash) | **PASS** |
| P5 AI commands 1–7, 9 + edge cases | **PASS** (answers match journal figures) |
| P5 Command 8 "Show monthly revenue and expenses." | **FAIL** — BUG-001 |
| P6 Document samples / upload / reject paths | samples **PASS**; 0-byte **FAIL** (BUG-005); 16 MB **FAIL** (BUG-005); valid PNG/PDF/TXT **PASS** |
| P7 Approval edit / approve / double-approve / reject | **PASS** for edit, approve (exactly 1 posting), double-approve (≤1 posting); reject path **not executed in run #1** (harness nav error) |
| P8 Responsive (desktop 1920 / laptop 1366 / tablet 768 / phone 390) | **NOT RUN** (crashed earlier in run #1) — not claimed |
| P9 Security/UI scan | **NOT RUN** (crashed earlier in run #1) — manual static review recorded in §6 |
| Console errors / page errors during suite | **NOT COUNTED** in run #1 (summary never printed) — re-run required |

**P4B "extra transactions = 7" reconciliation:** one of the eight types (`transfer`) did not post in the harness because its default source and destination were both HBL and the form's own (correct) validation rejected it — confirmed via standalone debug reproduction (BUG-002). Liquidity Δ observed 12,500 vs expected 42,500 is explained by that single blocked posting. **No ledger-corruption defect found; the ledger, TB, BS and CF remained balanced with the 7 posted transactions.**

## 6. Security &amp; data-safety findings (static review, non-destructive)

- **No network surface:** no `fetch`/XHR/axios/WebSocket in `src/`; zero external URLs; no CDN assets; app is fully self-contained/offline.
- **No secrets present** in source or `.env*`; no credentials to rotate.
- **Persistence:** `localStorage` key `abs-demo-state-v1` only — added transactions, approvals and AI conversation history persist locally in the viewer's browser; "Reset Demo Data" (Settings) restores the seed. Nothing is transmitted off-device.
- **No HTML injection sinks:** no `dangerouslySetInnerHTML`/`innerHTML`.
- **Dev-toolchain advisory:** 2 npm audit findings (moderate + high) in vite/esbuild dev-server path — not shipped in the static build; do not expose `npm run dev` to untrusted networks. Not fixed (breaking upgrade, out of scope).
- **RBAC/auth:** none by design (local demo). The approvals flow demonstrates *concept* only; it is not a security control.
- Storage is shared with the user's real browser profile if opened in the same browser/origin profile — noted for demos delivered via the same browser.

## 7. Simulated vs genuine (honesty register — unchanged)

| Feature | Status |
|---|---|
| All data (customers, vendors, invoices, chart of accounts, FY figures) | **SIMULATED** seed data |
| AI Command Center answers | **SIMULATED** — deterministic on-device pattern matching; no LLM/API call |
| OCR / document parsing of uploads | **NOT IMPLEMENTED** — uploads are stored locally as attachments; never read/extracted |
| Banks/ABA/integrations | **SIMULATED/none** — no real bank, SMS, email, ledger sync |
| Approvals | **SIMULATED** — local state only, never calls an external system |
| Trial balance / BS / CF / P&amp;L / dashboard math | **GENUINE** — computed in-browser from the (simulated) ledger; arithmetic verified independently in §3 |
| Today's date | fixed concept "2026-11-06" in demo context; FY fixed to FY2026-27 |

## 8. Limitations &amp; scope compliance

- The demo was QA'd **only** in the isolated directory; no production/Atlas/database/credential access was used or implied anywhere.
- Not everything in the UI has pixel-level manual coverage; assertions are DOM/value-based.
- No load/concurrency/performance testing (not applicable to a local single-user demo).
- No accessibility audit was performed (P3 at best; not claimed).
- Phase-2 historical security evidence from the earlier build phase remains absent from the workspace (documented in PROJECT_DEMO_AUDIT.md); this report does not fabricate it.
- PASS/FAIL claims in §5 reflect exactly what the suites executed; anything **NOT RUN** is labelled as such and is completed in the post-fix re-run.

## 9. Pre-fix verification commands

```
npm run dev            # HTTP 200
node scripts/qa-smoke.mjs   # 27/27 PASS
node scripts/qa-full.mjs    # run #1: crashed pre-summary — see §4/§5
node --check scripts/qa-full.mjs   # Syntax OK
```
Build/typecheck last verified **PASS** before the QA phase began (zero `src/` changes during inspection). They are re-run after the fixes land.

## 10. Recommendation (pre-fix)

Proceed with the minimal, demo-scoped fixes listed in §4 (BUG-001…BUG-005), then re-run both suites + build, then re-issue the report as `DEMO_FINAL_QA_REPORT.md`. Do **not** promote this artifact beyond a labelled client demo on the strength of these results; it is a simulated-data build for evaluation purposes only.
