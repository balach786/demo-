/* ------------------------------------------------------------------ */
/* Demo state provider — shared, isolated, localStorage-persisted.     */
/* Production data is NEVER touched. Reset via Settings → Reset Demo.  */
/* ------------------------------------------------------------------ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { SEED_TRANSACTIONS, accountById, accountBalance, journalLines } from '../data/demoData';
import type {
  ApprovalAction,
  DemoTransaction,
  Page,
  Toast,
  TransactionDraft,
} from '../data/types';

export interface AiStoredMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  time: string;
  intent?: string;
  module?: string;
  confidence?: number;
  table?: { headers: string[]; rows: (string | number)[][] };
  nav?: { page: Page; label: string; param?: string };
  actionRef?: string;
  simulated?: boolean;
}

interface Persisted {
  extraTransactions: DemoTransaction[];
  approvals: ApprovalAction[];
  aiConversation: AiStoredMessage[];
}

const STORAGE_KEY = 'abs-demo-state-v1';
const EMPTY: Persisted = { extraTransactions: [], approvals: [], aiConversation: [] };

const loadPersisted = (): Persisted => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Persisted>;
      return {
        extraTransactions: p.extraTransactions ?? [],
        approvals: p.approvals ?? [],
        aiConversation: p.aiConversation ?? [],
      };
    }
  } catch {
    /* corrupted demo state — fall through to defaults */
  }
  return EMPTY;
};

interface DemoContextValue {
  page: Page;
  navParam?: string;
  go: (page: Page, param?: string) => void;

  transactions: DemoTransaction[];
  approvals: ApprovalAction[];
  aiConversation: AiStoredMessage[];
  setAiConversation: React.Dispatch<React.SetStateAction<AiStoredMessage[]>>;

  toast: (kind: Toast['kind'], title: string, detail?: string) => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;

  addManualTransaction: (t: Omit<DemoTransaction, 'id' | 'status' | 'createdVia'>) => DemoTransaction;
  createApproval: (source: ApprovalAction['source'], title: string, draft: TransactionDraft) => ApprovalAction;
  approveAction: (id: string) => ApprovalAction | undefined;
  rejectAction: (id: string, reason: string) => void;
  updateDraft: (id: string, draft: TransactionDraft) => void;
  resetDemoData: () => void;

  nextTxnPreview: string;
}

const DemoContext = createContext<DemoContextValue | null>(null);

const nextSeq = (ids: string[]) =>
  Math.max(0, ...ids.map((id) => Number(id.split('-').pop()) || 0)) + 1;

export function DemoProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>('dashboard');
  const [navParam, setNavParam] = useState<string | undefined>(undefined);
  const [persisted, setPersisted] = useState<Persisted>(() =>
    typeof window === 'undefined' ? EMPTY : loadPersisted(),
  );
  const [toasts, setToasts] = useState<Toast[]>([]);

  const { extraTransactions, approvals, aiConversation } = persisted;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      /* storage unavailable — demo continues in-memory */
    }
  }, [persisted]);

  const go = useCallback((p: Page, param?: string) => {
    setPage(p);
    setNavParam(param);
    window.scrollTo({ top: 0 });
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (kind: Toast['kind'], title: string, detail?: string) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t.slice(-2), { id, kind, title, detail }]);
      window.setTimeout(() => dismissToast(id), 5200);
    },
    [dismissToast],
  );

  const transactions = useMemo(
    () =>
      [...SEED_TRANSACTIONS, ...extraTransactions].sort(
        (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
      ),
    [extraTransactions],
  );

  const nextTxnNumber = useCallback(() => nextSeq(transactions.map((t) => t.id)), [transactions]);
  const nextTxnPreview = `TXN-2026-${String(nextTxnNumber()).padStart(4, '0')}`;

  const addManualTransaction: DemoContextValue['addManualTransaction'] = useCallback(
    (t) => {
      const id = `TXN-2026-${String(nextSeq(transactions.map((x) => x.id))).padStart(4, '0')}`;
      const created: DemoTransaction = { ...t, id, status: 'posted', createdVia: 'manual' };
      setPersisted((p) => ({ ...p, extraTransactions: [...p.extraTransactions, created] }));
      toast('success', 'Transaction posted', `${id} recorded in the demo ledger.`);
      return created;
    },
    [transactions, toast],
  );

  const createApproval: DemoContextValue['createApproval'] = useCallback(
    (source, title, draft) => {
      const id = `APR-2026-${String(approvals.length + 1).padStart(4, '0')}`;
      const action: ApprovalAction = {
        id,
        createdAt: new Date().toISOString(),
        source,
        title,
        draft,
        status: 'pending',
      };
      setPersisted((p) => ({ ...p, approvals: [...p.approvals, action] }));
      return action;
    },
    [approvals.length],
  );

  const approveAction: DemoContextValue['approveAction'] = useCallback(
    (id) => {
      const target = approvals.find((a) => a.id === id);
      if (!target || target.status !== 'pending') {
        toast('warning', 'Cannot approve', 'This action is not pending approval anymore.');
        return undefined;
      }
      const txnNo = nextSeq(transactions.map((t) => t.id));
      const txnId = `TXN-2026-${String(txnNo).padStart(4, '0')}`;
      const d = target.draft;
      const posted: DemoTransaction = {
        id: txnId,
        date: d.date,
        description: d.description,
        type: d.type,
        mode: d.mode,
        amount: d.amount,
        accountId: d.accountId,
        partyId: d.partyId,
        expenseAccountId: d.expenseAccountId,
        reference: d.reference,
        status: 'posted',
        createdVia: target.source === 'manual' ? 'manual' : target.source,
      };
      const moneyAccount = d.accountId ?? (d.mode === 'bank' ? 'hbl' : 'cash');
      const allWithPosted = [...transactions, posted];
      const after = accountBalance(moneyAccount, allWithPosted);
      const completed: ApprovalAction = {
        ...target,
        status: 'completed',
        resultTxnId: txnId,
        resultAccountId: moneyAccount,
        resultBalanceAfter: after,
      };
      setPersisted((p) => {
        // Atomic idempotency: re-check against the persisted state, not the
        // render-closure — a rapid double-fire must never post twice.
        const current = p.approvals.find((a) => a.id === id);
        if (!current || current.status !== 'pending') return p;
        return {
          ...p,
          extraTransactions: [...p.extraTransactions, posted],
          approvals: p.approvals.map((a) => (a.id === id ? completed : a)),
        };
      });
      toast(
        'success',
        'Action approved (simulated)',
        `${txnId} posted · ${accountById(moneyAccount).name}: Rs ${Math.round(after).toLocaleString('en-PK')}`,
      );
      return completed;
    },
    [approvals, transactions, toast],
  );

  const rejectAction: DemoContextValue['rejectAction'] = useCallback(
    (id, reason) => {
      setPersisted((p) => ({
        ...p,
        approvals: p.approvals.map((a) => (a.id === id ? { ...a, status: 'rejected', rejectReason: reason } : a)),
      }));
      toast('info', 'Action rejected', 'The draft was rejected. No books were touched.');
    },
    [toast],
  );

  const updateDraft: DemoContextValue['updateDraft'] = useCallback(
    (id, draft) => {
      setPersisted((p) => ({
        ...p,
        approvals: p.approvals.map((a) => (a.id === id ? { ...a, draft } : a)),
      }));
      toast('success', 'Draft updated', 'Changes saved to the demo draft.');
    },
    [toast],
  );

  const setAiConversation: DemoContextValue['setAiConversation'] = useCallback((action) => {
    setPersisted((p) => ({
      ...p,
      aiConversation:
        typeof action === 'function'
          ? (action as (prev: AiStoredMessage[]) => AiStoredMessage[])(p.aiConversation)
          : action,
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setPersisted(EMPTY);
    toast('info', 'Demo data reset', 'Your demo changes were discarded. The fictional seed dataset was restored.');
  }, [toast]);

  const value: DemoContextValue = {
    page,
    navParam,
    go,
    transactions,
    approvals,
    aiConversation,
    setAiConversation,
    toast,
    toasts,
    dismissToast,
    addManualTransaction,
    createApproval,
    approveAction,
    rejectAction,
    updateDraft,
    resetDemoData,
    nextTxnPreview,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within DemoProvider');
  return ctx;
}

export { journalLines };
