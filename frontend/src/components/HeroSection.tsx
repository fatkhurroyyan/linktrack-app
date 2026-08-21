import React from 'react';
import { HardDrive, Github, Globe, Sparkles } from 'lucide-react';
import { AnalyticsStats } from '../types/link';

interface HeroSectionProps {
  stats: AnalyticsStats | null;
  onSelectPlatform: (platform: string) => void;
  activePlatform: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  stats,
  onSelectPlatform,
  activePlatform,
}) => {
  const gdriveCount = stats?.platform_counts?.['Google Drive'] || 0;
  const githubCount = stats?.platform_counts?.['GitHub'] || 0;
  const webCount = stats?.platform_counts?.['Web'] || 0;
  const totalCount = stats?.total_links || 0;

  return (
    <div className="relative pt-6 pb-4 overflow-hidden">
      {/* Background Glow Decorations */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Didukung Google Gemini 3.7 Flash & Ekspor Dokumen Kerja Cerdas</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3">
          Ubah Tautan Mentah Menjadi{' '}
          <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
            Basis Pengetahuan Terstruktur
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 mb-6">
          Otomatisasi pembacaan struktur Google Drive, analisis repositori GitHub & README, serta scraping web umum dengan taksonomi bertingkat dan ekspor Excel satu klik.
        </p>

        {/* Quick Platform Statistics Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onSelectPlatform('All')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activePlatform === 'All'
                ? 'bg-slate-800 text-white border border-slate-600 shadow-md'
                : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800/50'
            }`}
          >
            <span>Semua Tautan</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-750 text-slate-200 text-[11px] font-mono">
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => onSelectPlatform('Google Drive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activePlatform === 'Google Drive'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow'
                : 'bg-slate-900/70 text-slate-400 hover:text-amber-300 border border-slate-800/80 hover:bg-slate-800/50'
            }`}
          >
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>Google Drive</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[11px] font-mono border border-amber-500/20">
              {gdriveCount}
            </span>
          </button>

          <button
            onClick={() => onSelectPlatform('GitHub')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activePlatform === 'GitHub'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-glow'
                : 'bg-slate-900/70 text-slate-400 hover:text-purple-300 border border-slate-800/80 hover:bg-slate-800/50'
            }`}
          >
            <Github className="w-4 h-4 text-purple-400" />
            <span>GitHub Repos</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[11px] font-mono border border-purple-500/20">
              {githubCount}
            </span>
          </button>

          <button
            onClick={() => onSelectPlatform('Web')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activePlatform === 'Web'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-glow'
                : 'bg-slate-900/70 text-slate-400 hover:text-blue-300 border border-slate-800/80 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Situs Web & Artikel</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-[11px] font-mono border border-blue-500/20">
              {webCount}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
