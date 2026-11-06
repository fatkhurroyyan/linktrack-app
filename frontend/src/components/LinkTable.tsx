import React from 'react';
import { ArrowUpRight, HardDrive, Github, Globe, Edit3, Trash2 } from 'lucide-react';
import { LinkItem } from '../types/link';

interface LinkTableProps {
  items: LinkItem[];
  onSelectTag: (tag: string) => void;
  onOpenDetail: (item: LinkItem) => void;
  onDelete: (id: string) => void;
}

export const LinkTable: React.FC<LinkTableProps> = ({ items, onSelectTag, onOpenDetail, onDelete }) => (
  <div className="page-width">
    <div className="table-scroll" role="region" aria-label="Tabel koleksi tautan, geser untuk melihat kolom lainnya" tabIndex={0}>
      <table className="link-table">
        <caption className="sr-only">Koleksi tautan tersimpan</caption>
        <thead><tr><th scope="col">Platform</th><th scope="col">Judul Resource</th><th scope="col">Kategori & Use-Case</th><th scope="col">Ringkasan AI</th><th scope="col">Tags</th><th scope="col">Aksi</th></tr></thead>
        <tbody>{items.map((item) => {
          const Icon = item.platform.toLowerCase().includes('drive') ? HardDrive : item.platform.toLowerCase().includes('github') ? Github : Globe;
          return <tr key={item.id}>
            <td><span className="table-platform"><Icon size={16} aria-hidden="true" />{item.platform}</span>{item.primary_language && <small>{item.primary_language}</small>}</td>
            <td><a className="table-title" href={item.url} target="_blank" rel="noopener noreferrer">{item.title}<ArrowUpRight size={14} aria-hidden="true" /></a><small className="table-url">{item.url}</small></td>
            <td><span className="category-label">{item.primary_category}</span>{item.secondary_category && <span className="category-label">{item.secondary_category}</span>}{item.subcategory && <small>{item.subcategory}</small>}</td>
            <td><p className="table-summary">{item.summary || 'Belum ada ringkasan.'}</p></td>
            <td><div className="table-tags">{item.tags.map((tag) => <button key={tag} onClick={() => onSelectTag(tag)}>#{tag}</button>)}</div></td>
            <td><div className="card-actions"><button className="icon-button" onClick={() => onOpenDetail(item)} aria-label={`Lihat detail dan edit ${item.title}`}><Edit3 size={16} aria-hidden="true" /></button><button className="icon-button danger-action" onClick={() => onDelete(item.id)} aria-label={`Hapus ${item.title}`}><Trash2 size={16} aria-hidden="true" /></button></div></td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </div>
);
