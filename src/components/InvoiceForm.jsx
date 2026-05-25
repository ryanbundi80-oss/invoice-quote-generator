import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Save } from 'lucide-react';
import { CURRENCIES } from '../data/currencies';
import LineItems from './LineItems';
import { formatDate, formatMoney } from '../utils/format';

const THEMES = ['#0f6b4a', '#1e3a8a', '#334155', '#a16207', '#be123c', '#6d28d9'];
const SUBTITLE_PRESETS = ['Tax Invoice', 'Freelance Invoice', 'Proforma Invoice', 'Service Quote', 'Payment Receipt', 'Professional business document'];
const FILTERS = ['all', 'unpaid', 'paid', 'draft', 'overdue'];

function readLogo(file, onChange) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file.');
    return;
  }
  if (file.size > 750000) {
    alert('Please use a logo below 750KB so the PDF stays light.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onChange('branding.logo', reader.result);
  reader.readAsDataURL(file);
}

function SavedDocuments({ documents = [], currentId, onLoad, onDuplicate, onDelete, onMarkPaid }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const visibleDocuments = useMemo(() => {
    return documents
      .filter((document) => filter === 'all' || document.status === filter)
      .filter((document) => {
        const needle = query.trim().toLowerCase();
        if (!needle) return true;
        return [document.number, document.to?.name, document.type, document.status]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }, [documents, filter, query]);

  if (!documents.length) {
    return <p className="empty-state">Saved invoices, quotes, and receipts will appear here after you save or download.</p>;
  }

  return (
    <div className="saved-tools">
      <input className="saved-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search client or number..." />
      <div className="filter-pills">
        {FILTERS.map((item) => (
          <button className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)} type="button">
            {item}
          </button>
        ))}
      </div>
      <div className="saved-list">
        {visibleDocuments.map((document) => {
          const subtotal = document.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
          return (
            <article className={`saved-item ${document.id === currentId ? 'active' : ''}`} key={document.id}>
              <button className="saved-main" type="button" onClick={() => onLoad(document.id)}>
                <strong>{document.number || 'Untitled document'}</strong>
                <span>{document.to.name || 'No client'} · {formatMoney(subtotal, document.currency)}</span>
                <small>{document.type} · {document.status} · {formatDate(document.updatedAt)}</small>
              </button>
              <div className="saved-actions">
                <button type="button" onClick={() => onDuplicate(document.id)}>Duplicate</button>
                <button type="button" onClick={() => onMarkPaid(document.id)}>Paid</button>
                <button type="button" onClick={() => onDelete(document.id)}>Delete</button>
              </div>
            </article>
          );
        })}
      </div>
      {!visibleDocuments.length && <p className="empty-state">No saved documents match that filter.</p>}
    </div>
  );
}

export default function InvoiceForm({ invoice, totals, readiness = [], savedDocuments = [], onChange, onChangeItem, onAddItem, onRemoveItem, onSaveDraft, onNewDocument, onLoadDocument, onDuplicateDocument, onDeleteDocument, onMarkDocumentPaid }) {
  const isReceipt = invoice.type === 'receipt';

  return (
    <section className="form-panel" aria-label="Invoice form">
      <div className="section-card highlight-card">
        <div>
          <p className="eyebrow">Stage 1 focus</p>
          <h1>Create a professional document fast</h1>
          <p className="muted">No sign-up yet. The current document auto-saves while you type. Use “New” to start a blank document while keeping your business branding.</p>
        </div>
        <div className="quick-actions">
          <button className="btn btn-primary" type="button" onClick={onSaveDraft}><Save size={16} /> Save to history</button>
          <button className="btn btn-secondary" type="button" onClick={() => onNewDocument(invoice.type)}>Start new {invoice.type}</button>
        </div>
      </div>

      <div className="privacy-notice" role="note">
        <strong>Privacy note:</strong> Your drafts and saved invoices are stored only in this browser for now. Avoid using shared computers for sensitive client, KRA PIN, or payment information.
      </div>

      <div className="section-card readiness-card">
        <div className="section-title">Readiness checklist</div>
        <div className="readiness-grid">
          {readiness.map((item) => (
            <div className={item.done ? 'ready' : ''} key={item.label}>{item.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}<span>{item.label}</span></div>
          ))}
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">Branding</div>
        <div className="branding-tools">
          <label className="logo-uploader"><input type="file" accept="image/*" onChange={(event) => readLogo(event.target.files?.[0], onChange)} />{invoice.branding.logo ? <img src={invoice.branding.logo} alt="Uploaded logo preview" /> : <span>Upload logo</span>}</label>
          <p className="helper-text">For the clearest PDF, use a sharp PNG/JPG logo. A logo around 500px wide or larger works best, while keeping the file below 750KB.</p>
          <div className="theme-options" aria-label="Theme colour options">{THEMES.map((theme) => <button aria-label={`Use ${theme} theme`} className={invoice.branding.accentColor === theme ? 'selected' : ''} key={theme} onClick={() => onChange('branding.accentColor', theme)} style={{ backgroundColor: theme }} type="button" />)}</div>
          <label className="field full">Document subtitle
            <select value={invoice.branding.documentSubtitle} onChange={(event) => onChange('branding.documentSubtitle', event.target.value)}>
              {SUBTITLE_PRESETS.map((preset) => <option key={preset} value={preset}>{preset}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">Document</div>
        <div className="form-grid two">
          <label className="field">Type<select value={invoice.type} onChange={(event) => onChange('type', event.target.value)}><option value="invoice">Invoice</option><option value="quote">Quote</option><option value="receipt">Receipt</option></select></label>
          <label className="field">Status<select value={invoice.status} onChange={(event) => onChange('status', event.target.value)} disabled={isReceipt}><option value="draft">Draft</option><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></label>
          <label className="field">Number<input value={invoice.number} onChange={(event) => onChange('number', event.target.value)} /></label>
          <label className="field">Currency<select value={invoice.currency} onChange={(event) => onChange('currency', event.target.value)}>{Object.entries(CURRENCIES).map(([code, currency]) => <option key={code} value={code}>{currency.label}</option>)}</select></label>
          <label className="field">{isReceipt ? 'Payment date' : 'Issue date'}<input type="date" value={invoice.issueDate} onChange={(event) => onChange('issueDate', event.target.value)} /></label>
          {!isReceipt && <label className="field">{invoice.type === 'quote' ? 'Valid until' : 'Due date'}<input type="date" value={invoice.dueDate} onChange={(event) => onChange('dueDate', event.target.value)} /></label>}
        </div>
      </div>

      <div className="section-card"><div className="section-title">Your details</div><div className="form-grid two">
        <label className="field">Business / Your name<input value={invoice.from.name} onChange={(event) => onChange('from.name', event.target.value)} placeholder="Ryan Studio" /></label>
        <label className="field">Email<input value={invoice.from.email} onChange={(event) => onChange('from.email', event.target.value)} placeholder="you@example.com" /></label>
        <label className="field">Phone<input value={invoice.from.phone} onChange={(event) => onChange('from.phone', event.target.value)} placeholder="+254 712 345 678" /></label>
        <label className="field">KRA PIN / Tax ID<input value={invoice.from.taxPin} onChange={(event) => onChange('from.taxPin', event.target.value)} placeholder="A123456789B" /></label>
        <label className="field full">Address / Location<textarea value={invoice.from.address} onChange={(event) => onChange('from.address', event.target.value)} placeholder="Nairobi, Kenya" /></label>
      </div></div>

      <div className="section-card"><div className="section-title">Client details</div><div className="form-grid two">
        <label className="field">Client name<input value={invoice.to.name} onChange={(event) => onChange('to.name', event.target.value)} placeholder="Client Company Ltd" /></label>
        <label className="field">Client email<input value={invoice.to.email} onChange={(event) => onChange('to.email', event.target.value)} placeholder="client@example.com" /></label>
        <label className="field">Client phone<input value={invoice.to.phone} onChange={(event) => onChange('to.phone', event.target.value)} placeholder="+254 700 000 000" /></label>
        <label className="field">Client KRA PIN / Tax ID<input value={invoice.to.taxPin} onChange={(event) => onChange('to.taxPin', event.target.value)} placeholder="P000000000A" /></label>
        <label className="field full">Client address<textarea value={invoice.to.address} onChange={(event) => onChange('to.address', event.target.value)} placeholder="Street, City, Country" /></label>
      </div></div>

      <div className="section-card"><div className="section-title">Line items</div><LineItems items={invoice.items} currency={invoice.currency} onChangeItem={onChangeItem} onAddItem={onAddItem} onRemoveItem={onRemoveItem} /></div>

      <div className="section-card"><div className="section-title">Tax & totals</div><div className="form-grid two">
        <label className="field">VAT / tax rate (%)<input type="number" min="0" value={invoice.taxRate} onChange={(event) => onChange('taxRate', event.target.value)} /></label>
        <label className="field">Withholding tax (%)<input type="number" min="0" value={invoice.withholdingRate} onChange={(event) => onChange('withholdingRate', event.target.value)} /></label>
        {!isReceipt && <label className="field full">Amount paid so far<input type="number" min="0" value={invoice.amountPaid || 0} onChange={(event) => onChange('amountPaid', event.target.value)} /></label>}
      </div><div className="totals-box">
        <div><span>Subtotal</span><strong>{formatMoney(totals.subtotal, invoice.currency)}</strong></div>
        <div><span>VAT / tax</span><strong>{formatMoney(totals.tax, invoice.currency)}</strong></div>
        <div><span>Withholding</span><strong>- {formatMoney(totals.withholding, invoice.currency)}</strong></div>
        {!isReceipt && <div><span>Paid so far</span><strong>- {formatMoney(totals.paid, invoice.currency)}</strong></div>}
        <div className="grand"><span>{isReceipt ? 'Amount received' : 'Balance due'}</span><strong>{formatMoney(isReceipt ? totals.total : totals.balanceDue, invoice.currency)}</strong></div>
      </div></div>

      <div className="section-card"><div className="section-title">Payment & notes</div>
        <label className="field">Payment details<textarea value={invoice.paymentDetails} onChange={(event) => onChange('paymentDetails', event.target.value)} placeholder="M-Pesa Paybill: 123456&#10;Account: INV-001&#10;Bank: KCB, Acc: 1234567890" /></label>
        <label className="field">Notes / terms<textarea value={invoice.notes} onChange={(event) => onChange('notes', event.target.value)} placeholder="Payment due within 14 days. Thank you for your business." /></label>
      </div>

      <div className="section-card"><div className="section-title">Saved documents</div><SavedDocuments documents={savedDocuments} currentId={invoice.id} onLoad={onLoadDocument} onDuplicate={onDuplicateDocument} onDelete={onDeleteDocument} onMarkPaid={onMarkDocumentPaid} /></div>
    </section>
  );
}
