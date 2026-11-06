import React from 'react';
import { BarChart3, X, Tag } from 'lucide-react';
import { AnalyticsStats } from '../types/link';

interface StatsOverviewProps {
  stats: AnalyticsStats | null;
  onSelectCategory: (category: string) => void;
  onSelectTag: (tag: string) => void;
  onClose: () => void;
}
export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, onSelectCategory, onSelectTag, onClose }) => (
  <section className="page-width statistics" id="collection-statistics" aria-labelledby="statistics-title">
    <div className="statistics-panel">
      <div className="panel-heading"><div><h2 id="statistics-title"><BarChart3 size={20} aria-hidden="true" />Ringkasan Statistik & Taksonomi</h2><p>Kenali isi koleksimu. Pilih kategori atau tag untuk menjelajah.</p></div><button className="icon-button" onClick={onClose} aria-label="Tutup statistik"><X size={19} aria-hidden="true" /></button></div>
      {!stats ? <p className="muted">Statistik belum tersedia. Coba buka kembali setelah koneksi pulih.</p> : <div className="stats-columns">
        <div><h3>Kategori paling banyak disimpan</h3><div className="category-stats">{stats.top_categories.map((category) => <button key={category.category} onClick={() => onSelectCategory(category.category)}><span>{category.category}</span><strong>{new Intl.NumberFormat('id-ID').format(category.count)}<small> tautan</small></strong></button>)}{!stats.top_categories.length && <p className="muted">Kategori akan muncul setelah kamu menyimpan tautan.</p>}</div></div>
        <div><h3><Tag size={15} aria-hidden="true" />Tag populer</h3><div className="stats-tags">{stats.top_tags.map((tag) => <button key={tag.tag} onClick={() => onSelectTag(tag.tag)}>#{tag.tag}<span>{new Intl.NumberFormat('id-ID').format(tag.count)}</span></button>)}{!stats.top_tags.length && <p className="muted">Belum ada tag dalam koleksi.</p>}</div></div>
      </div>}
    </div>
  </section>
);
