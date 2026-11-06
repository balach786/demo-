/* ------------------------------------------------------------------ */
/* Formatting + pure report calculators (single source: the journal)   */
/* ------------------------------------------------------------------ */

import {
  ACCOUNTS,
  PARTIES,
  accountById,
  accountBalance,
  journalLines,
  partyBalance,
  partyById,
} from './demoData';
import type { DemoTransaction } from './types';

/* --------------------------- formatting --------------------------- */
export const fmtPKR = (n: number, withSign = false): string => {
  const abs = Math.abs(Math.round(n));
  const s = abs.toLocaleString('en-PK', { maximumFractionDigits: 0 });
  if (withSign && n < 0) return `- Rs ${s}`;
  return `Rs ${s}`;
};

export const fmtCompact = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `Rs ${(n / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `Rs ${(n / 1e5).toFixed(2)} L`;
  if (abs >= 1e3) return `Rs ${(n / 1e3).toFixed(1)}K`;
  return `Rs ${n.toFixed(0)}`;
};

export const fmtDate = (iso: string): string => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export const inRange = (t: DemoTransaction, from?: string, to?: string): boolean =>
  (!from || t.date >= from) && (!to || t.date <= to);

export type RangeKey = 'today' | 'week' | 'month' | 'year' | 'all';

export const rangeBounds = (key: RangeKey, today: string): { from?: string; to?: string } => {
  const d = new Date(today + 'T00:00:00');
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  switch (key) {
    case 'today':
      return { from: today, to: today };
    case 'week': {
      const start = new Date(d);
      const dow = (start.getDay() + 6) % 7; // Monday-first
      start.setDate(start.getDate() - dow);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { from: iso(start), to: iso(end) > today ? today : iso(end) };
    }
    case 'month':
      return { from: today.slice(0, 8) + '01', to: today };
    case 'year':
      return { from: '2026-07-01', to: today };
    case 'all':
      return {};
  }
};

/* ------------------------------ KPIs ------------------------------ */
export interface Kpis {
  cash: number;
  bank: number;
  sales: number;
  purchases: number;
  expenses: number;
  otherIncome: number;
  netProfit: number;
  receivable: number;
  payable: number;
  inventoryValue: number;
  salesCount: number;
}

export function computeKpis(txns: DemoTransaction[], from?: string, to?: string): Kpis {
  const scoped = txns.filter((t) => inRange(t, from, to));
  const sum = (pred: (t: DemoTransaction) => boolean) =>
    scoped.filter(pred).reduce((a, t) => a + t.amount, 0);

  const sales = sum((t) => t.type === 'sale');
  const purchases = sum((t) => t.type === 'purchase');
  const expenses = sum((t) => t.type === 'expense');
  const otherIncome = sum((t) => t.type === 'other_income');

  return {
    cash: accountBalance('cash', txns),
    bank: accountBalance('hbl', txns) + accountBalance('meezan', txns),
    sales,
    purchases,
    expenses,
    otherIncome,
    netProfit: sales + otherIncome - expenses,
    receivable: accountBalance('ar', txns),
    payable: -accountBalance('ap', txns),
    inventoryValue: accountBalance('inventory', txns),
    salesCount: scoped.filter((t) => t.type === 'sale').length,
  };
}

/* ------------------------- monthly series ------------------------- */
export interface MonthBucket {
  key: string;
  label: string;
  sales: number;
  purchases: number;
  expenses: number;
  otherIncome: number;
  profit: number;
  cashIn: number;
  cashOut: number;
}

export function monthlySeries(txns: DemoTransaction[]): MonthBucket[] {
  const months: { key: string; label: string }[] = [
    { key: '2026-07', label: 'Jul 26' },
    { key: '2026-08', label: 'Aug 26' },
    { key: '2026-09', label: 'Sep 26' },
    { key: '2026-10', label: 'Oct 26' },
    { key: '2026-11', label: 'Nov 26' },
  ];
  return months.map(({ key, label }) => {
    const scoped = txns.filter((t) => t.date.startsWith(key));
    const sum = (p: (t: DemoTransaction) => boolean) =>
      scoped.filter(p).reduce((a, t) => a + t.amount, 0);
    const sales = sum((t) => t.type === 'sale');
    const expenses = sum((t) => t.type === 'expense');
    const otherIncome = sum((t) => t.type === 'other_income');
    // Cash-flow movements through cash & bank accounts
    let cashIn = 0;
    let cashOut = 0;
    for (const t of scoped) {
      for (const l of journalLines(t)) {
        if (l.accountId === 'cash' || l.accountId === 'hbl' || l.accountId === 'meezan') {
          cashIn += l.debit;
          cashOut += l.credit;
        }
      }
    }
    // Remove internal transfers from both sides — the destination debit and the
    // source credit are the same economic move and were previously counted as
    // cash-in-less / cash-out-plus, which contradicted the Cash Flow report.
    const internalMoves = sum((t) => t.type === 'deposit' || t.type === 'withdrawal' || t.type === 'transfer');
    cashIn -= internalMoves;
    cashOut -= internalMoves;
    return {
      key,
      label,
      sales,
      purchases: sum((t) => t.type === 'purchase'),
      expenses,
      otherIncome,
      profit: sales + otherIncome - expenses,
      cashIn,
      cashOut,
    };
  });
}

/* --------------------------- Statements --------------------------- */
export interface PnlRow { name: string; amount: number }
export interface ProfitAndLoss {
  from?: string; to?: string;
  income: PnlRow[]; expense: PnlRow[];
  totalIncome: number; totalExpenses: number; netProfit: number;
}

export function profitAndLoss(txns: DemoTransaction[], from?: string, to?: string): ProfitAndLoss {
  const scoped = txns.filter((t) => inRange(t, from, to));
  const lines = scoped.flatMap(journalLines);
  const agg = (accountId: string, normal: 'credit' | 'debit') => {
    const ls = lines.filter((l) => l.accountId === accountId);
    const d = ls.reduce((a, l) => a + l.debit, 0);
    const c = ls.reduce((a, l) => a + l.credit, 0);
    return normal === 'credit' ? c - d : d - c;
  };
  const income = [
    { name: 'Sales Revenue', amount: agg('sales', 'credit') },
    { name: 'Other Income', amount: agg('otherincome', 'credit') },
  ];
  const expense = ACCOUNTS.filter((a) => a.type === 'expense').map((a) => ({
    name: a.name,
    amount: agg(a.id, 'debit'),
  }));
  const totalIncome = income.reduce((a, r) => a + r.amount, 0);
  const totalExpenses = expense.reduce((a, r) => a + r.amount, 0);
  return { from, to, income, expense, totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses };
}

export interface TrialRow { code: string; name: string; type: string; debit: number; credit: number }
export function trialBalance(txns: DemoTransaction[], asOf?: string): { rows: TrialRow[]; totalDebit: number; totalCredit: number; balanced: boolean } {
  const rows: TrialRow[] = ACCOUNTS.map((a) => {
    const bal = accountBalance(a.id, txns, asOf);
    return {
      code: a.code,
      name: a.name,
      type: a.type,
      debit: bal > 0 ? bal : 0,
      credit: bal < 0 ? -bal : 0,
    };
  });
  const totalDebit = rows.reduce((a, r) => a + r.debit, 0);
  const totalCredit = rows.reduce((a, r) => a + r.credit, 0);
  return { rows, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 1 };
}

export interface BalanceSheet {
  asOf: string;
  assets: { name: string; amount: number }[];
  liabilities: { name: string; amount: number }[];
  equity: { name: string; amount: number }[];
  totalAssets: number; totalLiabilities: number; totalEquity: number;
  balanced: boolean;
}
export function balanceSheet(txns: DemoTransaction[], asOf: string): BalanceSheet {
  const pnl = profitAndLoss(txns, undefined, asOf);
  const currentYearEarnings = pnl.netProfit;
  const b = (id: string) => accountBalance(id, txns, asOf);
  const assets = [
    { name: 'Main Cash Account', amount: b('cash') },
    { name: 'HBL Business Account', amount: b('hbl') },
    { name: 'Meezan Business Account', amount: b('meezan') },
    { name: 'Accounts Receivable', amount: b('ar') },
    { name: 'Inventory', amount: b('inventory') },
    { name: 'Fixed Assets', amount: b('fixedassets') },
  ];
  const liabilities = [
    { name: 'Accounts Payable', amount: -b('ap') },
    { name: 'Business Loans', amount: -b('loans') },
  ];
  const equity = [
    { name: 'Owner Capital', amount: -b('capital') },
    { name: 'Retained Earnings', amount: -b('retained') },
    { name: 'Current Year Earnings (FY 2026–27)', amount: currentYearEarnings },
  ];
  const totalAssets = assets.reduce((a, r) => a + r.amount, 0);
  const totalLiabilities = liabilities.reduce((a, r) => a + r.amount, 0);
  const totalEquity = equity.reduce((a, r) => a + r.amount, 0);
  return {
    asOf,
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1,
  };
}

export interface CashFlowSection { name: string; lines: PnlRow[]; total: number }
export interface CashFlow {
  from?: string; to?: string;
  operating: CashFlowSection;
  investing: CashFlowSection;
  financing: CashFlowSection;
  netChange: number;
  openingCash: number;
  closingCash: number;
}
const isMoney = (id: string) => id === 'cash' || id === 'hbl' || id === 'meezan';

export function cashFlow(txns: DemoTransaction[], from?: string, to?: string): CashFlow {
  const scoped = txns.filter((t) => inRange(t, from, to));
  const received: PnlRow[] = [];
  const paid: PnlRow[] = [];

  const push = (arr: PnlRow[], name: string, amount: number) => {
    const found = arr.find((r) => r.name === name);
    if (found) found.amount += amount;
    else arr.push({ name, amount });
  };

  for (const t of scoped) {
    if (t.type === 'deposit' || t.type === 'withdrawal' || t.type === 'transfer') continue; // internal
    const jl = journalLines(t);
    for (const l of jl) {
      if (!isMoney(l.accountId)) continue;
      const delta = l.debit - l.credit;
      for (const counter of jl.filter((x) => !isMoney(x.accountId))) {
        const amt = Math.abs(delta); // this dataset has exactly one money line per txn
        if (delta > 0) push(received, inflowLabel(counter.accountId), amt);
        else push(paid, outflowLabel(counter.accountId), amt);
      }
    }
  }

  const opIn = received.filter((r) => !['Fixed Assets'].includes(r.name));
  const opOut = paid.filter((r) => !['Business Loans', 'Owner Capital'].includes(r.name));
  const operating: CashFlowSection = {
    name: 'Operating Activities',
    lines: [...opIn.map((r) => ({ name: `(+) ${r.name}`, amount: r.amount })), ...opOut.map((r) => ({ name: `(−) ${r.name}`, amount: -r.amount }))],
    total: opIn.reduce((a, r) => a + r.amount, 0) - opOut.reduce((a, r) => a + r.amount, 0),
  };
  const investing: CashFlowSection = { name: 'Investing Activities', lines: [{ name: 'No investing transactions in demo period', amount: 0 }], total: 0 };
  const finLines = paid.filter((r) => ['Business Loans', 'Owner Capital'].includes(r.name));
  const financing: CashFlowSection = {
    name: 'Financing Activities',
    lines: finLines.length ? finLines.map((r) => ({ name: `(−) ${r.name}`, amount: -r.amount })) : [{ name: 'No financing transactions in demo period', amount: 0 }],
    total: -finLines.reduce((a, r) => a + r.amount, 0),
  };

  const openingMoney =
    accountById('cash').opening + accountById('hbl').opening + accountById('meezan').opening +
    txns.filter((t) => (!from || t.date < from))
      .flatMap(journalLines)
      .filter((l) => isMoney(l.accountId))
      .reduce((a, l) => a + l.debit - l.credit, 0);

  const netChange = operating.total + investing.total + financing.total;
  const closingMoney = openingMoney + netChange;

  return { from, to, operating, investing, financing, netChange, openingCash: openingMoney, closingCash: closingMoney };
}

function inflowLabel(id: string): string {
  switch (id) {
    case 'ar': return 'Receipts from customers';
    case 'sales': return 'Cash sales';
    case 'otherincome': return 'Other operating income';
    default: return `${accountById(id).name} (inflow)`;
  }
}
function outflowLabel(id: string): string {
  switch (id) {
    case 'ap': return 'Payments to suppliers';
    case 'inventory': return 'Purchase of inventory (cash)';
    case 'rent': return 'Rent paid';
    case 'salaries': return 'Salaries paid';
    case 'electricity': return 'Electricity paid';
    case 'transport': return 'Transport paid';
    case 'general': return 'General expenses paid';
    default: return `${accountById(id).name} (outflow)`;
  }
}

/* --------------------------- ledgers ------------------------------ */
export interface LedgerRow {
  date: string;
  txnId: string;
  description: string;
  reference?: string;
  debit: number;
  credit: number;
  balance: number;
}
export function partyLedger(partyId: string, txns: DemoTransaction[]): { rows: LedgerRow[]; opening: number; closing: number } {
  const p = partyById(partyId);
  let running = p?.opening ?? 0;
  const opening = running;
  const rows: LedgerRow[] = [];
  const sorted = [...txns].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  for (const t of sorted) {
    for (const l of journalLines(t)) {
      if (l.partyId === partyId && (l.accountId === 'ar' || l.accountId === 'ap')) {
        running += l.debit - l.credit;
        rows.push({
          date: t.date, txnId: t.id, description: t.description, reference: t.reference,
          debit: l.debit, credit: l.credit, balance: running,
        });
      }
    }
  }
  return { rows, opening, closing: running };
}

export function accountLedger(accountId: string, txns: DemoTransaction[]): { rows: LedgerRow[]; opening: number; closing: number } {
  let running = accountById(accountId).opening;
  const opening = running;
  const rows: LedgerRow[] = [];
  const sorted = [...txns].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  for (const t of sorted) {
    for (const l of journalLines(t)) {
      if (l.accountId === accountId) {
        running += l.debit - l.credit;
        rows.push({
          date: t.date, txnId: t.id, description: t.description, reference: t.reference,
          debit: l.debit, credit: l.credit, balance: running,
        });
      }
    }
  }
  return { rows, opening, closing: running };
}

/** Outstanding balances for all parties (signed: + receivable / − payable) */
export function partyOutstanding(txns: DemoTransaction[]) {
  return PARTIES.map((p) => ({ party: p, balance: partyBalance(p.id, txns) }));
}

export { accountBalance, partyBalance, accountById };
