import { useEffect, useRef, useState } from 'react';
import { useDemo, type AiStoredMessage } from '../state/DemoContext';
import { Icon } from '../components/icons';
import { runCommand, SUGGESTED_COMMANDS } from '../ai/mockAI';

const uid = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

export default function AICommandCenter() {
  const { transactions, approvals, createApproval, aiConversation, setAiConversation, go, toast } = useDemo();
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);

  // Seed a welcome message on first open
  useEffect(() => {
    if (!seededRef.current && aiConversation.length === 0) {
      seededRef.current = true;
      setAiConversation([{
        id: uid(),
        role: 'ai',
        text:
          'Assalamualaikum! Main aapka AI Business Secretary hoon (DEMO — on-device, simulated; koi external AI API call nahi hoti).\n\n' +
          'Main aapke accounting se jawab nikal sakta hoon, reports bana sakta hoon, ya payments/drafts prepare kar sakta hoon — sab kuch demo data par.\n\n' +
          'Neeche diye gaye suggested commands se shuru karein, ya apna sawal likhein.',
        time: new Date().toISOString(),
        module: 'AI Command Center',
        simulated: true,
      }]);
    }
  }, [aiConversation.length, setAiConversation]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [aiConversation.length, thinking]);

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || thinking) return;
    setInput('');
    const userMsg: AiStoredMessage = { id: uid(), role: 'user', text, time: new Date().toISOString() };
    setAiConversation((prev) => [...prev, userMsg]);
    setThinking(true);

    window.setTimeout(() => {
      const reply = runCommand(text, transactions);
      let actionRef: string | undefined;
      if (reply.draftAction) {
        const created = createApproval('ai', reply.draftAction.title, reply.draftAction.draft);
        actionRef = created.id;
      }
      const aiMsg: AiStoredMessage = {
        id: uid(),
        role: 'ai',
        text: reply.text,
        time: new Date().toISOString(),
        intent: reply.intent,
        module: reply.module,
        confidence: reply.confidence,
        table: reply.table,
        nav: reply.nav,
        actionRef,
        simulated: true,
      };
      setAiConversation((prev) => [...prev, aiMsg]);
      setThinking(false);
      if (actionRef) toast('warning', 'Draft created — pending approval', `${actionRef} is waiting for your approval. Nothing has been paid or posted yet.`);
    }, 620);
  };

  const pendingForConvo = approvals.filter((a) => a.status === 'pending').length;

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="flex-between">
        <div>
          <h2 style={{ fontSize: 20, color: 'var(--navy-800)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            AI Command Center
            <span className="sim-tag">DEMO AI · SIMULATED</span>
          </h2>
          <p className="small muted">Ask in English or Roman Urdu · answers computed live from the demo ledger · actions require your approval</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {pendingForConvo > 0 && (
            <button className="btn btn-teal btn-sm" onClick={() => go('approvals')}>
              <Icon name="approvals" size={14} /> {pendingForConvo} pending approval{pendingForConvo > 1 ? 's' : ''}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setAiConversation([])}><Icon name="refresh" size={14} /> Clear conversation</button>
        </div>
      </div>

      <div className="ai-shell">
        {/* ===== Suggested commands / history panel ===== */}
        <div className="card ai-panel">
          <div className="ai-panel-head">
            <Icon name="send" size={15} />
            <h3>Suggested Commands</h3>
          </div>
          <div className="suggestion-list">
            {SUGGESTED_COMMANDS.map((s) => (
              <button key={s} className="suggestion" onClick={() => send(s)} disabled={thinking}>
                <Icon name="chevron-right" size={13} />
                <span>{s}</span>
              </button>
            ))}
            <div className="banner-warn" style={{ marginTop: 6 }}>
              <Icon name="info" size={14} />
              <span>This demo AI runs on-device with deterministic pattern matching — <strong>no OpenAI API is called</strong> and no data leaves the browser. Answers are computed from the same dataset as the dashboard.</span>
            </div>
          </div>
        </div>

        {/* ===== Chat ===== */}
        <div className="card ai-panel">
          <div className="chat-area" ref={chatRef} aria-live="polite">
            {aiConversation.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="msg msg-user">{m.text}</div>
              ) : (
                <div key={m.id} className="msg msg-ai">
                  <div className="ai-text">{m.text}</div>

                  {m.table && (
                    <table className="ai-table">
                      <thead><tr>{m.table.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>{m.table.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
                    </table>
                  )}

                  {m.actionRef && (
                    <div className="ai-action-card">
                      <strong>⏳ Approval drafted: {m.actionRef}</strong>
                      <div style={{ margin: '5px 0 8px', color: '#6b4f12' }}>Status: PENDING APPROVAL · No payment will be executed until you approve it in the Approvals queue.</div>
                      <button className="btn btn-primary btn-sm" onClick={() => go('approvals')}><Icon name="approvals" size={13} /> Review &amp; Approve</button>
                    </div>
                  )}

                  {m.nav && (
                    <button className="ai-nav-link" onClick={() => go(m.nav!.page, m.nav!.param)}>
                      {m.nav.label} <Icon name="arrow-right" size={13} />
                    </button>
                  )}

                  <div className="msg-meta">
                    <span className="sim-tag">DEMO AI</span>
                    {m.module && <span>Module: <strong>{m.module}</strong></span>}
                    {m.intent && <span>Intent: <strong>{m.intent}</strong></span>}
                    {m.confidence !== undefined && <span>Confidence: <strong>{Math.round(m.confidence * 100)}%</strong></span>}
                    <span>{new Date(m.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ),
            )}
            {thinking && (
              <div className="msg msg-ai" aria-label="AI is thinking">
                <span className="typing-dots"><i /><i /></span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="chat-input-bar">
            <button className="icon-btn" title="Open Document Intelligence (upload receipts & invoices)" aria-label="Upload a document" onClick={() => go('documents')}>
              <Icon name="documents" size={20} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask about sales, profit, ledgers, payments… (English / Roman Urdu)"
              aria-label="AI command input"
              disabled={thinking}
            />
            <button className="send-btn" onClick={() => send()} aria-label="Send command" disabled={thinking || !input.trim()}>
              <Icon name="send" size={19} />
            </button>
          </div>
        </div>
      </div>

      <div className="small muted" style={{ padding: '0 2px' }}>
        Honest-by-design: this is a deterministic demo assistant, not a live LLM. It demonstrates intent understanding, dataset-grounded answers, navigation and the approval workflow — the production build will use the OpenAI API behind the same UX, subject to client sign-off.
      </div>
    </div>
  );
}
