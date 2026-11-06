# CLIENT_DEMO_GUIDE.md
## AI Business Secretary & Accountant — Scripted Client Demonstration
**Audience:** presenter · **Duration:** 18–22 minutes · **Reset any time:** Settings → Reset Demo Data

---

## 0. Before you walk in

```bash
cd ai-business-secretary-demo
npm install          # first time only
npm run dev          # open the preview URL
```
- Use a **fresh browser profile** (or Settings → Reset Demo Data) so the slate is clean.
- Browser zoom 100%, window ≥ 1400 px wide if possible (laptop + second screen ideal).
- Have this guide on a second screen. Do **not** edit code live.

## 1. The 60-second pitch (while Dashboard loads)

> "This is ABC Trading Company, a real working example. Everything you'll see is fictional demo data, but the maths is real double-entry bookkeeping — the dashboard, the ledgers and the AI all read the same journal, so the numbers always agree. Watch what happens when I ask it things in plain English — and English-Urdu mix."

## 2. Executive Dashboard (3 min)
- Point at the hero band: **Total Liquidity Rs 4,504,500 · FY Net Profit Rs 4,202,500 · Receivable Rs 1,688,000** — "live, not screenshots".
- Toggle **This Month → This Year → Today**: KPI cards and charts recompute instantly. Balances stay fixed (point-in-time), flows re-scope — that's correct accounting, and it always matches the reports you'll see later.
- Walk the cards: Cash, Bank, Sales (Rs 5,318,000 FY), Purchases (Rs 2,160,000), Expenses (Rs 1,141,300), Net Profit, Receivable, Payable, **Inventory Value**.
- Charts: Revenue vs Expenses (Jul–Nov), Monthly Profit trend, Cash Flow, Sales vs Purchases, Expense Breakdown donut.
- Click **View → Financial Reports** if asked "where does this come from?" — show P&L, then come back.
- Outstanding Payments panel: "Ahmed Enterprises Rs 988,000 — who owes what, straight from the ledger."

## 3. AI Command Center (5 min) — the showpiece
Open **AI Command Center**. Say:

1. Type / click **"Aaj ki total sales kitni hain?"** → Rs 178,000, table of today's bills, badge "Intent: sales_today · Confidence 97%".
2. **"Ahmed ka ledger dikhao."** → Rs 988,000 receivable + last entries + "Open Ledgers" button.
3. **"Is month ka profit calculate karo."** → month & FY table.
4. **"Business ka current cash balance batao."** → cash/HBL/Meezan split, total Rs 4,504,500.
5. **"ABC Traders ko kitni payment deni hai?"** → payable list.
6. **"Show me the last 10 transactions."** → live journal tail.
7. Now the money moment — **"Prepare a payment of Rs. 25,000 to ABC Traders."**
   → AI answers with a draft: Party ABC Traders · Rs 25,000 · HBL · **STATUS: PENDING APPROVAL** and a reference **APR-2026-000X**, plus toast "Draft created — no payment has been made".

> "Every financial action the AI proposes is a **draft**. Nothing moves until a human approves it. That's the control your accountant will love."

Be honest if asked: *"Is this calling ChatGPT right now?"* → **No — this build runs an on-device demo brain so it works offline in front of you. The production system uses the same screens with the OpenAI API behind them."**

## 4. Approvals (2 min)
Open **Approvals** (note the sidebar badge "1").
- Show the draft card: APR reference, source = **AI Command**, type Money Paid, party, amount, HBL, date.
- Click **Edit Draft**, change the amount to 25,000 (or 24,500), save → "draft is editable until approval".
- Click **Approve** → green banner: **"Posted as TXN-2026-00XX · HBL Business Account is now Rs 1,885,800"**.
- Sidebar badge clears. (If asked: in production this is where a bank transfer/SEPA/EMI instruction would be *prepared* — for this demo it reconciles the books only.)

## 5. Documents — Document Intelligence (3 min)
Open **Documents**.
> "Your staff photograph the supplier receipt; the system reads it, you confirm, books update."
- Click sample **"ABC Traders — Payment Receipt · Rs 25,000"**. Show the rendered receipt on the left.
- Walk the extraction: Party ABC Traders ✓, Date 06-Nov-2026, Reference **RCV-5521 (flagged LOW CONFIDENCE — amber)** ← "the AI tells you what it's unsure about, and never books unverified data".
- Edit nothing (or fix the reference), click **Prepare Transaction Draft** → lands in **Approvals** as Pending.
- Hit **Approve**. "From photo to posted voucher — with a human checkpoint."
- Optional: upload your own receipt photo → fields stay **empty** with "VERIFY — not detected": *"This demo has no OCR connected; production does. We never invent values from your documents."*

## 6. Accounting depth on demand (3–5 min, pick per audience)
- **Transactions** → Add Transaction: type Expense · Rent · Rs 45,000, description e.g. "Office rent demo entry" → note the **live journal preview: Debit Rent 45,000 / Credit HBL 45,000 — balanced**. Post it. Dashboard/Reports update instantly (total expenses change).
- **Ledgers** → Party Ledger (Ahmed Enterprises): Dr/Cr running balance; print button → show print-friendly layout.
- **Bank Accounts** — click HBL card → movements; "no real bank API in the demo; integration is a production work-package".
- **Financial Reports** — tabs:
  - P&L (Income 5,343,800 − Expenses 1,141,300 → **Net 4,202,500**)
  - Trial Balance → green **BALANCED** badge (debits 12,943,800 = credits 12,943,800)
  - Balance Sheet → **ASSETS = LIABILITIES + EQUITY ✓**
  > "We only show statements that tie out. If the books don't balance, the demo refuses to dress it up."

## 7. Honesty slide (1 min — do not skip)
Open **Settings** → "**What Works, What's Simulated, What's Planned**" table.
- Working: dashboard, accounting engine, reports, approvals, documents flow (with verification), persistence in-browser.
- Simulated: AI answers, document extraction, bank balances.
- Planned: OpenAI API, MongoDB Atlas persistence, RBAC/login, real bank connectivity, notifications.

> "Everything simulated today is a production work-package with your go-ahead — and nothing simulated today is presented to you as live."

## 8. Reset & close
- **Settings → Reset Demo Data** → back to the clean seed world; confirm on-screen toast.
- Close: "You've seen the dashboard, the books, the AI, a document, an approval — all consistent. For the full build we need: your real chart of accounts, opening trial balance, and your go-ahead to wire up Atlas + OpenAI under a proper security review."

## 9. If something goes wrong live
| Symptom | Fix |
|---|---|
| White screen / odd state | Refresh (F5). If stale: Settings → Reset Demo Data. |
| Approval badge count confusing | Badge counts *pending only*; approving clears it. |
| Numbers "changed" mid-demo | You posted test entries — reset demo data (Settings) before Q&A. |
| "Can it connect to my bank?" | "In the production scope — via a licensed aggregator; demo proves the workflow, not the rail." |
| "Is my data online?" | "No — nothing leaves this browser; the demo has no backend." |

## 10. Suggested closing line

> "The complete product is: this exact screen-set, plus your live data, real AI, real persistence and bank connectivity — phased, security-reviewed, and auditable. The demo you just saw is the proof of shape; the engagement decides the depth."
