import { useEffect, useMemo, useState } from 'react';
import { useDemo } from '../state/DemoContext';
import { Icon } from '../components/icons';
import { Modal, EmptyState, Badge } from '../components/common';
import { ACCOUNTS, PARTIES, partyById, accountById, TXN_TYPE_LABEL } from '../data/demoData';
import { fmtDate, fmtDateTime, fmtPKR } from '../data/stats';
import type { ApprovalAction, TransactionDraft } from '../data/types';

type Tab = 'pending' | 'completed' | 'rejected' | 'all';

export default function ApprovalsPage() {
  const { approvals, approveAction, rejectAction, updateDraft, toast, go } = useDemo();
  const [tab, setTab] = useState<Tab>('pending');
  const [editId, setEditId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editForm, setEditForm] = useState<TransactionDraft | null>(null);

  const counts = useMemo(() => ({
    pending: approvals.filter((a) => a.status === 'pending').length,
    completed: approvals.filter((a) => a.status === 'completed').length,
    rejected: approvals.filter((a) => a.status === 'rejected').length,
  }), [approvals]);

  const filtered = useMemo(
    () => approvals.filter((a) => (tab === 'all' ? true : a.status === tab)).slice().reverse(),
    [approvals, tab],
  );

  const editing = editId ? approvals.find((a) => a.id === editId) ?? null : null;

  useEffect(() => {
    if (editing) setEditForm({ ...editing.draft });
  }, [editing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = (a: ApprovalAction) => {
    setEditForm({ ...a.draft });
    setEditId(a.id);
  };

  const saveEdit = () => {
    if (!editing || !editForm) return;
    const amt = Number(editForm.amount);
    if (!amt || amt <= 0) { toast('warning', 'Invalid amount', 'Amount must be positive.'); return; }
    if (editForm.description.trim().length < 4) { toast('warning', 'Description too short', 'Give a meaningful description.'); return; }
    updateDraft(editing.id, { ...editForm, amount: amt, description: editForm.description.trim() });
    setEditId(null);
  };

  const doReject = () => {
    if (!rejectId) return;
    if (rejectReason.trim().length < 4) { toast('warning', 'Reason required', 'Tell the team why this draft is rejected (min 4 characters).'); return; }
    rejectAction(rejectId, rejectReason.trim());
    setRejectId(null);
    setRejectReason('');
    setTab('rejected'); // show the rejected card + reason, mirroring Approve → Completed tab
  };

  return (
    <div className="stack">
      <div className="flex-between">
        <div>
          <h2 style={{ fontSize: 20, color: 'var(--navy-800)', fontWeight: 800 }}>Approvals</h2>
          <p className="small muted">Every AI- or document-prepared action lands here as a <strong>Pending Approval</strong>. Approving posts a simulated entry to the demo ledger — never a real payment.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => go('ai')}><Icon name="ai" size={14} /> Ask AI to prepare another</button>
      </div>

      <div className="banner-info">
        <Icon name="guard" size={16} />
        <span><strong>Demo safety:</strong> approving an action performs a simulated posting inside your browser’s demo state (localStorage). No bank transfer, email, SMS or external system call is made. “Reset Demo Data” in Settings restores the seed dataset.</span>
      </div>

      <div className="pill-group" role="tablist" aria-label="Approval status">
        {([
          ['pending', `Pending (${counts.pending})`],
          ['completed', `Completed (${counts.completed})`],
          ['rejected', `Rejected (${counts.rejected})`],
          ['all', `All (${approvals.length})`],
        ] as [Tab, string][]).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`pill ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card"><EmptyState icon="approvals" title={tab === 'pending' ? 'Nothing waiting for approval' : 'No actions in this view yet'} hint="Ask the AI Command Center to “Prepare a payment of Rs. 25,000 to ABC Traders”, or prepare a draft from the Documents module." /></div>
      )}

      {filtered.map((a) => {
        const party = partyById(a.draft.partyId);
        const account = a.draft.accountId ? accountById(a.draft.accountId) : undefined;
        return (
          <div key={a.id} className={`approval-card ${a.status === 'completed' ? 'completed' : a.status === 'rejected' ? 'rejected' : ''}`}>
            <div className="approval-head">
              <Badge tone={a.status === 'pending' ? 'amber' : a.status === 'completed' ? 'green' : 'red'}>{a.status === 'pending' ? 'Pending Approval' : a.status}</Badge>
              <Badge tone={a.source === 'ai' ? 'blue' : a.source === 'document' ? 'teal' : 'neutral'}>{a.source === 'ai' ? 'AI Command' : a.source === 'document' ? 'Document' : 'Manual'}</Badge>
              <strong style={{ color: 'var(--navy-800)', fontSize: 13 }}>{a.title}</strong>
              <span className="small muted" style={{ marginLeft: 'auto' }}>{a.id} · {fmtDateTime(a.createdAt)}</span>
            </div>

            <div className="approval-meta">
              <div><small>Type</small><strong>{TXN_TYPE_LABEL[a.draft.type]}</strong></div>
              <div><small>Party</small><strong>{party?.name ?? '—'}</strong></div>
              <div><small>Amount</small><strong>{fmtPKR(a.draft.amount)}</strong></div>
              <div><small>{a.draft.mode === 'credit' ? 'Settlement' : 'From Account'}</small><strong>{a.draft.mode === 'credit' ? 'On credit (khata)' : account?.name ?? '—'}</strong></div>
              <div><small>Date</small><strong>{fmtDate(a.draft.date)}</strong></div>
              <div><small>Reference</small><strong>{a.draft.reference ?? '—'}</strong></div>
            </div>
            <div className="small" style={{ color: 'var(--text)' }}>{a.draft.description}</div>

            {a.status === 'completed' && a.resultTxnId && (
              <div className="banner-info" style={{ borderColor: '#bfe6cd', background: 'var(--green-soft)', color: '#166534' }}>
                <Icon name="check-circle" size={15} />
                <span><strong>Posted as {a.resultTxnId}.</strong> {a.resultAccountId && `${accountById(a.resultAccountId).name} is now ${fmtPKR(a.resultBalanceAfter ?? 0)}. `}The demo ledger, dashboard and reports have been updated.</span>
              </div>
            )}
            {a.status === 'rejected' && a.rejectReason && (
              <div className="banner-warn" style={{ background: 'var(--red-soft)', borderColor: '#f3b8b8', color: '#991b1b' }}>
                <Icon name="alert" size={15} />
                <span><strong>Rejected.</strong> Reason: {a.rejectReason}</span>
              </div>
            )}

            {a.status === 'pending' && (
              <div className="approval-actions">
                <button className="btn btn-success btn-sm" onClick={() => { approveAction(a.id); setTab('completed'); }}><Icon name="check" size={14} /> Approve</button>
                <button className="btn btn-outline btn-sm" onClick={() => startEdit(a)}><Icon name="edit" size={14} /> Edit Draft</button>
                <button className="btn btn-danger-outline btn-sm" onClick={() => setRejectId(a.id)}><Icon name="x" size={14} /> Reject</button>
              </div>
            )}
          </div>
        );
      })}

      {/* ===== Edit draft modal ===== */}
      {editing && editForm && (
        <Modal title={`Edit Draft — ${editing.id}`} onClose={() => setEditId(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setEditId(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEdit}><Icon name="check" size={14} /> Save Draft</button>
          </>}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="e-type">Type</label>
              <input id="e-type" value={TXN_TYPE_LABEL[editForm.type]} disabled />
            </div>
            <div className="field">
              <label htmlFor="e-date">Date</label>
              <input id="e-date" type="date" value={editForm.date} onChange={(ev) => setEditForm({ ...editForm, date: ev.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="e-amount">Amount (PKR)</label>
              <input id="e-amount" type="number" min={1} value={editForm.amount} onChange={(ev) => setEditForm({ ...editForm, amount: Number(ev.target.value) })} />
            </div>
            <div className="field">
              <label htmlFor="e-party">Party</label>
              <select id="e-party" value={editForm.partyId ?? ''} onChange={(ev) => setEditForm({ ...editForm, partyId: ev.target.value || undefined })}>
                <option value="">— None —</option>
                {PARTIES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="e-acc">From Account</label>
              <select id="e-acc" value={editForm.accountId ?? 'hbl'} disabled={editForm.mode === 'credit'} onChange={(ev) => setEditForm({ ...editForm, accountId: ev.target.value })}>
                {ACCOUNTS.filter((x) => x.isCash || x.isBank).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="e-ref">Reference</label>
              <input id="e-ref" value={editForm.reference ?? ''} onChange={(ev) => setEditForm({ ...editForm, reference: ev.target.value || undefined })} />
            </div>
            <div className="field full">
              <label htmlFor="e-desc">Description</label>
              <textarea id="e-desc" rows={2} value={editForm.description} onChange={(ev) => setEditForm({ ...editForm, description: ev.target.value })} />
            </div>
          </div>
        </Modal>
      )}

      {/* ===== Reject modal ===== */}
      {rejectId && (
        <Modal title="Reject Draft" onClose={() => setRejectId(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setRejectId(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={doReject}><Icon name="x" size={14} /> Reject Draft</button>
          </>}>
          <p className="small muted" style={{ marginBottom: 10 }}>Rejecting discards the draft — nothing is posted to the demo ledger.</p>
          <div className="field">
            <label htmlFor="rej-reason">Reason <span className="req">*</span></label>
            <textarea id="rej-reason" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Wrong party / amount too high / duplicate of INV…" autoFocus />
          </div>
        </Modal>
      )}
    </div>
  );
}
