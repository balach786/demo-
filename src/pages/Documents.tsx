import { useMemo, useRef, useState } from 'react';
import { useDemo } from '../state/DemoContext';
import { Icon } from '../components/icons';
import { DEMO_TODAY, PARTIES } from '../data/demoData';
import { fmtPKR } from '../data/stats';

type DocKind = 'payment_receipt' | 'purchase_invoice' | 'sales_invoice' | 'bank_slip' | 'other';

interface ExtractionFields {
  docType: DocKind;
  partyId: string;
  date: string;
  reference: string;
  amount: string;
  description: string;
  uncertain: string[];
}

interface LoadedDoc {
  id: string;
  name: string;
  origin: 'sample' | 'upload';
  mime?: string;
  url?: string;
  extraction: ExtractionFields | null; // null → no extraction possible (user upload)
  sampleId?: 'receipt-abc' | 'invoice-ali';
}

const SAMPLES: LoadedDoc[] = [
  {
    id: 'sample-receipt-abc',
    name: 'payment_receipt_abc_traders.jpg',
    origin: 'sample',
    sampleId: 'receipt-abc',
    extraction: {
      docType: 'payment_receipt',
      partyId: 'abct',
      date: '2026-11-06',
      reference: 'RCV-5521',
      amount: '25000',
      description: 'Payment to ABC Traders against supplier account — per receipt RCV-5521',
      uncertain: ['reference'],
    },
  },
  {
    id: 'sample-invoice-ali',
    name: 'purchase_invoice_ali_suppliers.pdf',
    origin: 'sample',
    sampleId: 'invoice-ali',
    extraction: {
      docType: 'purchase_invoice',
      partyId: 'ali',
      date: '2026-11-05',
      reference: 'PINV-2026-0014',
      amount: '84500',
      description: 'Purchase of assorted fabric stock from Ali Suppliers',
      uncertain: [],
    },
  },
];

const EMPTY_UPLOAD_EXTRACTION: ExtractionFields = {
  docType: 'other',
  partyId: '',
  date: DEMO_TODAY,
  reference: '',
  amount: '',
  description: '',
  uncertain: ['partyId', 'amount', 'date', 'reference'],
};

export default function DocumentsPage() {
  const { createApproval, go, toast } = useDemo();
  const [docs, setDocs] = useState<LoadedDoc[]>(SAMPLES);
  const [activeId, setActiveId] = useState<string>(SAMPLES[0].id);
  const [dragOver, setDragOver] = useState(false);
  const [fields, setFields] = useState<ExtractionFields>(() => ({ ...SAMPLES[0].extraction! }));
  const fileRef = useRef<HTMLInputElement>(null);

  const active = docs.find((d) => d.id === activeId)!;
  const isSample = active.origin === 'sample';

  const loadDoc = (doc: LoadedDoc) => {
    setActiveId(doc.id);
    setFields(doc.extraction ? { ...doc.extraction } : { ...EMPTY_UPLOAD_EXTRACTION });
  };

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    if (file.size === 0) {
      toast('error', 'Empty file', 'This file is 0 bytes — there is nothing to preview. Choose a real JPG/PNG or PDF.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast('error', 'File too large', 'The demo accepts files up to 15 MB. Please choose a smaller JPG/PNG or PDF.');
      return;
    }
    const ok = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!ok) {
      toast('error', 'Unsupported file', 'Upload an image (JPG/PNG) or a PDF. Other formats are not accepted in the demo.');
      return;
    }
    const url = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    const doc: LoadedDoc = { id: `upload-${Date.now()}`, name: file.name, origin: 'upload', mime: file.type, url, extraction: null };
    setDocs((d) => [doc, ...d]);
    loadDoc(doc);
    toast('info', 'Document loaded', 'No OCR/Vision is connected in the demo — fields are not auto-detected. Enter values manually, or use the built-in sample documents.');
  };

  const party = PARTIES.find((p) => p.id === fields.partyId);
  const amt = Number(fields.amount);

  const fieldState = (key: keyof ExtractionFields) =>
    fields.uncertain.includes(key as string) ? 'uncertain' : 'confident';

  const prepareDraft = () => {
    if (!fields.partyId || !amt || amt <= 0 || fields.description.trim().length < 4) {
      toast('warning', 'Review the extraction', 'Party, amount and a description (min 4 chars) are required before a draft can be prepared.');
      return;
    }
    const isPurchase = fields.docType === 'purchase_invoice';
    const action = createApproval('document', `${isPurchase ? 'Purchase from' : 'Payment to'} ${party?.name} (from document)`, {
      type: isPurchase ? 'purchase' : 'payment',
      mode: isPurchase ? 'credit' : 'bank',
      amount: amt,
      accountId: isPurchase ? undefined : 'hbl',
      partyId: fields.partyId,
      date: fields.date || DEMO_TODAY,
      reference: fields.reference.trim() || undefined,
      description: fields.description.trim(),
    });
    toast('warning', 'Draft created — pending approval', `${action.id} is in the Approvals queue. Verify the highlighted fields first.`);
    go('approvals');
  };

  const stepIndex = useMemo(() => {
    if (amt > 0 && fields.partyId) return 4;
    return 3;
  }, [amt, fields.partyId]);

  return (
    <div className="stack">
      <div>
        <h2 style={{ fontSize: 20, color: 'var(--navy-800)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          Document Intelligence <span className="sim-tag">SIMULATED EXTRACTION</span>
        </h2>
        <p className="small muted">Upload a bank slip, receipt or invoice → preview extracted fields → correct → draft transaction → approve. Values are never invented: sample documents carry known-good values; your uploads require manual entry (no OCR connected in demo).</p>
      </div>

      {/* Stepper */}
      <div className="flex-between no-print" style={{ padding: '4px 2px' }}>
        {['Upload', 'Extract', 'Review & Correct', 'Transaction Draft', 'Approval'].map((label, i) => {
          const n = i + 1;
          const done = n < stepIndex || (n <= 2);
          const current = n === stepIndex || (n === 3 && stepIndex === 3);
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 800,
                background: done ? 'var(--teal)' : current ? 'var(--blue)' : '#e2e8f0', color: done || current ? '#fff' : 'var(--muted)',
              }}>{done ? '✓' : n}</div>
              <span className="small" style={{ fontWeight: 700, color: current ? 'var(--blue-dark)' : 'var(--muted)' }}>{label}</span>
              {n < 5 && <div style={{ flex: 1, height: 2, background: done ? 'var(--teal)' : 'var(--border)' }} />}
            </div>
          );
        })}
      </div>

      <div className="doc-shell">
        {/* ===== Left: upload + preview + doc list ===== */}
        <div className="stack" style={{ gap: 14 }}>
          <div
            className={`dropzone ${dragOver ? 'drag' : ''}`}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
            role="button"
            tabIndex={0}
            aria-label="Upload a document"
          >
            <Icon name="upload" size={34} />
            <div><strong>Drag &amp; drop a document here</strong></div>
            <div className="small">Bank slips · payment receipts · purchase/sales invoices · PDF or images</div>
            <button className="btn btn-outline btn-sm" type="button" onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}>Browse files</button>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={(e) => onFiles(e.target.files)} />
          </div>

          <div className="flex-between" style={{ padding: '0 2px' }}>
            <span className="small muted">Or load a <strong>known sample document</strong> (values verified for the demo):</span>
          </div>
          <div className="two-col" style={{ gap: 10 }}>
            <button className="sample-doc-btn" onClick={() => loadDoc(SAMPLES[0])}>
              <Icon name="file" size={20} />
              <span><strong>ABC Traders</strong><br />Payment Receipt · Rs 25,000</span>
            </button>
            <button className="sample-doc-btn" onClick={() => loadDoc(SAMPLES[1])}>
              <Icon name="file" size={20} />
              <span><strong>Ali Suppliers</strong><br />Purchase Invoice · Rs 84,500</span>
            </button>
          </div>

          {/* Document preview */}
          <div className="doc-preview" aria-label="Document preview">
            <div className="flex-between" style={{ marginBottom: 10 }}>
              <span className="small" style={{ fontWeight: 800, color: '#4a4636' }}>PREVIEW — {active.name}</span>
              <span className="badge badge-neutral">{active.origin === 'sample' ? 'SAMPLE' : 'YOUR UPLOAD'}</span>
            </div>
            {active.origin === 'sample' ? (
              active.sampleId === 'receipt-abc' ? (
                <div className="receipt-paper">
                  <h4>ABC TRADERS</h4>
                  <div style={{ textAlign: 'center', fontSize: 10 }}>Godown 3, Site Area, Karachi · Ph: +92 345 5551234</div>
                  <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, marginTop: 4 }}>PAYMENT RECEIPT</div>
                  <hr />
                  <div className="receipt-row"><span>Receipt No</span><b>RCV-5521</b></div>
                  <div className="receipt-row"><span>Date</span><b>06-Nov-2026</b></div>
                  <div className="receipt-row"><span>Received from</span><b>ABC Trading Company</b></div>
                  <div className="receipt-row"><span>Being payment against</span><b>Supplier account</b></div>
                  <hr />
                  <div className="receipt-row receipt-total"><span>AMOUNT</span><span>Rs 25,000/=</span></div>
                  <div className="receipt-row"><span>In words</span><b>Rupees Twenty Five Thousand Only</b></div>
                  <hr />
                  <div style={{ textAlign: 'center', fontSize: 9, color: '#777' }}>This is a fictitious sample document for product demonstration.</div>
                </div>
              ) : (
                <div className="receipt-paper">
                  <h4>ALI SUPPLIERS</h4>
                  <div style={{ textAlign: 'center', fontSize: 10 }}>Mill Road, Faisalabad · Ph: +92 312 8884321</div>
                  <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, marginTop: 4 }}>PURCHASE INVOICE</div>
                  <hr />
                  <div className="receipt-row"><span>Invoice No</span><b>PINV-2026-0014</b></div>
                  <div className="receipt-row"><span>Date</span><b>05-Nov-2026</b></div>
                  <div className="receipt-row"><span>Bill to</span><b>ABC Trading Company</b></div>
                  <div className="receipt-row"><span>Items</span><b>Assorted fabric stock</b></div>
                  <hr />
                  <div className="receipt-row"><span>Subtotal</span><span>Rs 72,414</span></div>
                  <div className="receipt-row"><span>GST 17%</span><span>Rs 12,086</span></div>
                  <div className="receipt-row receipt-total"><span>GRAND TOTAL</span><span>Rs 84,500/=</span></div>
                  <hr />
                  <div style={{ textAlign: 'center', fontSize: 9, color: '#777' }}>This is a fictitious sample document for product demonstration.</div>
                </div>
              )
            ) : active.url ? (
              <img src={active.url} alt={`Uploaded document: ${active.name}`} style={{ maxWidth: '100%', maxHeight: 380, display: 'block', margin: '0 auto', borderRadius: 8, boxShadow: 'var(--shadow-md)' }} />
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#5b5744' }}>
                <Icon name="file" size={44} />
                <div style={{ marginTop: 8, fontWeight: 700 }}>{active.name}</div>
                <div className="small">PDF preview is not rendered in this demo — the file stays in your browser only.</div>
              </div>
            )}
          </div>
        </div>

        {/* ===== Right: extraction panel ===== */}
        <div className="card card-pad">
          <div className="flex-between" style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 13, color: 'var(--navy-800)' }}>Extracted Fields</h3>
            <span className="badge badge-amber">SIMULATED — NOT OCR</span>
          </div>

          {!isSample && (
            <div className="banner-warn" style={{ marginBottom: 12 }}>
              <Icon name="alert" size={15} />
              <span>No OCR/Vision service is connected to this demo. For your upload, every field must be confirmed or typed by you — highlighted fields are unknown, not “detected with low confidence”.</span>
            </div>
          )}
          {isSample && (
            <div className="banner-info" style={{ marginBottom: 12 }}>
              <Icon name="info" size={15} />
              <span>Sample document — values below are the <em>known ground truth</em> of the sample, labelled as simulated extraction. Corrections you type are saved into the draft.</span>
            </div>
          )}

          <div className="extract-grid">
            <div className="field">
              <label htmlFor="x-doctype">Document Type</label>
              <select id="x-doctype" value={fields.docType} onChange={(e) => setFields({ ...fields, docType: e.target.value as DocKind })}>
                <option value="payment_receipt">Payment Receipt</option>
                <option value="purchase_invoice">Purchase Invoice</option>
                <option value="sales_invoice">Sales Invoice</option>
                <option value="bank_slip">Bank Slip</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className={`field ${fieldState('partyId') === 'uncertain' ? 'uncertain' : ''}`}>
              <label htmlFor="x-party">Party {fieldState('partyId') === 'uncertain' && <span className="field-uncertain-tag"><Icon name="alert" size={10} />VERIFY</span>}</label>
              <select id="x-party" value={fields.partyId} onChange={(e) => setFields({ ...fields, partyId: e.target.value, uncertain: fields.uncertain.filter((u) => u !== 'partyId') })}>
                <option value="">— Not detected —</option>
                {PARTIES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className={`field ${fieldState('date') === 'uncertain' ? 'uncertain' : ''}`}>
              <label htmlFor="x-date">Date {fieldState('date') === 'uncertain' && <span className="field-uncertain-tag"><Icon name="alert" size={10} />VERIFY</span>}</label>
              <input id="x-date" type="date" value={fields.date} onChange={(e) => setFields({ ...fields, date: e.target.value, uncertain: fields.uncertain.filter((u) => u !== 'date') })} />
            </div>
            <div className={`field ${fieldState('reference') === 'uncertain' ? 'uncertain' : ''}`}>
              <label htmlFor="x-ref">Reference No. {fieldState('reference') === 'uncertain' && <span className="field-uncertain-tag"><Icon name="alert" size={10} />LOW CONFIDENCE</span>}</label>
              <input id="x-ref" value={fields.reference} placeholder="Not detected" onChange={(e) => setFields({ ...fields, reference: e.target.value, uncertain: fields.uncertain.filter((u) => u !== 'reference') })} />
            </div>
            <div className={`field ${fieldState('amount') === 'uncertain' ? 'uncertain' : ''}`}>
              <label htmlFor="x-amount">Amount (PKR) {fieldState('amount') === 'uncertain' && <span className="field-uncertain-tag"><Icon name="alert" size={10} />VERIFY</span>}</label>
              <input id="x-amount" type="number" min={1} value={fields.amount} placeholder="Not detected — enter manually" onChange={(e) => setFields({ ...fields, amount: e.target.value, uncertain: fields.uncertain.filter((u) => u !== 'amount') })} />
            </div>
            <div className="field">
              <label>Computed</label>
              <div style={{ height: 37, display: 'flex', alignItems: 'center', fontWeight: 800, color: 'var(--navy-800)', fontVariantNumeric: 'tabular-nums' }}>{amt > 0 ? fmtPKR(amt) : '—'}</div>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="x-desc">Description <span className="req">*</span></label>
              <textarea id="x-desc" rows={2} value={fields.description} placeholder="Describe the transaction this document supports…" onChange={(e) => setFields({ ...fields, description: e.target.value })} />
            </div>
          </div>

          <div className="divider" />
          <div className="flex-between">
            <div className="small muted" style={{ maxWidth: 250 }}>The draft goes to <strong>Approvals</strong> with status “Pending Approval”. Nothing is posted until you approve.</div>
            <button className="btn btn-teal" onClick={prepareDraft}><Icon name="approvals" size={15} /> Prepare Transaction Draft</button>
          </div>
        </div>
      </div>
    </div>
  );
}
