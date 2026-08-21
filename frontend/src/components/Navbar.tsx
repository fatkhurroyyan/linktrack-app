import React from 'react';
import { Sparkles, PlusCircle, BarChart3 } from 'lucide-react';

interface NavbarProps {
  onOpenBatch: () => void;
  onToggleStats: () => void;
  showStats: boolean;
  totalCount?: number;
  aiActive: boolean;
  modelName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBatch,
  onToggleStats,
  showStats,
  aiActive,
  modelName,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-[1px] shadow-glow">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                LinkSense AI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Universal Resource Curator & Knowledge Hub
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* AI Status Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${aiActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-medium">{modelName}</span>
            <span className="text-slate-500 font-mono text-[11px]">Structured JSON</span>
          </div>

          {/* Stats Toggle Button */}
          <button
            onClick={onToggleStats}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              showStats
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
            title="Tampilkan Analisis Statistik"
          >
            <BarChart3 className="w-4 h-4 text-brand-400" />
            <span className="hidden sm:inline">Statistik</span>
          </button>

          {/* Batch Ingest Button */}
          <button
            onClick={onOpenBatch}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white text-xs font-semibold shadow-glow transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Batch Input</span>
          </button>
        </div>
      </div>
    </header>
  );
};
