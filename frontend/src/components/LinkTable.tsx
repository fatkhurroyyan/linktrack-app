import React from 'react';
import {
  ExternalLink,
  HardDrive,
  Github,
  Globe,
  Edit3,
  Trash2,
} from 'lucide-react';
import { LinkItem } from '../types/link';

interface LinkTableProps {
  items: LinkItem[];
  onSelectTag: (tag: string) => void;
  onOpenDetail: (item: LinkItem) => void;
  onDelete: (id: string) => void;
}

export const LinkTable: React.FC<LinkTableProps> = ({
  items,
  onSelectTag,
  onOpenDetail,
  onDelete,
}) => {
  const getPlatformIcon = (platform: string) => {
    if (platform.toLowerCase().includes('drive')) {
      return <HardDrive className="w-4 h-4 text-amber-400" />;
    }
    if (platform.toLowerCase().includes('github')) {
      return <Github className="w-4 h-4 text-purple-400" />;
    }
    return <Globe className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/90 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4 w-36">Platform</th>
              <th className="py-3 px-4 min-w-[200px]">Judul Resource</th>
              <th className="py-3 px-4 w-44">Kategori & Use-Case</th>
              <th className="py-3 px-4 min-w-[240px]">Ringkasan AI</th>
              <th className="py-3 px-4 w-44">Tags</th>
              <th className="py-3 px-4 w-28 text-center">Tautan</th>
              <th className="py-3 px-4 w-24 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {items.map((item, idx) => (
              <tr
                key={item.id}
                className="hover:bg-slate-800/40 transition-colors group"
              >
                {/* No */}
                <td className="py-3 px-4 text-center font-mono text-slate-500">
                  {idx + 1}
                </td>

                {/* Platform */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 font-medium text-slate-200">
                    {getPlatformIcon(item.platform)}
                    <span>{item.platform}</span>
                  </div>
                  {item.primary_language && (
                    <span className="inline-block mt-1 text-[10px] font-mono text-emerald-400">
                      {item.primary_language}
                    </span>
                  )}
                </td>

                {/* Title */}
                <td className="py-3 px-4">
                  <p className="font-semibold text-white line-clamp-2 group-hover:text-brand-300 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate max-w-xs mt-0.5">
                    {item.url}
                  </p>
                </td>

                {/* Category & Subcategory */}
                <td className="py-3 px-4">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 text-[11px] font-medium mb-1">
                    {item.primary_category}
                  </span>
                  {item.subcategory && (
                    <p className="text-[11px] text-brand-400 font-medium">
                      ↳ {item.subcategory}
                    </p>
                  )}
                </td>

                {/* AI Summary */}
                <td className="py-3 px-4">
                  <p className="text-slate-300 leading-relaxed line-clamp-2">
                    {item.summary || '-'}
                  </p>
                </td>

                {/* Tags */}
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => onSelectTag(tag)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 hover:text-brand-300 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </td>

                {/* URL */}
                <td className="py-3 px-4 text-center">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[11px] font-medium transition-colors"
                  >
                    <span>Buka</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onOpenDetail(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
