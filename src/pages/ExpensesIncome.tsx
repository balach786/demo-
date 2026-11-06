import { useMemo, useState } from 'react';
import { useDemo } from '../state/DemoContext';
import { HBars } from '../components/charts';
import { EmptyState } from '../components/common';
import { ACCOUNTS, TXN_TYPE_LABEL } from '../data/demoData';
import { fmtDate, fmtPKR, monthlySeries } from '../data/stats';

export default function ExpensesIncomePage() {
  const { transactions, go } = useDemo();
  const [monthFilter, setMonthFilter] = useState<string>('all');

  const expenseCategories = useMemo(
    () =>
      ACCOUNTS.filter((a) => a.type === 'expense').map((a) => ({
        label: a.name,
        value: transactions.filter((t) => t.type === 'expense' && t.expenseAccountId === a.id).reduce((s, t) => s + t.amount, 0),
      })).sort((a, b) => b.value - a.value),
    [transactions],
  );

  const totalExpenses = expenseCategories.reduce((a, c) => a + c.value, 0);
  const totalSales = transactions.filter((t) => t.type === 'sale').reduce((a, t) => a + t.amount, 0);
  const totalOtherIncome = transactions.filter((t) => t.type === 'other_income').reduce((a, t) => a + t.amount, 0);

  const m = useMemo(() => monthlySeries(transactions), [transactions]);

  const months = useMemo(() => ['all', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'], []);
  const monthLabel: Record<string, string> = { all: 'All FY', '2026-07': 'Jul 2026', '2026-08': 'Aug 2026', '2026-09': 'Sep 2026', '2026-10': 'Oct 2026', '2026-11': 'Nov 2026' };

  const rows = useMemo(
    () => [...transactions]
      .reverse()
      .filter((t) => t.type === 'expense' || t.type === 'other_income' || t.type === 'sale')
      .filter((t) => monthFilter === 'all' || t.date.startsWith(monthFilter)),
    [transactions, monthFilter],
  );

  return (
    <div className="stack">
      <div>
        <h2 style={{ fontSize: 20, color: 'var(--navy-800)', fontWeight: 800 }}>Expenses &amp; Income</h2>
        <p className="small muted">Category-wise analysis from the demo journal · FY 2026–27</p>
      </div>

      {/* Summary strip */}
      <div className="three-col">
        <div className="card card-pad" style={{ borderLeft: '4px solid var(--blue)' }}>
          <div className="small muted">Total Sales Revenue</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--blue-dark)', fontVariantNumeric: 'tabular-nums' }}>{fmtPKR(totalSales)}</div>
          <div className="small muted">{transactions.filter((t) => t.type === 'sale').length} sales invoices &amp; counter sales</div>
        </div>
        <div className="card card-pad" style={{ borderLeft: '4px solid var(--teal)' }}>
          <div className="small muted">Other Income</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--teal-dark)', fontVariantNumeric: 'tabular-nums' }}>{fmtPKR(totalOtherIncome)}</div>
          <div className="small muted">Bank profit &amp; miscellaneous</div>
        </div>
        <div className="card card-pad" style={{ borderLeft: '4px solid var(--red)' }}>
          <div className="small muted">Total Operating Expenses</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>{fmtPKR(totalExpenses)}</div>
          <div className="small muted">{transactions.filter((t) => t.type === 'expense').length} expense vouchers</div>
        </div>
      </div>

      <div className="two-col">
        {/* Expense categories */}
        <div className="card card-pad">
          <h3 style={{ fontSize: 13, color: 'var(--navy-800)', marginBottom: 12 }}>Expenses by Category — FY to date</h3>
          <HBars items={expenseCategories} color="#DC2626" />
          <div className="table-wrap" style={{ marginTop: 14, boxShadow: 'none' }}>
            <table className="data">
              <thead><tr><th>Category</th><th className="num">Amount</th><th className="num">% of Total</th></tr></thead>
              <tbody>
                {expenseCategories.map((c) => (
                  <tr key={c.label}><td>{c.label}</td><td className="num">{fmtPKR(c.value)}</td><td className="num">{totalExpenses > 0 ? ((c.value / totalExpenses) * 100).toFixed(1) : '0.0'}%</td></tr>
                ))}
                <tr><td><strong>Total</strong></td><td className="num"><strong>{fmtPKR(totalExpenses)}</strong></td><td className="num">100%</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Month-wise trend */}
        <div className="card card-pad">
          <h3 style={{ fontSize: 13, color: 'var(--navy-800)', marginBottom: 8 }}>Month-wise Expense &amp; Income Summary</h3>
          <table className="report-table">
            <thead><tr><th>Month</th><th className="num">Sales</th><th className="num">Other Income</th><th className="num">Expenses</th><th className="num">Net</th></tr></thead>
            <tbody>
              {m.map((x) => (
                <tr key={x.key}>
                  <td>{x.label}</td>
                  <td className="num">{fmtPKR(x.sales)}</td>
                  <td className="num">{fmtPKR(x.otherIncome)}</td>
                  <td className="num">{fmtPKR(x.expenses)}</td>
                  <td className="num" style={{ color: x.profit >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{fmtPKR(x.profit)}</td>
                </tr>
              ))}
              <tr className="total-row"><td>FY 2026–27</td><td className="num">{fmtPKR(m.reduce((a, x) => a + x.sales, 0))}</td><td className="num">{fmtPKR(m.reduce((a, x) => a + x.otherIncome, 0))}</td><td className="num">{fmtPKR(m.reduce((a, x) => a + x.expenses, 0))}</td><td className="num">{fmtPKR(m.reduce((a, x) => a + x.profit, 0))}</td></tr>
            </tbody>
          </table>
          <div className="divider" />
          <div className="flex-between">
            <span className="small muted">Need the full picture?</span>
            <button className="btn btn-outline btn-sm" onClick={() => go('reports', 'pnl')}>Open Profit &amp; Loss</button>
          </div>
        </div>
      </div>

      {/* Vouchers list */}
      <div className="card">
        <div className="flex-between card-pad" style={{ paddingBottom: 10 }}>
          <h3 style={{ fontSize: 13, color: 'var(--navy-800)' }}>Income &amp; Expense Vouchers</h3>
          <div className="pill-group" role="tablist" aria-label="Month filter">
            {months.map((k) => <button key={k} className={`pill ${monthFilter === k ? 'active' : ''}`} onClick={() => setMonthFilter(k)}>{monthLabel[k]}</button>)}
          </div>
        </div>
        <div className="table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="data">
            <thead><tr><th>Date</th><th>Voucher</th><th>Description</th><th>Type</th><th className="num">Amount</th></tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="small">{fmtDate(t.date)}</td>
                  <td className="small">{t.id}</td>
                  <td style={{ whiteSpace: 'normal' }}>{t.description}</td>
                  <td><span className={`badge ${t.type === 'sale' ? 'badge-blue' : t.type === 'other_income' ? 'badge-teal' : 'badge-amber'}`}>{TXN_TYPE_LABEL[t.type]}</span></td>
                  <td className="num">{fmtPKR(t.amount)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5}><EmptyState icon="expenses" title="Nothing in this month" hint="Pick another month — Nov 2026 has data through 6 Nov." /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
