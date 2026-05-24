import { Save } from 'lucide-react';
import { CURRENCIES } from '../data/currencies';
import LineItems from './LineItems';
import { formatMoney } from '../utils/format';

export default function InvoiceForm({ invoice, totals, onChange, onChangeItem, onAddItem, onRemoveItem, onSaveDraft }) {
  return (
    <section className="form-panel" aria-label="Invoice form">
      <div className="section-card highlight-card">
        <div>
          <p className="eyebrow">MVP focus</p>
          <h1>Create invoices without sign-up</h1>
          <p className="muted">Start with a fast frontend tool. Accounts, M-Pesa automation, and dashboards come after people prove they want it.</p>
        </div>
        <button className="btn btn-secondary" type="button" onClick={onSaveDraft}>
          <Save size={16} />
          Save draft
        </button>
      </div>

      <div className="section-card">
        <div className="section-title">Document</div>
        <div className="form-grid two">
          <label className="field">
            Type
            <select value={invoice.type} onChange={(event) => onChange('type', event.target.value)}>
              <option value="invoice">Invoice</option>
              <option value="quote">Quote</option>
            </select>
          </label>
          <label className="field">
            Status
            <select value={invoice.status} onChange={(event) => onChange('status', event.target.value)}>
              <option value="draft">Draft</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>
          <label className="field">
            Number
            <input value={invoice.number} onChange={(event) => onChange('number', event.target.value)} />
          </label>
          <label className="field">
            Currency
            <select value={invoice.currency} onChange={(event) => onChange('currency', event.target.value)}>
              {Object.entries(CURRENCIES).map(([code, currency]) => (
                <option key={code} value={code}>{currency.label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Issue date
            <input type="date" value={invoice.issueDate} onChange={(event) => onChange('issueDate', event.target.value)} />
          </label>
          <label className="field">
            Due date
            <input type="date" value={invoice.dueDate} onChange={(event) => onChange('dueDate', event.target.value)} />
          </label>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">Your details</div>
        <div className="form-grid two">
          <label className="field">
            Business / Your name
            <input value={invoice.from.name} onChange={(event) => onChange('from.name', event.target.value)} placeholder="Ryan Studio" />
          </label>
          <label className="field">
            Email
            <input value={invoice.from.email} onChange={(event) => onChange('from.email', event.target.value)} placeholder="you@example.com" />
          </label>
          <label className="field">
            Phone
            <input value={invoice.from.phone} onChange={(event) => onChange('from.phone', event.target.value)} placeholder="+254 712 345 678" />
          </label>
          <label className="field">
            KRA PIN / Tax ID
            <input value={invoice.from.taxPin} onChange={(event) => onChange('from.taxPin', event.target.value)} placeholder="A123456789B" />
          </label>
          <label className="field full">
            Address / Location
            <textarea value={invoice.from.address} onChange={(event) => onChange('from.address', event.target.value)} placeholder="Nairobi, Kenya" />
          </label>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">Client details</div>
        <div className="form-grid two">
          <label className="field">
            Client name
            <input value={invoice.to.name} onChange={(event) => onChange('to.name', event.target.value)} placeholder="Client Company Ltd" />
          </label>
          <label className="field">
            Client email
            <input value={invoice.to.email} onChange={(event) => onChange('to.email', event.target.value)} placeholder="client@example.com" />
          </label>
          <label className="field full">
            Client address
            <textarea value={invoice.to.address} onChange={(event) => onChange('to.address', event.target.value)} placeholder="Street, City, Country" />
          </label>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">Line items</div>
        <LineItems
          items={invoice.items}
          currency={invoice.currency}
          onChangeItem={onChangeItem}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
        />
      </div>

      <div className="section-card">
        <div className="section-title">Tax & totals</div>
        <div className="form-grid two">
          <label className="field">
            VAT / tax rate (%)
            <input type="number" min="0" value={invoice.taxRate} onChange={(event) => onChange('taxRate', event.target.value)} />
          </label>
          <label className="field">
            Withholding tax (%)
            <input type="number" min="0" value={invoice.withholdingRate} onChange={(event) => onChange('withholdingRate', event.target.value)} />
          </label>
        </div>
        <div className="totals-box">
          <div><span>Subtotal</span><strong>{formatMoney(totals.subtotal, invoice.currency)}</strong></div>
          <div><span>VAT / tax</span><strong>{formatMoney(totals.tax, invoice.currency)}</strong></div>
          <div><span>Withholding</span><strong>- {formatMoney(totals.withholding, invoice.currency)}</strong></div>
          <div className="grand"><span>Total due</span><strong>{formatMoney(totals.total, invoice.currency)}</strong></div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">Payment & notes</div>
        <label className="field">
          Payment details
          <textarea value={invoice.paymentDetails} onChange={(event) => onChange('paymentDetails', event.target.value)} placeholder="M-Pesa Paybill: 123456&#10;Account: INV-001&#10;Bank: KCB, Acc: 1234567890" />
        </label>
        <label className="field">
          Notes / terms
          <textarea value={invoice.notes} onChange={(event) => onChange('notes', event.target.value)} placeholder="Payment due within 14 days. Thank you for your business." />
        </label>
      </div>
    </section>
  );
}
