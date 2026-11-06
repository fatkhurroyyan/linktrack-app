import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Library, ArrowUpRight, RefreshCw, AlertCircle, CheckCircle2, AlertTriangle, X, Sparkles } from 'lucide-react';

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

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const linkRequest = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#152c33' : '#edf5f5');
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try { localStorage.setItem('linksense-theme', next); } catch { /* Theme still works when storage is unavailable. */ }
  };

  useEffect(() => () => { clearTimeout(toastTimer.current); }, []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showStats, setShowStats] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LinkItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, duration: number = 4500) => {
    clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, duration);
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
    const request = ++linkRequest.current;
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await api.getLinks(filters);
      if (request !== linkRequest.current) return;
      setLinks(Array.isArray(data?.items) ? data.items : []);
      setTotalCount(typeof data?.total === 'number' ? data.total : 0);
    } catch {
      if (request === linkRequest.current) setLoadError('Koleksi belum dapat dimuat. Periksa koneksi, lalu coba lagi.');
    } finally {
      if (request === linkRequest.current) setIsLoading(false);
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
    const timer = setTimeout(() => { void fetchLinks(); }, filters.query ? 250 : 0);
    return () => { clearTimeout(timer); linkRequest.current += 1; };
  }, [fetchLinks, filters.query]);

  // Handler: Process Single Link
  const handleProcessLink = async (url: string): Promise<boolean> => {
    setIsProcessing(true);
    try {
      const newItem = await api.processLink(url);
      showToast('success', `Berhasil mengurasi: "${newItem.title}"`);
      await Promise.all([fetchLinks(), fetchMetadata(), fetchCategories()]);
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Gagal memproses tautan.';
      const isDuplicate = err.response?.status === 409 || errMsg.toLowerCase().includes('sudah pernah');
      if (isDuplicate) {
        showToast('warning', errMsg, 6000);
      } else {
        showToast('error', errMsg);
      }
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Process Batch Links
  const handleProcessBatch = async (urls: string[]): Promise<BatchProcessResponse | null> => {
    setIsProcessing(true);
    try {
      const res = await api.processBatch(urls);
      const dupCount = res.duplicates_count ?? (res.duplicates ? res.duplicates.length : 0);
      const dupList = res.duplicates || [];

      if (res.successful > 0 && dupCount === 0) {
        showToast('success', `Berhasil menambahkan ${res.successful} tautan baru.`);
      } else if (res.successful > 0 && dupCount > 0) {
        const dupNames = dupList.map((d) => d.title || d.url).join(', ');
        showToast(
          'warning',
          `Berhasil menambahkan ${res.successful} tautan baru. ${dupCount} tautan dilewati karena sudah pernah Anda masukkan: ${dupNames}`,
          7500
        );
      } else if (res.successful === 0 && dupCount > 0) {
        const dupNames = dupList.map((d) => d.title || d.url).join(', ');
        showToast(
          'warning',
          `Semua (${dupCount}) tautan dilewati karena sudah pernah Anda masukkan sebelumnya: ${dupNames}`,
          7500
        );
      } else {
        showToast('error', `Batch selesai: ${res.failed} tautan gagal diproses.`);
      }

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
  const handleSaveDetail = async (id: string, updated: Partial<LinkItem>): Promise<boolean> => {
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
      return true;
    } catch (err) {
      // Rollback on failure
      setLinks(previousLinks);
      showToast('error', 'Gagal memperbarui metadata.');
      return false;
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

  const hasFilters = Boolean(filters.query || filters.platform !== 'All' || filters.category !== 'All' || filters.tag);
  const resetFilters = () => setFilters((previous) => ({ ...previous, query: '', platform: 'All', category: 'All', tag: '', page: 1 }));

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Lewati ke konten utama</a>
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toast && <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} aria-hidden="true" /> : toast.type === 'warning' ? <AlertTriangle size={20} aria-hidden="true" /> : <AlertCircle size={20} aria-hidden="true" />}
          <span>{toast.message}</span><button className="icon-button" onClick={() => setToast(null)} aria-label="Tutup notifikasi"><X size={16} aria-hidden="true" /></button>
        </div>}
      </div>
      <Navbar onOpenBatch={() => setIsBatchOpen(true)} onToggleStats={() => setShowStats(!showStats)} showStats={showStats} aiActive={health.ai_active} modelName={health.gemini_model} theme={theme} onToggleTheme={toggleTheme} />
      <main id="main-content" className="main-content" tabIndex={-1}>
        <HeroSection stats={stats} onSelectPlatform={handleSelectPlatform} activePlatform={filters.platform}>
          <IngestionBar onProcess={handleProcessLink} isLoading={isProcessing} />
        </HeroSection>
        {showStats && <StatsOverview stats={stats} onSelectCategory={handleSelectCategory} onSelectTag={handleSelectTag} onClose={() => setShowStats(false)} />}
        <FilterBar filters={filters} onFilterChange={handleFilterChange} categories={categoriesList} totalCount={totalCount} viewMode={viewMode} onViewModeChange={setViewMode} activeTag={filters.tag} onClearTag={handleClearTag} onOpenManageCategories={() => setIsCategoryModalOpen(true)} />
        <div aria-busy={isLoading} className="collection-results">
          {isLoading ? (
            <div className="page-width"><span className="sr-only" role="status">Memuat basis pengetahuan…</span><div className="collection-grid skeleton-grid" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <div className="card-skeleton" key={index}><div className="skeleton-source"><span /><span /></div><div className="skeleton-line skeleton-title" /><div className="skeleton-line" /><div className="skeleton-line" /><div className="skeleton-line skeleton-short" /><div className="skeleton-footer" /></div>)}</div></div>
          ) : loadError ? (
            <div className="page-width"><div className="collection-state error-state" role="alert"><span className="empty-icon"><AlertCircle size={30} aria-hidden="true" /></span><h2>Koleksi belum terhubung</h2><p>{loadError}</p><button className="button button-outline" onClick={() => void fetchLinks()}><RefreshCw size={16} aria-hidden="true" />Coba Lagi</button></div></div>
          ) : links.length === 0 ? (
            <div className="page-width"><div className="collection-state"><span className="empty-icon"><Library size={32} aria-hidden="true" /></span><h2>{hasFilters ? 'Belum menemukan yang kamu cari?' : 'Tempat untuk ide pertamamu.'}</h2><p>{hasFilters ? 'Coba kata kunci lain atau hapus filter untuk melihat seluruh koleksi.' : 'Mulai dengan tautan Google Drive, repositori GitHub, atau artikel yang ingin kamu simpan.'}</p>{hasFilters ? <button className="button button-outline" onClick={resetFilters}>Hapus Semua Filter</button> : <button className="button button-primary" onClick={() => document.getElementById('link-url')?.focus()}><Sparkles size={16} aria-hidden="true" />Simpan Tautan<ArrowUpRight size={16} aria-hidden="true" /></button>}</div></div>
          ) : viewMode === 'grid' ? (
            <div className="page-width"><div className="collection-grid">{links.map((item) => <LinkCard key={item.id} item={item} categoriesList={categoriesList} onSelectTag={handleSelectTag} onOpenDetail={handleOpenDetail} onDelete={handleDeleteLink} onUpdateLink={handleSaveDetail} />)}</div><p className="collection-end">{links.length < totalCount ? `Menampilkan ${new Intl.NumberFormat('id-ID').format(links.length)} dari ${new Intl.NumberFormat('id-ID').format(totalCount)} tautan. Gunakan pencarian atau filter untuk mempersempit koleksi.` : 'Semua referensi ini, siap kamu temukan kembali.'}</p></div>
          ) : <LinkTable items={links} onSelectTag={handleSelectTag} onOpenDetail={handleOpenDetail} onDelete={handleDeleteLink} />}
        </div>
      </main>
      <BatchIngestionModal isOpen={isBatchOpen} onClose={() => setIsBatchOpen(false)} onProcessBatch={handleProcessBatch} isLoading={isProcessing} />
      <CategoryManageModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} categories={categories} onCreateCategory={handleCreateCategory} onDeleteCategory={handleDeleteCategory} />
      <DetailModal item={selectedItem} isOpen={isDetailOpen} categoriesList={categoriesList} onClose={() => setIsDetailOpen(false)} onSave={handleSaveDetail} />
      <footer className="site-footer"><div className="page-width"><span className="footer-brand"><Sparkles size={17} aria-hidden="true" />LinkSense AI</span><p>LinkSense AI &copy; 2026. Powered by Google Gemini &amp; Multi-Platform Universal Scraper.</p><a href="#main-content">Kembali ke atas<ArrowUpRight size={14} aria-hidden="true" /></a></div></footer>
    </div>
  );
};
