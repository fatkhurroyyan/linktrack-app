import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Lock,
  Tag,
  AlertTriangle,
  FolderTree,
  Search,
} from 'lucide-react';
import { Category } from '../types/link';

interface CategoryManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCreateCategory: (name: string) => Promise<boolean>;
  onDeleteCategory: (id: string, force?: boolean) => Promise<boolean>;
}

export const CategoryManageModal: React.FC<CategoryManageModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCreateCategory,
  onDeleteCategory,
}) => {
  if (!isOpen) return null;

  const [newCatName, setNewCatName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const success = await onCreateCategory(newCatName.trim());
      if (success) {
        setNewCatName('');
      } else {
        setErrorMessage('Gagal menambahkan kategori. Pastikan nama belum ada.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Gagal menambahkan kategori.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (cat: Category) => {
    if (cat.is_system) return;
    setDeleteCandidate(cat);
  };

  const handleConfirmDelete = async (force: boolean) => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await onDeleteCategory(deleteCandidate.id, force);
      setDeleteCandidate(null);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail?.message || 'Gagal menghapus kategori.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Kelola Kategori</h2>
              <p className="text-[11px] text-slate-400">
                Tambah atau hapus kategori untuk kurasi dan auto-klasifikasi AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Add Category Form */}
          <form onSubmit={handleCreate} className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-400" />
              <span>Tambah Kategori Baru</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Misal: Machine Learning, Cloud Architecture..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500/60 transition-colors"
                maxLength={80}
              />
              <button
                type="submit"
                disabled={!newCatName.trim() || isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Tambah'}</span>
              </button>
            </div>
            {errorMessage && (
              <p className="text-[11px] text-red-400 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>{errorMessage}</span>
              </p>
            )}
          </form>

          {/* Search within categories */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Daftar Kategori Aktif ({categories.length})
              </span>
              <div className="relative w-44">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kategori..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
                />
              </div>
            </div>

            {/* Category List */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
                  Tidak ada kategori yang cocok.
                </div>
              ) : (
                filteredCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-200">
                        {cat.name}
                      </span>
                      {cat.is_system && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Mutlak</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono">
                        {cat.usage_count} tautan
                      </span>
                      {!cat.is_system && (
                        <button
                          onClick={() => handleDeleteClick(cat)}
                          className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Tutup
          </button>
        </div>

        {/* Delete Confirmation Warning Modal (Option B) */}
        {deleteCandidate && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Hapus Kategori "{deleteCandidate.name}"?
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {deleteCandidate.usage_count > 0 ? (
                      <span className="text-amber-300 font-medium">
                        Peringatan: Kategori ini sedang digunakan oleh{' '}
                        <b className="text-white">{deleteCandidate.usage_count} tautan</b>.
                      </span>
                    ) : (
                      'Kategori ini belum digunakan oleh tautan manapun.'
                    )}
                  </p>
                </div>
              </div>

              {deleteCandidate.usage_count > 0 && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  Jika Anda tetap menghapus kategori ini, link yang terkait akan dialihkan ke kategori sekunder atau kategori default sistem.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteCandidate(null)}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleConfirmDelete(deleteCandidate.usage_count > 0)}
                  disabled={isDeleting}
                  className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/20 transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Kategori'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
