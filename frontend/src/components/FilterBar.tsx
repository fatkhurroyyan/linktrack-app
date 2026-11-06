import React from 'react';
import { Search, X, LayoutGrid, List, ArrowDownWideNarrow, SlidersHorizontal, Tag, ChevronDown } from 'lucide-react';
import { FilterState } from '../types/link';
import { ExportDropdown } from './ExportDropdown';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  categories: string[];
  totalCount: number;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  activeTag: string;
  onClearTag: () => void;
  onOpenManageCategories?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, categories, totalCount, viewMode, onViewModeChange, activeTag, onClearTag, onOpenManageCategories }) => (
  <div className="page-width collection-controls" id="collection">
    <div className="collection-heading">
      <div className="collection-title"><h2>Koleksi tautanmu</h2><span className="result-count" aria-live="polite">{new Intl.NumberFormat('id-ID').format(totalCount)} tautan</span></div>
      <button className="text-button" onClick={onOpenManageCategories}><SlidersHorizontal size={15} aria-hidden="true" />Kelola Kategori</button>
    </div>
    <div className="filter-toolbar">
      <div className="search-field">
        <Search size={18} aria-hidden="true" /><label htmlFor="collection-search" className="sr-only">Cari tautan</label>
        <input id="collection-search" name="query" type="search" autoComplete="off" value={filters.query} onChange={(event) => onFilterChange({ query: event.target.value, page: 1 })} placeholder="Cari judul, kata kunci, atau tag…" />
        {filters.query && <button className="icon-button" onClick={() => onFilterChange({ query: '', page: 1 })} aria-label="Hapus pencarian"><X size={16} aria-hidden="true" /></button>}
      </div>
      <div className="filter-options">
        <div className="select-field category-filter">
          <label htmlFor="category-filter" className="sr-only">Filter kategori</label>
          <select id="category-filter" name="category" value={filters.category} onChange={(event) => onFilterChange({ category: event.target.value, page: 1 })}>
            <option value="All">Semua Kategori</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select><ChevronDown size={15} aria-hidden="true" />
        </div>
        <div className="select-field sort-filter">
          <ArrowDownWideNarrow size={15} aria-hidden="true" /><label htmlFor="sort-filter" className="sr-only">Urutkan tautan</label>
          <select id="sort-filter" name="sort" value={`${filters.sortBy}-${filters.sortOrder}`} onChange={(event) => {
            const [sortBy, sortOrder] = event.target.value.split('-') as [FilterState['sortBy'], FilterState['sortOrder']];
            onFilterChange({ sortBy, sortOrder, page: 1 });
          }}>
            <option value="created_at-desc">Terbaru</option><option value="created_at-asc">Terlama</option><option value="title-asc">Judul (A-Z)</option><option value="title-desc">Judul (Z-A)</option><option value="platform-asc">Platform (A-Z)</option>
          </select><ChevronDown size={15} aria-hidden="true" />
        </div>
        <ExportDropdown filters={filters} totalCount={totalCount} />
        <div className="view-switch" role="group" aria-label="Tampilan koleksi">
          <button className={`icon-button ${viewMode === 'grid' ? 'is-selected' : ''}`} aria-label="Tampilan kartu" aria-pressed={viewMode === 'grid'} onClick={() => onViewModeChange('grid')}><LayoutGrid size={17} aria-hidden="true" /></button>
          <button className={`icon-button ${viewMode === 'table' ? 'is-selected' : ''}`} aria-label="Tampilan tabel" aria-pressed={viewMode === 'table'} onClick={() => onViewModeChange('table')}><List size={18} aria-hidden="true" /></button>
        </div>
      </div>
    </div>
    {activeTag && <div className="active-filter"><Tag size={14} aria-hidden="true" /><span>Tag: <strong>#{activeTag}</strong></span><button className="icon-button" onClick={onClearTag} aria-label={`Hapus filter tag ${activeTag}`}><X size={14} aria-hidden="true" /></button></div>}
  </div>
);
