import React, { useState } from 'react';
import { Plus, Trash2, Lock, Search } from 'lucide-react';
import { Category } from '../types/link';
import { ModalShell } from './ModalShell';

interface CategoryManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCreateCategory: (name: string) => Promise<boolean>;
  onDeleteCategory: (id: string, force?: boolean) => Promise<boolean>;
}

export const CategoryManageModal: React.FC<CategoryManageModalProps> = ({ isOpen, onClose, categories, onCreateCategory, onDeleteCategory }) => {
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [candidate, setCandidate] = useState<Category | null>(null);
  const [error, setError] = useState('');
  if (!isOpen) return null;
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true); setError('');
    try { if (await onCreateCategory(name.trim())) setName(''); else setError('Kategori belum ditambahkan. Pastikan namanya belum dipakai, lalu coba lagi.'); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!candidate || busy) return;
    setBusy(true); setError('');
    try { if (await onDeleteCategory(candidate.id, candidate.usage_count > 0)) setCandidate(null); else setError('Kategori belum dihapus. Coba lagi.'); }
    finally { setBusy(false); }
  };
  const filtered = categories.filter((category) => category.name.toLowerCase().includes(search.toLowerCase()));
  return <ModalShell title="Kelola Kategori" description="Atur ruang untuk setiap topik dalam koleksimu." onClose={onClose}>
    <div className="modal-body form-stack">
      <form onSubmit={create} className="field"><label htmlFor="category-name">Tambah Kategori Baru</label><div className="inline-form"><input id="category-name" name="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required autoComplete="off" placeholder="Misalnya, Frontend Development…" disabled={busy} /><button className="button button-primary" disabled={busy}><Plus size={16} aria-hidden="true" />{busy ? 'Menyimpan…' : 'Tambah'}</button></div></form>
      {error && <p className="inline-message is-error" role="alert">{error}</p>}
      <div className="category-list-heading"><h3>Daftar kategori <span className="muted">({categories.length})</span></h3><div className="search-field"><Search size={16} aria-hidden="true" /><label htmlFor="category-search" className="sr-only">Cari kategori</label><input id="category-search" name="category-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari kategori…" autoComplete="off" /></div></div>
      <ul className="category-list">{filtered.map((category) => <li key={category.id}><div className="category-list-name"><span>{category.name}</span>{category.is_system && <span className="system-label"><Lock size={11} aria-hidden="true" />Mutlak</span>}</div><span className="category-usage">{category.usage_count} tautan</span>{!category.is_system && <button className="icon-button danger-action" onClick={() => { setError(''); setCandidate(category); }} aria-label={`Hapus kategori ${category.name}`}><Trash2 size={16} aria-hidden="true" /></button>}</li>)}</ul>
      {!filtered.length && <p className="muted">{search ? 'Tidak ada kategori yang cocok. Coba kata kunci lain.' : 'Buat kategori pertamamu menggunakan formulir di atas.'}</p>}
    </div>
    <div className="modal-footer"><button className="button button-outline" onClick={onClose}>Tutup</button></div>
    {candidate && <ModalShell title={`Hapus kategori “${candidate.name}”?`} description={candidate.usage_count ? `Kategori ini digunakan oleh ${candidate.usage_count} tautan. Tautan terkait akan dialihkan ke kategori sekunder atau kategori default sistem.` : 'Kategori ini belum digunakan oleh tautan mana pun.'} onClose={() => setCandidate(null)}>
      {error && <p className="modal-body field-error" role="alert">{error}</p>}
      <div className="modal-footer"><button className="button button-outline" onClick={() => setCandidate(null)}>Batal</button><button className="button button-danger" onClick={remove} disabled={busy}><Trash2 size={16} aria-hidden="true" />{busy ? 'Menghapus…' : 'Ya, Hapus Kategori'}</button></div>
    </ModalShell>}
  </ModalShell>;
};
