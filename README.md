# AI Business Secretary & Accountant — Client Demo

> **DEMO MODE — fictional data only.** ABC Trading Company, FY 2026–27, currency PKR. No backend, no database, no external APIs. Nothing here touches production systems.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

Production-style preview: `npm run build && npm run preview`

## Quality gates

| Gate | Command / result |
|---|---|
| Typecheck (strict) | `npm run typecheck` — PASS |
| Production build | `npm run build` — PASS |
| Headless QA (Playwright) | `node scripts/qa-smoke.mjs` — 27/27 PASS, 0 console errors |
| Mobile viewport | `node scripts/qa-mobile.mjs` — PASS |
| Accounting invariants | TB 12,943,800 = 12,943,800 · BS 11,802,500 = 11,802,500 · AR/AP subledger = control · CF closing = liquidity |

## Demo flow for clients

See **CLIENT_DEMO_GUIDE.md** for the scripted ~20-minute walkthrough.
See **PROJECT_DEMO_AUDIT.md** (inspection findings — no existing repo was present) and **DEMO_IMPLEMENTATION_REPORT.md** (full status: working / simulated / planned).

## Tech

React 18 · TypeScript · Vite 5 · hand-rolled SVG charts · CSS design system (no framework, no CDN) · React context + localStorage (demo persistence) · double-entry journal engine in `src/data/` · deterministic on-device demo AI in `src/ai/mockAI.ts`.

## Safety notes

- Fictional records only; "Reset Demo Data" restores the seed world.
- Demo approvals are simulated — no bank transfers, emails, SMS or postings to real ledgers occur.
- AI is deterministic pattern matching (not an LLM); documents are sample-verified or manual-entry (no OCR).
