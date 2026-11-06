/* Minimal inline SVG icon set (stroke-based, lucide-style). */

export type IconName =
  | 'dashboard' | 'ai' | 'transactions' | 'parties' | 'accounts' | 'ledgers' | 'bank'
  | 'expenses' | 'reports' | 'documents' | 'approvals' | 'settings'
  | 'search' | 'bell' | 'chevron-down' | 'chevron-right' | 'arrow-right' | 'arrow-up-right'
  | 'x' | 'check' | 'check-circle' | 'alert' | 'info' | 'printer' | 'download' | 'upload'
  | 'calendar' | 'refresh' | 'plus' | 'file' | 'guard' | 'send' | 'edit' | 'trash' | 'eye';

const PATHS: Record<IconName, React.ReactNode> = {
  dashboard: (<><rect x="3" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" /></>),
  ai: (<><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" /><path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" /></>),
  transactions: (<><path d="M4 7h13" /><path d="M13 3l4 4-4 4" /><path d="M20 17H7" /><path d="M11 21l-4-4 4-4" /></>),
  parties: (<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19.5c.8-3.4 3-5 5.5-5s4.7 1.6 5.5 5" /><circle cx="17" cy="9.5" r="2.4" /><path d="M15.5 14.6c2.6.2 4.2 1.9 4.9 4.9" /></>),
  accounts: (<><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v14l-4-2.5L12 20l-4-2.5L4 20V6z" /><path d="M9 9h6M9 13h6" /></>),
  ledgers: (<><path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5v-15z" /><path d="M4 20.5A2.5 2.5 0 016.5 18H20" /><path d="M9 7.5h6M9 11h6" /></>),
  bank: (<><path d="M3 9.5L12 4l9 5.5" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" /><path d="M3 21h18" /></>),
  expenses: (<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" /><path d="M9.5 8h5M9.5 12h5M9.5 16h2" /></>),
  reports: (<><path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M14 3v5h5" /><path d="M9.5 13h5M9.5 17h5M9.5 9h1.5" /></>),
  documents: (<><path d="M12 16V4" /><path d="M8 8l4-4 4 4" /><path d="M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4" /></>),
  approvals: (<><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>),
  settings: (<><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34h.01a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55h.01a1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87v.01a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.51 1z" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>),
  bell: (<><path d="M18 9a6 6 0 10-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9z" /><path d="M10 20a2.2 2.2 0 004 0" /></>),
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  'chevron-right': <path d="M9 6l6 6-6 6" />,
  'arrow-right': (<><path d="M4 12h15" /><path d="M13 6l6 6-6 6" /></>),
  'arrow-up-right': (<><path d="M7 17L17 7" /><path d="M9 7h8v8" /></>),
  x: (<><path d="M6 6l12 12M18 6L6 18" /></>),
  check: <path d="M5 13l4.5 4.5L19 7" />,
  'check-circle': (<><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>),
  alert: (<><path d="M10.3 4.1L2.6 17.5A2 2 0 004.3 20.5h15.4a2 2 0 001.7-3L13.7 4.1a2 2 0 00-3.4 0z" /><path d="M12 9.5v4.5M12 17h.01" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>),
  printer: (<><path d="M7 8V3h10v5" /><path d="M7 17H4a1 1 0 01-1-1v-6a3 3 0 013-3h12a3 3 0 013 3v6a1 1 0 01-1 1h-3" /><rect x="7" y="14" width="10" height="7" rx="1" /></>),
  download: (<><path d="M12 4v12" /><path d="M8 12l4 4 4-4" /><path d="M4 20h16" /></>),
  upload: (<><path d="M12 16V4" /><path d="M8 8l4-4 4 4" /><path d="M4 20h16" /></>),
  calendar: (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>),
  refresh: (<><path d="M20 11a8 8 0 10-2.3 6.3" /><path d="M20 5v6h-6" /></>),
  plus: (<><path d="M12 5v14M5 12h14" /></>),
  file: (<><path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M14 3v5h5" /></>),
  guard: (<><path d="M12 3l7.5 3v6c0 4.5-3 7.5-7.5 9-4.5-1.5-7.5-4.5-7.5-9V6L12 3z" /><path d="M9.5 12l2 2 3.5-4" /></>),
  send: (<><path d="M21 3L10 14" /><path d="M21 3l-7 18-4-8-8-4 19-6z" /></>),
  edit: (<><path d="M4 20h4l11-11a2.1 2.1 0 00-3-3L5 17v3z" /></>),
  trash: (<><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6.5 7l1.2 13a2 2 0 002 1.8h4.6a2 2 0 002-1.8L17.5 7" /></>),
  eye: (<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>),
};

export function Icon({ name, size = 20, strokeWidth = 1.8, className }: { name: IconName; size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
