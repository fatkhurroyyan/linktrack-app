import React, { useState } from 'react';
import {
  ExternalLink,
  HardDrive,
  Github,
  Globe,
  Star,
  GitFork,
  Trash2,
  Edit3,
  FolderTree,
  ChevronDown,
  ChevronUp,
  FileText,
  Lock,
} from 'lucide-react';
import { LinkItem } from '../types/link';

interface LinkCardProps {
  item: LinkItem;
  categoriesList: string[];
  onSelectTag: (tag: string) => void;
  onOpenDetail: (item: LinkItem) => void;
  onDelete: (id: string) => void;
  onUpdateLink?: (id: string, updated: Partial<LinkItem>) => Promise<void>;
}

export const LinkCard: React.FC<LinkCardProps> = ({
  item,
  categoriesList,
  onSelectTag,
  onOpenDetail,
  onDelete,
  onUpdateLink,
}) => {
  const [showFiles, setShowFiles] = useState(false);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);

  const isGDrive =
    item.platform.toLowerCase().includes('drive') ||
    item.url.toLowerCase().includes('drive.google.com');
  const isGitHub =
    item.platform.toLowerCase().includes('github') ||
    item.url.toLowerCase().includes('github.com');

  const getPlatformBadge = () => {
    if (isGDrive) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
          <HardDrive className="w-3.5 h-3.5" />
          <span>Google Drive</span>
        </span>
      );
    }
    if (isGitHub) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold">
          <Github className="w-3.5 h-3.5" />
          <span>GitHub</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
        <Globe className="w-3.5 h-3.5" />
        <span>Web</span>
      </span>
    );
  };

  // Handle Changing Secondary Category for GDrive / GitHub
  const handleSecondaryCategoryChange = async (newSec: string) => {
    if (!onUpdateLink) return;
    setIsUpdatingCategory(true);
    try {
      const secVal = newSec.trim() ? newSec.trim() : null;
      await onUpdateLink(item.id, {
        primary_category: isGDrive ? 'GDrive' : isGitHub ? 'GitHub' : item.primary_category,
        secondary_category: secVal || undefined,
      });
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  // Handle Changing Primary Category for Web
  const handleWebPrimaryCategoryChange = async (newPrim: string) => {
    if (!onUpdateLink || !newPrim) return;
    setIsUpdatingCategory(true);
    try {
      await onUpdateLink(item.id, {
        primary_category: newPrim,
        secondary_category: item.secondary_category || undefined,
      });
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  // Filter available categories for secondary dropdown (exclude GDrive/GitHub)
  const availableSecondaryOptions = categoriesList.filter(
    (c) => c !== 'GDrive' && c !== 'GitHub'
  );

  const stars = item.raw_metadata?.stars;
  const forks = item.raw_metadata?.forks;

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
      {/* Top Meta Bar */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {getPlatformBadge()}

            {/* Category Slot 1 */}
            {isGDrive ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-[11px] font-medium border border-amber-500/30"
                title="Kategori mutlak Google Drive (Terkunci)"
              >
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                <span>GDrive</span>
              </span>
            ) : isGitHub ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 text-[11px] font-medium border border-purple-500/30"
                title="Kategori mutlak GitHub (Terkunci)"
              >
                <Lock className="w-2.5 h-2.5 text-purple-400" />
                <span>GitHub</span>
              </span>
            ) : (
              <div className="relative inline-block">
                <select
                  value={item.primary_category}
                  onChange={(e) => handleWebPrimaryCategoryChange(e.target.value)}
                  disabled={isUpdatingCategory}
                  className="appearance-none bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium px-2 py-0.5 pr-5 rounded-md border border-slate-700 focus:outline-none focus:border-brand-500 cursor-pointer transition-colors"
                  title="Ubah Kategori Utama"
                >
                  {availableSecondaryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-2.5 h-2.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Category Slot 2 (Optional Second Category) */}
            <div className="relative inline-block">
              <select
                value={item.secondary_category || ''}
                onChange={(e) => handleSecondaryCategoryChange(e.target.value)}
                disabled={isUpdatingCategory}
                className={`appearance-none text-[11px] font-medium px-2 py-0.5 pr-5 rounded-md border transition-colors cursor-pointer ${
                  item.secondary_category
                    ? 'bg-slate-800 hover:bg-slate-700 text-brand-300 border-brand-500/30'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border-dashed border-slate-700'
                }`}
                title="Atur Kategori Ke-2 (Maksimal 2 Kategori)"
              >
                <option value="">
                  {item.secondary_category ? '— Hapus Kategori 2 —' : '+ Kategori 2'}
                </option>
                {availableSecondaryOptions
                  .filter((cat) => cat !== item.primary_category)
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {item.primary_language && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[11px] font-mono border border-emerald-500/20">
                {item.primary_language}
              </span>
            )}
          </div>

          {/* Direct External Link */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
            title="Buka Tautan Asli"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2 mb-1.5 group-hover:text-brand-300 transition-colors">
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            {item.title}
          </a>
        </h3>

        {/* Subcategory / Use Case */}
        {item.subcategory && (
          <p className="text-xs text-brand-400 font-medium mb-2">
            ↳ {item.subcategory}
          </p>
        )}

        {/* AI Summary Box */}
        {item.summary && (
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-3">
            {item.summary}
          </p>
        )}

        {/* GitHub Stars/Forks if applicable */}
        {(stars !== undefined || forks !== undefined) && (
          <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 font-mono">
            {stars !== undefined && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {stars.toLocaleString()}
              </span>
            )}
            {forks !== undefined && (
              <span className="flex items-center gap-1">
                <GitFork className="w-3.5 h-3.5 text-slate-400" />
                {forks.toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Google Drive Files Expander */}
        {item.gdrive_files && item.gdrive_files.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setShowFiles(!showFiles)}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>{item.gdrive_files.length} Berkas dalam Folder</span>
              {showFiles ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showFiles && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 max-h-36 overflow-y-auto space-y-1.5 text-xs">
                {item.gdrive_files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between text-slate-300">
                    <span className="truncate flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      {file.file_name}
                    </span>
                    {file.web_view_link && (
                      <a
                        href={file.web_view_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-400 hover:underline flex-shrink-0 ml-2"
                      >
                        Buka
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: Tags & Action Buttons */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-hidden max-h-6">
          {item.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectTag(tag)}
              className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-brand-300 text-[10px] font-medium transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onOpenDetail(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-colors"
            title="Lihat Detail & Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            title="Hapus Tautan"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
