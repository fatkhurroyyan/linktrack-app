import React from 'react';
import { HardDrive, Github, Globe, Library } from 'lucide-react';
import { AnalyticsStats } from '../types/link';

interface HeroSectionProps {
  stats: AnalyticsStats | null;
  onSelectPlatform: (platform: string) => void;
  activePlatform: string;
  children?: React.ReactNode;
}

const sources = [
  { value: 'All', label: 'Semua Tautan', icon: Library },
  { value: 'Google Drive', label: 'Google Drive', icon: HardDrive },
  { value: 'GitHub', label: 'GitHub Repos', icon: Github },
  { value: 'Web', label: 'Situs Web & Artikel', icon: Globe },
];

export const HeroSection: React.FC<HeroSectionProps> = ({ stats, onSelectPlatform, activePlatform, children }) => (
  <section className="page-width workspace-intro" aria-labelledby="workspace-title">
    <div className="intro-panel">
      <div className="intro-content">
        <h1 id="workspace-title">Tautan tersimpan.<br /><span>Ide tetap terhubung.</span></h1>
        <p className="intro-description">Satu tempat untuk referensi, repositori, dan inspirasi.<br className="desktop-break" /> Simpan tautannya, biarkan AI merapikannya.</p>
        {children}
      </div>
      <div className="intro-art" aria-hidden="true">
        <img src="/images/library-companion.webp" alt="" width="360" height="360" fetchPriority="high" />
      </div>
    </div>
    <div className="source-tabs" role="group" aria-label="Filter berdasarkan platform">
      {sources.map(({ value, label, icon: Icon }) => (
        <button key={value} className={`source-tab ${activePlatform === value ? 'is-selected' : ''}`} aria-pressed={activePlatform === value} onClick={() => onSelectPlatform(value)}>
          <Icon size={18} aria-hidden="true" /><span>{label}</span>
          <span className="source-count">{stats ? new Intl.NumberFormat('id-ID').format(value === 'All' ? stats.total_links : stats.platform_counts?.[value] ?? 0) : '…'}</span>
        </button>
      ))}
    </div>
  </section>
);
