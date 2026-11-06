import { Fragment, useEffect, useMemo, useState } from 'react';
import { useDemo } from '../state/DemoContext';
import { Icon } from '../components/icons';
import { DEMO_TODAY, PARTIES, ACCOUNTS } from '../data/demoData';
import {
  balanceSheet, cashFlow, fmtDate, fmtPKR, profitAndLoss, trialBalance, accountLedger, partyLedger,
} from '../data/stats';

type ReportTab = 'pnl' | 'cashflow' | 'trial' | 'balancesheet' | 'partyledger' | 'accountledger';

const TABS: { key: ReportTab; label: string }[] = [
  { key: 'pnl', label: 'Profit & Loss' },
  { key: 'cashflow', label: 'Cash Flow' },
  { key: 'trial', label: 'Trial Balance' },
  { key: 'balancesheet', label: 'Balance Sheet' },
  { key: 'partyledger', label: 'Party Ledger' },
  { key: 'accountledger', label: 'Account Ledger' },
];

export default function ReportsPage() {
  const { transactions, navParam, toast } = useDemo();
  const [tab, setTab] = useState<ReportTab>(navParam === 'cashflow' || navParam === 'pnl' ? navParam : 'pnl');
  const [from, setFrom] = useState('2026-07-01');
  const [to, setTo] = useState(DEMO_TODAY);
  const [partyId, setPartyId] = useState(PARTIES[0].id);
  const [accountId, setAccountId] = useState('cash');

  useEffect(() => {
    if (navParam === 'pnl' || navParam === 'cashflow') setTab(navParam);
  }, [navParam]);

  const pnl = useMemo(() => profitAndLoss(transactions, from, to), [transactions, from, to]);
  const cf = useMemo(() => cashFlow(transactions, from, to), [transactions, from, to]);
  const tb = useMemo(() => trialBalance(transactions, to), [transactions, to]);
  const bs = useMemo(() => balanceSheet(transactions, to), [transactions, to]);
  const pl = useMemo(() => partyLedger(partyId, transactions), [partyId, transactions]);
  const al = useMemo(() => accountLedger(accountId, transactions), [accountId, transactions]);

  const print = () => {
    toast('info', 'Print preview', 'Sending the printable statement to your browser print dialog.');
    window.setTimeout(() => window.print(), 350);
  };

  const showsDateRange = tab === 'pnl' || tab === 'cashflow';
  const showsAsOf = tab === 'trial' || tab === 'balancesheet';

  return (
    <div className="stack">
      <div className="flex-between no-print">
        <div>
          <h2 style={{ fontSize: 20, color: 'var(--navy-800)', fontWeight: 800 }}>Financial Reports</h2>
          <p className="small muted">Computed live from the shared demo journal · printable statements · FY 2026–27</p>
        </div>
        <button className="btn btn-primary" onClick={print}><Icon name="printer" size={15} /> Print / Save PDF</button>
      </div>

      <div className="report-tabs no-print" role="tablist" aria-label="Report type">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={`report-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* Controls */}
      {(showsDateRange || showsAsOf) && (
        <div className="card card-pad no-print" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {showsDateRange && (
            <>
              <div className="field"><label htmlFor="r-from">From</label><input id="r-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <div className="field"><label htmlFor="r-to">To</label><input id="r-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setFrom('2026-07-01'); setTo(DEMO_TODAY); }}><Icon name="refresh" size={13} /> FY to date</button>
            </>
          )}
          {showsAsOf && (
            <div className="field"><label htmlFor="r-asof">As of</label><input id="r-asof" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          )}
        </div>
      )}
      {tab === 'partyledger' && (
        <div className="field no-print" style={{ maxWidth: 340 }}>
          <label htmlFor="r-party">Party</label>
          <select id="r-party" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
            {PARTIES.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
          </select>
        </div>
      )}
      {tab === 'accountledger' && (
        <div className="field no-print" style={{ maxWidth: 340 }}>
          <label htmlFor="r-acct">Account</label>
          <select id="r-acct" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {ACCOUNTS.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
          </select>
        </div>
      )}

      {/* ================= PROFIT & LOSS ================= */}
      {tab === 'pnl' && (
        <div className="report-sheet">
          <div className="report-head">
            <h2>ABC Trading Company</h2>
            <p>Profit &amp; Loss Statement</p>
            <p>{fmtDate(from)} to {fmtDate(to)} · Currency: PKR · Unaudited demo figures</p>
          </div>
          <div className="report-body">
            <table className="report-table">
              <tbody>
                <tr className="section"><td colSpan={2}>Income</td></tr>
                {pnl.income.map((r) => <tr key={r.name}><td>{r.name}</td><td className="num">{fmtPKR(r.amount)}</td></tr>)}
                <tr className="total-row"><td>Total Income</td><td className="num">{fmtPKR(pnl.totalIncome)}</td></tr>
                <tr className="section"><td colSpan={2}>Operating Expenses</td></tr>
                {pnl.expense.map((r) => <tr key={r.name}><td>{r.name}</td><td className="num">{fmtPKR(r.amount)}</td></tr>)}
                <tr className="total-row"><td>Total Expenses</td><td className="num">{fmtPKR(pnl.totalExpenses)}</td></tr>
                <tr className="total-row" style={{ background: 'var(--green-soft)' }}><td>NET PROFIT / (LOSS) for the period</td><td className="num">{fmtPKR(pnl.netProfit)}</td></tr>
              </tbody>
            </table>
            <div className="report-note">Demo P&amp;L prepared on revenue−expense basis. Cost of goods sold is not allocated because the demo tracks inventory at cost (purchases capitalised to Inventory). Figures are fictional and unaudited; not for statutory, tax or lender submission.</div>
          </div>
        </div>
      )}

      {/* ================= CASH FLOW ================= */}
      {tab === 'cashflow' && (
        <div className="report-sheet">
          <div className="report-head">
            <h2>ABC Trading Company</h2>
            <p>Cash Flow Statement (Direct Method)</p>
            <p>{fmtDate(from)} to {fmtDate(to)} · Currency: PKR</p>
          </div>
          <div className="report-body">
            <table className="report-table">
              <tbody>
                <tr><td>Opening cash &amp; bank balance</td><td className="num">{fmtPKR(cf.openingCash)}</td></tr>
                {[cf.operating, cf.investing, cf.financing].map((sec) => (
                  <Fragment key={sec.name}>
                    <tr className="section"><td colSpan={2}>{sec.name}</td></tr>
                    {sec.lines.map((l, i) => <tr key={i}><td style={{ paddingLeft: 22 }}>{l.name}</td><td className="num">{fmtPKR(l.amount)}</td></tr>)}
                    <tr className="total-row"><td>Net cash from {sec.name.replace(' Activities', '').toLowerCase()} activities</td><td className="num">{fmtPKR(sec.total)}</td></tr>
                  </Fragment>
                ))}
                <tr className="total-row" style={{ background: 'var(--blue-soft)' }}><td>NET CHANGE IN CASH &amp; EQUIVALENTS</td><td className="num">{fmtPKR(cf.netChange)}</td></tr>
                <tr className="total-row" style={{ background: 'var(--teal-soft)' }}><td>CLOSING cash &amp; bank balance</td><td className="num">{fmtPKR(cf.closingCash)}</td></tr>
              </tbody>
            </table>
            <div className="report-note">Internal movements (cash deposits, withdrawals, inter-bank transfers) are excluded to avoid double counting. “Cash sales” and “receipts from customers” are operating inflows; supplier payments, salaries and other expense settlements are operating outflows. Investing/financing sections are empty because the demo period contains no such activity. Closing should equal dashboard liquidity for the same as-of date.</div>
          </div>
        </div>
      )}

      {/* ================= TRIAL BALANCE ================= */}
      {tab === 'trial' && (
        <div className="report-sheet">
          <div className="report-head">
            <h2>ABC Trading Company</h2>
            <p>Trial Balance · As of {fmtDate(to)}</p>
            <span className="balance-check"><Icon name="check-circle" size={13} />{tb.balanced ? 'BALANCED — TOTAL DEBITS = TOTAL CREDITS' : 'OUT OF BALANCE — INVESTIGATE'}</span>
          </div>
          <div className="report-body">
            <table className="report-table">
              <thead><tr><th>Code</th><th>Account</th><th>Type</th><th className="num">Debit (Rs)</th><th className="num">Credit (Rs)</th></tr></thead>
              <tbody>
                {tb.rows.map((r) => (
                  <tr key={r.code}><td>{r.code}</td><td>{r.name}</td><td style={{ textTransform: 'capitalize' }}>{r.type}</td><td className="num">{r.debit > 0 ? fmtPKR(r.debit) : ''}</td><td className="num">{r.credit > 0 ? fmtPKR(r.credit) : ''}</td></tr>
                ))}
                <tr className="total-row"><td colSpan={3}>TOTALS</td><td className="num">{fmtPKR(tb.totalDebit)}</td><td className="num">{fmtPKR(tb.totalCredit)}</td></tr>
              </tbody>
            </table>
            <div className="report-note">Trial balance proves arithmetic equality of the double-entry journal; it does not prove completeness or correctness of classification. Demo figures only.</div>
          </div>
        </div>
      )}

      {/* ================= BALANCE SHEET ================= */}
      {tab === 'balancesheet' && (
        <div className="report-sheet">
          <div className="report-head">
            <h2>ABC Trading Company</h2>
            <p>Statement of Financial Position · As of {fmtDate(to)}</p>
            <span className="balance-check"><Icon name="check-circle" size={13} />{bs.balanced ? 'ASSETS = LIABILITIES + EQUITY ✓' : 'DOES NOT BALANCE — INVESTIGATE'}</span>
          </div>
          <div className="report-body">
            <table className="report-table">
              <tbody>
                <tr className="section"><td colSpan={2}>Assets</td></tr>
                {bs.assets.map((r) => <tr key={r.name}><td>{r.name}</td><td className="num">{fmtPKR(r.amount)}</td></tr>)}
                <tr className="total-row"><td>Total Assets</td><td className="num">{fmtPKR(bs.totalAssets)}</td></tr>
                <tr className="section"><td colSpan={2}>Liabilities</td></tr>
                {bs.liabilities.map((r) => <tr key={r.name}><td>{r.name}</td><td className="num">{fmtPKR(r.amount)}</td></tr>)}
                <tr className="total-row"><td>Total Liabilities</td><td className="num">{fmtPKR(bs.totalLiabilities)}</td></tr>
                <tr className="section"><td colSpan={2}>Equity</td></tr>
                {bs.equity.map((r) => <tr key={r.name}><td>{r.name}</td><td className="num">{fmtPKR(r.amount)}</td></tr>)}
                <tr className="total-row"><td>Total Equity</td><td className="num">{fmtPKR(bs.totalEquity)}</td></tr>
                <tr className="total-row" style={{ background: 'var(--blue-soft)' }}><td>LIABILITIES + EQUITY</td><td className="num">{fmtPKR(bs.totalLiabilities + bs.totalEquity)}</td></tr>
              </tbody>
            </table>
            <div className="report-note">Balance sheet is shown only because the demo books balance: Assets = Liabilities + Equity (including current-year earnings). Fictional, unaudited demo figures — not for statutory filing or loan applications.</div>
          </div>
        </div>
      )}

      {/* ================= PARTY LEDGER ================= */}
      {tab === 'partyledger' && (
        <div className="report-sheet">
          <div className="report-head">
            <h2>ABC Trading Company</h2>
            <p>Party Ledger — {PARTIES.find((p) => p.id === partyId)?.name}</p>
            <p>FY 2026–27 to {fmtDate(DEMO_TODAY)} · PKR</p>
          </div>
          <div className="report-body">
            <table className="report-table">
              <thead><tr><th>Date</th><th>Description</th><th>Ref</th><th className="num">Debit</th><th className="num">Credit</th><th className="num">Balance</th></tr></thead>
              <tbody>
                <tr><td colSpan={5} style={{ fontStyle: 'italic', color: 'var(--muted)' }}>Opening balance</td><td className="num">{fmtPKR(Math.abs(pl.opening))} {pl.opening >= 0 ? 'Dr' : 'Cr'}</td></tr>
                {pl.rows.map((r, i) => (
                  <tr key={i}><td>{fmtDate(r.date)}</td><td style={{ whiteSpace: 'normal' }}>{r.description}</td><td className="small">{r.reference ?? '—'}</td><td className="num">{r.debit > 0 ? fmtPKR(r.debit) : ''}</td><td className="num">{r.credit > 0 ? fmtPKR(r.credit) : ''}</td><td className="num">{fmtPKR(Math.abs(r.balance))} {r.balance >= 0 ? 'Dr' : 'Cr'}</td></tr>
                ))}
                <tr className="total-row"><td colSpan={3}>CLOSING BALANCE</td><td colSpan={2}></td><td className="num">{fmtPKR(Math.abs(pl.closing))} {pl.closing >= 0 ? 'Dr' : 'Cr'}</td></tr>
              </tbody>
            </table>
            <div className="report-note">Dr = party owes ABC Trading Company (receivable) · Cr = company owes party (payable). Generated from the shared demo journal.</div>
          </div>
        </div>
      )}

      {/* ================= ACCOUNT LEDGER ================= */}
      {tab === 'accountledger' && (
        <div className="report-sheet">
          <div className="report-head">
            <h2>ABC Trading Company</h2>
            <p>Account Ledger — {ACCOUNTS.find((a) => a.id === accountId)?.code} · {ACCOUNTS.find((a) => a.id === accountId)?.name}</p>
            <p>FY 2026–27 to {fmtDate(DEMO_TODAY)} · PKR</p>
          </div>
          <div className="report-body">
            <table className="report-table">
              <thead><tr><th>Date</th><th>Description</th><th>Ref</th><th className="num">Debit</th><th className="num">Credit</th><th className="num">Balance</th></tr></thead>
              <tbody>
                <tr><td colSpan={5} style={{ fontStyle: 'italic', color: 'var(--muted)' }}>Opening balance</td><td className="num">{fmtPKR(Math.abs(al.opening))} {al.opening >= 0 ? 'Dr' : 'Cr'}</td></tr>
                {al.rows.map((r, i) => (
                  <tr key={i}><td>{fmtDate(r.date)}</td><td style={{ whiteSpace: 'normal' }}>{r.description}</td><td className="small">{r.reference ?? '—'}</td><td className="num">{r.debit > 0 ? fmtPKR(r.debit) : ''}</td><td className="num">{r.credit > 0 ? fmtPKR(r.credit) : ''}</td><td className="num">{fmtPKR(Math.abs(r.balance))} {r.balance >= 0 ? 'Dr' : 'Cr'}</td></tr>
                ))}
                <tr className="total-row"><td colSpan={3}>CLOSING BALANCE</td><td colSpan={2}></td><td className="num">{fmtPKR(Math.abs(al.closing))} {al.closing >= 0 ? 'Dr' : 'Cr'}</td></tr>
              </tbody>
            </table>
            <div className="report-note">Running balance in debit-positive convention. Generated from the shared demo journal.</div>
          </div>
        </div>
      )}
    </div>
  );
}
