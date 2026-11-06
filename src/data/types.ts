/* ------------------------------------------------------------------ */
/* AI Business Secretary & Accountant — DEMO TYPES                      */
/* All records are FICTIONAL demo data for ABC Trading Company.        */
/* ------------------------------------------------------------------ */

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  /** Signed opening balance (+ = debit, − = credit) as of FY start */
  opening: number;
  isCash?: boolean;
  isBank?: boolean;
  /** Bank metadata (only for bank accounts) */
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  description?: string;
}

export type PartyType = 'customer' | 'supplier';

export interface Party {
  id: string;
  name: string;
  type: PartyType;
  contactPerson: string;
  phone: string;
  city: string;
  address: string;
  /** Signed opening balance (+ = party owes us / receivable, − = we owe party / payable) */
  opening: number;
  creditLimit?: number;
}

export type TxnType =
  | 'sale'
  | 'purchase'
  | 'receipt'
  | 'payment'
  | 'expense'
  | 'other_income'
  | 'deposit'
  | 'withdrawal'
  | 'transfer';

export type TxnMode = 'cash' | 'bank' | 'credit';
export type TxnStatus = 'posted';

export interface DemoTransaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  type: TxnType;
  mode: TxnMode;
  amount: number;
  /** Cash/bank account used (mode cash|bank). For deposits: source cash account. */
  accountId?: string;
  /** Destination bank account (deposit / transfer / withdrawal uses fromAccountId) */
  toAccountId?: string;
  fromAccountId?: string;
  /** Expense account (type = expense) */
  expenseAccountId?: string;
  /** Party (credit sales/purchases, receipts, payments) */
  partyId?: string;
  reference?: string;
  status: TxnStatus;
  createdVia: 'seed' | 'manual' | 'ai' | 'document';
}

export interface JournalLine {
  accountId: string;
  debit: number;
  credit: number;
  partyId?: string;
}

export type ApprovalStatus = 'draft' | 'pending' | 'completed' | 'rejected';

export interface TransactionDraft {
  type: TxnType;
  mode: TxnMode;
  amount: number;
  accountId?: string;
  partyId?: string;
  expenseAccountId?: string;
  date: string;
  description: string;
  reference?: string;
}

export interface ApprovalAction {
  id: string; // APR-0001
  createdAt: string; // ISO datetime
  source: 'ai' | 'document' | 'manual';
  title: string;
  draft: TransactionDraft;
  status: ApprovalStatus;
  resultTxnId?: string;
  resultBalanceAfter?: number;
  resultAccountId?: string;
  rejectReason?: string;
}

export type Page =
  | 'dashboard'
  | 'ai'
  | 'transactions'
  | 'parties'
  | 'accounts'
  | 'ledgers'
  | 'banks'
  | 'expenses-income'
  | 'reports'
  | 'documents'
  | 'approvals'
  | 'settings';

export interface Toast {
  id: number;
  kind: 'success' | 'info' | 'warning' | 'error';
  title: string;
  detail?: string;
}
