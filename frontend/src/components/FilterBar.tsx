import React from 'react';
import {
  Search,
  X,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
  Tag,
  Filter,
} from 'lucide-react';
import { FilterState } from '../types/link';
import { ExportDropdown } from './ExportDropdown';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  categories: string[];
  totalCount: number;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  activeTag: string;
  onClearTag: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  categories,
  totalCount,
  viewMode,
  onViewModeChange,
  activeTag,
  onClearTag,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 space-y-3">
      {/* Top Filter Bar: Search, Category, Sort, Export, View Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-sm">
        {/* Left: Search Input Box */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => onFilterChange({ query: e.target.value, page: 1 })}
            placeholder="Cari tautan, kata kunci, kategori, atau tag..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500/60"
          />
          {filters.query && (
            <button
              onClick={() => onFilterChange({ query: '', page: 1 })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Middle: Category Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <select
              value={filters.category}
              onChange={(e) => onFilterChange({ category: e.target.value, page: 1 })}
              className="w-full sm:w-auto appearance-none bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-8 text-xs text-slate-200 focus:outline-none focus:border-brand-500/60 cursor-pointer"
            >
              <option value="All">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          {/* Sort By Dropdown */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [any, any];
                onFilterChange({ sortBy, sortOrder, page: 1 });
              }}
              className="w-full sm:w-auto appearance-none bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-8 text-xs text-slate-200 focus:outline-none focus:border-brand-500/60 cursor-pointer"
            >
              <option value="created_at-desc">Terbaru</option>
              <option value="created_at-asc">Terlama</option>
              <option value="title-asc">Judul (A-Z)</option>
              <option value="title-desc">Judul (Z-A)</option>
              <option value="platform-asc">Platform (A-Z)</option>
            </select>
            <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Right Actions: Export & View Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
          <ExportDropdown filters={filters} totalCount={totalCount} />

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-slate-800 text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Data Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Tag Pill Filter Indicator */}
      {activeTag && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Filter Tag Aktif:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 font-medium">
            <Tag className="w-3 h-3" />
            <span>#{activeTag}</span>
            <button onClick={onClearTag} className="hover:text-white ml-1">
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}
    </div>
  );
};
