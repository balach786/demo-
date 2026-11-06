import { useMemo, useState } from 'react';
import { useDemo } from '../state/DemoContext';
import { Icon } from '../components/icons';
import { accountBalance, ACCOUNTS, DEMO_TODAY } from '../data/demoData';
import { fmtPKR } from '../data/stats';
import type { AccountType } from '../data/types';

const GROUPS: { type: AccountType; title: string; subtitle: string }[] = [
  { type: 'asset', title: 'Assets', subtitle: 'What the business owns' },
  { type: 'liability', title: 'Liabilities', subtitle: 'What the business owes' },
  { type: 'equity', title: 'Equity', subtitle: 'Owner’s stake & retained earnings' },
  { type: 'income', title: 'Income', subtitle: 'Revenue earned' },
  { type: 'expense', title: 'Expenses', subtitle: 'Operating costs' },
];

export default function AccountsPage() {
  const { transactions } = useDemo();
  const [filter, setFilter] = useState('');

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return ACCOUNTS.map((a) => ({ account: a, balance: accountBalance(a.id, transactions) }))
      .filter(({ account }) => !q || [account.code, account.name, account.description ?? ''].join(' ').toLowerCase().includes(q));
  }, [transactions, filter]);

  const totals = useMemo(() => {
    const t: Record<AccountType, number> = { asset: 0, liability: 0, equity: 0, income: 0, expense: 0 };
    for (const { account, balance } of rows) t[account.type] += Math.abs(balance) * (account.type === 'liability' || account.type === 'equity' || account.type === 'income' ? 1 : 1);
    return t;
  }, [rows]);

  return (
    <div className="stack">
      <div className="flex-between">
        <div>
          <h2 style={{ fontSize: 20, color: 'var(--navy-800)', fontWeight: 800 }}>Chart of Accounts</h2>
          <p className="small muted">FY 2026–27 · balances are live from the demo journal · as of {DEMO_TODAY}</p>
        </div>
        <div className="field" style={{ minWidth: 240 }}>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter accounts…" aria-label="Filter accounts" />
        </div>
      </div>

      <div className="banner-info">
        <Icon name="info" size={16} />
        <span>Demo chart — 17 accounts covering Assets, Liabilities, Equity, Income and Expenses. Balances below are computed live from the demo journal (opening + FY movements). Debit-nature accounts show positive balances; credit-nature accounts are shown in their natural (positive) form.</span>
      </div>

      {GROUPS.map((g) => {
        const groupRows = rows.filter((r) => r.account.type === g.type);
        if (groupRows.length === 0) return null;
        const isCreditNature = g.type === 'liability' || g.type === 'equity' || g.type === 'income';
        const groupTotal = groupRows.reduce((a, r) => a + (isCreditNature ? -r.balance : r.balance), 0);
        return (
          <div className="card" key={g.type} style={{ overflow: 'hidden' }}>
            <div className="flex-between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: '#fbfcfe' }}>
              <div>
                <strong style={{ color: 'var(--navy-800)', fontSize: 13 }}>{g.title}</strong>
                <span className="small muted" style={{ marginLeft: 10 }}>{g.subtitle}</span>
              </div>
              <strong style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--navy-800)' }}>{fmtPKR(groupTotal)}</strong>
            </div>
            <div className="table-wrap" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
              <table className="data">
                <thead><tr><th style={{ width: 70 }}>Code</th><th>Account Name</th><th>Nature</th><th className="num">Opening</th><th className="num">Current Balance</th></tr></thead>
                <tbody>
                  {groupRows.map(({ account, balance }) => {
                    const natural = isCreditNature ? -balance : balance;
                    const naturalOpening = isCreditNature ? -account.opening : account.opening;
                    return (
                      <tr key={account.id}>
                        <td className="small muted">{account.code}</td>
                        <td><strong style={{ color: 'var(--navy-800)' }}>{account.name}</strong>{account.description && <div className="small muted">{account.description}</div>}</td>
                        <td className="small muted">{isCreditNature ? 'Credit' : 'Debit'}</td>
                        <td className="num">{fmtPKR(naturalOpening)}</td>
                        <td className="num" style={{ fontWeight: 700 }}>{fmtPKR(natural)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <div className="flex-between small muted" style={{ padding: '0 2px' }}>
        <span>Totals — Assets: {fmtPKR(totals.asset)} · Liabilities: {fmtPKR(totals.liability)} · Equity: {fmtPKR(totals.equity)}</span>
        <span>See <button className="link-btn" style={{ display: 'inline' }} onClick={() => window.print()}><Icon name="printer" size={12} /> printable reports</button> via Financial Reports</span>
      </div>
    </div>
  );
}
