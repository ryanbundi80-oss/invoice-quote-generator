import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import { calculateTotals } from './utils/calculations';
import { downloadElementAsPDF } from './utils/pdf';
import { buildDocumentFilename, formatDate, formatMoney, getFutureInputValue, getTodayInputValue } from './utils/format';
import './styles.css';

const STORAGE_KEY = 'invoicekit-current-draft';
const HISTORY_KEY = 'invoicekit-saved-documents';

function newLineItem() {
  return { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 };
}

function createEmptyInvoice(overrides = {}) {
  const type = overrides.type || 'invoice';
  const prefix = type === 'quote' ? 'QUO' : 'INV';

  return {
    id: crypto.randomUUID(),
    type,
    status: 'unpaid',
    number: `${prefix}-001`,
    currency: 'KES',
    issueDate: getTodayInputValue(),
    dueDate: getFutureInputValue(14),
    taxRate: 16,
    withholdingRate: 0,
    branding: {
      logo: '',
      accentColor: '#0f6b4a',
      documentSubtitle: 'Professional business document'
    },
    from: {
      name: '',
      email: '',
      phone: '',
      taxPin: '',
      address: ''
    },
    to: {
      name: '',
      email: '',
      phone: '',
      taxPin: '',
      address: ''
    },
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
  return [stamped, ...withoutCurrent].slice(0, 12);
}

function nextDocumentNumber(type, documents) {
  const prefix = type === 'quote' ? 'QUO' : 'INV';
  const matcher = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  const highest = documents.reduce((max, document) => {
    const match = String(document.number || '').match(matcher);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `${prefix}-${String(highest + 1).padStart(3, '0')}`;
}

function buildShareMessage(invoice, totals) {
  const title = invoice.type === 'quote' ? 'quote' : 'invoice';
  const clientName = invoice.to.name || 'there';
  const dueLabel = invoice.type === 'quote' ? 'valid until' : 'due on';
  const dueDate = invoice.dueDate ? formatDate(invoice.dueDate) : 'the agreed date';
  const payment = invoice.paymentDetails ? `\n\nPayment details:\n${invoice.paymentDetails}` : '';

  return `Hi ${clientName}, here is ${title.toUpperCase()} ${invoice.number || ''} for ${formatMoney(totals.total, invoice.currency)}, ${dueLabel} ${dueDate}.${payment}\n\nKind regards,\n${invoice.from.name || 'Your business'}`;
}

export default function App() {
  const [invoice, setInvoice] = useState(loadInitialInvoice);
  const [savedDocuments, setSavedDocuments] = useState(loadSavedDocuments);
  const [isDownloading, setIsDownloading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const totals = useMemo(
    () => calculateTotals(invoice.items, invoice.taxRate, invoice.withholdingRate),
    [invoice.items, invoice.taxRate, invoice.withholdingRate]
  );

  const readiness = useMemo(() => {
    const billableItems = invoice.items.filter((item) => item.description && Number(item.unitPrice) > 0);

    return [
      { label: 'Business details added', done: Boolean(invoice.from.name && invoice.from.email) },
      { label: 'Client details added', done: Boolean(invoice.to.name) },
      { label: 'At least one priced item', done: billableItems.length > 0 },
      { label: 'Payment details added', done: Boolean(invoice.paymentDetails) },
      { label: 'Due date set', done: Boolean(invoice.dueDate) }
    ];
  }, [invoice]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoice));
  }, [invoice]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(savedDocuments));
  }, [savedDocuments]);

  function flash(message) {
    setSavedMessage(message);
    window.setTimeout(() => setSavedMessage(''), 2500);
  }

  function updateInvoice(path, value) {
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
    setInvoice((current) => touch({
      ...current,
      items: [...current.items, newLineItem()]
    }));
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
    const next = createEmptyInvoice({
      type,
      number: nextDocumentNumber(type, savedDocuments),
      currency: invoice.currency,
      branding: invoice.branding,
      from: invoice.from,
      paymentDetails: invoice.paymentDetails,
      notes: invoice.notes
    });

    setInvoice(next);
    flash(`Started ${type === 'quote' ? 'a new quote' : 'a new invoice'}.`);
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
      status: 'draft',
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
    setSavedDocuments((current) => current.filter((item) => item.id !== documentId));
    if (invoice.id === documentId) startNewDocument(invoice.type);
    flash('Removed saved document.');
  }

  function markDocumentPaid(documentId) {
    setSavedDocuments((current) => current.map((item) => (
      item.id === documentId ? touch({ ...item, status: 'paid' }) : item
    )));

    if (invoice.id === documentId) {
      setInvoice((current) => touch({ ...current, status: 'paid' }));
    }

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
      <Header
        onDownload={handleDownload}
        onNewDocument={() => startNewDocument(invoice.type)}
        onCopyMessage={copyPaymentMessage}
        isDownloading={isDownloading}
      />
      {savedMessage && <div className="toast">{savedMessage}</div>}
      <main className="app-shell">
        <InvoiceForm
          invoice={invoice}
          totals={totals}
          readiness={readiness}
          savedDocuments={savedDocuments}
          onChange={updateInvoice}
          onChangeItem={updateItem}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onSaveDraft={saveDraft}
          onNewDocument={startNewDocument}
          onLoadDocument={loadDocument}
          onDuplicateDocument={duplicateDocument}
          onDeleteDocument={deleteDocument}
          onMarkDocumentPaid={markDocumentPaid}
        />
        <InvoicePreview invoice={invoice} totals={totals} />
      </main>
    </>
  );
}
