import { useMemo, useState } from 'react';
import Header from './components/Header';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import { calculateTotals } from './utils/calculations';
import { downloadElementAsPDF } from './utils/pdf';
import { getFutureInputValue, getTodayInputValue } from './utils/format';
import './styles.css';

const STORAGE_KEY = 'invoicekit-current-draft';

const emptyInvoice = {
  type: 'invoice',
  status: 'unpaid',
  number: 'INV-001',
  currency: 'KES',
  issueDate: getTodayInputValue(),
  dueDate: getFutureInputValue(14),
  taxRate: 16,
  withholdingRate: 0,
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
    address: ''
  },
  items: [
    { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }
  ],
  paymentDetails: '',
  notes: 'Payment due within 14 days. Thank you for your business.'
};

function loadInitialInvoice() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : emptyInvoice;
  } catch {
    return emptyInvoice;
  }
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
  return clone;
}

export default function App() {
  const [invoice, setInvoice] = useState(loadInitialInvoice);
  const [isDownloading, setIsDownloading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const totals = useMemo(
    () => calculateTotals(invoice.items, invoice.taxRate, invoice.withholdingRate),
    [invoice.items, invoice.taxRate, invoice.withholdingRate]
  );

  function updateInvoice(path, value) {
    setInvoice((current) => setNestedValue(current, path, value));
  }

  function updateItem(index, field, value) {
    setInvoice((current) => {
      const items = [...current.items];
      items[index] = { ...items[index], [field]: value };
      return { ...current, items };
    });
  }

  function addItem() {
    setInvoice((current) => ({
      ...current,
      items: [...current.items, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]
    }));
  }

  function removeItem(index) {
    setInvoice((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function saveDraft() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoice));
    setSavedMessage('Draft saved in this browser.');
    window.setTimeout(() => setSavedMessage(''), 2500);
  }

  function resetInvoice() {
    localStorage.removeItem(STORAGE_KEY);
    setInvoice({ ...emptyInvoice, items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }] });
  }

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadElementAsPDF('invoice-preview', `${invoice.number || 'invoice'}.pdf`);
    } catch (error) {
      alert('Could not generate the PDF. Please check the preview and try again.');
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <Header onDownload={handleDownload} onReset={resetInvoice} isDownloading={isDownloading} />
      {savedMessage && <div className="toast">{savedMessage}</div>}
      <main className="app-shell">
        <InvoiceForm
          invoice={invoice}
          totals={totals}
          onChange={updateInvoice}
          onChangeItem={updateItem}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onSaveDraft={saveDraft}
        />
        <InvoicePreview invoice={invoice} totals={totals} />
      </main>
    </>
  );
}
