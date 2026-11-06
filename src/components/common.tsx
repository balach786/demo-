/* Shared UI atoms: modal, KPI card, badges, toasts, section headers */
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from './icons';
import { useDemo } from '../state/DemoContext';
import { fmtPKR } from '../data/stats';

/* ------------------------------- Modal ------------------------------ */
export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------ KPI card ----------------------------- */
export function KpiCard({
  label,
  value,
  delta,
  deltaGood,
  icon,
  tone = 'blue',
  onClick,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaGood?: boolean;
  icon: IconName;
  tone?: 'blue' | 'teal' | 'green' | 'amber' | 'navy' | 'red' | 'violet';
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className={`kpi-icon tone-${tone}`}>
        <Icon name={icon} size={20} />
      </div>
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {delta && (
          <div className={`kpi-delta ${deltaGood === undefined ? '' : deltaGood ? 'good' : 'bad'}`}>{delta}</div>
        )}
      </div>
      {onClick && <Icon name="arrow-up-right" size={16} className="kpi-arrow" />}
    </>
  );
  if (onClick) {
    return (
      <button className="kpi-card kpi-button" onClick={onClick} aria-label={`${label} — view details`}>
        {inner}
      </button>
    );
  }
  return <div className="kpi-card">{inner}</div>;
}

/* ------------------------------ Section header ------------------------ */
export function SectionHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {action && <div className="section-head-action">{action}</div>}
    </div>
  );
}

/* -------------------------------- Badge ------------------------------- */
export function Badge({ tone, children }: { tone: 'green' | 'amber' | 'red' | 'blue' | 'neutral' | 'teal'; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

/* ------------------------------- Toasts -------------------------------- */
export function Toasts() {
  const { toasts, dismissToast } = useDemo();
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`} role="status">
          <div className="toast-icon">
            <Icon
              name={t.kind === 'success' ? 'check-circle' : t.kind === 'error' ? 'alert' : t.kind === 'warning' ? 'alert' : 'info'}
              size={18}
            />
          </div>
          <div className="toast-text">
            <strong>{t.title}</strong>
            {t.detail && <span>{t.detail}</span>}
          </div>
          <button className="icon-btn small" onClick={() => dismissToast(t.id)} aria-label="Dismiss notification">
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Empty state --------------------------- */
export function EmptyState({ icon, title, hint }: { icon: IconName; title: string; hint?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon name={icon} size={30} /></div>
      <h4>{title}</h4>
      {hint && <p>{hint}</p>}
    </div>
  );
}

/* --------------------------- Money signed ----------------------------- */
export function Money({ amount, suffix }: { amount: number; suffix?: string }) {
  const cls = amount >= 0 ? 'money-pos' : 'money-neg';
  return (
    <span className={cls}>
      {fmtPKR(Math.abs(amount))}
      {suffix ? ` ${suffix}` : ''}
    </span>
  );
}

/* ------------------------- Skeleton shimmer --------------------------- */
export function Skeleton({ width, height }: { width: string | number; height: string | number }) {
  return <div className="skeleton" style={{ width, height }} />;
}
