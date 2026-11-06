/* ------------------------------------------------------------------ */
/* DETERMINISTIC DEMO AI — no external API is called.                  */
/* This module pattern-matches the demo commands (English + Roman      */
/* Urdu) and computes answers from the shared demo dataset.            */
/* It is presented to the user as "Demo AI (simulated, on-device)".     */
/* ------------------------------------------------------------------ */

import { DEMO_TODAY, PARTIES, TXN_TYPE_LABEL, partyBalance, accountBalance } from '../data/demoData';
import { fmtDate, fmtPKR, monthlySeries, profitAndLoss } from '../data/stats';
import type { DemoTransaction, Page, Party, TransactionDraft } from '../data/types';

export interface AITable {
  headers: string[];
  rows: (string | number)[][];
}
export interface AINav { page: Page; label: string; param?: string }

export interface AIReply {
  text: string;
  intent: string;
  module: string;
  confidence: number;
  table?: AITable;
  nav?: AINav;
  /** When set, the UI creates a Pending Approval action from this draft */
  draftAction?: { title: string; draft: TransactionDraft };
  simulated: true;
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

const GENERIC_WORDS = new Set(['traders', 'suppliers', 'enterprises', 'co', 'ltd', 'pvt', 'house', 'company', 'the']);

const findParty = (text: string): Party | undefined => {
  const t = norm(text);
  let best: { party: Party; score: number } | undefined;
  for (const p of PARTIES) {
    const n = norm(p.name);
    let score = 0;
    if (t.includes(n)) score += 100; // full name match wins
    const first = n.split(' ')[0];
    if (first.length > 2 && !GENERIC_WORDS.has(first) && t.includes(first)) score += 10; // distinctive first word
    if (score > 0 && (!best || score > best.score)) best = { party: p, score };
  }
  return best?.party;
};

const parseAmount = (text: string): number | undefined => {
  const m = text.match(/(?:rs\.?|pkr|₨)?\s*([\d]{1,3}(?:,[\d]{3})+|\d+)(?:\s*(?:rupees|rs|pkr))?/i);
  if (m) return Number(m[1].replace(/,/g, ''));
  const m2 = text.match(/([\d]+)\s*(?:rs|rupees|pkr)/i);
  if (m2) return Number(m2[1]);
  return undefined;
};

const last = (txns: DemoTransaction[], n: number, pred?: (t: DemoTransaction) => boolean) =>
  [...txns].filter(pred ?? (() => true)).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id.localeCompare(a.id))).slice(0, n);

const txnRows = (list: DemoTransaction[]): AITable => ({
  headers: ['ID', 'Date', 'Description', 'Type', 'Amount'],
  rows: list.map((t) => [t.id, fmtDate(t.date), t.description, TXN_TYPE_LABEL[t.type], fmtPKR(t.amount)]),
});

const monthToDate = { from: DEMO_TODAY.slice(0, 8) + '01', to: DEMO_TODAY };
const fyToDate = { from: '2026-07-01', to: DEMO_TODAY };

export function runCommand(raw: string, txns: DemoTransaction[]): AIReply {
  const t = norm(raw);
  const base = { simulated: true as const };

  /* ---- prepare payment -------------------------------------------- */
  if (/(prepare|create|make|record|initiate).*(payment|transfer)|payment.*(of|for).*(rs|pkr|₨|\d)|pay .*(rs|pkr|\d)/.test(t)) {
    const amount = parseAmount(raw);
    const party = findParty(raw);
    if (amount && party) {
      const draft: TransactionDraft = {
        type: 'payment',
        mode: 'bank',
        amount,
        accountId: 'hbl',
        partyId: party.id,
        date: DEMO_TODAY,
        description: `Payment to ${party.name}`,
      };
      return {
        ...base,
        intent: 'prepare_payment',
        module: 'Accounting · Money Paid',
        confidence: 0.94,
        text:
          `Understood. I have prepared a payment draft for your review:\n\n` +
          `• Party: ${party.name}\n• Amount: ${fmtPKR(amount)}\n• Paying from: HBL Business Account\n• Date: ${fmtDate(DEMO_TODAY)}\n` +
          `• Status: PENDING APPROVAL\n\n` +
          `This is only a draft — no money has moved. Please review and approve it in the Approvals queue. ` +
          `(Demo: approval is simulated; no real transfer is executed.)`,
        nav: { page: 'approvals', label: 'Open Approvals' },
        draftAction: { title: `Payment to ${party.name}`, draft },
      };
    }
    return {
      ...base,
      intent: 'prepare_payment',
      module: 'Accounting · Money Paid',
      confidence: 0.55,
      text:
        `I’d like to prepare that payment, but I need both a clear amount and a known party. ` +
        `Try: “Prepare a payment of Rs. 25,000 to ABC Traders.”\n\nRecognised parties: ${PARTIES.map((p) => p.name).join(', ')}.`,
    };
  }

  /* ---- last N transactions ---------------------------------------- */
  const mLast = t.match(/(?:last|recent)\s+(\d+)?\s*(?:transactions|txns|entries)/);
  if (mLast) {
    const n = Math.min(Math.max(Number(mLast[1] ?? 10), 1), 15);
    const list = last(txns, n);
    return {
      ...base,
      intent: 'list_transactions',
      module: 'Accounting · Transactions',
      confidence: 0.96,
      text: `Here are the last ${n} transactions from the demo ledger (as of ${fmtDate(DEMO_TODAY)}):`,
      table: txnRows(list),
      nav: { page: 'transactions', label: 'Open Transactions' },
    };
  }

  /* ---- today's sales ---------------------------------------------- */
  if (/(aaj|today).*(sale|sales|bikri)|sales?.*(aaj|today)/.test(t)) {
    const todays = txns.filter((x) => x.date === DEMO_TODAY && x.type === 'sale');
    const total = todays.reduce((a, x) => a + x.amount, 0);
    return {
      ...base,
      intent: 'sales_today',
      module: 'Dashboard · Sales',
      confidence: 0.97,
      text: todays.length
        ? `Aaj (${fmtDate(DEMO_TODAY)}) ki total sales ${fmtPKR(total)} hain, across ${todays.length} transaction(s).`
        : `Aaj (${fmtDate(DEMO_TODAY)}) koi sale record nahi hui abhi tak. Yesterday's and month-to-date figures are on the dashboard.`,
      table: todays.length ? txnRows(todays) : undefined,
      nav: { page: 'dashboard', label: 'Open Dashboard' },
    };
  }

  /* ---- party ledger / outstanding --------------------------------- */
  if (/ledger|udhaar|khata/.test(t)) {
    const party = findParty(raw);
    if (party) {
      const bal = partyBalance(party.id, txns);
      const related = last(txns, 6, (x) => x.partyId === party.id);
      return {
        ...base,
        intent: 'party_ledger',
        module: 'Accounting · Party Ledger',
        confidence: 0.95,
        text:
          `${party.name} ka khata (demo data):\n\n` +
          `• Current balance: ${fmtPKR(Math.abs(bal))} ${bal >= 0 ? 'receivable (party owes you)' : 'payable (you owe party)'}\n` +
          `• Contact: ${party.contactPerson} · ${party.phone} · ${party.city}\n\n` +
          `Last ${related.length} entries:`,
        table: txnRows(related),
        nav: { page: 'ledgers', label: 'Open Ledgers', param: party.id },
      };
    }
    return {
      ...base,
      intent: 'party_ledger',
      module: 'Accounting · Party Ledger',
      confidence: 0.5,
      text: `Which party? Try: “Ahmed ka ledger dikhao.”\n\nRecognised parties: ${PARTIES.map((p) => p.name).join(', ')}.`,
    };
  }

  if (/(kitni payment|kya dena|how much.*(owe|pay|payable)|outstanding|payable|deni hai|balance.*(abc|ali|xyz)|(abc|ali|xyz).*payment)/.test(t)) {
    const party = findParty(raw);
    const suppliers = PARTIES.filter((p) => p.type === 'supplier');
    const rows = (party ? [party] : suppliers).map((p) => {
      const bal = partyBalance(p.id, txns);
      return [p.name, bal < 0 ? fmtPKR(-bal) : '—'] as (string | number)[];
    });
    return {
      ...base,
      intent: 'party_outstanding',
      module: 'Accounting · Accounts Payable',
      confidence: 0.9,
      text: party
        ? `${party.name} ko abhi ${fmtPKR(Math.max(0, -partyBalance(party.id, txns)))} deni hai (demo figures).`
        : `Supplier-wise payable position (demo figures):`,
      table: { headers: ['Supplier', 'Payable'], rows },
      nav: { page: 'parties', label: 'Open Parties' },
    };
  }

  /* ---- month / FY profit ------------------------------------------ */
  if (/profit|munafa|fayda/.test(t)) {
    const mtd = profitAndLoss(txns, monthToDate.from, monthToDate.to);
    const fy = profitAndLoss(txns, fyToDate.from, fyToDate.to);
    return {
      ...base,
      intent: 'profit',
      module: 'Reports · Profit & Loss',
      confidence: 0.95,
      text:
        `Profit summary (demo data, as of ${fmtDate(DEMO_TODAY)}):\n\n` +
        `• This month (Nov 2026): ${fmtPKR(mtd.netProfit)} — revenue ${fmtPKR(mtd.totalIncome)} − expenses ${fmtPKR(mtd.totalExpenses)}\n` +
        `• FY 2026–27 to date: ${fmtPKR(fy.netProfit)} — revenue ${fmtPKR(fy.totalIncome)} − expenses ${fmtPKR(fy.totalExpenses)}`,
      table: {
        headers: ['Period', 'Revenue', 'Expenses', 'Net Profit'],
        rows: [
          ['Nov 2026 (MTD)', fmtPKR(mtd.totalIncome), fmtPKR(mtd.totalExpenses), fmtPKR(mtd.netProfit)],
          ['FY 2026–27 (YTD)', fmtPKR(fy.totalIncome), fmtPKR(fy.totalExpenses), fmtPKR(fy.netProfit)],
        ],
      },
      nav: { page: 'reports', label: 'Open P&L Report' },
    };
  }

  /* ---- cash balance ------------------------------------------------ */
  if (/cash.*(balance|kitna|batao|position)|balance.*(cash|bank)|paisa.*kitna/.test(t)) {
    const cash = accountBalance('cash', txns);
    const hbl = accountBalance('hbl', txns);
    const meezan = accountBalance('meezan', txns);
    return {
      ...base,
      intent: 'cash_balance',
      module: 'Dashboard · Liquidity',
      confidence: 0.96,
      text:
        `Business liquidity position (demo data):\n\n` +
        `• Main Cash: ${fmtPKR(cash)}\n• HBL Business Account: ${fmtPKR(hbl)}\n• Meezan Business Account: ${fmtPKR(meezan)}\n` +
        `• Total: ${fmtPKR(cash + hbl + meezan)}`,
      table: {
        headers: ['Account', 'Balance'],
        rows: [
          ['Main Cash Account', fmtPKR(cash)],
          ['HBL Business Account', fmtPKR(hbl)],
          ['Meezan Business Account', fmtPKR(meezan)],
          ['Total liquidity', fmtPKR(cash + hbl + meezan)],
        ],
      },
      nav: { page: 'banks', label: 'Open Bank Accounts' },
    };
  }

  /* ---- monthly revenue & expenses ---------------------------------- */
  if (/monthly|month.wise|month by month|revenue and expenses|sales.*vs.*expense/.test(t)) {
    const m = monthlySeries(txns);
    return {
      ...base,
      intent: 'monthly_overview',
      module: 'Dashboard · Trends',
      confidence: 0.93,
      text: `Month-wise revenue vs expenses (demo data):`,
      table: {
        headers: ['Month', 'Sales', 'Purchases', 'Expenses', 'Net Profit'],
        rows: m.map((x) => [x.label, fmtPKR(x.sales), fmtPKR(x.purchases), fmtPKR(x.expenses), fmtPKR(x.profit)]),
      },
      nav: { page: 'dashboard', label: 'Open Dashboard' },
    };
  }

  /* ---- expenses ---------------------------------------------------- */
  if (/expense|kharcha/.test(t)) {
    const wantsToday = /(aaj|today)/.test(t);
    const scoped = wantsToday
      ? txns.filter((x) => x.date === DEMO_TODAY && x.type === 'expense')
      : txns.filter((x) => x.date >= monthToDate.from && x.type === 'expense');
    const total = scoped.reduce((a, x) => a + x.amount, 0);
    return {
      ...base,
      intent: 'expenses',
      module: 'Expenses & Income',
      confidence: 0.92,
      text: `${wantsToday ? 'Aaj ki' : 'Is month (Nov 2026) ki'} expenses — total ${fmtPKR(total)} (${scoped.length} transaction(s)):`,
      table: txnRows(scoped),
      nav: { page: 'expenses-income', label: 'Open Expenses & Income' },
    };
  }

  /* ---- trial balance / balance sheet -------------------------------- */
  if (/trial balance/.test(t)) {
    return {
      ...base,
      intent: 'trial_balance',
      module: 'Reports · Trial Balance',
      confidence: 0.97,
      text: `Trial Balance is ready in the Reports module and it balances (total debits = total credits) in demo data.`,
      nav: { page: 'reports', label: 'Open Trial Balance' },
    };
  }
  if (/balance sheet/.test(t)) {
    return {
      ...base,
      intent: 'balance_sheet',
      module: 'Reports · Balance Sheet',
      confidence: 0.97,
      text: `Balance Sheet (as of ${fmtDate(DEMO_TODAY)}) is balanced in demo data: Assets = Liabilities + Equity. Open Reports to view it.`,
      nav: { page: 'reports', label: 'Open Balance Sheet' },
    };
  }

  /* ---- help ---------------------------------------------------------- */
  if (/help|what can you|capabilities|commands|madad/.test(t)) {
    return {
      ...base,
      intent: 'help',
      module: 'AI Command Center',
      confidence: 0.99,
      text:
        `Main demo AI hoon — on-device, simulated. Main yeh kar sakta hoon:\n\n` +
        `• “Aaj ki total sales kitni hain?”\n• “Ahmed ka ledger dikhao.”\n• “Is month ka profit calculate karo.”\n` +
        `• “Business ka current cash balance batao.”\n• “Aaj ki expenses ki report banao.”\n• “Ali Traders ko kitni payment deni hai?”\n` +
        `• “Show me the last 10 transactions.”\n• “Prepare a payment of Rs. 25,000 to ABC Traders.”\n• “Show monthly revenue and expenses.”\n\n` +
        `Financial actions draft mein jate hain — approve karne se pehle aap review karte hain.`,
    };
  }

  /* ---- fallback ------------------------------------------------------ */
  return {
    ...base,
    intent: 'unknown',
    module: 'AI Command Center',
    confidence: 0,
    text:
      `I didn’t fully understand that command (demo AI — on-device pattern matching).\n\n` +
      `Mujhe yeh baatain samajh aati hain: sales, profit, cash balance, expenses, party ledger, outstanding payments, last transactions, monthly overview, ya “Prepare a payment of Rs. X to <Party>”.\n\n` +
      `Type “help” for the full list.`,
  };
}

export const SUGGESTED_COMMANDS = [
  'Aaj ki total sales kitni hain?',
  'Ahmed ka ledger dikhao.',
  'Is month ka profit calculate karo.',
  'Business ka current cash balance batao.',
  'Aaj ki expenses ki report banao.',
  'ABC Traders ko kitni payment deni hai?',
  'Show me the last 10 transactions.',
  'Prepare a payment of Rs. 25,000 to ABC Traders.',
  'Show monthly revenue and expenses.',
];
