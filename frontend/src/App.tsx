import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { IngestionBar } from './components/IngestionBar';
import { BatchIngestionModal } from './components/BatchIngestionModal';
import { CategoryManageModal } from './components/CategoryManageModal';
import { FilterBar } from './components/FilterBar';
import { LinkCard } from './components/LinkCard';
import { LinkTable } from './components/LinkTable';
import { DetailModal } from './components/DetailModal';
import { StatsOverview } from './components/StatsOverview';
import { api } from './services/api';
import {
  LinkItem,
  AnalyticsStats,
  FilterState,
  BatchProcessResponse,
  Category,
} from './types/link';
import { Layers, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  // State
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [health, setHealth] = useState<{ status: string; gemini_model: string; ai_active: boolean }>({
    status: 'connecting',
    gemini_model: 'gemini-3.7-flash',
    ai_active: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showStats, setShowStats] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LinkItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    query: '',
    platform: 'All',
    category: 'All',
    tag: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 100,
  });

  // Fetch Links
  const fetchLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getLinks(filters);
      setLinks(Array.isArray(data?.items) ? data.items : []);
      setTotalCount(typeof data?.total === 'number' ? data.total : 0);
    } catch (err: any) {
      console.error('Failed to fetch links:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await api.getCategories();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  // Fetch Analytics & Health
  const fetchMetadata = async () => {
    try {
      const [analyticsData, healthData] = await Promise.allSettled([
        api.getAnalytics(),
        api.getHealth(),
      ]);
      if (analyticsData.status === 'fulfilled') {
        setStats(analyticsData.value);
      }
      if (healthData.status === 'fulfilled') {
        setHealth(healthData.value);
      }
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // Handler: Process Single Link
  const handleProcessLink = async (url: string) => {
    setIsProcessing(true);
    try {
      const newItem = await api.processLink(url);
      showToast('success', `Berhasil mengurasi: "${newItem.title}"`);
      await Promise.all([fetchLinks(), fetchMetadata(), fetchCategories()]);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Gagal memproses tautan.';
      showToast('error', errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Process Batch Links
  const handleProcessBatch = async (urls: string[]): Promise<BatchProcessResponse | null> => {
    setIsProcessing(true);
    try {
      const res = await api.processBatch(urls);
      showToast('success', `Batch Selesai: ${res.successful} berhasil, ${res.failed} gagal.`);
      await Promise.all([fetchLinks(), fetchMetadata(), fetchCategories()]);
      return res;
    } catch (err: any) {
      showToast('error', 'Gagal memproses batch link.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Update Link (Optimistic Instant Update without reload)
  const handleSaveDetail = async (id: string, updated: Partial<LinkItem>) => {
    const previousLinks = [...links];

    // 1. Instantly update local state
    setLinks((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextPrimary =
          updated.primary_category !== undefined
            ? updated.primary_category
            : item.primary_category;
        const nextSecondary =
          updated.secondary_category !== undefined
            ? updated.secondary_category || undefined
            : item.secondary_category;
        const nextCategories: string[] = [];
        if (nextPrimary) nextCategories.push(nextPrimary);
        if (nextSecondary && nextSecondary !== nextPrimary) {
          nextCategories.push(nextSecondary);
        }
        return {
          ...item,
          ...updated,
          primary_category: nextPrimary,
          secondary_category: nextSecondary,
          categories: nextCategories,
        };
      })
    );

    try {
      // 2. Send update to server
      const serverUpdated = await api.updateLink(id, updated);

      // 3. Sync item with server response
      setLinks((prev) =>
        prev.map((item) => (item.id === id ? serverUpdated : item))
      );

      showToast('success', 'Kategori & metadata berhasil diperbarui.');

      // 4. Silently refresh category counters & metadata in background (no reload)
      fetchCategories();
      fetchMetadata();
    } catch (err) {
      // Rollback on failure
      setLinks(previousLinks);
      showToast('error', 'Gagal memperbarui metadata.');
    }
  };

  // Handler: Delete Link (Optimistic Instant Update)
  const handleDeleteLink = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus tautan ini dari basis pengetahuan?')) {
      return;
    }
    const previousLinks = [...links];
    setLinks((prev) => prev.filter((item) => item.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));

    try {
      await api.deleteLink(id);
      showToast('info', 'Tautan telah dihapus.');
      fetchCategories();
      fetchMetadata();
    } catch (err) {
      setLinks(previousLinks);
      setTotalCount(previousLinks.length);
      showToast('error', 'Gagal menghapus tautan.');
    }
  };

  // Handler: Create Category
  const handleCreateCategory = async (name: string): Promise<boolean> => {
    try {
      await api.createCategory(name);
      showToast('success', `Kategori "${name}" berhasil dibuat.`);
      await fetchCategories();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Gagal membuat kategori.';
      showToast('error', msg);
      return false;
    }
  };

  // Handler: Delete Category
  const handleDeleteCategory = async (id: string, force: boolean = false): Promise<boolean> => {
    try {
      const res = await api.deleteCategory(id, force);
      showToast('info', res.message || 'Kategori berhasil dihapus.');
      await Promise.all([fetchCategories(), fetchLinks(), fetchMetadata()]);
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Gagal menghapus kategori.';
      showToast('error', msg);
      return false;
    }
  };

  // Filter Modifiers
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleSelectPlatform = (platform: string) => {
    setFilters((prev) => ({ ...prev, platform, page: 1 }));
  };

  const handleSelectCategory = (category: string) => {
    setFilters((prev) => ({ ...prev, category, page: 1 }));
  };

  const handleSelectTag = (tag: string) => {
    setFilters((prev) => ({ ...prev, tag, page: 1 }));
  };

  const handleClearTag = () => {
    setFilters((prev) => ({ ...prev, tag: '', page: 1 }));
  };

  const handleOpenDetail = (item: LinkItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  // Categories list from Category state, analytics, or defaults
  const categoriesList =
    categories.length > 0
      ? categories.map((c) => c.name)
      : stats?.top_categories?.map((c) => c.category) || [
          'GDrive',
          'GitHub',
          'Frontend Development',
          'Backend & API',
          'AI & Machine Learning',
          'Data & Research',
          'Desain & Aset Grafis',
          'DevOps & Cloud',
          'E-book & Edukasi',
          'Produktivitas & Tools',
        ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-brand-500/30 selection:text-brand-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-500/10'
                : toast.type === 'error'
                ? 'bg-red-950/90 text-red-200 border-red-500/40 shadow-red-500/10'
                : 'bg-slate-900/90 text-slate-200 border-slate-700 shadow-slate-500/10'
            } backdrop-blur-md`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        onOpenBatch={() => setIsBatchOpen(true)}
        onToggleStats={() => setShowStats(!showStats)}
        showStats={showStats}
        aiActive={health.ai_active}
        modelName={health.gemini_model}
      />

      {/* Main Content */}
      <main className="flex-1 pb-16">
        {/* Hero Section */}
        <HeroSection
          stats={stats}
          onSelectPlatform={handleSelectPlatform}
          activePlatform={filters.platform}
        />

        {/* URL Ingestion Bar */}
        <IngestionBar
          onProcess={handleProcessLink}
          isLoading={isProcessing}
        />

        {/* Collapsible Stats Overview Drawer */}
        {showStats && (
          <StatsOverview
            stats={stats}
            onSelectCategory={handleSelectCategory}
            onSelectTag={handleSelectTag}
            onClose={() => setShowStats(false)}
          />
        )}

        {/* Filter and Control Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          categories={categoriesList}
          totalCount={totalCount}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          activeTag={filters.tag}
          onClearTag={handleClearTag}
          onOpenManageCategories={() => setIsCategoryModalOpen(true)}
        />

        {/* Content Listing */}
        {isLoading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Memuat basis pengetahuan...</p>
          </div>
        ) : links.length === 0 ? (
          <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tidak Ada Tautan Ditemukan</h3>
              <p className="text-xs text-slate-400 mt-1">
                {filters.query || filters.platform !== 'All' || filters.category !== 'All' || filters.tag
                  ? 'Tidak ada hasil yang sesuai dengan kriteria filter saat ini.'
                  : 'Mulai dengan menempelkan URL Google Drive, GitHub repo, atau link web di atas.'}
              </p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {links.map((item) => (
                <LinkCard
                  key={item.id}
                  item={item}
                  categoriesList={categoriesList}
                  onSelectTag={handleSelectTag}
                  onOpenDetail={handleOpenDetail}
                  onDelete={handleDeleteLink}
                  onUpdateLink={handleSaveDetail}
                />
              ))}
            </div>
          </div>
        ) : (
          <LinkTable
            items={links}
            onSelectTag={handleSelectTag}
            onOpenDetail={handleOpenDetail}
            onDelete={handleDeleteLink}
          />
        )}
      </main>

      {/* Batch Ingestion Modal */}
      <BatchIngestionModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onProcessBatch={handleProcessBatch}
        isLoading={isProcessing}
      />

      {/* Category Management Modal */}
      <CategoryManageModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCreateCategory={handleCreateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Detail & Edit Modal */}
      <DetailModal
        item={selectedItem}
        isOpen={isDetailOpen}
        categoriesList={categoriesList}
        onClose={() => setIsDetailOpen(false)}
        onSave={handleSaveDetail}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600 bg-slate-950">
        <p>
          LinkSense AI &copy; 2026. Powered by Google Gemini &amp; Multi-Platform Universal Scraper.
        </p>
      </footer>
    </div>
  );
};
