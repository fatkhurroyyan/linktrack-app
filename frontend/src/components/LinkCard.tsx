import React, { useState } from 'react';
import { ArrowUpRight, HardDrive, Github, Globe, Star, GitFork, Trash2, Edit3, FolderTree, ChevronDown, FileText, Lock } from 'lucide-react';
import { LinkItem } from '../types/link';

interface LinkCardProps {
  item: LinkItem;
  categoriesList: string[];
  onSelectTag: (tag: string) => void;
  onOpenDetail: (item: LinkItem) => void;
  onDelete: (id: string) => void;
  onUpdateLink?: (id: string, updated: Partial<LinkItem>) => Promise<unknown>;
}

export const LinkCard: React.FC<LinkCardProps> = ({ item, categoriesList, onSelectTag, onOpenDetail, onDelete, onUpdateLink }) => {
  const [showFiles, setShowFiles] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const isDrive = item.platform.toLowerCase().includes('drive') || item.url.includes('drive.google.com');
  const isGithub = item.platform.toLowerCase().includes('github') || item.url.includes('github.com');
  const Icon = isDrive ? HardDrive : isGithub ? Github : Globe;
  const source = isDrive ? 'Google Drive' : isGithub ? 'GitHub' : 'Situs Web';
  const available = categoriesList.filter((category) => category !== 'GDrive' && category !== 'GitHub');
  const primaryOptions = Array.from(new Set([item.primary_category, ...available].filter(Boolean)));
  let host = item.url;
  try { host = new URL(item.url).hostname.replace(/^www\./, ''); } catch { /* Keep the original URL for legacy entries. */ }
  const update = async (category: string, secondary = false) => {
    if (!onUpdateLink) return;
    setIsUpdating(true);
    try {
      await onUpdateLink(item.id, secondary ? { primary_category: isDrive ? 'GDrive' : isGithub ? 'GitHub' : item.primary_category, secondary_category: category } : { primary_category: category, secondary_category: item.secondary_category || undefined });
    } finally { setIsUpdating(false); }
  };
  return (
    <article className="link-card" data-platform={isDrive ? 'drive' : isGithub ? 'github' : 'web'}>
      <div className="card-top">
        <div className="source-identity"><span className="source-icon"><Icon size={21} aria-hidden="true" /></span><div><span className="source-name">{source}</span><span className="source-host" title={host}>{host}</span></div></div>
        <a className="icon-button open-link" href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`Buka ${item.title} di tab baru`}><ArrowUpRight size={19} aria-hidden="true" /></a>
      </div>
      <h3 className="card-title"><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a></h3>
      {item.subcategory && <p className="card-use-case">{item.subcategory}</p>}
      <p className="card-summary">{item.summary || 'Ringkasan belum tersedia. Buka detail untuk melengkapi informasi tautan.'}</p>
      {(item.primary_language || item.raw_metadata?.stars !== undefined || item.raw_metadata?.forks !== undefined) && <div className="repository-meta">
        {item.primary_language && <span>{item.primary_language}</span>}
        {item.raw_metadata?.stars !== undefined && <span><Star size={13} aria-hidden="true" />{new Intl.NumberFormat('id-ID').format(item.raw_metadata.stars)}<span className="sr-only"> bintang</span></span>}
        {item.raw_metadata?.forks !== undefined && <span><GitFork size={13} aria-hidden="true" />{new Intl.NumberFormat('id-ID').format(item.raw_metadata.forks)}<span className="sr-only"> fork</span></span>}
      </div>}
      <div className="card-categories">
        {isDrive || isGithub ? <span className="locked-category"><Lock size={12} aria-hidden="true" />{isDrive ? 'GDrive' : 'GitHub'}</span> : <select aria-label={`Kategori utama untuk ${item.title}`} value={item.primary_category} disabled={isUpdating || !onUpdateLink} onChange={(event) => update(event.target.value)}>{primaryOptions.map((category) => <option key={category}>{category}</option>)}</select>}
        <select aria-label={`Kategori kedua untuk ${item.title}`} value={item.secondary_category || ''} disabled={isUpdating || !onUpdateLink} onChange={(event) => update(event.target.value, true)}>
          <option value="">{item.secondary_category ? 'Hapus kategori kedua' : '+ Kategori kedua'}</option>
          {Array.from(new Set([item.secondary_category, ...available].filter((category): category is string => Boolean(category) && category !== item.primary_category))).map((category) => <option key={category}>{category}</option>)}
        </select>
        {isUpdating && <span className="sr-only" role="status">Menyimpan kategori…</span>}
      </div>
      {item.gdrive_files?.length > 0 && <div className="drive-files">
        <button className="text-button" onClick={() => setShowFiles(!showFiles)} aria-expanded={showFiles} aria-controls={`files-${item.id}`}><FolderTree size={15} aria-hidden="true" />{item.gdrive_files.length} berkas dalam folder<ChevronDown size={14} className={showFiles ? 'is-rotated' : ''} aria-hidden="true" /></button>
        {showFiles && <ul id={`files-${item.id}`} className="file-list">{item.gdrive_files.map((file) => <li key={file.id}><FileText size={14} aria-hidden="true" /><span>{file.file_name}</span>{file.web_view_link && <a href={file.web_view_link} target="_blank" rel="noopener noreferrer" aria-label={`Buka ${file.file_name}`}>Buka</a>}</li>)}</ul>}
      </div>}
      <div className="card-footer">
        <div className="card-tags">{item.tags.slice(0, 2).map((tag) => <button key={tag} onClick={() => onSelectTag(tag)}>#{tag}</button>)}{item.tags.length > 2 && <button onClick={() => onOpenDetail(item)} aria-label={`Lihat ${item.tags.length - 2} tag lainnya untuk ${item.title}`}>+{item.tags.length - 2}</button>}</div>
        <div className="card-actions"><button className="icon-button" onClick={() => onOpenDetail(item)} aria-label={`Lihat detail dan edit ${item.title}`} title="Lihat Detail & Edit"><Edit3 size={16} aria-hidden="true" /></button><button className="icon-button danger-action" onClick={() => onDelete(item.id)} aria-label={`Hapus ${item.title}`} title="Hapus Tautan"><Trash2 size={16} aria-hidden="true" /></button></div>
      </div>
    </article>
  );
};
