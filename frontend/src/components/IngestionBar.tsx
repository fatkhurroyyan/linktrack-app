import React, { useState } from 'react';
import { Link2, Sparkles, Loader2, HardDrive, Github, Globe, ArrowRight } from 'lucide-react';

interface IngestionBarProps {
  onProcess: (url: string) => Promise<void>;
  isLoading: boolean;
}

export const IngestionBar: React.FC<IngestionBarProps> = ({ onProcess, isLoading }) => {
  const [url, setUrl] = useState('');

  // Auto-detect platform icon as user types
  const getPlatformIcon = () => {
    const low = url.toLowerCase();
    if (low.includes('drive.google.com') || low.includes('docs.google.com')) {
      return <HardDrive className="w-5 h-5 text-amber-400 animate-bounce" />;
    }
    if (low.includes('github.com')) {
      return <Github className="w-5 h-5 text-purple-400 animate-bounce" />;
    }
    if (low.length > 3) {
      return <Globe className="w-5 h-5 text-blue-400" />;
    }
    return <Link2 className="w-5 h-5 text-slate-500" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = url.trim();
    if (!clean || isLoading) return;
    const normalized = clean.startsWith('http://') || clean.startsWith('https://') ? clean : `https://${clean}`;
    await onProcess(normalized);
    setUrl('');
  };

  const setSampleUrl = (sample: string) => {
    setUrl(sample);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 my-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center rounded-2xl bg-slate-900/90 border border-slate-800 p-2 shadow-2xl focus-within:border-brand-500/60 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
          {/* Left Platform Icon Indicator */}
          <div className="pl-3 pr-2 flex items-center justify-center">
            {getPlatformIcon()}
          </div>

          {/* URL Input Box */}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Tempel tautan (misal: github.com/user/repo atau drive.google.com/...)"
            required
            className="w-full bg-transparent px-2 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            disabled={isLoading}
          />

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white transition-all shadow-glow ${
              !url.trim() || isLoading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 active:scale-95'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Menganalisis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Analisis & Kurasi AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Example Links Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-slate-400">
        <span className="text-slate-500">Coba contoh tautan:</span>
        <button
          type="button"
          onClick={() => setSampleUrl('https://github.com/facebook/react')}
          className="px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-purple-300 border border-slate-800 transition-colors"
        >
          React (GitHub)
        </button>
        <button
          type="button"
          onClick={() => setSampleUrl('https://github.com/fastapi/fastapi')}
          className="px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-emerald-300 border border-slate-800 transition-colors"
        >
          FastAPI (GitHub)
        </button>
        <button
          type="button"
          onClick={() => setSampleUrl('https://drive.google.com/drive/folders/1wK9_samplePublicFolder')}
          className="px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-amber-300 border border-slate-800 transition-colors"
        >
          Google Drive Folder
        </button>
        <button
          type="button"
          onClick={() => setSampleUrl('https://tailwindcss.com/docs/utility-first')}
          className="px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-blue-300 border border-slate-800 transition-colors"
        >
          Tailwind CSS (Web)
        </button>
      </div>
    </div>
  );
};
