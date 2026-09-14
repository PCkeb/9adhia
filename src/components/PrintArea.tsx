import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getPrintSettings, type AppSettings } from '@/lib/settings';

interface PrintAreaProps {
  title: string;
  children: ReactNode;
}

/**
 * Renders print content into a separate portal container (#print-document)
 * that is hidden on screen but shown during print via CSS @media print.
 * The app (#root) is hidden during printing, so only #print-document appears.
 */
export function PrintArea({ title, children }: PrintAreaProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    getPrintSettings().then(setSettings);
  }, []);

  const lines = settings ? [
    settings.header_line1, settings.header_line2, settings.header_line3,
    settings.header_line4, settings.header_line5, settings.header_line6,
  ].filter(l => l) : [];

  const hasGovHeader = lines.length > 0;

  const printContent = (
    <div id="print-document" style={{ display: 'none' }}>
      {/* Government header */}
      {hasGovHeader && (
        <div className="print-header-only">
          {lines.map((line, i) => (
            <div key={i} className="gov-line" style={{ position: 'relative', minHeight: '1.6em' }}>
              <span>{line}</span>
              {i === 2 && settings?.header_date_text && (
                <span className="gov-date" style={{ position: 'absolute', left: 0, top: 0 }}>{settings.header_date_text}</span>
              )}
            </div>
          ))}
          {settings?.header_ref_text && (
            <div className="gov-ref">{settings.header_ref_text}</div>
          )}
        </div>
      )}

      {/* Fallback simple header */}
      {!hasGovHeader && (
        <div className="print-header-only">
          <h1>{settings?.print_header_title ?? title}</h1>
          {settings?.print_header_subtitle && <p>{settings.print_header_subtitle}</p>}
          {settings?.print_header_logo_text && <p className="logo-text">{settings.print_header_logo_text}</p>}
        </div>
      )}

      {/* Document content */}
      <div className="print-content-only">
        <h2 className="print-doc-title">{title}</h2>
        {children}
      </div>
    </div>
  );

  // Portal into document.body so it's outside #root
  return createPortal(printContent, document.body);
}
