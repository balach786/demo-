import { useEffect, useMemo, useState } from 'react';
import { useDemo } from '../state/DemoContext';
import { Icon } from '../components/icons';
import { EmptyState, Badge } from '../components/common';
import { PARTIES, TXN_TYPE_LABEL, partyBalance } from '../data/demoData';
import { fmtDate, fmtPKR } from '../data/stats';
import type { Party } from '../data/types';

export default function PartiesPage() {
  const { transactions, go, navParam, toast } = useDemo();
  const [tab, setTab] = useState<'all' | 'customer' | 'supplier'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(navParam && navParam !== 'supplier' ? navParam : PARTIES[0].id);

  useEffect(() => {
    if (navParam === 'supplier') setTab('supplier');
    else if (navParam && PARTIES.some((p) => p.id === navParam)) setSelectedId(navParam);
  }, [navParam]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PARTIES.filter((p) => (tab === 'all' || p.type === tab))
      .filter((p) => !q || [p.name, p.city, p.contactPerson, p.phone].join(' ').toLowerCase().includes(q));
  }, [tab, search]);

  const selected: Party = PARTIES.find((p) => p.id === selectedId) ?? PARTIES[0];
  const balance = partyBalance(selected.id, transactions);

  const stats = useMemo(() => {
    const mine = transactions.filter((t) => t.partyId === selected.id);
    const sum = (pred: (t: typeof mine[number]) => boolean) => mine.filter(pred).reduce((a, t) => a + t.amount, 0);
    return {
      totalSales: sum((t) => t.type === 'sale'),
      totalPurchases: sum((t) => t.type === 'purchase'),
      totalReceipts: sum((t) => t.type === 'receipt'),
      totalPayments: sum((t) => t.type === 'payment'),
      txnCount: mine.length,
    };
  }, [transactions, selected.id]);

  const ledger = useMemo(
    () => transactions.filter((t) => t.partyId === selected.id).slice(-6).reverse(),
    [transactions, selected.id],
  );

  return (
    <div className="stack">
      <div className="flex-between">
        <div>
          <h2 style={{ fontSize: 20, color: 'var(--navy-800)', fontWeight: 800 }}>Parties</h2>
          <p className="small muted">Customers &amp; suppliers · fictional demo contacts · opening balances carried into the demo ledger</p>
        </div>
        <button className="btn btn-outline" onClick={() => toast('info', 'Demo limitation', 'New party creation is intentionally disabled in the client demo. Seed data covers 3 customers and 3 suppliers.')}>
          <Icon name="plus" size={15} /> Add Party
        </button>
      </div>

      <div className="party-detail-grid">
        {/* ===== List panel ===== */}
        <div className="card" style={{ overflow: 'hidden', alignSelf: 'start' }}>
          <div className="card-pad" style={{ paddingBottom: 10 }}>
            <div className="pill-group" style={{ marginBottom: 10 }}>
              {([['all', 'All'], ['customer', 'Customers'], ['supplier', 'Suppliers']] as const).map(([k, l]) => (
                <button key={k} className={`pill ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
              ))}
            </div>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search party…" aria-label="Search parties"
              style={{ width: '100%', height: 35, border: '1px solid var(--border-strong)', borderRadius: 8, padding: '0 11px', fontSize: 12 }} />
          </div>
          <div style={{ maxHeight: 560, overflowY: 'auto' }}>
            {filtered.map((p) => {
              const bal = partyBalance(p.id, transactions);
              const active = p.id === selected.id;
              return (
                <button key={p.id} className="party-row-btn" onClick={() => setSelectedId(p.id)}
                  style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', textAlign: 'left', padding: '11px 14px', borderBottom: '1px solid #eef1f7', background: active ? 'var(--blue-soft)' : 'transparent', borderLeft: active ? '3px solid var(--blue)' : '3px solid transparent' }}>
                  <span className={`avatar ${p.type === 'customer' ? 'avatar-c' : 'avatar-s'}`}>{p.name.slice(0, 2).toUpperCase()}</span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy-800)' }}>{p.name}</span>
                    <span className="small muted">{p.city} · {p.type === 'customer' ? 'Customer' : 'Supplier'}</span>
                  </span>
                  <span className="small" style={{ fontWeight: 800, color: bal >= 0 ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap' }}>{fmtPKR(Math.abs(bal))}</span>
                </button>
              );
            })}
            {filtered.length === 0 && <EmptyState icon="parties" title="No parties found" hint="Clear the search or switch tabs." />}
          </div>
        </div>

        {/* ===== Detail panel ===== */}
        <div className="stack" style={{ gap: 16 }}>
          <div className="card card-pad">
            <div className="flex-between" style={{ alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
                <span className={`avatar ${selected.type === 'customer' ? 'avatar-c' : 'avatar-s'}`} style={{ width: 54, height: 54, fontSize: 16, borderRadius: 14 }}>{selected.name.slice(0, 2).toUpperCase()}</span>
                <div>
                  <h3 style={{ fontSize: 17, color: 'var(--navy-800)' }}>{selected.name}</h3>
                  <div className="small muted">{selected.contactPerson} · {selected.phone}</div>
                  <div style={{ marginTop: 5 }}><Badge tone={selected.type === 'customer' ? 'blue' : 'teal'}>{selected.type === 'customer' ? 'Customer' : 'Supplier'}</Badge></div>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => go('ledgers', selected.id)}><Icon name="ledgers" size={14} /> Open Ledger</button>
            </div>
            <div className="party-balance-box" style={{ marginTop: 14 }}>
              <small>{balance >= 0 ? 'Receivable from party' : 'Payable to party'} · FY 2026–27</small>
              <div className="big">{fmtPKR(Math.abs(balance))}</div>
              {selected.creditLimit && <div className="small" style={{ color: '#8fa6c4', marginTop: 3 }}>Credit limit: {fmtPKR(selected.creditLimit)} · Utilisation: {Math.round((Math.max(0, balance) / selected.creditLimit) * 100)}%</div>}
            </div>
            <div className="kv"><span>Address</span><strong style={{ textAlign: 'right' }}>{selected.address}</strong></div>
            <div className="kv"><span>Opening balance</span><strong>{fmtPKR(Math.abs(selected.opening))} {selected.opening >= 0 ? '(Dr)' : '(Cr)'}</strong></div>
            <div className="kv"><span>FY transactions</span><strong>{stats.txnCount}</strong></div>
          </div>

          {/* FY activity stats */}
          <div className="three-col" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {(selected.type === 'customer'
              ? [['Total Sales', stats.totalSales, 'var(--blue)'], ['Receipts Received', stats.totalReceipts, 'var(--green)'], ['Net Outstanding', Math.max(0, balance), 'var(--amber)'], ['Avg. Deal Size', stats.txnCount ? Math.round(stats.totalSales / Math.max(1, ledgerSaleCount(transactions, selected.id))) : 0, 'var(--violet)']]
              : [['Total Purchases', stats.totalPurchases, 'var(--teal)'], ['Payments Made', stats.totalPayments, 'var(--green)'], ['Net Outstanding', Math.max(0, -balance), 'var(--red)'], ['Avg. Bill Size', stats.txnCount ? Math.round(stats.totalPurchases / Math.max(1, ledgerSaleCount(transactions, selected.id, 'purchase'))) : 0, 'var(--violet)']]
            ).map(([l, v, c]) => (
              <div key={l as string} className="card card-pad" style={{ padding: '12px 14px' }}>
                <div className="small muted" style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: 700 }}>{l as string}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: c as string, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{fmtPKR(v as number)}</div>
              </div>
            ))}
          </div>

          {/* Recent ledger lines */}
          <div className="card">
            <div className="card-pad" style={{ paddingBottom: 8 }}>
              <h3 style={{ fontSize: 13, color: 'var(--navy-800)' }}>Recent Ledger Activity — {selected.name}</h3>
            </div>
            <div className="table-wrap" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="data">
                <thead><tr><th>Date</th><th>Description</th><th>Type</th><th className="num">Amount</th></tr></thead>
                <tbody>
                  {ledger.map((t) => (
                    <tr key={t.id}>
                      <td className="small">{fmtDate(t.date)}</td>
                      <td style={{ whiteSpace: 'normal' }}>{t.description}</td>
                      <td><span className="badge badge-neutral">{TXN_TYPE_LABEL[t.type]}</span></td>
                      <td className="num">{fmtPKR(t.amount)}</td>
                    </tr>
                  ))}
                  {ledger.length === 0 && <tr><td colSpan={4}><EmptyState icon="ledgers" title="No entries yet" hint="Transactions involving this party will appear here." /></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ledgerSaleCount(transactions: { partyId?: string; type: string }[], partyId: string, type: 'sale' | 'purchase' = 'sale'): number {
  return transactions.filter((t) => t.partyId === partyId && t.type === type).length;
}
