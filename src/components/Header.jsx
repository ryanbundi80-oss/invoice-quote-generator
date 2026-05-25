import { Download, FilePlus2, MessageSquareText, Printer, Send } from 'lucide-react';

export default function Header({ documentType = 'invoice', onDownload, onNewDocument, onCopyMessage, onWhatsAppShare, onPrint, isDownloading }) {
  const label = documentType === 'quote' ? 'quote' : documentType === 'receipt' ? 'receipt' : 'invoice';

  return (
    <header className="topbar">
      <div className="brand-mark" aria-label="InvoiceKit home">
        <span className="brand-dot" />
        <span>InvoiceKit</span>
      </div>

      <div className="topbar-actions">
        <button className="btn btn-secondary" type="button" onClick={onNewDocument} title="Starts a blank document using your current business details">
          <FilePlus2 size={16} />
          New {label}
        </button>
        <button className="btn btn-secondary" type="button" onClick={onCopyMessage}>
          <MessageSquareText size={16} />
          Copy message
        </button>
        <button className="btn btn-secondary" type="button" onClick={onWhatsAppShare}>
          <Send size={16} />
          WhatsApp
        </button>
        <button className="btn btn-secondary" type="button" onClick={onPrint}>
          <Printer size={16} />
          Print
        </button>
        <button className="btn btn-primary" type="button" onClick={onDownload} disabled={isDownloading}>
          <Download size={16} />
          {isDownloading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>
    </header>
  );
}
