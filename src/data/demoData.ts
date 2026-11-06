/* ------------------------------------------------------------------ */
/* AI Business Secretary & Accountant — CENTRAL DEMO DATASET            */
/* Business: ABC Trading Company (FICTIONAL) · Currency: PKR            */
/* Demo period: FY 2026-27 (1 Jul 2026 – 30 Jun 2027)                   */
/* DEMO_TODAY is fixed at 2026-11-06 so the demo always reconciles.     */
/*                                                                      */
/* Safety: this module is the SINGLE SOURCE OF TRUTH for the demo.      */
/* Every dashboard figure, report and AI answer is derived from the     */
/* journal produced by journalLines(). Nothing is hardcoded elsewhere.  */
/* ------------------------------------------------------------------ */

import type {
  Account,
  DemoTransaction,
  JournalLine,
  Party,
} from './types';

export const DEMO_TODAY = '2026-11-06';
export const DEMO_BUSINESS = 'ABC Trading Company';
export const DEMO_FY = 'FY 2026–27';
export const DEMO_CURRENCY = 'PKR';
export const FY_START = '2026-07-01';

/* ---------------------------- Accounts --------------------------- */
export const ACCOUNTS: Account[] = [
  { id: 'cash',        code: '1001', name: 'Main Cash Account',   type: 'asset',     opening: 485000,  isCash: true,  description: 'Physical cash at head office' },
  { id: 'hbl',         code: '1010', name: 'HBL Business Account', type: 'asset',    opening: 1250000, isBank: true,  bankName: 'Habib Bank Limited',   accountTitle: 'ABC Trading Company', accountNumber: 'PK00HABB0000001234567890', description: 'Primary corporate account' },
  { id: 'meezan',      code: '1020', name: 'Meezan Business Account', type: 'asset', opening: 780000,  isBank: true,  bankName: 'Meezan Bank Limited',  accountTitle: 'ABC Trading Company', accountNumber: 'PK00MEZN0000009876543210', description: 'Secondary corporate account' },
  { id: 'ar',          code: '1100', name: 'Accounts Receivable', type: 'asset',     opening: 640000,  description: 'Amounts owed by customers' },
  { id: 'inventory',   code: '1200', name: 'Inventory',           type: 'asset',     opening: 950000,  description: 'Finished goods & stock' },
  { id: 'fixedassets', code: '1300', name: 'Fixed Assets',        type: 'asset',     opening: 2500000, description: 'Vehicles, equipment & furniture' },
  { id: 'ap',          code: '2000', name: 'Accounts Payable',    type: 'liability', opening: -520000, description: 'Amounts owed to suppliers' },
  { id: 'loans',       code: '2100', name: 'Business Loans',      type: 'liability', opening: -800000, description: 'Meezan Bank running finance' },
  { id: 'capital',     code: '3000', name: 'Owner Capital',       type: 'equity',    opening: -4500000 },
  { id: 'retained',    code: '3100', name: 'Retained Earnings',   type: 'equity',    opening: -785000 },
  { id: 'sales',       code: '4000', name: 'Sales Revenue',       type: 'income',    opening: 0 },
  { id: 'otherincome', code: '4100', name: 'Other Income',        type: 'income',    opening: 0, description: 'Bank profit & misc. income' },
  { id: 'rent',        code: '5000', name: 'Rent',                type: 'expense',   opening: 0 },
  { id: 'salaries',    code: '5100', name: 'Salaries',            type: 'expense',   opening: 0 },
  { id: 'electricity', code: '5200', name: 'Electricity',         type: 'expense',   opening: 0 },
  { id: 'transport',   code: '5300', name: 'Transport',           type: 'expense',   opening: 0 },
  { id: 'general',     code: '5400', name: 'General Expenses',    type: 'expense',   opening: 0 },
];

export const accountById = (id: string): Account => {
  const a = ACCOUNTS.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown account: ${id}`);
  return a;
};

/* ----------------------------- Parties --------------------------- */
export const PARTIES: Party[] = [
  { id: 'ahmed',   name: 'Ahmed Enterprises',  type: 'customer', contactPerson: 'Mr. Ahmed Raza',   phone: '+92 300 1234567', city: 'Karachi', address: 'Shop 14, Tariq Road, Karachi', opening: 265000,  creditLimit: 1500000 },
  { id: 'raza',    name: 'Raza Cloth House',   type: 'customer', contactPerson: 'Mr. Raza Mehmood', phone: '+92 321 7654321', city: 'Lahore',  address: '22-A MM Alam Road, Lahore',   opening: 175000,  creditLimit: 1000000 },
  { id: 'karachi', name: 'Karachi Traders Co.',type: 'customer', contactPerson: 'Mr. Imran Sheikh', phone: '+92 333 4567890', city: 'Karachi', address: 'Plot 9, Jodia Bazar, Karachi', opening: 200000, creditLimit: 2000000 },
  { id: 'abct',    name: 'ABC Traders',        type: 'supplier', contactPerson: 'Mr. Naveed Akhtar',phone: '+92 345 5551234', city: 'Karachi', address: 'Godown 3, Site Area, Karachi', opening: -220000 },
  { id: 'ali',     name: 'Ali Suppliers',      type: 'supplier', contactPerson: 'Mr. Ali Hassan',   phone: '+92 312 8884321', city: 'Faisalabad', address: 'Mill Road, Faisalabad',    opening: -180000 },
  { id: 'xyz',     name: 'XYZ Distributors',   type: 'supplier', contactPerson: 'Mr. Zeeshan Butt', phone: '+92 301 2229090', city: 'Multan',  address: 'Shah Rukn-e-Alam Road, Multan', opening: -120000 },
];

export const partyById = (id?: string): Party | undefined =>
  PARTIES.find((p) => p.id === id);

/* ----------------------- Seed transactions ------------------------ */
const S = (
  n: number,
  date: string,
  type: DemoTransaction['type'],
  mode: DemoTransaction['mode'],
  amount: number,
  description: string,
  extras: Partial<DemoTransaction> = {},
): DemoTransaction => ({
  id: `TXN-2026-${String(n).padStart(4, '0')}`,
  date,
  type,
  mode,
  amount,
  description,
  status: 'posted',
  createdVia: 'seed',
  ...extras,
});

export const SEED_TRANSACTIONS: DemoTransaction[] = [
  // ---- JULY 2026 ----
  S(1,  '2026-07-01', 'sale',     'credit', 385000, 'Sales invoice to Ahmed Enterprises',                    { partyId: 'ahmed',   reference: 'INV-2026-0001' }),
  S(2,  '2026-07-03', 'sale',     'cash',   145000, 'Cash sales — retail counter',                           { accountId: 'cash',   reference: 'CS-0001' }),
  S(3,  '2026-07-05', 'purchase', 'credit', 260000, 'Purchase of stock — XYZ Distributors',                  { partyId: 'xyz',     reference: 'PINV-2026-0001' }),
  S(4,  '2026-07-06', 'receipt',  'bank',   200000, 'Receipt from Ahmed Enterprises against INV-2026-0001',   { partyId: 'ahmed',   accountId: 'hbl', reference: 'RCP-0001' }),
  S(5,  '2026-07-08', 'expense',  'bank',    45000, 'Office rent — July 2026',                               { accountId: 'hbl',    expenseAccountId: 'rent' }),
  S(6,  '2026-07-10', 'expense',  'bank',   180000, 'Staff salaries — July 2026',                            { accountId: 'hbl',    expenseAccountId: 'salaries' }),
  S(7,  '2026-07-12', 'receipt',  'bank',   150000, 'Receipt from Karachi Traders Co. against outstanding',   { partyId: 'karachi', accountId: 'hbl', reference: 'RCP-0002' }),
  S(8,  '2026-07-14', 'sale',     'credit', 230000, 'Sales invoice to Raza Cloth House',                     { partyId: 'raza',    reference: 'INV-2026-0002' }),
  S(9,  '2026-07-16', 'payment',  'bank',   120000, 'Payment to ABC Traders against supplier account',        { partyId: 'abct',    accountId: 'hbl', reference: 'PAY-0001' }),
  S(10, '2026-07-18', 'expense',  'cash',    18500, 'K-Electric bill — July 2026',                           { accountId: 'cash',   expenseAccountId: 'electricity' }),
  S(11, '2026-07-20', 'sale',     'cash',   165000, 'Cash sales — walk-in customers',                        { accountId: 'cash',   reference: 'CS-0002' }),
  S(12, '2026-07-22', 'purchase', 'credit', 195000, 'Purchase of fabric rolls — Ali Suppliers',              { partyId: 'ali',     reference: 'PINV-2026-0002' }),
  S(13, '2026-07-25', 'deposit',  'cash',   100000, 'Cash deposited into HBL Business Account',               { toAccountId: 'hbl',   reference: 'DEP-0001' }),
  S(14, '2026-07-26', 'expense',  'cash',    24000, 'Transport & delivery charges — July 2026',               { accountId: 'cash',   expenseAccountId: 'transport' }),
  S(15, '2026-07-28', 'sale',     'credit', 310000, 'Sales invoice to Ahmed Enterprises',                    { partyId: 'ahmed',   reference: 'INV-2026-0003' }),
  S(16, '2026-07-30', 'receipt',  'bank',   175000, 'Receipt from Raza Cloth House against INV-2026-0002',    { partyId: 'raza',    accountId: 'meezan', reference: 'RCP-0003' }),
  // ---- AUGUST 2026 ----
  S(17, '2026-08-02', 'sale',     'credit', 420000, 'Sales invoice to Karachi Traders Co.',                  { partyId: 'karachi', reference: 'INV-2026-0004' }),
  S(18, '2026-08-04', 'purchase', 'credit', 310000, 'Purchase of stock — ABC Traders',                       { partyId: 'abct',    reference: 'PINV-2026-0003' }),
  S(19, '2026-08-06', 'receipt',  'bank',   385000, 'Receipt from Ahmed Enterprises — balance of INV-2026-0001', { partyId: 'ahmed', accountId: 'hbl', reference: 'RCP-0004' }),
  S(20, '2026-08-08', 'expense',  'bank',    45000, 'Office rent — August 2026',                             { accountId: 'hbl',    expenseAccountId: 'rent' }),
  S(21, '2026-08-09', 'expense',  'bank',   180000, 'Staff salaries — August 2026',                          { accountId: 'hbl',    expenseAccountId: 'salaries' }),
  S(22, '2026-08-11', 'sale',     'cash',   172000, 'Cash sales — retail counter',                           { accountId: 'cash',   reference: 'CS-0003' }),
  S(23, '2026-08-13', 'receipt',  'bank',   200000, 'Receipt from Karachi Traders Co.',                      { partyId: 'karachi', accountId: 'hbl', reference: 'RCP-0005' }),
  S(24, '2026-08-15', 'purchase', 'credit', 285000, 'Purchase of stock — XYZ Distributors',                  { partyId: 'xyz',     reference: 'PINV-2026-0004' }),
  S(25, '2026-08-17', 'expense',  'cash',    21000, 'K-Electric bill — August 2026',                         { accountId: 'cash',   expenseAccountId: 'electricity' }),
  S(26, '2026-08-19', 'sale',     'credit', 265000, 'Sales invoice to Raza Cloth House',                     { partyId: 'raza',    reference: 'INV-2026-0005' }),
  S(27, '2026-08-21', 'payment',  'bank',   150000, 'Payment to Ali Suppliers against supplier account',     { partyId: 'ali',     accountId: 'hbl', reference: 'PAY-0002' }),
  S(28, '2026-08-23', 'expense',  'cash',    26500, 'Transport & delivery charges — August 2026',             { accountId: 'cash',   expenseAccountId: 'transport' }),
  S(29, '2026-08-25', 'sale',     'credit', 295000, 'Sales invoice to Ahmed Enterprises',                    { partyId: 'ahmed',   reference: 'INV-2026-0006' }),
  S(30, '2026-08-27', 'payment',  'bank',   190000, 'Payment to ABC Traders against supplier account',        { partyId: 'abct',    accountId: 'hbl', reference: 'PAY-0003' }),
  S(31, '2026-08-29', 'receipt',  'bank',   250000, 'Receipt from Ahmed Enterprises',                        { partyId: 'ahmed',   accountId: 'hbl', reference: 'RCP-0006' }),
  S(32, '2026-08-30', 'other_income', 'bank',  9400, 'Bank profit — HBL Business Account',                   { accountId: 'hbl' }),
  S(33, '2026-08-31', 'deposit',  'cash',   150000, 'Cash deposited into HBL Business Account',               { toAccountId: 'hbl',   reference: 'DEP-0002' }),
  // ---- SEPTEMBER 2026 ----
  S(34, '2026-09-02', 'sale',     'credit', 405000, 'Sales invoice to Ahmed Enterprises',                    { partyId: 'ahmed',   reference: 'INV-2026-0007' }),
  S(35, '2026-09-04', 'purchase', 'credit', 240000, 'Purchase of stock — Ali Suppliers',                     { partyId: 'ali',     reference: 'PINV-2026-0005' }),
  S(36, '2026-09-06', 'receipt',  'bank',   230000, 'Receipt from Raza Cloth House — balance of INV-2026-0002', { partyId: 'raza',   accountId: 'meezan', reference: 'RCP-0007' }),
  S(37, '2026-09-08', 'expense',  'bank',    45000, 'Office rent — September 2026',                          { accountId: 'hbl',    expenseAccountId: 'rent' }),
  S(38, '2026-09-09', 'expense',  'bank',   180000, 'Staff salaries — September 2026',                       { accountId: 'hbl',    expenseAccountId: 'salaries' }),
  S(39, '2026-09-12', 'sale',     'cash',   158000, 'Cash sales — retail counter',                           { accountId: 'cash',   reference: 'CS-0004' }),
  S(40, '2026-09-14', 'receipt',  'bank',   220000, 'Receipt from Karachi Traders Co.',                      { partyId: 'karachi', accountId: 'hbl', reference: 'RCP-0008' }),
  S(41, '2026-09-16', 'purchase', 'credit', 330000, 'Purchase of stock — XYZ Distributors',                  { partyId: 'xyz',     reference: 'PINV-2026-0006' }),
  S(42, '2026-09-18', 'expense',  'cash',    19800, 'K-Electric bill — September 2026',                      { accountId: 'cash',   expenseAccountId: 'electricity' }),
  S(43, '2026-09-20', 'sale',     'credit', 375000, 'Sales invoice to Karachi Traders Co.',                  { partyId: 'karachi', reference: 'INV-2026-0008' }),
  S(44, '2026-09-22', 'payment',  'bank',   260000, 'Payment to XYZ Distributors against supplier account',   { partyId: 'xyz',     accountId: 'hbl', reference: 'PAY-0004' }),
  S(45, '2026-09-24', 'expense',  'cash',    28000, 'Transport & delivery charges — September 2026',          { accountId: 'cash',   expenseAccountId: 'transport' }),
  S(46, '2026-09-26', 'sale',     'credit', 240000, 'Sales invoice to Raza Cloth House',                     { partyId: 'raza',    reference: 'INV-2026-0009' }),
  S(47, '2026-09-28', 'expense',  'cash',    12000, 'Office supplies & stationery',                          { accountId: 'cash',   expenseAccountId: 'general' }),
  S(48, '2026-09-30', 'other_income', 'bank',  7800, 'Bank profit — HBL Business Account',                   { accountId: 'hbl' }),
  S(49, '2026-09-30', 'transfer', 'bank',   200000, 'Internal transfer — HBL to Meezan account',              { fromAccountId: 'hbl', toAccountId: 'meezan', reference: 'TRF-0001' }),
  // ---- OCTOBER 2026 ----
  S(50, '2026-10-02', 'sale',     'credit', 355000, 'Sales invoice to Ahmed Enterprises',                    { partyId: 'ahmed',   reference: 'INV-2026-0010' }),
  S(51, '2026-10-04', 'purchase', 'credit', 275000, 'Purchase of stock — ABC Traders',                       { partyId: 'abct',    reference: 'PINV-2026-0007' }),
  S(52, '2026-10-06', 'receipt',  'bank',   310000, 'Receipt from Ahmed Enterprises against INV-2026-0003',   { partyId: 'ahmed',   accountId: 'hbl', reference: 'RCP-0009' }),
  S(53, '2026-10-08', 'expense',  'bank',    45000, 'Office rent — October 2026',                            { accountId: 'hbl',    expenseAccountId: 'rent' }),
  S(54, '2026-10-09', 'expense',  'bank',   180000, 'Staff salaries — October 2026',                         { accountId: 'hbl',    expenseAccountId: 'salaries' }),
  S(55, '2026-10-11', 'sale',     'cash',   181000, 'Cash sales — retail counter',                           { accountId: 'cash',   reference: 'CS-0005' }),
  S(56, '2026-10-13', 'receipt',  'bank',   375000, 'Receipt from Karachi Traders Co. against INV-2026-0008', { partyId: 'karachi', accountId: 'hbl', reference: 'RCP-0010' }),
  S(57, '2026-10-15', 'purchase', 'credit', 265000, 'Purchase of stock — Ali Suppliers',                     { partyId: 'ali',     reference: 'PINV-2026-0008' }),
  S(58, '2026-10-17', 'expense',  'cash',    22400, 'K-Electric bill — October 2026',                        { accountId: 'cash',   expenseAccountId: 'electricity' }),
  S(59, '2026-10-19', 'sale',     'credit', 285000, 'Sales invoice to Raza Cloth House',                     { partyId: 'raza',    reference: 'INV-2026-0011' }),
  S(60, '2026-10-21', 'payment',  'bank',   250000, 'Payment to ABC Traders against supplier account',        { partyId: 'abct',    accountId: 'hbl', reference: 'PAY-0005' }),
  S(61, '2026-10-23', 'expense',  'cash',    27000, 'Transport & delivery charges — October 2026',            { accountId: 'cash',   expenseAccountId: 'transport' }),
  S(62, '2026-10-25', 'receipt',  'bank',   240000, 'Receipt from Raza Cloth House against INV-2026-0009',    { partyId: 'raza',    accountId: 'meezan', reference: 'RCP-0011' }),
  S(63, '2026-10-27', 'sale',     'credit', 390000, 'Sales invoice to Karachi Traders Co.',                  { partyId: 'karachi', reference: 'INV-2026-0012' }),
  S(64, '2026-10-29', 'expense',  'cash',    15000, 'Repairs & maintenance — office',                        { accountId: 'cash',   expenseAccountId: 'general' }),
  S(65, '2026-10-30', 'other_income', 'bank',  8600, 'Bank profit — HBL Business Account',                   { accountId: 'hbl' }),
  S(66, '2026-10-31', 'deposit',  'cash',   120000, 'Cash deposited into HBL Business Account',               { toAccountId: 'hbl',   reference: 'DEP-0003' }),
  // ---- NOVEMBER 2026 (to DEMO_TODAY) ----
  S(67, '2026-11-01', 'sale',     'credit', 268000, 'Sales invoice to Ahmed Enterprises',                    { partyId: 'ahmed',   reference: 'INV-2026-0013' }),
  S(68, '2026-11-02', 'receipt',  'bank',   290000, 'Receipt from Karachi Traders Co. against INV-2026-0012', { partyId: 'karachi', accountId: 'hbl', reference: 'RCP-0012' }),
  S(69, '2026-11-03', 'sale',     'cash',    96000, 'Cash sales — retail counter',                           { accountId: 'cash',   reference: 'CS-0006' }),
  S(70, '2026-11-04', 'expense',  'cash',    17600, 'K-Electric bill — November 2026',                       { accountId: 'cash',   expenseAccountId: 'electricity' }),
  S(71, '2026-11-05', 'payment',  'bank',   195000, 'Payment to Ali Suppliers against supplier account',     { partyId: 'ali',     accountId: 'hbl', reference: 'PAY-0006' }),
  S(72, '2026-11-06', 'expense',  'cash',     9500, 'Transport & delivery charges — November 2026',           { accountId: 'cash',   expenseAccountId: 'transport' }),
  S(73, '2026-11-06', 'sale',     'cash',   178000, 'Cash sales — retail counter',                           { accountId: 'cash',   reference: 'CS-0007' }),
  S(74, '2026-11-06', 'receipt',  'bank',   150000, 'Receipt from Ahmed Enterprises — part payment INV-2026-0013', { partyId: 'ahmed', accountId: 'hbl', reference: 'RCP-0013' }),
];

/* ------------------- Double-entry journal engine ------------------ */
export function journalLines(t: DemoTransaction): JournalLine[] {
  const L = (accountId: string, debit: number, credit: number, partyId?: string): JournalLine => ({
    accountId, debit, credit, partyId,
  });
  const amt = t.amount;
  const moneyAccount = t.mode === 'bank' ? t.accountId ?? 'hbl' : t.accountId ?? 'cash';

  switch (t.type) {
    case 'sale':
      return t.mode === 'credit'
        ? [L('ar', amt, 0, t.partyId), L('sales', 0, amt)]
        : [L(moneyAccount, amt, 0), L('sales', 0, amt)];
    case 'purchase':
      return t.mode === 'credit'
        ? [L('inventory', amt, 0), L('ap', 0, amt, t.partyId)]
        : [L('inventory', amt, 0), L(moneyAccount, 0, amt)];
    case 'receipt':
      return [L(moneyAccount, amt, 0), L('ar', 0, amt, t.partyId)];
    case 'payment':
      return [L('ap', amt, 0, t.partyId), L(moneyAccount, 0, amt)];
    case 'expense':
      return [L(t.expenseAccountId ?? 'general', amt, 0), L(moneyAccount, 0, amt)];
    case 'other_income':
      return [L(moneyAccount, amt, 0), L('otherincome', 0, amt)];
    case 'deposit':
      return [L(t.toAccountId ?? 'hbl', amt, 0), L('cash', 0, amt)];
    case 'withdrawal':
      return [L('cash', amt, 0), L(t.fromAccountId ?? 'hbl', 0, amt)];
    case 'transfer':
      return [L(t.toAccountId ?? 'meezan', amt, 0), L(t.fromAccountId ?? 'hbl', 0, amt)];
  }
}

/** Signed balance (+ debit) of an account as of `asOf` (inclusive). */
export function accountBalance(accountId: string, txns: DemoTransaction[], asOf?: string): number {
  let bal = accountById(accountId).opening;
  for (const t of txns) {
    if (asOf && t.date > asOf) continue;
    for (const l of journalLines(t)) {
      if (l.accountId === accountId) bal += l.debit - l.credit;
    }
  }
  return bal;
}

/** Signed party balance (+ = party owes us). Works for AR and AP lines. */
export function partyBalance(partyId: string, txns: DemoTransaction[]): number {
  const p = partyById(partyId);
  let bal = p?.opening ?? 0;
  for (const t of txns) {
    for (const l of journalLines(t)) {
      if (l.partyId === partyId && (l.accountId === 'ar' || l.accountId === 'ap')) {
        bal += l.debit - l.credit;
      }
    }
  }
  return bal;
}

export const bankAccounts = ACCOUNTS.filter((a) => a.isBank);
export const cashAccount = ACCOUNTS.find((a) => a.isCash)!;

export const TXN_TYPE_LABEL: Record<DemoTransaction['type'], string> = {
  sale: 'Sales',
  purchase: 'Purchase',
  receipt: 'Money Received',
  payment: 'Money Paid',
  expense: 'Expense',
  other_income: 'Other Income',
  deposit: 'Cash Deposit',
  withdrawal: 'Cash Withdrawal',
  transfer: 'Bank Transfer',
};
