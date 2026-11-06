import { useState } from 'react';
import { useDemo } from '../state/DemoContext';
import { Icon } from '../components/icons';
import { Modal } from '../components/common';
import { DEMO_BUSINESS, DEMO_FY, DEMO_TODAY } from '../data/demoData';

const FEATURE_STATUS: { feature: string; status: 'working' | 'simulated' | 'planned'; note: string }[] = [
  { feature: 'Executive dashboard (live KPIs, charts, filters)', status: 'working', note: 'Computed from shared demo journal' },
  { feature: 'Double-entry accounting (journal, ledgers)', status: 'working', note: 'Debits always equal credits; books balance' },
  { feature: 'Parties, chart of accounts, bank accounts', status: 'working', note: 'Fictional seed data + demo-posted entries' },
  { feature: 'Financial reports (P&L, CF, TB, BS, ledgers)', status: 'working', note: 'Printable; statements reconcile to the seed ledger' },
  { feature: 'Add transaction / manual journal posting', status: 'working', note: 'Posts to isolated demo ledger (localStorage)' },
  { feature: 'Approval workflow (draft → approve → post)', status: 'working', note: 'Isolated demo state; no real payments' },
  { feature: 'AI Secretary answers (English / Roman Urdu)', status: 'simulated', note: 'Deterministic on-device pattern matching — no LLM/API call' },
  { feature: 'Document intelligence (extraction)', status: 'simulated', note: 'Sample documents use known-good values; uploads require manual entry — no OCR connected' },
  { feature: 'Bank feeds & balances', status: 'simulated', note: 'Illustrative only — no bank API integration' },
  { feature: 'OpenAI API integration', status: 'planned', note: 'Planned for production phase — requires client approval & key' },
  { feature: 'MongoDB Atlas persistence', status: 'planned', note: 'Intentionally NOT connected; demo uses in-memory + localStorage' },
  { feature: 'Authentication & roles', status: 'planned', note: 'Demo has no login; production will add RBAC' },
  { feature: 'Email / SMS / WhatsApp notifications', status: 'planned', note: 'Not implemented — no outbound messages ever sent' },
  { feature: 'Real bank transfers / payment execution', status: 'planned', note: 'Not implemented — approvals are simulated only' },
];

export default function SettingsPage() {
  const { resetDemoData, setAiConversation, toast } = useDemo();
  const [confirmReset, setConfirmReset] = useState(false);
  const [prefs, setPrefs] = useState({ compactNumbers: false, animations: true, boldTotals: true });

  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="stack">
      <div>
        <h2 style={{ fontSize: 20, color: 'var(--navy-800)', fontWeight: 800 }}>Settings</h2>
        <p className="small muted">Demo workspace configuration — production settings arrive with the full build.</p>
      </div>

      <div className="settings-grid">
        {/* ===== Business profile (read-only demo) ===== */}
        <div className="card card-pad">
          <h3 style={{ fontSize: 13, color: 'var(--navy-800)', marginBottom: 10 }}>Business Profile — Demo</h3>
          <div className="kv"><span>Business name</span><strong>{DEMO_BUSINESS}</strong></div>
          <div className="kv"><span>Legal form</span><strong>Sole Proprietorship (fictional)</strong></div>
          <div className="kv"><span>Financial year</span><strong>{DEMO_FY} (1 Jul – 30 Jun)</strong></div>
          <div className="kv"><span>Demo “today”</span><strong>{DEMO_TODAY}</strong></div>
          <div className="kv"><span>Base currency</span><strong>PKR — Pakistani Rupee (Rs)</strong></div>
          <div className="kv"><span>Registered address</span><strong>Plot 9, Jodia Bazar, Karachi (fictional)</strong></div>
          <div className="kv"><span>NTN / Sales Tax</span><strong>0000000-0 (placeholder)</strong></div>
          <div className="divider" />
          <h3 style={{ fontSize: 13, color: 'var(--navy-800)', marginBottom: 4 }}>Session Display Preferences</h3>
          <p className="small muted" style={{ marginBottom: 6 }}>Visual toggles for this demo session only.</p>
          {([
            ['compactNumbers', 'Compact number format (Lakh/Crore)', 'Show abbreviated figures where space is tight'],
            ['animations', 'Interface animations', 'Subtle chart & page transitions'],
            ['boldTotals', 'Bold report totals', 'Emphasise total rows in statements'],
          ] as [keyof typeof prefs, string, string][]).map(([key, label, hint]) => (
            <div className="setting-row" key={key}>
              <div><strong style={{ fontSize: 12 }}>{label}</strong><small>{hint}</small></div>
              <button className={`toggle ${prefs[key] ? 'on' : ''}`} role="switch" aria-checked={prefs[key]} aria-label={label} onClick={() => toggle(key)} />
            </div>
          ))}
        </div>

        {/* ===== Demo controls ===== */}
        <div className="stack" style={{ gap: 16 }}>
          <div className="card card-pad" style={{ borderLeft: '4px solid var(--amber)' }}>
            <h3 style={{ fontSize: 13, color: 'var(--navy-800)', marginBottom: 6 }}>Demo Data Controls</h3>
            <p className="small muted" style={{ marginBottom: 10 }}>Demo changes (added transactions, approvals, AI conversation) are stored only in this browser’s localStorage — never on a server, never in production systems.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-danger-outline btn-sm" onClick={() => setConfirmReset(true)}><Icon name="refresh" size={14} /> Reset Demo Data</button>
              <button className="btn btn-outline btn-sm" onClick={() => { setAiConversation([]); toast('info', 'Conversation cleared', 'AI chat history was cleared.'); }}><Icon name="trash" size={14} /> Clear AI Conversation</button>
            </div>
          </div>

          <div className="card card-pad">
            <h3 style={{ fontSize: 13, color: 'var(--navy-800)', marginBottom: 8 }}>Build &amp; Safety Facts</h3>
            <div className="kv"><span>Build type</span><strong>Client demonstration (not production)</strong></div>
            <div className="kv"><span>Frontend</span><strong>React 18 + TypeScript + Vite</strong></div>
            <div className="kv"><span>Charts</span><strong>Hand-rolled SVG (zero external chart deps)</strong></div>
            <div className="kv"><span>State</span><strong>React context + localStorage (isolated)</strong></div>
            <div className="kv"><span>External network calls</span><strong>None — works offline</strong></div>
            <div className="kv"><span>Security posture</span><strong>Demo only — not a hardened deployment</strong></div>
          </div>
        </div>
      </div>

      {/* ===== Feature honesty matrix ===== */}
      <div className="card card-pad">
        <h3 style={{ fontSize: 13, color: 'var(--navy-800)', marginBottom: 4 }}>What Works, What’s Simulated, What’s Planned</h3>
        <p className="small muted" style={{ marginBottom: 10 }}>The honest scope map for this client demonstration.</p>
        <div style={{ overflowX: 'auto' }}>
          <table className="status-matrix">
            <thead><tr><th>Capability</th><th>Status</th><th>Notes</th></tr></thead>
            <tbody>
              {FEATURE_STATUS.map((f) => (
                <tr key={f.feature}>
                  <td>{f.feature}</td>
                  <td>
                    {f.status === 'working' && <span className="badge badge-green">Working</span>}
                    {f.status === 'simulated' && <span className="badge badge-amber">Simulated</span>}
                    {f.status === 'planned' && <span className="badge badge-neutral">Planned</span>}
                  </td>
                  <td className="muted">{f.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="banner-info">
        <Icon name="guard" size={16} />
        <span><strong>Demo integrity notice:</strong> All company names, people, phone numbers, account numbers and financial figures in this application are fictional and exist solely to demonstrate the product. “Approved” actions never move real money. No part of this demo constitutes accounting, tax or legal advice.</span>
      </div>

      {/* Reset confirm */}
      {confirmReset && (
        <Modal title="Reset Demo Data?" onClose={() => setConfirmReset(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => { resetDemoData(); setConfirmReset(false); }}><Icon name="refresh" size={14} /> Reset Everything</button>
          </>}>
          <p style={{ fontSize: 13 }}>This discards all demo changes in this browser: added transactions, approved/rejected drafts, and the AI conversation. The fictional seed dataset (FY 2026–27, Jul–Nov 2026) is restored.</p>
          <p className="small muted" style={{ marginTop: 8 }}>Production data is never touched by this action — none exists in this build.</p>
        </Modal>
      )}
    </div>
  );
}
