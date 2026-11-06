import { useEffect, useMemo, useState } from 'react';
import { useDemo } from '../state/DemoContext';
import { Icon } from '../components/icons';
import { Modal, EmptyState, Badge } from '../components/common';
import {
  ACCOUNTS, DEMO_TODAY, PARTIES, TXN_TYPE_LABEL, accountById, journalLines, partyById,
} from '../data/demoData';
import { fmtDate, fmtPKR } from '../data/stats';
import type { DemoTransaction, TxnMode, TxnType } from '../data/types';

type Draft = {
  type: TxnType; mode: TxnMode; date: string; amount: string;
  accountId: string; toAccountId: string; fromAccountId: string;
  partyId: string; expenseAccountId: string;
  description: string; reference: string;
};

const freshDraft = (): Draft => ({
  type: 'sale', mode: 'credit', date: DEMO_TODAY, amount: '',
  accountId: 'cash', toAccountId: 'meezan', fromAccountId: 'hbl',
  partyId: '', expenseAccountId: 'general',
  description: '', reference: '',
});

const TYPE_OPTIONS: { value: TxnType; label: string }[] = [
  { value: 'receipt', label: 'Money Received' },
  { value: 'payment', label: 'Money Paid' },
  { value: 'sale', label: 'Sales' },
  { value: 'purchase', label: 'Purchases' },
  { value: 'expense', label: 'Expense' },
  { value: 'deposit', label: 'Cash Deposit' },
  { value: 'withdrawal', label: 'Cash Withdrawal' },
  { value: 'transfer', label: 'Bank Transfer' },
];

const moneyAccounts = ACCOUNTS.filter((a) => a.isCash || a.isBank);
const bankAccountsOnly = ACCOUNTS.filter((a) => a.isBank);
const expenseAccounts = ACCOUNTS.filter((a) => a.type === 'expense');

const draftToTxn = (d: Draft): Omit<DemoTransaction, 'id' | 'status' | 'createdVia'> => ({
  date: d.date,
  type: d.type,
  mode: d.type === 'sale' || d.type === 'purchase' ? d.mode : d.type === 'expense' || d.type === 'receipt' || d.type === 'payment' ? d.mode : d.type === 'deposit' || d.type === 'withdrawal' || d.type === 'transfer' ? 'bank' : 'cash',
  amount: Number(d.amount),
  accountId: ['receipt', 'payment', 'sale', 'purchase', 'expense'].includes(d.type) ? (d.mode === 'credit' ? undefined : d.accountId) : d.type === 'deposit' ? 'cash' : undefined,
  toAccountId: ['deposit', 'transfer'].includes(d.type) ? d.toAccountId : undefined,
  fromAccountId: ['withdrawal', 'transfer'].includes(d.type) ? d.fromAccountId : undefined,
  partyId: ['receipt', 'payment'].includes(d.type) || d.mode === 'credit' ? d.partyId || undefined : undefined,
  expenseAccountId: d.type === 'expense' ? d.expenseAccountId : undefined,
  description: d.description.trim(),
  reference: d.reference.trim() || undefined,
});

export default function TransactionsPage() {
  const { transactions, addManualTransaction, navParam, toast } = useDemo();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TxnType>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(navParam ?? null);
  const [draft, setDraft] = useState<Draft>(freshDraft());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { if (navParam) setDetailId(navParam); }, [navParam]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...transactions]
      .reverse()
      .filter((t) => (typeFilter === 'all' || t.type === typeFilter))
      .filter((t) => (!from || t.date >= from) && (!to || t.date <= to))
      .filter((t) => {
        if (!q) return true;
        const party = partyById(t.partyId)?.name ?? '';
        return [t.id, t.description, t.reference ?? '', party].join(' ').toLowerCase().includes(q);
      });
  }, [transactions, search, typeFilter, from, to]);

  const totals = useMemo(() => {
    let inflow = 0, outflow = 0;
    for (const t of filtered) {
      if (t.type === 'receipt' || t.type === 'sale' || t.type === 'other_income') inflow += t.amount;
      if (t.type === 'payment' || t.type === 'purchase' || t.type === 'expense') outflow += t.amount;
    }
    return { inflow, outflow };
  }, [filtered]);

  const detail = detailId ? transactions.find((t) => t.id === detailId) ?? null : null;

  /* -------- form validation -------- */
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const amt = Number(draft.amount);
    if (!draft.amount || isNaN(amt) || amt <= 0) e.amount = 'Enter a positive amount.';
    if (!draft.date) e.date = 'Date is required.';
    if (draft.description.trim().length < 4) e.description = 'Description must be at least 4 characters.';
    const needsParty = ['receipt', 'payment'].includes(draft.type) || ((draft.type === 'sale' || draft.type === 'purchase') && draft.mode === 'credit');
    if (needsParty && !draft.partyId) e.partyId = 'Select a party.';
    if (draft.type === 'transfer' && draft.fromAccountId === draft.toAccountId) e.fromAccountId = 'Source and destination must differ.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) { toast('warning', 'Check the form', 'Some required fields need attention.'); return; }
    addManualTransaction(draftToTxn(draft));
    setAddOpen(false);
    setDraft(freshDraft());
    setErrors({});
  };

  /* -------- journal preview inside the form -------- */
  const previewLines = useMemo(() => {
    const amt = Number(draft.amount);
    if (!amt || amt <= 0) return null;
    try {
      const txn: DemoTransaction = {
        ...draftToTxn(draft),
        amount: amt,
        id: 'PREVIEW',
        status: 'posted',
        createdVia: 'manual',
      } as DemoTransaction;
      return journalLines(txn);
    } catch {
      return null;
    }
  }, [draft]);

  const showMode = draft.type === 'sale' || draft.type === 'purchase' || draft.type === 'receipt' || draft.type === 'payment';
  const partyOptions = (draft.type === 'sale' || draft.type === 'receipt')
    ? PARTIES.filter((p) => p.type === 'customer')
    : (draft.type === 'purchase' || draft.type === 'payment')
      ? PARTIES.filter((p) => p.type === 'supplier')
      : PARTIES;

  return (
    <div className="stack">
      <div className="flex-between">
        <div>
          <h2 style={{ fontSize: 20, color: 'var(--navy-800)', fontWeight: 800 }}>Transactions</h2>
          <p className="small muted">Demo ledger · {transactions.length} posted entries · double-entry balanced</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}><Icon name="plus" size={16} /> Add Transaction</button>
      </div>

      {/* Filters */}
      <div className="card card-pad" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: '1 1 220px' }}>
          <label htmlFor="txn-search">Search</label>
          <input id="txn-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Description, ID, reference or party…" />
        </div>
        <div className="field">
          <label htmlFor="txn-type">Type</label>
          <select id="txn-type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | TxnType)}>
            <option value="all">All types</option>
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            <option value="other_income">Other Income</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="txn-from">From</label>
          <input id="txn-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="txn-to">To</label>
          <input id="txn-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {(search || typeFilter !== 'all' || from || to) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setTypeFilter('all'); setFrom(''); setTo(''); }}>
            <Icon name="refresh" size={14} /> Clear
          </button>
        )}
      </div>

      <div className="flex-between small muted" style={{ padding: '0 2px' }}>
        <span><strong>{filtered.length}</strong> transaction(s) · Money in <strong style={{ color: 'var(--green)' }}>{fmtPKR(totals.inflow)}</strong> · Money out <strong style={{ color: 'var(--red)' }}>{fmtPKR(totals.outflow)}</strong></span>
        <span>Showing demo data only</span>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>ID</th><th>Date</th><th>Description</th><th>Party</th><th>Type</th><th>Account</th><th className="num">Amount</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td className="small">{t.id}</td>
                <td className="small">{fmtDate(t.date)}</td>
                <td style={{ whiteSpace: 'normal', minWidth: 230 }}>{t.description}</td>
                <td className="small">{partyById(t.partyId)?.name ?? '—'}</td>
                <td><span className="badge badge-neutral">{TXN_TYPE_LABEL[t.type]}</span></td>
                <td className="small">{moneyAccountLabel(t)}</td>
                <td className="num">{fmtPKR(t.amount)}</td>
                <td><button className="link-btn" onClick={() => setDetailId(t.id)}><Icon name="eye" size={13} /> Details</button></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8}><EmptyState icon="transactions" title="No transactions match" hint="Adjust the search or filters above. Demo data covers Jul–Nov 2026." /></td></tr>
            )}
          </tbody>
        </table>
        <div className="table-foot"><span>FY 2026–27 · PKR · Sorted newest first</span><span>Double-entry verified — debits equal credits on every posting</span></div>
      </div>

      {/* ============ Add Transaction modal ============ */}
      {addOpen && (
        <Modal title="Add Transaction — Demo" onClose={() => setAddOpen(false)} wide
          footer={<>
            <button className="btn btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}><Icon name="check" size={15} /> Post to Demo Ledger</button>
          </>}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="f-type">Transaction Type <span className="req">*</span></label>
              <select id="f-type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as TxnType, mode: ['sale', 'purchase'].includes(e.target.value) ? 'credit' : 'cash', partyId: '' })}>
                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-date">Date <span className="req">*</span></label>
              <input id="f-date" type="date" value={draft.date} max={DEMO_TODAY} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              {errors.date && <span className="field-error">{errors.date}</span>}
            </div>
            <div className="field">
              <label htmlFor="f-amount">Amount (PKR) <span className="req">*</span></label>
              <input id="f-amount" type="number" min={1} placeholder="e.g. 25000" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} autoFocus />
              {errors.amount && <span className="field-error">{errors.amount}</span>}
            </div>
            <div className="field">
              <label htmlFor="f-ref">Reference</label>
              <input id="f-ref" placeholder="e.g. INV-2026-0014" value={draft.reference} onChange={(e) => setDraft({ ...draft, reference: e.target.value })} />
            </div>

            {showMode && (
              <div className="field">
                <label htmlFor="f-mode">Settlement</label>
                <select id="f-mode" value={draft.mode} onChange={(e) => setDraft({ ...draft, mode: e.target.value as TxnMode })}>
                  {(draft.type === 'sale' || draft.type === 'purchase') && <option value="credit">On Credit (Party khata)</option>}
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Account</option>
                </select>
              </div>
            )}

            {showMode && draft.mode !== 'credit' && (
              <div className="field">
                <label htmlFor="f-acc">Account <span className="req">*</span></label>
                <select id="f-acc" value={draft.accountId} onChange={(e) => setDraft({ ...draft, accountId: e.target.value })}>
                  {moneyAccounts.filter((a) => a.type === 'asset').map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}

            {(['receipt', 'payment'].includes(draft.type) || draft.mode === 'credit') && (
              <div className="field">
                <label htmlFor="f-party">Party <span className="req">*</span></label>
                <select id="f-party" value={draft.partyId} onChange={(e) => setDraft({ ...draft, partyId: e.target.value })}>
                  <option value="">— Select party —</option>
                  {partyOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errors.partyId && <span className="field-error">{errors.partyId}</span>}
              </div>
            )}

            {draft.type === 'expense' && (
              <div className="field">
                <label htmlFor="f-exp">Expense Category <span className="req">*</span></label>
                <select id="f-exp" value={draft.expenseAccountId} onChange={(e) => setDraft({ ...draft, expenseAccountId: e.target.value })}>
                  {expenseAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}

            {draft.type === 'deposit' && (
              <div className="field">
                <label htmlFor="f-dep">Deposit Into <span className="req">*</span></label>
                <select id="f-dep" value={draft.toAccountId} onChange={(e) => setDraft({ ...draft, toAccountId: e.target.value })}>
                  {bankAccountsOnly.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
            {draft.type === 'withdrawal' && (
              <div className="field">
                <label htmlFor="f-wd">Withdraw From <span className="req">*</span></label>
                <select id="f-wd" value={draft.fromAccountId} onChange={(e) => setDraft({ ...draft, fromAccountId: e.target.value })}>
                  {bankAccountsOnly.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
            {draft.type === 'transfer' && (
              <>
                <div className="field">
                  <label htmlFor="f-from">From Account <span className="req">*</span></label>
                  <select id="f-from" value={draft.fromAccountId} onChange={(e) => setDraft({ ...draft, fromAccountId: e.target.value })}>
                    {bankAccountsOnly.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  {errors.fromAccountId && <span className="field-error">{errors.fromAccountId}</span>}
                </div>
                <div className="field">
                  <label htmlFor="f-to">To Account <span className="req">*</span></label>
                  <select id="f-to" value={draft.toAccountId} onChange={(e) => setDraft({ ...draft, toAccountId: e.target.value })}>
                    {bankAccountsOnly.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </>
            )}

            <div className="field full">
              <label htmlFor="f-desc">Description <span className="req">*</span></label>
              <input id="f-desc" placeholder="e.g. Payment received from Ahmed Enterprises" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              {errors.description && <span className="field-error">{errors.description}</span>}
            </div>
          </div>

          {/* Live journal preview */}
          {previewLines && (
            <div style={{ marginTop: 14 }}>
              <div className="small" style={{ fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Journal Impact Preview</div>
              <table className="report-table" style={{ border: '1px solid var(--border)', borderRadius: 8 }}>
                <thead><tr><th style={{ textAlign: 'left', padding: '7px 10px' }}>Account</th><th className="num" style={{ padding: '7px 10px' }}>Debit</th><th className="num" style={{ padding: '7px 10px' }}>Credit</th></tr></thead>
                <tbody>
                  {previewLines.map((l, i) => (
                    <tr key={i}>
                      <td>{accountById(l.accountId).name}{l.partyId ? ` · ${partyById(l.partyId)?.name}` : ''}</td>
                      <td className="num">{l.debit > 0 ? fmtPKR(l.debit) : '—'}</td>
                      <td className="num">{l.credit > 0 ? fmtPKR(l.credit) : '—'}</td>
                    </tr>
                  ))}
                  <tr className="total-row"><td>Totals</td><td className="num">{fmtPKR(previewLines.reduce((a, l) => a + l.debit, 0))}</td><td className="num">{fmtPKR(previewLines.reduce((a, l) => a + l.credit, 0))}</td></tr>
                </tbody>
              </table>
              <div className="small muted" style={{ marginTop: 5 }}>Balanced double-entry — debits will equal credits.</div>
            </div>
          )}
        </Modal>
      )}

      {/* ============ Detail modal ============ */}
      {detail && (
        <Modal title={`Transaction ${detail.id}`} onClose={() => setDetailId(null)}
          footer={<button className="btn btn-outline" onClick={() => setDetailId(null)}>Close</button>}>
          <div className="kv"><span>Date</span><strong>{fmtDate(detail.date)}</strong></div>
          <div className="kv"><span>Type</span><strong>{TXN_TYPE_LABEL[detail.type]}</strong></div>
          <div className="kv"><span>Description</span><strong style={{ textAlign: 'right' }}>{detail.description}</strong></div>
          <div className="kv"><span>Party</span><strong>{partyById(detail.partyId)?.name ?? '—'}</strong></div>
          <div className="kv"><span>Reference</span><strong>{detail.reference ?? '—'}</strong></div>
          <div className="kv"><span>Amount</span><strong>{fmtPKR(detail.amount)}</strong></div>
          <div className="kv"><span>Status</span><Badge tone="green">Posted</Badge></div>
          <div className="kv"><span>Created via</span><strong style={{ textTransform: 'capitalize' }}>{detail.createdVia === 'seed' ? 'Demo seed' : detail.createdVia}</strong></div>
          <div className="divider" />
          <div className="small" style={{ fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Ledger Impact</div>
          <table className="report-table" style={{ border: '1px solid var(--border)', borderRadius: 8 }}>
            <thead><tr><th style={{ textAlign: 'left', padding: '7px 10px' }}>Account</th><th className="num" style={{ padding: '7px 10px' }}>Debit</th><th className="num" style={{ padding: '7px 10px' }}>Credit</th></tr></thead>
            <tbody>
              {journalLines(detail).map((l, i) => (
                <tr key={i}>
                  <td>{accountById(l.accountId).name}{l.partyId ? ` · ${partyById(l.partyId)?.name}` : ''}</td>
                  <td className="num">{l.debit > 0 ? fmtPKR(l.debit) : ''}</td>
                  <td className="num">{l.credit > 0 ? fmtPKR(l.credit) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </div>
  );
}

function moneyAccountLabel(t: DemoTransaction): string {
  if (t.type === 'deposit') return `Cash → ${t.toAccountId ? accountById(t.toAccountId).name : 'Bank'}`;
  if (t.type === 'withdrawal') return `${t.fromAccountId ? accountById(t.fromAccountId).name : 'Bank'} → Cash`;
  if (t.type === 'transfer') return `${t.fromAccountId ? accountById(t.fromAccountId).name : 'HBL'} → ${t.toAccountId ? accountById(t.toAccountId).name : 'Meezan'}`;
  if (t.mode === 'credit') return 'Party khata (credit)';
  if (t.accountId) return accountById(t.accountId).name;
  return '—';
}
