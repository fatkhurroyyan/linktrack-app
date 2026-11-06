import React, { useState } from 'react';
import { ArrowUpRight, Save, FileText, Code, FolderTree, Lock } from 'lucide-react';
import { LinkItem } from '../types/link';
import { ModalShell } from './ModalShell';

interface DetailModalProps {
  item: LinkItem | null;
  isOpen: boolean;
  categoriesList?: string[];
  onClose: () => void;
  onSave: (id: string, updated: Partial<LinkItem>) => Promise<boolean>;
}

const DetailEditor: React.FC<Omit<DetailModalProps, 'isOpen' | 'item'> & { item: LinkItem }> = ({ item, categoriesList = [], onClose, onSave }) => {
  const isDrive = item.platform.toLowerCase().includes('drive') || item.url.includes('drive.google.com');
  const isGithub = item.platform.toLowerCase().includes('github') || item.url.includes('github.com');
  const [title, setTitle] = useState(item.title);
  const [primary, setPrimary] = useState(isDrive ? 'GDrive' : isGithub ? 'GitHub' : item.primary_category);
  const [secondary, setSecondary] = useState(item.secondary_category || '');
  const [subcategory, setSubcategory] = useState(item.subcategory || '');
  const [summary, setSummary] = useState(item.summary || '');
  const [tags, setTags] = useState(item.tags.join(', '));
  const [tab, setTab] = useState('edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const available = categoriesList.filter((category) => category !== 'GDrive' && category !== 'GitHub');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError('');
    try {
      const success = await onSave(item.id, { title, primary_category: primary, secondary_category: secondary.trim(), subcategory, summary, tags: tags.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean) });
      if (success) onClose(); else setError('Perubahan belum tersimpan. Periksa koneksi dan coba lagi.');
    } finally { setSaving(false); }
  };
  return <ModalShell title="Detail & Edit Metadata" description={item.title} onClose={onClose} wide>
    <div className="detail-tabs" role="group" aria-label="Bagian detail tautan">
      <button className={tab === 'edit' ? 'is-selected' : ''} aria-pressed={tab === 'edit'} onClick={() => setTab('edit')}><FileText size={15} aria-hidden="true" />Informasi & AI Summary</button>
      {item.gdrive_files?.length > 0 && <button className={tab === 'files' ? 'is-selected' : ''} aria-pressed={tab === 'files'} onClick={() => setTab('files')}><FolderTree size={15} aria-hidden="true" />Daftar Berkas ({item.gdrive_files.length})</button>}
      <button className={tab === 'raw' ? 'is-selected' : ''} aria-pressed={tab === 'raw'} onClick={() => setTab('raw')}><Code size={15} aria-hidden="true" />Raw Metadata JSON</button>
    </div>
    <div className="modal-body">
      {tab === 'edit' && <form id="detail-form" onSubmit={submit} className="form-stack">
        <div className="field"><span className="field-label">URL Sumber</span><a className="source-url" href={item.url} target="_blank" rel="noopener noreferrer"><span>{item.url}</span><ArrowUpRight size={17} aria-hidden="true" /></a></div>
        <div className="field"><label htmlFor="detail-title">Judul Resource</label><input id="detail-title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required disabled={saving} /></div>
        <div className="field-columns">
          <div className="field"><label htmlFor={isDrive || isGithub ? undefined : 'detail-primary'}>Kategori Utama {isDrive || isGithub ? '(Mutlak)' : ''}</label>{isDrive || isGithub ? <div className="locked-field"><Lock size={14} aria-hidden="true" />{primary}<small>Terkunci otomatis</small></div> : <select id="detail-primary" name="primary_category" value={primary} onChange={(event) => setPrimary(event.target.value)} disabled={saving}>{Array.from(new Set([primary, ...available])).map((category) => <option key={category}>{category}</option>)}</select>}</div>
          <div className="field"><label htmlFor="detail-secondary">Kategori Ke-2 (Opsional)</label><select id="detail-secondary" name="secondary_category" value={secondary} onChange={(event) => setSecondary(event.target.value)} disabled={saving}><option value="">Tidak ada kategori kedua</option>{Array.from(new Set([secondary, ...available].filter((category) => category && category !== primary))).map((category) => <option key={category}>{category}</option>)}</select></div>
        </div>
        <div className="field"><label htmlFor="detail-subcategory">Subkategori / Use-Case</label><input id="detail-subcategory" name="subcategory" value={subcategory} onChange={(event) => setSubcategory(event.target.value)} disabled={saving} /></div>
        <div className="field"><label htmlFor="detail-summary">Ringkasan AI</label><textarea id="detail-summary" name="summary" value={summary} onChange={(event) => setSummary(event.target.value)} rows={4} disabled={saving} /></div>
        <div className="field"><label htmlFor="detail-tags">Tags</label><input id="detail-tags" name="tags" value={tags} onChange={(event) => setTags(event.target.value)} aria-describedby="detail-tags-hint" disabled={saving} /><p id="detail-tags-hint" className="form-hint">Pisahkan setiap tag dengan koma.</p></div>
        {error && <p className="inline-message is-error" role="alert">{error}</p>}
      </form>}
      {tab === 'files' && <ul className="detail-files">{item.gdrive_files.map((file) => <li key={file.id}><FileText size={18} aria-hidden="true" /><div><strong>{file.file_name}</strong>{file.mime_type && <small>{file.mime_type}</small>}</div>{file.web_view_link && <a className="icon-button" href={file.web_view_link} target="_blank" rel="noopener noreferrer" aria-label={`Buka ${file.file_name}`}><ArrowUpRight size={18} aria-hidden="true" /></a>}</li>)}</ul>}
      {tab === 'raw' && <pre className="metadata-code" tabIndex={0}>{JSON.stringify(item.raw_metadata || {}, null, 2)}</pre>}
    </div>
    <div className="modal-footer"><button className="button button-outline" type="button" onClick={onClose}>Tutup</button>{tab === 'edit' && <button className="button button-primary" type="submit" form="detail-form" disabled={saving}><Save size={16} aria-hidden="true" />{saving ? 'Menyimpan…' : 'Simpan Perubahan'}</button>}</div>
  </ModalShell>;
};

export const DetailModal: React.FC<DetailModalProps> = ({ isOpen, item, ...props }) => !isOpen || !item ? null : <DetailEditor key={item.id} item={item} {...props} />;
