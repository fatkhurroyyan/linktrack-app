import React, { useState } from 'react';
import { X, Sparkles, Loader2, Layers } from 'lucide-react';
import { BatchProcessResponse } from '../types/link';

interface BatchIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessBatch: (urls: string[]) => Promise<BatchProcessResponse | null>;
  isLoading: boolean;
}

export const BatchIngestionModal: React.FC<BatchIngestionModalProps> = ({
  isOpen,
  onClose,
  onProcessBatch,
  isLoading,
}) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  // Extract and normalize URLs from lines (auto-prepend https:// if missing)
  const urls = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      if (line.startsWith('http://') || line.startsWith('https://')) {
        return line;
      }
      return `https://${line}`;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (urls.length === 0 || isLoading) return;
    const res = await onProcessBatch(urls);
    if (res) {
      setText('');
      onClose(); // Auto-close modal on finish
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Batch Link Ingestion</h2>
              <p className="text-xs text-slate-400">
                Tempel beberapa tautan (satu baris per tautan, tanpa https:// juga bisa).
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Daftar URL (Satu per baris):</span>
              <span className="font-mono text-brand-400 font-semibold">
                {urls.length} Tautan terdeteksi
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="github.com/facebook/react&#10;drive.google.com/drive/folders/12345...&#10;fastapi.tiangolo.com&#10;https://tailwindcss.com"
              rows={6}
              disabled={isLoading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={urls.length === 0 || isLoading}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-glow ${
                urls.length === 0 || isLoading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses {urls.length} Tautan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Mulai Kurasi Batch ({urls.length})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
