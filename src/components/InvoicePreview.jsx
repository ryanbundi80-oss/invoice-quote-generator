import { formatDate, formatMoney } from '../utils/format';

function DetailBlock({ title, name, lines }) {
  return (
    <div>
      <p className="preview-label-small">{title}</p>
      <h3>{name || '—'}</h3>
      <p className="preview-lines">{lines.filter(Boolean).join('\n') || '—'}</p>
    </div>
  );
}

function getDocumentTitle(type) {
  if (type === 'quote') return 'Quote';
  if (type === 'receipt') return 'Receipt';
  return 'Invoice';
}

function getSafeDescription(item) {
  const description = String(item.description || '').trim();
  const amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  if (description) return description;
  if (amount > 0) return 'Service provided';
  return '—';
}

export default function InvoicePreview({ invoice, totals }) {
  const title = getDocumentTitle(invoice.type);
  const isReceipt = invoice.type === 'receipt';
  const accentStyle = { '--document-accent': invoice.branding?.accentColor || '#0f6b4a' };

  return (
    <section className="preview-panel" aria-label="Invoice preview">
      <div className="preview-sticky">
        <p className="eyebrow preview-heading">Live preview</p>

        <article className="invoice-sheet" id="invoice-preview" style={accentStyle}>
          <div className="invoice-top-accent" />
          <div className="invoice-top">
            <div className="brand-lockup">
              {invoice.branding?.logo && <img className="invoice-logo" src={invoice.branding.logo} alt={`${invoice.from.name || 'Business'} logo`} />}
              <div>
                <p className="sheet-brand">{invoice.from.name || 'Your Business'}</p>
                <p className="sheet-subtitle">{invoice.branding?.documentSubtitle || 'Professional business document'}</p>
              </div>
            </div>
            <div className="sheet-meta">
              <h2>{title}</h2>
              <p>{invoice.number}</p>
              <span className={`status status-${invoice.status}`}>{invoice.status}</span>
            </div>
          </div>

          <div className="invoice-parties">
            <DetailBlock
              title="From"
              name={invoice.from.name}
              lines={[invoice.from.email, invoice.from.phone, invoice.from.taxPin && `KRA PIN: ${invoice.from.taxPin}`, invoice.from.address]}
            />
            <DetailBlock
              title={isReceipt ? 'Received from' : 'Bill to'}
              name={invoice.to.name}
              lines={[invoice.to.email, invoice.to.phone, invoice.to.taxPin && `KRA PIN: ${invoice.to.taxPin}`, invoice.to.address]}
            />
          </div>

          <div className="date-strip">
            <div>
              <span>{isReceipt ? 'Payment date' : 'Issue date'}</span>
              <strong>{formatDate(invoice.issueDate)}</strong>
            </div>
            {!isReceipt && (
              <div>
                <span>{invoice.type === 'quote' ? 'Valid until' : 'Due date'}</span>
                <strong>{formatDate(invoice.dueDate)}</strong>
              </div>
            )}
            <div>
              <span>Currency</span>
              <strong>{invoice.currency}</strong>
            </div>
          </div>

          <table className="preview-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items
                .filter((item) => item.description || Number(item.unitPrice) > 0)
                .map((item) => {
                  const amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                  return (
                    <tr key={item.id}>
                      <td>{getSafeDescription(item)}</td>
                      <td>{Number(item.quantity) || 0}</td>
                      <td>{formatMoney(item.unitPrice, invoice.currency)}</td>
                      <td>{formatMoney(amount, invoice.currency)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          <div className="preview-total-wrap">
            <div className="preview-totals">
              <div><span>Subtotal</span><strong>{formatMoney(totals.subtotal, invoice.currency)}</strong></div>
              <div><span>VAT / tax ({invoice.taxRate || 0}%)</span><strong>{formatMoney(totals.tax, invoice.currency)}</strong></div>
              <div><span>WHT ({invoice.withholdingRate || 0}%)</span><strong>- {formatMoney(totals.withholding, invoice.currency)}</strong></div>
              {!isReceipt && <div><span>Paid so far</span><strong>- {formatMoney(totals.paid, invoice.currency)}</strong></div>}
              <div className="grand"><span>{isReceipt ? 'Amount received' : invoice.type === 'quote' ? 'Quote total' : 'Balance due'}</span><strong>{formatMoney(isReceipt ? totals.total : totals.balanceDue, invoice.currency)}</strong></div>
            </div>
          </div>

          {(invoice.paymentDetails || invoice.notes) && (
            <footer className="invoice-footer">
              {invoice.paymentDetails && (
                <div className="payment-box">
                  <p className="preview-label-small">Payment details</p>
                  <p>{invoice.paymentDetails}</p>
                </div>
              )}
              {invoice.notes && (
                <div>
                  <p className="preview-label-small">Notes</p>
                  <p className="preview-lines">{invoice.notes}</p>
                </div>
              )}
            </footer>
          )}

          <div className="invoice-kit-footer">
            <span>Thank you for your business.</span>
            <span>Generated with InvoiceKit</span>
          </div>
        </article>
      </div>
    </section>
  );
}
