import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, FileCode, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import { FilterState } from '../types/link';

interface ExportDropdownProps {
  filters: FilterState;
  totalCount: number;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({ filters, totalCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (format: 'excel' | 'csv' | 'pdf') => {
    const url = api.getExportUrl(format, filters);
    // Trigger direct browser download
    window.open(url, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={totalCount === 0}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
          totalCount === 0
            ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
            : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm active:scale-95'
        }`}
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span>Ekspor Dokumen</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl glass-dropdown z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
            <p className="text-[11px] font-semibold text-slate-300">Format Ekspor ({totalCount} tautan)</p>
            <p className="text-[10px] text-slate-500">Mengekspor sesuai filter aktif saat ini</p>
          </div>

          {/* Excel .xlsx */}
          <button
            onClick={() => handleExport('excel')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800/90 hover:text-white transition-colors group text-left"
          >
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="font-medium block">Spreadsheet Excel (.xlsx)</span>
              <span className="text-[10px] text-slate-400 block">Tabel rapi + Hyperlink aktif</span>
            </div>
          </button>

          {/* CSV */}
          <button
            onClick={() => handleExport('csv')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800/90 hover:text-white transition-colors group text-left"
          >
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <span className="font-medium block">File CSV (.csv)</span>
              <span className="text-[10px] text-slate-400 block">Format standar UTF-8 BOM</span>
            </div>
          </button>

          {/* PDF */}
          <button
            onClick={() => handleExport('pdf')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800/90 hover:text-white transition-colors group text-left"
          >
            <div className="p-1.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 group-hover:bg-red-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="font-medium block">Katalog PDF (.pdf)</span>
              <span className="text-[10px] text-slate-400 block">Dokumen siap cetak & baca</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
