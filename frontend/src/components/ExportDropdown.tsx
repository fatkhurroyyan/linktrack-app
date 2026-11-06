import React, { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileCode, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import { FilterState } from '../types/link';

export const ExportDropdown: React.FC<{ filters: FilterState; totalCount: number }> = ({ filters, totalCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const outside = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setIsOpen(false); };
    const keyboard = (event: KeyboardEvent) => { if (event.key === 'Escape') { setIsOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', keyboard); };
  }, [isOpen]);
  return (
    <div className="export-dropdown" ref={ref} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false); }}>
      <button ref={trigger} className="button button-outline export-trigger" disabled={!totalCount} onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} aria-controls="export-options"><Download size={16} aria-hidden="true" /><span>Ekspor Dokumen</span><ChevronDown size={14} aria-hidden="true" /></button>
      {isOpen && <div className="export-menu" id="export-options">
        <p className="export-caption">Ekspor {new Intl.NumberFormat('id-ID').format(totalCount)} tautan sesuai filter</p>
        {([
          ['excel', 'Spreadsheet Excel', '.xlsx', FileSpreadsheet],
          ['csv', 'File CSV', '.csv', FileCode],
          ['pdf', 'Katalog PDF', '.pdf', FileText],
        ] as const).map(([format, label, extension, Icon]) => <a key={format} href={api.getExportUrl(format, filters)} target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)}><Icon size={19} aria-hidden="true" /><span>{label}<small>{extension}</small></span><Download size={14} aria-hidden="true" /></a>)}
      </div>}
    </div>
  );
};
