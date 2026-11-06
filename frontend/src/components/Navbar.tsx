import React from 'react';
import { Sparkles, PlusCircle, BarChart3, Moon, Sun, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  onOpenBatch: () => void;
  onToggleStats: () => void;
  showStats: boolean;
  aiActive: boolean;
  modelName: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBatch, onToggleStats, showStats, aiActive, modelName, theme, onToggleTheme }) => (
  <header className="site-header">
    <div className="page-width nav-inner">
      <a className="brand" href="#main-content" aria-label="LinkSense AI, beranda">
        <span className="brand-mark"><Sparkles size={23} aria-hidden="true" /></span>
        <span className="brand-name" translate="no">LinkSense <span>AI</span></span>
        <span className="pro-label">PRO</span>
      </a>
      <nav className="nav-actions" aria-label="Navigasi utama">
        <span className={`ai-status ${aiActive ? 'is-active' : ''}`} title={modelName}>
          <span className="status-dot" aria-hidden="true" />{aiActive ? 'AI siap membantu' : 'AI belum aktif'}
        </span>
        <button className="icon-button theme-button" onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Gunakan tema terang' : 'Gunakan tema gelap'} title={theme === 'dark' ? 'Tema terang' : 'Tema gelap'}>
          {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>
        <button className={`button button-quiet stats-toggle ${showStats ? 'is-selected' : ''}`} onClick={onToggleStats} aria-expanded={showStats} aria-controls="collection-statistics" aria-label="Statistik">
          <BarChart3 size={17} aria-hidden="true" /><span>Statistik</span>
        </button>
        <button className="button button-primary batch-button" onClick={onOpenBatch}>
          <PlusCircle size={17} aria-hidden="true" /><span>Batch Input</span><ArrowUpRight className="batch-arrow" size={16} aria-hidden="true" />
        </button>
      </nav>
    </div>
  </header>
);
