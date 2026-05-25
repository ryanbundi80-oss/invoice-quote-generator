import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import { calculateTotals } from './utils/calculations';
import { downloadElementAsPDF } from './utils/pdf';
import { buildDocumentFilename, formatDate, formatMoney, getFutureInputValue, getTodayInputValue } from './utils/format';
import './styles.css';
import './polish.css';

const STORAGE_KEY = 'invoicekit-current-draft';
const HISTORY_KEY = 'invoicekit-saved-documents';

const TYPE_META = {
  invoice: { prefix: 'INV', label: 'invoice', status: 'unpaid', subtitle: 'Tax Invoice' },
  quote: { prefix: 'QUO', label: 'quote', status: 'draft', subtitle: 'Freelance Quote' },
  receipt: { prefix: 'RCT', label: 'receipt', status: 'paid', subtitle: 'Payment Receipt' }
};

function newLineItem() {
  return { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 };
}

function createEmptyInvoice(overrides = {}) {
  const type = overrides.type || 'invoice';
  const meta = TYPE_META[type] || TYPE_META.invoice;

  return {
    id: crypto.randomUUID(),
    type,
    status: meta.status,
    number: `${meta.prefix}-001`,
    currency: 'KES',
    issueDate: getTodayInputValue(),
    dueDate: getFutureInputValue(14),
    taxRate: 16,
    withholdingRate: 0,
    amountPaid: 0,
    branding: {
      logo: '',
      accentColor: '#0f6b4a',
      documentSubtitle: meta.subtitle
    },
    from: { name: '', email: '', phone: '', taxPin: '', address: '' },
    to: { name: '', email: '', phone: '', taxPin: '', address: '' },
    items: [newLineItem()],
    paymentDetails: '',
    notes: 'Payment due within 14 days. Thank you for your business.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

function migrateInvoice(rawInvoice) {
  const fresh = createEmptyInvoice({ type: rawInvoice?.type || 'invoice' });
  const items = Array.isArray(rawInvoice?.items) && rawInvoice.items.length > 0
    ? rawInvoice.items.map((item) => ({ ...newLineItem(), ...item, id: item.id || crypto.randomUUID() }))
    : fresh.items;

  return {
    ...fresh,
    ...rawInvoice,
    amountPaid: rawInvoice?.amountPaid ?? fresh.amountPaid,
    branding: { ...fresh.branding, ...(rawInvoice?.branding || {}) },
    from: { ...fresh.from, ...(rawInvoice?.from || {}) },
    to: { ...fresh.to, ...(rawInvoice?.to || {}) },
    items
  };
}

function loadInitialInvoice() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? migrateInvoice(JSON.parse(saved)) : createEmptyInvoice();
  } catch {
    return createEmptyInvoice();
  }
}

function loadSavedDocuments() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    const documents = saved ? JSON.parse(saved) : [];
    return Array.isArray(documents) ? documents.map(migrateInvoice) : [];
  } catch {
    return [];
  }
}

function touch(document) {
  return { ...document, updatedAt: new Date().toISOString() };
}

function setNestedValue(object, path, value) {
  const keys = path.split('.');
  const clone = structuredClone(object);
  let current = clone;
  keys.slice(0, -1).forEach((key) => {
    current[key] = current[key] ?? {};
    current = current[key];
  });
  current[keys.at(-1)] = value;
  return touch(clone);
}

function upsertDocument(documents, document) {
  const stamped = touch(document);
  const withoutCurrent = documents.filter((item) => item.id !== stamped.id);
  return [stamped, ...withoutCurrent].slice(0, 25);
}

function nextDocumentNumber(type, documents) {
  const meta = TYPE_META[type] || TYPE_META.invoice;
  const matcher = new RegExp(`^${meta.prefix}-(\\d+)$`, 'i');
  const highest = documents.reduce((max, document) => {
    const match = String(document.number || '').match(matcher);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${meta.prefix}-${String(highest + 1).padStart(3, '0')}`;
}

function updateDocumentType(document, nextType, documents) {
  const meta = TYPE_META[nextType] || TYPE_META.invoice;
  return touch({
    ...document,
    type: nextType,
    status: nextType === 'receipt' ? 'paid' : document.status,
    number: nextDocumentNumber(nextType, documents),
    branding: { ...document.branding, documentSubtitle: meta.subtitle },
    amountPaid: nextType === 'receipt' ? 0 : document.amountPaid
  });
}

function buildShareMessage(invoice, totals) {
  const meta = TYPE_META[invoice.type] || TYPE_META.invoice;
  const clientName = invoice.to.name || 'there';
  const dueLabel = invoice.type === 'quote' ? 'Valid until' : invoice.type === 'receipt' ? 'Paid on' : 'Due by';
  const dueDate = invoice.type === 'receipt' ? formatDate(invoice.issueDate) : formatDate(invoice.dueDate);
  const payment = invoice.paymentDetails ? `\nPay via:\n${invoice.paymentDetails}` : '';
  const amountLine = invoice.type === 'receipt'
    ? `for ${formatMoney(totals.total, invoice.currency)}.`
    : `for ${formatMoney(totals.balanceDue || totals.total, invoice.currency)}. ${dueLabel} ${dueDate}.`;
  return `Hi ${clientName}, please find your ${meta.label.toUpperCase()} ${invoice.number || ''} ${amountLine}${payment}\n\nThank you,\n${invoice.from.name || 'Your business'}`;
}

export default function App() {
  const [invoice, setInvoice] = useState(loadInitialInvoice);
  const [savedDocuments, setSavedDocuments] = useState(loadSavedDocuments);
  const [isDownloading, setIsDownloading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const totals = useMemo(
    () => calculateTotals(invoice.items, invoice.taxRate, invoice.withholdingRate, invoice.amountPaid),
    [invoice.items, invoice.taxRate, invoice.withholdingRate, invoice.amountPaid]
  );

  const readiness = useMemo(() => {
    const billableItems = invoice.items.filter((item) => item.description && Number(item.unitPrice) > 0);
    return [
      { label: 'Business details added', done: Boolean(invoice.from.name && invoice.from.email) },
      { label: 'Client details added', done: Boolean(invoice.to.name) },
      { label: 'At least one priced item', done: billableItems.length > 0 },
      { label: 'Payment details added', done: Boolean(invoice.paymentDetails) },
      { label: invoice.type === 'quote' ? 'Expiry date set' : invoice.type === 'receipt' ? 'Payment date set' : 'Due date set', done: Boolean(invoice.dueDate || invoice.type === 'receipt') }
    ];
  }, [invoice]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoice));
  }, [invoice]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(savedDocuments));
  }, [savedDocuments]);

  useEffect(() => {
    document.querySelectorAll('input, select, textarea').forEach((field, index) => {
      if (!field.id) field.id = `invoicekit-field-${index}`;
      if (!field.name) field.name = field.id;
    });
  });

  function flash(message) {
    setSavedMessage(message);
    window.setTimeout(() => setSavedMessage(''), 2500);
  }

  function updateInvoice(path, value) {
    if (path === 'type') {
      setInvoice((current) => updateDocumentType(current, value, savedDocuments));
      return;
    }
    setInvoice((current) => setNestedValue(current, path, value));
  }

  function updateItem(index, field, value) {
    setInvoice((current) => {
      const items = [...current.items];
      items[index] = { ...items[index], [field]: value };
      return touch({ ...current, items });
    });
  }

  function addItem() {
    setInvoice((current) => touch({ ...current, items: [...current.items, newLineItem()] }));
  }

  function removeItem(index) {
    setInvoice((current) => {
      const remainingItems = current.items.filter((_, itemIndex) => itemIndex !== index);
      return touch({ ...current, items: remainingItems.length ? remainingItems : [newLineItem()] });
    });
  }

  function saveDraft() {
    const stamped = touch(invoice);
    setInvoice(stamped);
    setSavedDocuments((current) => upsertDocument(current, stamped));
    flash('Saved to invoice history in this browser.');
  }

  function startNewDocument(type = invoice.type) {
    const meta = TYPE_META[type] || TYPE_META.invoice;
    const next = createEmptyInvoice({
      type,
      status: meta.status,
      number: nextDocumentNumber(type, savedDocuments),
      currency: invoice.currency,
      branding: { ...invoice.branding, documentSubtitle: meta.subtitle },
      from: invoice.from,
      paymentDetails: invoice.paymentDetails,
      notes: type === 'receipt' ? 'Thank you. Payment received.' : invoice.notes
    });
    setInvoice(next);
    flash(`Started ${type === 'quote' ? 'a new quote' : type === 'receipt' ? 'a new receipt' : 'a new invoice'}. Fill in the form on the left.`);
  }

  function loadDocument(documentId) {
    const document = savedDocuments.find((item) => item.id === documentId);
    if (!document) return;
    setInvoice(migrateInvoice(document));
    flash('Loaded saved document.');
  }

  function duplicateDocument(documentId) {
    const document = savedDocuments.find((item) => item.id === documentId);
    if (!document) return;
    const duplicate = migrateInvoice({
      ...document,
      id: crypto.randomUUID(),
      status: document.type === 'receipt' ? 'paid' : 'draft',
      number: nextDocumentNumber(document.type, savedDocuments),
      issueDate: getTodayInputValue(),
      dueDate: getFutureInputValue(14),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: document.items.map((item) => ({ ...item, id: crypto.randomUUID() }))
    });
    setInvoice(duplicate);
    setSavedDocuments((current) => upsertDocument(current, duplicate));
    flash('Duplicated document for faster reuse.');
  }

  function deleteDocument(documentId) {
    const document = savedDocuments.find((item) => item.id === documentId);
    const label = document?.number || 'this document';
    const shouldDelete = window.confirm(`Delete ${label}? This cannot be undone.`);
    if (!shouldDelete) return;

    setSavedDocuments((current) => current.filter((item) => item.id !== documentId));
    if (invoice.id === documentId) startNewDocument(invoice.type);
    flash('Removed saved document.');
  }

  function markDocumentPaid(documentId) {
    setSavedDocuments((current) => current.map((item) => (
      item.id === documentId ? touch({ ...item, status: 'paid' }) : item
    )));
    if (invoice.id === documentId) setInvoice((current) => touch({ ...current, status: 'paid' }));
    flash('Marked as paid.');
  }

  async function copyPaymentMessage() {
    try {
      await navigator.clipboard.writeText(buildShareMessage(invoice, totals));
      flash('Client message copied. Paste it in WhatsApp or email.');
    } catch {
      flash('Could not copy message automatically.');
    }
  }

  function shareToWhatsApp() {
    const message = encodeURIComponent(buildShareMessage(invoice, totals));
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
  }

  function printDocument() {
    window.print();
  }

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadElementAsPDF('invoice-preview', buildDocumentFilename(invoice));
      setSavedDocuments((current) => upsertDocument(current, invoice));
    } catch (error) {
      alert('Could not generate the PDF. Please check the preview and try again.');
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <Header documentType={invoice.type} onDownload={handleDownload} onNewDocument={() => startNewDocument(invoice.type)} onCopyMessage={copyPaymentMessage} onWhatsAppShare={shareToWhatsApp} onPrint={printDocument} isDownloading={isDownloading} />
      {savedMessage && <div className="toast">{savedMessage}</div>}
      <main className="app-shell">
        <InvoiceForm invoice={invoice} totals={totals} readiness={readiness} savedDocuments={savedDocuments} onChange={updateInvoice} onChangeItem={updateItem} onAddItem={addItem} onRemoveItem={removeItem} onSaveDraft={saveDraft} onNewDocument={startNewDocument} onLoadDocument={loadDocument} onDuplicateDocument={duplicateDocument} onDeleteDocument={deleteDocument} onMarkDocumentPaid={markDocumentPaid} />
        <InvoicePreview invoice={invoice} totals={totals} />
      </main>
    </>
  );
}
