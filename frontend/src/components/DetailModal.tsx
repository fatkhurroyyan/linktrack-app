import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Save,
  Tag,
  FileText,
  FolderTree,
  Code,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { LinkItem } from '../types/link';

interface DetailModalProps {
  item: LinkItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updated: Partial<LinkItem>) => Promise<void>;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !item) return null;

  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.primary_category);
  const [subcategory, setSubcategory] = useState(item.subcategory || '');
  const [summary, setSummary] = useState(item.summary || '');
  const [tagsStr, setTagsStr] = useState(item.tags.join(', '));
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'files' | 'raw'>('edit');

  useEffect(() => {
    setTitle(item.title);
    setCategory(item.primary_category);
    setSubcategory(item.subcategory || '');
    setSummary(item.summary || '');
    setTagsStr(item.tags.join(', '));
  }, [item]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const tagsArray = tagsStr
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      await onSave(item.id, {
        title,
        primary_category: category,
        subcategory,
        summary,
        tags: tagsArray,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-semibold">
              {item.platform}
            </span>
            <h2 className="text-sm font-bold text-white truncate max-w-md">
              Detail & Edit Metadata
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/30 text-xs">
          <button
            onClick={() => setActiveTab('edit')}
            className={`pb-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'edit'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Informasi & AI Summary
          </button>
          {item.gdrive_files && item.gdrive_files.length > 0 && (
            <button
              onClick={() => setActiveTab('files')}
              className={`pb-2 font-semibold transition-colors border-b-2 flex items-center gap-1 ${
                activeTab === 'files'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Daftar Berkas ({item.gdrive_files.length})</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('raw')}
            className={`pb-2 font-semibold transition-colors border-b-2 flex items-center gap-1 ${
              activeTab === 'raw'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Raw Metadata JSON</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'edit' && (
            <form onSubmit={handleSave} id="detail-form" className="space-y-3.5">
              {/* URL */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">URL Sumber</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono text-[11px]">
                  <span className="truncate flex-1">{item.url}</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                    title="Buka"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Judul Resource</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500/60"
                />
              </div>

              {/* Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Kategori Utama</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500/60"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Sub-Kategori / Use Case</label>
                  <input
                    type="text"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500/60"
                  />
                </div>
              </div>

              {/* AI Summary */}
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand-400" />
                  <span>Ringkasan AI (Executive Summary)</span>
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500/60"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>Tags (Pisahkan dengan koma)</span>
                </label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="react, frontend, ui-library"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-brand-500/60"
                />
              </div>
            </form>
          )}

          {activeTab === 'files' && (
            <div className="space-y-2">
              <p className="text-slate-400 text-[11px] mb-2">
                Daftar berkas yang terdeteksi di dalam Google Drive folder ini:
              </p>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                {item.gdrive_files.map((file) => (
                  <div key={file.id} className="p-3 flex items-center justify-between hover:bg-slate-900/50">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="font-medium text-slate-200 truncate">{file.file_name}</span>
                    </div>
                    {file.web_view_link && (
                      <a
                        href={file.web_view_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px] flex-shrink-0 ml-3"
                      >
                        <span>Buka</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'raw' && (
            <div>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-80">
                {JSON.stringify(item.raw_metadata || {}, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Ditambahkan: {new Date(item.created_at).toLocaleString('id-ID')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-slate-300 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              Batal
            </button>
            {activeTab === 'edit' && (
              <button
                type="submit"
                form="detail-form"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-semibold transition-all shadow-glow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
