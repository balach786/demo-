import { useMemo, useState } from 'react';
import { useDemo } from '../state/DemoContext';
import { Icon } from '../components/icons';
import { Modal, EmptyState } from '../components/common';
import { ACCOUNTS, TXN_TYPE_LABEL, accountBalance, journalLines } from '../data/demoData';
import { fmtDate, fmtPKR } from '../data/stats';
import type { TxnType } from '../data/types';

const banks = ACCOUNTS.filter((a) => a.isBank);

export default function BankAccountsPage() {
  const { transactions, addManualTransaction, toast } = useDemo();
  const [selected, setSelected] = useState<string>('hbl');
  const [opOpen, setOpOpen] = useState(false);
  const [opType, setOpType] = useState<TxnType>('transfer');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [otherBank, setOtherBank] = useState('meezan');

  const balances = useMemo(() => banks.map((b) => ({ bank: b, balance: accountBalance(b.id, transactions) })), [transactions]);
  const cashBalance = useMemo(() => accountBalance('cash', transactions), [transactions]);
  const totalBank = balances.reduce((a, b) => a + b.balance, 0);

  const selectedBank = banks.find((b) => b.id === selected)!;
  const recent = useMemo(
    () =>
      [...transactions]
        .filter((t) => journalLines(t).some((l) => l.accountId === selected))
        .slice(-9)
        .reverse(),
    [transactions, selected],
  );

  const submitOp = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast('warning', 'Amount required', 'Enter a positive amount.'); return; }
    const description = desc.trim() || (opType === 'transfer' ? 'Internal bank transfer' : opType === 'deposit' ? 'Cash deposited to bank' : 'Cash withdrawn from bank');
    if (opType === 'transfer' && otherBank === selected) { toast('warning', 'Same account', 'Source and destination must differ.'); return; }
    if (opType === 'transfer') {
      addManualTransaction({ date: '2026-11-06', type: 'transfer', mode: 'bank', amount: amt, fromAccountId: selected, toAccountId: otherBank, description, reference: `TRF-DEMO` });
    } else if (opType === 'deposit') {
      addManualTransaction({ date: '2026-11-06', type: 'deposit', mode: 'cash', amount: amt, accountId: 'cash', toAccountId: selected, description, reference: 'DEP-DEMO' });
    } else {
      addManualTransaction({ date: '2026-11-06', type: 'withdrawal', mode: 'bank', amount: amt, fromAccountId: selected, description, reference: 'WDL-DEMO' });
    }
    setOpOpen(false);
    setAmount(''); setDesc('');
  };

  return (
    <div className="stack">
      <div className="flex-between">
        <div>
          <h2 style={{ fontSize: 20, color: 'var(--navy-800)', fontWeight: 800 }}>Bank Accounts</h2>
          <p className="small muted">Simulated bank feeds — no real bank integration · balances live from the demo ledger</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpOpen(true)}><Icon name="plus" size={15} /> Demo Bank Transaction</button>
      </div>

      <div className="banner-warn">
        <Icon name="alert" size={16} />
        <span>Demo accounts only. Balances, account numbers and “bank connectivity” are illustrative. Production release will use a bank-aggregation/API partner with proper consent — explicit scope discussion required.</span>
      </div>

      {/* Account cards */}
      <div className="three-col" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {balances.map(({ bank, balance }) => (
          <button key={bank.id} className="bank-card" style={{ textAlign: 'left', outline: selected === bank.id ? '3px solid var(--teal)' : 'none', outlineOffset: 2 }} onClick={() => setSelected(bank.id)} aria-pressed={selected === bank.id}>
            <div className="chip" aria-hidden="true" />
            <div className="bank-name">{bank.bankName}</div>
            <div className="bank-bal">{fmtPKR(balance)}</div>
            <div className="small" style={{ color: '#c4d6ee' }}>{bank.accountTitle} · {bank.name}</div>
            <div className="bank-meta">{bank.accountNumber}</div>
          </button>
        ))}
        <div className="bank-card" style={{ background: 'linear-gradient(150deg, #3a2f16, #574417)' }}>
          <div className="chip" style={{ background: 'linear-gradient(150deg, #ffd97a, #d4a94e)' }} aria-hidden="true" />
          <div className="bank-name" style={{ color: '#ffd97a' }}>Main Cash Account</div>
          <div className="bank-bal">{fmtPKR(cashBalance)}</div>
          <div className="small" style={{ color: '#f0dfae' }}>Physical cash at head office</div>
          <div className="bank-meta">Account 1001 · Asset</div>
        </div>
      </div>

      <div className="flex-between small muted" style={{ padding: '0 2px' }}>
        <span>Total bank balance: <strong>{fmtPKR(totalBank)}</strong> · Cash: <strong>{fmtPKR(cashBalance)}</strong> · Combined liquidity: <strong>{fmtPKR(totalBank + cashBalance)}</strong></span>
        <span>Click a card to inspect its movements →</span>
      </div>

      {/* Movements of selected account */}
      <div className="card">
        <div className="card-pad" style={{ paddingBottom: 8 }}>
          <h3 style={{ fontSize: 13, color: 'var(--navy-800)' }}>Recent Movements — {selectedBank.name}</h3>
          <p className="small muted">Opening {fmtDate('2026-07-01')} · {fmtPKR(selectedBank.opening)}</p>
        </div>
        <div className="table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="data">
            <thead><tr><th>Date</th><th>Description</th><th>Type</th><th className="num">In</th><th className="num">Out</th></tr></thead>
            <tbody>
              {recent.map((t) => {
                const line = journalLines(t).find((l) => l.accountId === selected)!;
                return (
                  <tr key={t.id}>
                    <td className="small">{fmtDate(t.date)}</td>
                    <td style={{ whiteSpace: 'normal' }}>{t.description}</td>
                    <td><span className="badge badge-neutral">{TXN_TYPE_LABEL[t.type]}</span></td>
                    <td className="num">{line.debit > 0 ? fmtPKR(line.debit) : ''}</td>
                    <td className="num">{line.credit > 0 ? fmtPKR(line.credit) : ''}</td>
                  </tr>
                );
              })}
              {recent.length === 0 && <tr><td colSpan={5}><EmptyState icon="bank" title="No movements yet" hint="Bank activity will appear here." /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demo bank operation modal */}
      {opOpen && (
        <Modal title="Demo Bank Transaction" onClose={() => setOpOpen(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setOpOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitOp}><Icon name="check" size={15} /> Post to Demo Ledger</button>
          </>}>
          <div className="banner-info" style={{ marginBottom: 12 }}><Icon name="info" size={15} /><span>Simulated operation — posts a double-entry into the demo ledger only. No bank API is called.</span></div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="op-type">Operation</label>
              <select id="op-type" value={opType} onChange={(e) => setOpType(e.target.value as TxnType)}>
                <option value="transfer">Bank Transfer (between demo accounts)</option>
                <option value="deposit">Cash Deposit (Cash → this bank)</option>
                <option value="withdrawal">Cash Withdrawal (this bank → Cash)</option>
              </select>
            </div>
            {opType === 'transfer' && (
              <div className="field">
                <label htmlFor="op-other">To Account</label>
                <select id="op-other" value={otherBank} onChange={(e) => setOtherBank(e.target.value)}>
                  {banks.filter((b) => b.id !== selected).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            <div className="field">
              <label htmlFor="op-amount">Amount (PKR) <span className="req">*</span></label>
              <input id="op-amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 50000" autoFocus />
            </div>
            <div className="field full">
              <label htmlFor="op-desc">Description</label>
              <input id="op-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional narrative" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
