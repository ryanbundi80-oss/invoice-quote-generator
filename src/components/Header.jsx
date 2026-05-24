import { Download, RotateCcw } from 'lucide-react';

export default function Header({ onDownload, onReset, isDownloading }) {
  return (
    <header className="topbar">
      <div className="brand-mark" aria-label="InvoiceKit home">
        <span className="brand-dot" />
        <span>InvoiceKit</span>
      </div>

      <div className="topbar-actions">
        <button className="btn btn-secondary" type="button" onClick={onReset}>
          <RotateCcw size={16} />
          Reset
        </button>
        <button className="btn btn-primary" type="button" onClick={onDownload} disabled={isDownloading}>
          <Download size={16} />
          {isDownloading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>
    </header>
  );
}
