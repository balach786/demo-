/* Hand-rolled SVG charts — zero dependencies, sandbox-safe, themeable. */

const NAVY = '#12263F';
const BLUE = '#2563EB';
const TEAL = '#0E9F9F';
const GREEN = '#16A34A';
const RED = '#DC2626';
const GRID = '#E4E9F2';
const TXT = '#5B6B84';

const fmtY = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${(n / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(Math.round(n));
};

/* ----------------------- Grouped bar chart ------------------------ */
export function GroupedBars({
  labels,
  seriesA,
  seriesB,
  nameA,
  nameB,
  height = 220,
}: {
  labels: string[];
  seriesA: number[];
  seriesB: number[];
  nameA: string;
  nameB: string;
  height?: number;
}) {
  const W = 640, H = height, PAD_L = 46, PAD_B = 26, PAD_T = 12, PAD_R = 8;
  const max = Math.max(1, ...seriesA, ...seriesB);
  const iw = W - PAD_L - PAD_R;
  const ih = H - PAD_T - PAD_B;
  const groupW = iw / labels.length;
  const bw = Math.min(22, (groupW - 14) / 2);
  const ticks = 4;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`${nameA} vs ${nameB}`}>
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = (max / ticks) * i;
          const y = PAD_T + ih - (ih * v) / max;
          return (
            <g key={i}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke={GRID} strokeDasharray={i === 0 ? '' : '3 4'} />
              <text x={PAD_L - 6} y={y + 4} fontSize="10" fill={TXT} textAnchor="end">{fmtY(v)}</text>
            </g>
          );
        })}
        {labels.map((lab, i) => {
          const cx = PAD_L + groupW * i + groupW / 2;
          const hA = (seriesA[i] / max) * ih;
          const hB = (seriesB[i] / max) * ih;
          return (
            <g key={lab}>
              <rect className="bar-anim" x={cx - bw - 1.5} y={PAD_T + ih - hA} width={bw} height={hA} rx={3} fill={BLUE} />
              <rect className="bar-anim" x={cx + 1.5} y={PAD_T + ih - hB} width={bw} height={hB} rx={3} fill={TEAL} />
              <text x={cx} y={H - 8} fontSize="10.5" fill={TXT} textAnchor="middle">{lab}</text>
            </g>
          );
        })}
      </svg>
      <div className="chart-legend">
        <span><i style={{ background: BLUE }} />{nameA}</span>
        <span><i style={{ background: TEAL }} />{nameB}</span>
      </div>
    </div>
  );
}

/* ------------------------- Area / line chart ------------------------ */
export function ProfitLine({
  labels,
  values,
  height = 220,
}: {
  labels: string[];
  values: number[];
  height?: number;
}) {
  const W = 640, H = height, PAD_L = 46, PAD_B = 26, PAD_T = 14, PAD_R = 22;
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const iw = W - PAD_L - PAD_R;
  const ih = H - PAD_T - PAD_B;
  const px = (i: number) => PAD_L + (iw * i) / (values.length - 1);
  const py = (v: number) => PAD_T + ih - ((v - min) / (max - min || 1)) * ih;
  const linePts = values.map((v, i) => `${px(i)},${py(v)}`).join(' ');
  const areaPts = `${px(0)},${py(min)} ${linePts} ${px(values.length - 1)},${py(min)}`;
  const ticks = 4;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Monthly net profit">
        <defs>
          <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GREEN} stopOpacity="0.32" />
            <stop offset="100%" stopColor={GREEN} stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = min + ((max - min) / ticks) * i;
          const y = py(v);
          return (
            <g key={i}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke={GRID} strokeDasharray="3 4" />
              <text x={PAD_L - 6} y={y + 4} fontSize="10" fill={TXT} textAnchor="end">{fmtY(v)}</text>
            </g>
          );
        })}
        <polygon points={areaPts} fill="url(#profitFill)" />
        <polyline points={linePts} fill="none" stroke={GREEN} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" className="line-anim" />
        {values.map((v, i) => (
          <g key={i}>
            <circle cx={px(i)} cy={py(v)} r="3.6" fill="#fff" stroke={GREEN} strokeWidth="2" />
            <text x={px(i)} y={H - 8} fontSize="10.5" fill={TXT} textAnchor="middle">{labels[i]}</text>
          </g>
        ))}
      </svg>
      <div className="chart-legend"><span><i style={{ background: GREEN }} />Net Profit</span></div>
    </div>
  );
}

/* --------------------------- Cash flow bars ------------------------- */
export function CashFlowBars({
  labels,
  inflow,
  outflow,
  height = 220,
}: {
  labels: string[];
  inflow: number[];
  outflow: number[];
  height?: number;
}) {
  const W = 640, H = height, PAD_L = 46, PAD_B = 26, PAD_T = 12, PAD_R = 8;
  const max = Math.max(1, ...inflow, ...outflow);
  const iw = W - PAD_L - PAD_R;
  const ih = H - PAD_T - PAD_B;
  const groupW = iw / labels.length;
  const bw = Math.min(22, (groupW - 14) / 2);
  const ticks = 4;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Cash inflow vs outflow">
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = (max / ticks) * i;
          const y = PAD_T + ih - (ih * v) / max;
          return (
            <g key={i}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke={GRID} strokeDasharray="3 4" />
              <text x={PAD_L - 6} y={y + 4} fontSize="10" fill={TXT} textAnchor="end">{fmtY(v)}</text>
            </g>
          );
        })}
        {labels.map((lab, i) => {
          const cx = PAD_L + groupW * i + groupW / 2;
          const hIn = (inflow[i] / max) * ih;
          const hOut = (outflow[i] / max) * ih;
          return (
            <g key={lab}>
              <rect className="bar-anim" x={cx - bw - 1.5} y={PAD_T + ih - hIn} width={bw} height={hIn} rx={3} fill={TEAL} />
              <rect className="bar-anim" x={cx + 1.5} y={PAD_T + ih - hOut} width={bw} height={hOut} rx={3} fill={RED} opacity="0.82" />
              <text x={cx} y={H - 8} fontSize="10.5" fill={TXT} textAnchor="middle">{lab}</text>
            </g>
          );
        })}
      </svg>
      <div className="chart-legend">
        <span><i style={{ background: TEAL }} />Money In</span>
        <span><i style={{ background: RED, opacity: 0.82 }} />Money Out</span>
      </div>
    </div>
  );
}

/* ------------------------------ Donut ------------------------------- */
export function Donut({
  segments,
  size = 168,
  thickness = 22,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const shown = segments.filter((s) => s.value > 0);

  return (
    <div className="donut-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Distribution">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={GRID} strokeWidth={thickness} />
        {total > 0 &&
          shown.map((s) => {
            const frac = s.value / total;
            const dash = frac * c;
            const el = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                strokeLinecap="butt"
              >
                <title>{`${s.label}: ${fmtY(s.value)}`}</title>
              </circle>
            );
            offset += dash;
            return el;
          })}
        <text x="50%" y="46%" textAnchor="middle" fontSize="15" fontWeight="700" fill={NAVY}>
          {fmtY(total)}
        </text>
        <text x="50%" y="60%" textAnchor="middle" fontSize="8.5" fill={TXT}>
          TOTAL
        </text>
      </svg>
      <div className="donut-legend">
        {shown.map((s) => (
          <div key={s.label} className="donut-legend-row">
            <span className="dot" style={{ background: s.color }} />
            <span className="lbl">{s.label}</span>
            <span className="val">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------- Horizontal bar ranking ------------------------ */
export function HBars({
  items,
  color = BLUE,
}: {
  items: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="hbars">
      {items.map((i) => (
        <div className="hbar-row" key={i.label}>
          <div className="hbar-label" title={i.label}>{i.label}</div>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: `${(i.value / max) * 100}%`, background: color }} />
          </div>
          <div className="hbar-val">{fmtY(i.value)}</div>
        </div>
      ))}
    </div>
  );
}
