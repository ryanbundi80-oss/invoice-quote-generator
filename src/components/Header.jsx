import { Download, FilePlus2, MessageSquareText } from 'lucide-react';

export default function Header({ onDownload, onNewDocument, onCopyMessage, isDownloading }) {
  return (
    <header className="topbar">
      <div className="brand-mark" aria-label="InvoiceKit home">
        <span className="brand-dot" />
        <span>InvoiceKit</span>
      </div>

      <div className="topbar-actions">
        <button className="btn btn-secondary" type="button" onClick={onNewDocument}>
          <FilePlus2 size={16} />
          New
        </button>
        <button className="btn btn-secondary" type="button" onClick={onCopyMessage}>
          <MessageSquareText size={16} />
          Copy client message
        </button>
        <button className="btn btn-primary" type="button" onClick={onDownload} disabled={isDownloading}>
          <Download size={16} />
          {isDownloading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>
    </header>
  );
}
