import React from 'react';
import { BarChart3, Layers, Tag, X } from 'lucide-react';
import { AnalyticsStats } from '../types/link';

interface StatsOverviewProps {
  stats: AnalyticsStats | null;
  onSelectCategory: (category: string) => void;
  onSelectTag: (tag: string) => void;
  onClose: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  onSelectCategory,
  onSelectTag,
  onClose,
}) => {
  if (!stats) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="glass-panel rounded-2xl p-5 border border-brand-500/20 relative shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Ringkasan Statistik & Taksonomi</h3>
              <p className="text-[11px] text-slate-400">Distribusi kategori dan tag terpopuler dalam basis pengetahuan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Top Categories */}
          <div>
            <h4 className="font-semibold text-slate-300 flex items-center gap-1.5 mb-2.5">
              <Layers className="w-3.5 h-3.5 text-brand-400" />
              <span>Kategori Utama Teratas</span>
            </h4>
            <div className="space-y-2">
              {stats.top_categories.map((cat) => {
                const percentage = Math.round((cat.count / (stats.total_links || 1)) * 100);
                return (
                  <button
                    key={cat.category}
                    onClick={() => onSelectCategory(cat.category)}
                    className="w-full text-left group"
                  >
                    <div className="flex items-center justify-between text-slate-300 group-hover:text-brand-300 transition-colors mb-1">
                      <span className="font-medium truncate">{cat.category}</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {cat.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </button>
                );
              })}
              {stats.top_categories.length === 0 && (
                <p className="text-slate-500 text-[11px]">Belum ada data kategori.</p>
              )}
            </div>
          </div>

          {/* Top Tags Cloud */}
          <div>
            <h4 className="font-semibold text-slate-300 flex items-center gap-1.5 mb-2.5">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              <span>Tag Cerdas Paling Populer</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {stats.top_tags.map((t) => (
                <button
                  key={t.tag}
                  onClick={() => onSelectTag(t.tag)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-brand-500/20 text-slate-300 hover:text-brand-300 border border-slate-700/60 hover:border-brand-500/30 transition-all text-xs font-medium flex items-center gap-1"
                >
                  <span>#{t.tag}</span>
                  <span className="text-[10px] font-mono text-slate-500">({t.count})</span>
                </button>
              ))}
              {stats.top_tags.length === 0 && (
                <p className="text-slate-500 text-[11px]">Belum ada tag cerdas.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
