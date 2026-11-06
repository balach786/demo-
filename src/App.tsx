import { useEffect, useMemo, useRef, useState } from 'react';
import { DemoProvider, useDemo } from './state/DemoContext';
import { Icon, type IconName } from './components/icons';
import { Toasts } from './components/common';
import { DEMO_BUSINESS, DEMO_FY, ACCOUNTS, PARTIES, TXN_TYPE_LABEL } from './data/demoData';
import { fmtDate, fmtPKR } from './data/stats';
import type { Page } from './data/types';

import Dashboard from './pages/Dashboard';
import AICommandCenter from './pages/AICommandCenter';
import TransactionsPage from './pages/Transactions';
import PartiesPage from './pages/Parties';
import AccountsPage from './pages/Accounts';
import LedgersPage from './pages/Ledgers';
import BankAccountsPage from './pages/BankAccounts';
import ExpensesIncomePage from './pages/ExpensesIncome';
import ReportsPage from './pages/Reports';
import DocumentsPage from './pages/Documents';
import ApprovalsPage from './pages/Approvals';
import SettingsPage from './pages/Settings';

interface NavItem { page: Page; label: string; icon: IconName; badgeKey?: 'approvals' }
const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Overview', items: [
    { page: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { page: 'ai', label: 'AI Command Center', icon: 'ai' },
  ]},
  { group: 'Accounting', items: [
    { page: 'transactions', label: 'Transactions', icon: 'transactions' },
    { page: 'parties', label: 'Parties', icon: 'parties' },
    { page: 'accounts', label: 'Chart of Accounts', icon: 'accounts' },
    { page: 'ledgers', label: 'Ledgers', icon: 'ledgers' },
    { page: 'banks', label: 'Bank Accounts', icon: 'bank' },
    { page: 'expenses-income', label: 'Expenses & Income', icon: 'expenses' },
  ]},
  { group: 'Intelligence', items: [
    { page: 'reports', label: 'Financial Reports', icon: 'reports' },
    { page: 'documents', label: 'Documents', icon: 'documents' },
    { page: 'approvals', label: 'Approvals', icon: 'approvals', badgeKey: 'approvals' },
  ]},
  { group: 'System', items: [
    { page: 'settings', label: 'Settings', icon: 'settings' },
  ]},
];

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Executive Dashboard',
  ai: 'AI Command Center',
  transactions: 'Transactions',
  parties: 'Parties',
  accounts: 'Chart of Accounts',
  ledgers: 'Ledgers',
  banks: 'Bank Accounts',
  'expenses-income': 'Expenses & Income',
  reports: 'Financial Reports',
  documents: 'Document Intelligence',
  approvals: 'Approvals',
  settings: 'Settings',
};

function Shell() {
  const { page, go, transactions, approvals } = useDemo();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  // Global search across parties, accounts, transactions
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: { label: string; sub: string; icon: IconName; action: () => void }[] = [];
    for (const p of PARTIES) {
      if (p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)) {
        out.push({ label: p.name, sub: `${p.type === 'customer' ? 'Customer' : 'Supplier'} · ${p.city}`, icon: 'parties', action: () => go('parties', p.id) });
      }
    }
    for (const a of ACCOUNTS) {
      if (a.name.toLowerCase().includes(q) || a.code.includes(q)) {
        out.push({ label: `${a.code} — ${a.name}`, sub: `Account · ${a.type}`, icon: 'accounts', action: () => go('accounts') });
      }
    }
    for (const t of [...transactions].reverse()) {
      if (out.length >= 12) break;
      if (
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.reference ?? '').toLowerCase().includes(q)
      ) {
        out.push({ label: t.description, sub: `${t.id} · ${fmtDate(t.date)} · ${fmtPKR(t.amount)}`, icon: 'transactions', action: () => go('transactions', t.id) });
      }
    }
    return out.slice(0, 12);
  }, [query, transactions, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        (searchRef.current?.querySelector('input') as HTMLInputElement | null)?.focus();
      } else if (e.key === 'Escape') {
        setSearchFocus(false);
        setNotifOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setSearchFocus(false);
      if (!notifRef.current?.contains(e.target as Node)) setNotifOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, []);

  const activities = useMemo(
    () => [...transactions].slice(-7).reverse().map((t) => ({ id: t.id, text: `${TXN_TYPE_LABEL[t.type]} — ${t.description}`, amount: t.amount, date: t.date })),
    [transactions],
  );

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'ai': return <AICommandCenter />;
      case 'transactions': return <TransactionsPage />;
      case 'parties': return <PartiesPage />;
      case 'accounts': return <AccountsPage />;
      case 'ledgers': return <LedgersPage />;
      case 'banks': return <BankAccountsPage />;
      case 'expenses-income': return <ExpensesIncomePage />;
      case 'reports': return <ReportsPage />;
      case 'documents': return <DocumentsPage />;
      case 'approvals': return <ApprovalsPage />;
      case 'settings': return <SettingsPage />;
    }
  };

  return (
    <div className="app-shell">
      {/* ============ Sidebar ============ */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Main navigation">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none">
              <rect x="6" y="6" width="36" height="36" rx="9" fill="rgba(255,255,255,0.18)" />
              <path d="M15 29l6.2-6.2 4.4 4.4L33 17" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="33" cy="17" r="2.6" fill="#5eead4" />
              <path d="M15 36h18" stroke="rgba(255,255,255,0.65)" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="brand-text">
            <h1>AI Business Secretary<br />&amp; Accountant</h1>
            <span>Your Intelligent Business Management Assistant</span>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((group) => (
            <div key={group.group}>
              <div className="nav-group">{group.group}</div>
              {group.items.map((item) => (
                <button
                  key={item.page}
                  className={`nav-item ${page === item.page ? 'active' : ''}`}
                  onClick={() => { go(item.page); setSidebarOpen(false); }}
                  aria-current={page === item.page ? 'page' : undefined}
                >
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                  {item.badgeKey === 'approvals' && pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="demo-card" role="note" aria-label="Demo mode notice">
          <div className="dc-top"><span className="demo-dot" /><span>DEMO MODE</span></div>
          <p>Fictional data · ABC Trading Company. No real bank, email or database connections. Safe to explore &amp; click everything.</p>
        </div>
        <div className="side-foot"><Icon name="guard" size={13} /> Demo build v1.0 · Presentation only</div>
      </aside>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,38,0.5)', zIndex: 35 }} />}

      {/* ============ Main column ============ */}
      <div className="main-col">
        <header className="topbar">
          <button className="icon-btn sidebar-toggle" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle sidebar">
            <Icon name="transactions" size={20} />
          </button>
          <div className="tb-biz">
            <strong>{DEMO_BUSINESS}</strong>
            <span>{PAGE_TITLES[page]} · {DEMO_FY}</span>
          </div>

          <div className="tb-search" ref={searchRef}>
            <Icon name="search" size={16} className="search-icon" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              placeholder="Search parties, transactions, accounts…"
              aria-label="Global search"
            />
            <kbd>Ctrl K</kbd>
            {searchFocus && results.length > 0 && (
              <div className="search-results" role="listbox">
                {results.map((r, i) => (
                  <button key={i} role="option" aria-selected="false" onClick={() => { r.action(); setQuery(''); setSearchFocus(false); }}>
                    <Icon name={r.icon} size={16} />
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
                    <small>{r.sub}</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="fy-pill">{DEMO_FY} · PKR</span>
          <span className="demo-pill"><span className="demo-dot" />DEMO MODE</span>

          <div ref={notifRef} style={{ position: 'relative' }}>
            <button className="icon-btn" onClick={() => setNotifOpen((v) => !v)} aria-label="Notifications" aria-expanded={notifOpen}>
              <Icon name="bell" size={20} />
              {activities.length > 0 && <span className="bell-dot" />}
            </button>
            {notifOpen && (
              <div className="notif-panel" role="dialog" aria-label="Recent business activities">
                <div className="notif-head">
                  <span>Recent Business Activities</span>
                  <button className="link-btn" onClick={() => { setNotifOpen(false); go('transactions'); }}>View all<Icon name="arrow-right" size={12} /></button>
                </div>
                {activities.map((a) => (
                  <div className="notif-item" key={a.id}>
                    <div className="n-ic"><Icon name="transactions" size={15} /></div>
                    <div><div>{a.text}</div><small>{a.id} · {fmtDate(a.date)} · {fmtPKR(a.amount)}</small></div>
                  </div>
                ))}
                <div className="notif-foot">Demo feed — generated from the shared demo dataset (not live banking).</div>
              </div>
            )}
          </div>
        </header>

        <main className="page-scroll" id="main-content">
          <div className="page-container">{renderPage()}</div>
        </main>
      </div>

      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <DemoProvider>
      <Shell />
    </DemoProvider>
  );
}
