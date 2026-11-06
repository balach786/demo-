import { useEffect, useMemo, useState } from 'react';
import { useDemo } from '../state/DemoContext';
import { Icon } from '../components/icons';
import { ACCOUNTS, PARTIES } from '../data/demoData';
import { accountLedger, fmtDate, fmtPKR, partyLedger } from '../data/stats';

export default function LedgersPage() {
  const { transactions, navParam, toast } = useDemo();
  const [tab, setTab] = useState<'party' | 'account'>('party');
  const [partyId, setPartyId] = useState(navParam && PARTIES.some((p) => p.id === navParam) ? navParam : PARTIES[0].id);
  const [accountId, setAccountId] = useState('cash');

  useEffect(() => {
    if (navParam && PARTIES.some((p) => p.id === navParam)) {
      setTab('party');
      setPartyId(navParam);
    }
  }, [navParam]);

  const party = useMemo(() => partyLedger(partyId, transactions), [partyId, transactions]);
  const acct = useMemo(() => accountLedger(accountId, transactions), [accountId, transactions]);
  const partyMeta = PARTIES.find((p) => p.id === partyId)!;
  const accountMeta = ACCOUNTS.find((a) => a.id === accountId)!;

  const active = tab === 'party' ? party : acct;
  const totalDebit = active.rows.reduce((a, r) => a + r.debit, 0);
  const totalCredit = active.rows.reduce((a, r) => a + r.credit, 0);

  const doPrint = () => {
    toast('info', 'Print preview', 'Use your browser’s print dialog — layout is print-optimised.');
    window.setTimeout(() => window.print(), 350);
  };

  const formatBal = (bal: number) =>
    tab === 'party'
      ? bal >= 0 ? `${fmtPKR(bal)} Dr` : `${fmtPKR(-bal)} Cr`
      : bal >= 0 ? `${fmtPKR(bal)} Dr` : `${fmtPKR(-bal)} Cr`;

  return (
    <div className="stack">
      <div className="flex-between no-print">
        <div>
          <h2 style={{ fontSize: 20, color: 'var(--navy-800)', fontWeight: 800 }}>Ledgers</h2>
          <p className="small muted">Party-wise (khata) and account-wise running balances — live from the demo journal</p>
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="pill-group" role="tablist" aria-label="Ledger type">
            <button className={`pill ${tab === 'party' ? 'active' : ''}`} onClick={() => setTab('party')} role="tab" aria-selected={tab === 'party'}>Party Ledger</button>
            <button className={`pill ${tab === 'account' ? 'active' : ''}`} onClick={() => setTab('account')} role="tab" aria-selected={tab === 'account'}>Account Ledger</button>
          </div>
          {tab === 'party' ? (
            <select value={partyId} onChange={(e) => setPartyId(e.target.value)} aria-label="Select party" style={{ height: 35, borderRadius: 8, border: '1px solid var(--border-strong)', padding: '0 10px', fontSize: 12 }}>
              {PARTIES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          ) : (
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} aria-label="Select account" style={{ height: 35, borderRadius: 8, border: '1px solid var(--border-strong)', padding: '0 10px', fontSize: 12 }}>
              {ACCOUNTS.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
            </select>
          )}
          <button className="btn btn-outline btn-sm" onClick={doPrint}><Icon name="printer" size={14} /> Print</button>
        </div>
      </div>

      {/* ===== Printed sheet ===== */}
      <div className="report-sheet">
        <div className="report-head">
          <h2>ABC Trading Company</h2>
          <p>{tab === 'party' ? `Party Ledger — ${partyMeta.name}` : `Account Ledger — ${accountMeta.code} · ${accountMeta.name}`}</p>
          <p>FY 2026–27 · 1 Jul 2026 to 6 Nov 2026 · Currency: PKR · <strong>Fictional demo statement</strong></p>
        </div>
        <div className="report-body">
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Date</th>
                <th style={{ textAlign: 'left' }}>Txn ID</th>
                <th style={{ textAlign: 'left' }}>Description</th>
                <th style={{ textAlign: 'left' }}>Ref</th>
                <th className="num">Debit</th>
                <th className="num">Credit</th>
                <th className="num">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} style={{ fontStyle: 'italic', color: 'var(--muted)' }}>Opening balance — 1 Jul 2026</td>
                <td className="num">{formatBal(active.opening)}</td>
              </tr>
              {active.rows.map((r, i) => (
                <tr key={i}>
                  <td>{fmtDate(r.date)}</td>
                  <td className="small">{r.txnId}</td>
                  <td style={{ whiteSpace: 'normal', maxWidth: 320 }}>{r.description}</td>
                  <td className="small">{r.reference ?? '—'}</td>
                  <td className="num">{r.debit > 0 ? fmtPKR(r.debit) : ''}</td>
                  <td className="num">{r.credit > 0 ? fmtPKR(r.credit) : ''}</td>
                  <td className="num">{formatBal(r.balance)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={4}>Closing balance · Totals</td>
                <td className="num">{fmtPKR(totalDebit)}</td>
                <td className="num">{fmtPKR(totalCredit)}</td>
                <td className="num">{formatBal(active.closing)}</td>
              </tr>
            </tbody>
          </table>
          <div className="report-note">
            {tab === 'party'
              ? `${partyMeta.name} — ${partyMeta.type === 'customer' ? 'Customer' : 'Supplier'} · ${partyMeta.contactPerson} · ${partyMeta.phone}. Positive (Dr) balances indicate amounts receivable from the party; negative (Cr) balances indicate amounts payable.`
              : `${accountMeta.name} is a ${accountMeta.type} account (${accountMeta.type === 'asset' || accountMeta.type === 'expense' ? 'debit' : 'credit'} nature). Running balance shown in debit-positive convention.`}
            {' '}Generated from the shared demo journal — includes demo-approved AI/document transactions. Not a real financial statement.
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="three-col">
        <div className="card card-pad"><div className="small muted">Opening (1 Jul 2026)</div><div style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy-800)' }}>{formatBal(active.opening)}</div></div>
        <div className="card card-pad"><div className="small muted">Movement ({active.rows.length} entries)</div><div style={{ fontSize: 19, fontWeight: 800, color: 'var(--teal-dark)' }}>{fmtPKR(totalDebit + totalCredit)}</div></div>
        <div className="card card-pad"><div className="small muted">Closing balance</div><div style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy-800)' }}>{formatBal(active.closing)}</div></div>
      </div>
    </div>
  );
}
