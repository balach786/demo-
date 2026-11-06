import { useMemo, useState } from 'react';
import { useDemo } from '../state/DemoContext';
import { Icon } from '../components/icons';
import { KpiCard } from '../components/common';
import { GroupedBars, ProfitLine, CashFlowBars, Donut, HBars } from '../components/charts';
import {
  DEMO_TODAY, PARTIES, partyBalance, TXN_TYPE_LABEL, ACCOUNTS,
} from '../data/demoData';
import {
  computeKpis, fmtDate, fmtPKR, monthlySeries, rangeBounds, type RangeKey,
} from '../data/stats';

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
];

export default function Dashboard() {
  const { transactions, go } = useDemo();
  const [range, setRange] = useState<RangeKey>('month');

  const bounds = rangeBounds(range, DEMO_TODAY);
  const k = useMemo(() => computeKpis(transactions, bounds.from, bounds.to), [transactions, bounds.from, bounds.to]);
  const fy = useMemo(() => computeKpis(transactions), [transactions]);
  const m = useMemo(() => monthlySeries(transactions), [transactions]);


  // Top customers by credit+cash sales (FY to date)
  const topCustomers = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== 'sale') continue;
      const key = t.partyId ? (PARTIES.find((p) => p.id === t.partyId)?.name ?? 'Customer') : 'Cash Sales';
      map.set(key, (map.get(key) ?? 0) + t.amount);
    }
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [transactions]);

  // Expense breakdown donut (FY to date)
  const expenseBreakdown = useMemo(() => {
    const colors = ['#2563EB', '#0E9F9F', '#F59E0B', '#7C5CD6', '#64748B'];
    return ACCOUNTS.filter((a) => a.type === 'expense')
      .map((a, i) => ({ label: a.name, value: transactions.filter((t) => t.type === 'expense' && t.expenseAccountId === a.id).reduce((s, t) => s + t.amount, 0), color: colors[i % colors.length] }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Outstanding: receivables (customers) + payables (suppliers)
  const outstanding = useMemo(() => {
    return PARTIES.map((p) => ({ party: p, balance: partyBalance(p.id, transactions) }))
      .filter((x) => Math.abs(x.balance) > 0)
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  }, [transactions]);

  const recent = useMemo(() => [...transactions].slice(-6).reverse(), [transactions]);
  const activities = useMemo(() => [...transactions].slice(-5).reverse(), [transactions]);

  const rangeLabel = RANGE_OPTIONS.find((r) => r.key === range)!.label;

  return (
    <div className="stack">
      {/* ===== Hero band ===== */}
      <div className="dash-hero">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="demo-pill" style={{ background: 'rgba(245,158,11,0.18)', borderColor: 'rgba(245,158,11,0.5)', color: '#fcd34d' }}>
              <span className="demo-dot" />LIVE DEMO
            </span>
            <span style={{ fontSize: 11, color: '#8fa6c4' }}>{fmtDate(DEMO_TODAY)} · {rangeLabel}</span>
          </div>
          <h1 style={{ marginTop: 10 }}>Good morning, Mr. Bilal —<br />here is your business at a glance.</h1>
          <p>All figures below are computed live from the shared demo ledger for <strong style={{ color: '#fff' }}>ABC Trading Company</strong>. They reconcile with the Accounting module and the Reports section.</p>
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><small>Total Liquidity</small><strong>{fmtPKR(fy.cash + fy.bank)}</strong></div>
          <div className="hero-stat"><small>FY Net Profit</small><strong>{fmtPKR(fy.netProfit)}</strong></div>
          <div className="hero-stat"><small>Receivable</small><strong>{fmtPKR(fy.receivable)}</strong></div>
        </div>
      </div>

      {/* ===== Range filter ===== */}
      <div className="flex-between">
        <div className="pill-group" role="tablist" aria-label="Date range">
          {RANGE_OPTIONS.map((r) => (
            <button key={r.key} className={`pill ${range === r.key ? 'active' : ''}`} onClick={() => setRange(r.key)} role="tab" aria-selected={range === r.key}>
              {r.label}
            </button>
          ))}
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => go('reports')}>
          <Icon name="reports" size={14} /> View Financial Reports
        </button>
      </div>

      {/* ===== KPI cards ===== */}
      <div className="kpi-grid">
        <KpiCard label="Total Cash Balance" value={fmtPKR(fy.cash)} delta="Main Cash Account — live" icon="bank" tone="amber" onClick={() => go('banks')} />
        <KpiCard label="Total Bank Balance" value={fmtPKR(fy.bank)} delta="HBL + Meezan accounts" icon="bank" tone="navy" onClick={() => go('banks')} />
        <KpiCard label="Total Sales" value={fmtPKR(k.sales)} delta={`${k.salesCount} sale(s) · ${rangeLabel}`} icon="arrow-up-right" tone="blue" onClick={() => go('reports', 'pnl')} />
        <KpiCard label="Total Purchases" value={fmtPKR(k.purchases)} delta={`${k.purchases > 0 ? 'Inventory stock-ins' : 'No purchases'} · ${rangeLabel}`} icon="transactions" tone="teal" onClick={() => go('reports')} />
        <KpiCard label="Total Expenses" value={fmtPKR(k.expenses)} delta={`Vouchers · ${rangeLabel}`} icon="expenses" tone="red" onClick={() => go('expenses-income')} />
        <KpiCard label="Net Profit" value={fmtPKR(k.netProfit)} delta={`Incl. other income · ${rangeLabel}`} icon="approvals" tone="green" onClick={() => go('reports', 'pnl')} />
        <KpiCard label="Accounts Receivable" value={fmtPKR(fy.receivable)} delta="Owed by customers" icon="parties" tone="blue" onClick={() => go('parties')} />
        <KpiCard label="Accounts Payable" value={fmtPKR(fy.payable)} delta="Owed to suppliers" icon="parties" tone="violet" onClick={() => go('parties', 'supplier')} />
        <KpiCard label="Total Inventory Value" value={fmtPKR(fy.inventoryValue)} delta="Perpetual demo valuation" icon="accounts" tone="teal" onClick={() => go('accounts')} />
      </div>

      {/* ===== Revenue vs Expenses + Monthly Profit ===== */}
      <div className="charts-grid">
        <div className="card card-pad">
          <div className="chart-title-row">
            <div><h3>Revenue vs Expenses</h3><span>Month-wise, FY 2026–27 to date (demo data)</span></div>
            <button className="link-btn" onClick={() => go('reports', 'pnl')}>Details <Icon name="arrow-right" size={12} /></button>
          </div>
          <GroupedBars labels={m.map((x) => x.label)} seriesA={m.map((x) => x.sales)} seriesB={m.map((x) => x.expenses)} nameA="Sales Revenue" nameB="Operating Expenses" height={215} />
        </div>
        <div className="card card-pad">
          <div className="chart-title-row">
            <div><h3>Monthly Profit</h3><span>Sales + other income − expenses</span></div>
            <button className="link-btn" onClick={() => go('reports', 'pnl')}>Details <Icon name="arrow-right" size={12} /></button>
          </div>
          <ProfitLine labels={m.map((x) => x.label)} values={m.map((x) => x.profit)} height={215} />
        </div>
      </div>

      {/* ===== Cash flow + Sales vs Purchases + Expense donut ===== */}
      <div className="charts-grid-3">
        <div className="card card-pad">
          <div className="chart-title-row">
            <div><h3>Cash Flow</h3><span>Money in vs out (cash &amp; bank)</span></div>
            <button className="link-btn" onClick={() => go('reports', 'cashflow')}>Details <Icon name="arrow-right" size={12} /></button>
          </div>
          <CashFlowBars labels={m.map((x) => x.label)} inflow={m.map((x) => x.cashIn)} outflow={m.map((x) => x.cashOut)} height={190} />
        </div>
        <div className="card card-pad">
          <div className="chart-title-row">
            <div><h3>Sales vs Purchases</h3><span>Trading volume comparison</span></div>
            <button className="link-btn" onClick={() => go('transactions')}>Details <Icon name="arrow-right" size={12} /></button>
          </div>
          <GroupedBars labels={m.map((x) => x.label)} seriesA={m.map((x) => x.sales)} seriesB={m.map((x) => x.purchases)} nameA="Sales" nameB="Purchases" height={190} />
        </div>
        <div className="card card-pad">
          <div className="chart-title-row">
            <div><h3>Expense Breakdown</h3><span>FY 2026–27 · by category</span></div>
            <button className="link-btn" onClick={() => go('expenses-income')}>Details <Icon name="arrow-right" size={12} /></button>
          </div>
          <Donut segments={expenseBreakdown} size={150} thickness={20} />
        </div>
      </div>

      {/* ===== Recent transactions + outstanding ===== */}
      <div className="two-col" style={{ gridTemplateColumns: '1.55fr 1fr' }}>
        <div className="card">
          <div className="card-pad" style={{ paddingBottom: 10 }}>
            <div className="chart-title-row" style={{ marginBottom: 2 }}>
              <div><h3>Recent Transactions</h3><span>Latest 6 · all channels feed the demo ledger</span></div>
              <button className="link-btn" onClick={() => go('transactions')}>View all <Icon name="arrow-right" size={12} /></button>
            </div>
          </div>
          <div className="table-wrap" style={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
            <table className="data">
              <thead><tr><th>ID</th><th>Date</th><th>Description</th><th>Type</th><th className="num">Amount</th></tr></thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t.id}>
                    <td className="small">{t.id}</td>
                    <td className="small">{fmtDate(t.date)}</td>
                    <td style={{ whiteSpace: 'normal', minWidth: 220 }}>{t.description}</td>
                    <td><span className="badge badge-neutral">{TXN_TYPE_LABEL[t.type]}</span></td>
                    <td className="num">{fmtPKR(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card card-pad">
          <div className="chart-title-row">
            <div><h3>Outstanding Payments</h3><span>Live from party balances</span></div>
            <button className="link-btn" onClick={() => go('parties')}>View all <Icon name="arrow-right" size={12} /></button>
          </div>
          <div className="stack" style={{ gap: 9, marginTop: 4 }}>
            {outstanding.map(({ party, balance }) => (
              <div key={party.id} style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #eef1f7', paddingBottom: 9 }}>
                <span className={`avatar ${party.type === 'customer' ? 'avatar-c' : 'avatar-s'}`}>{party.name.slice(0, 2).toUpperCase()}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy-800)' }}>{party.name}</div>
                  <div className="small muted">{party.type === 'customer' ? 'Receivable · customer' : 'Payable · supplier'}</div>
                </div>
                <div className="num" style={{ fontWeight: 800, color: balance >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {fmtPKR(Math.abs(balance))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Top customers + activities ===== */}
      <div className="two-col">
        <div className="card card-pad">
          <div className="chart-title-row">
            <div><h3>Top Customers</h3><span>By sales revenue · FY 2026–27</span></div>
            <button className="link-btn" onClick={() => go('parties')}>All parties <Icon name="arrow-right" size={12} /></button>
          </div>
          <HBars items={topCustomers} color="#2563EB" />
        </div>
        <div className="card card-pad">
          <div className="chart-title-row">
            <div><h3>Recent Business Activities</h3><span>Latest ledger events</span></div>
          </div>
          <div>
            {activities.map((t) => (
              <div className="activity-item" key={t.id}>
                <span className="a-dot"><Icon name="transactions" size={13} /></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11.5 }}>{TXN_TYPE_LABEL[t.type]} — {t.description}</div>
                  <small>{t.id} · {fmtDate(t.date)} · {fmtPKR(t.amount)}{t.reference ? ` · ${t.reference}` : ''}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
