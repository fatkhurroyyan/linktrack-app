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
import { applyLinkUpdate, matchesFilters, mergeCreatedLinks, removeCategoryFromLink } from './utils/collection';
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
  const categoryRequest = useRef(0);
  const statsRequest = useRef(0);
  const linksAbort = useRef<AbortController>();
  const pendingWrites = useRef(0);
  const pendingLinkIds = useRef(new Set<string>());
  const linksRef = useRef(links);
  linksRef.current = links;
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>();
  const refreshFlags = useRef({ links: false, metadata: false });
  const refreshCollection = useRef<() => void>(() => {});
  const refreshMetadata = useRef<() => void>(() => {});
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

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Foreground reads show a skeleton; background reconciliation keeps the
  // collection visible. Ignore responses started before a mutation.
  const fetchLinks = useCallback(async (background = false) => {
    if (pendingWrites.current > 0) {
      refreshFlags.current.links = true;
      return;
    }
    linksAbort.current?.abort();
    const controller = new AbortController();
    linksAbort.current = controller;
    const request = ++linkRequest.current;
    if (!background) { setIsLoading(true); setLoadError(''); }
    else setIsLoading(false);
    try {
      const data = await api.getLinks(filters, controller.signal);
      if (request !== linkRequest.current) return;
      setLinks(Array.isArray(data?.items) ? data.items : []);
      setTotalCount(typeof data?.total === 'number' ? data.total : 0);
    } catch {
      if (request === linkRequest.current && !controller.signal.aborted && !background) {
        setLoadError('Koleksi belum dapat dimuat. Periksa koneksi, lalu coba lagi.');
      }
    } finally {
      if (request === linkRequest.current && !background) setIsLoading(false);
      if (linksAbort.current === controller) linksAbort.current = undefined;
    }
  }, [filters]);

  const fetchCategories = useCallback(async () => {
    const request = ++categoryRequest.current;
    try {
      const data = await api.getCategories();
      if (request === categoryRequest.current && pendingWrites.current === 0 && Array.isArray(data)) setCategories(data);
    } catch { /* Keep the last confirmed categories if background refresh fails. */ }
  }, []);

  const fetchStats = useCallback(async () => {
    const request = ++statsRequest.current;
    try {
      const data = await api.getAnalytics();
      if (request === statsRequest.current && pendingWrites.current === 0) setStats(data);
    } catch { /* A failed statistics refresh must not hide saved links. */ }
  }, []);

  refreshCollection.current = () => { void fetchLinks(true); };
  refreshMetadata.current = () => { void fetchCategories(); void fetchStats(); };

  const beginMutation = () => {
    pendingWrites.current += 1;
    ++linkRequest.current;
    ++categoryRequest.current;
    ++statsRequest.current;
    // Preserve reconciliation work if this write interrupts an older refresh.
    if (linksAbort.current && !linksAbort.current.signal.aborted) refreshFlags.current.links = true;
    linksAbort.current?.abort();
    clearTimeout(refreshTimer.current);
    setIsLoading(false);
  };

  const finishMutation = (refreshLinks = false) => {
    pendingWrites.current -= 1;
    refreshFlags.current.links ||= refreshLinks;
    refreshFlags.current.metadata = true;
    if (pendingWrites.current > 0) return;
    clearTimeout(refreshTimer.current);
    // Combine rapid edits into one refresh, outside the mutation's wait path.
    refreshTimer.current = setTimeout(() => {
      const dirty = refreshFlags.current;
      refreshFlags.current = { links: false, metadata: false };
      if (dirty.links) refreshCollection.current();
      if (dirty.metadata) refreshMetadata.current();
    }, 120);
  };

  useEffect(() => {
    void fetchCategories();
    void fetchStats();
    // Health does not change when a link or category changes.
    let active = true;
    void api.getHealth().then((data) => { if (active) setHealth(data); }).catch(() => {});
    return () => {
      active = false;
      ++categoryRequest.current;
      ++statsRequest.current;
      clearTimeout(refreshTimer.current);
    };
  }, [fetchCategories, fetchStats]);

  useEffect(() => {
    const timer = setTimeout(() => { void fetchLinks(); }, filters.query ? 250 : 0);
    return () => { clearTimeout(timer); ++linkRequest.current; linksAbort.current?.abort(); };
  }, [fetchLinks, filters.query]);

  const insertCreatedItems = (items: LinkItem[]) => {
    const currentFilters = filtersRef.current;
    const existingIds = new Set(linksRef.current.map((item) => item.id));
    const newMatches = items.filter((item) => !existingIds.has(item.id) && matchesFilters(item, currentFilters));
    setLinks((previous) => mergeCreatedLinks(previous, items, currentFilters));
    setTotalCount((previous) => previous + newMatches.length);
    setLoadError('');
  };

  const handleProcessLink = async (url: string): Promise<boolean> => {
    beginMutation();
    setIsProcessing(true);
    try {
      const item = await api.processLink(url);
      insertCreatedItems([item]);
      showToast('success', `Berhasil mengurasi: "${item.title}"`);
      return true;
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Gagal memproses tautan.';
      const duplicate = err.response?.status === 409 || String(message).toLowerCase().includes('sudah pernah');
      showToast(duplicate ? 'warning' : 'error', message, duplicate ? 6000 : 4500);
      return false;
    } finally {
      setIsProcessing(false);
      finishMutation(true);
    }
  };

  const handleProcessBatch = async (urls: string[]): Promise<BatchProcessResponse | null> => {
    beginMutation();
    setIsProcessing(true);
    try {
      const result = await api.processBatch(urls);
      insertCreatedItems(result.items);
      const duplicates = result.duplicates_count ?? result.duplicates?.length ?? 0;
      if (result.successful > 0) {
        showToast(duplicates || result.failed ? 'warning' : 'success', `Berhasil menambahkan ${result.successful} tautan baru.${duplicates ? ` ${duplicates} tautan duplikat dilewati.` : ''}${result.failed ? ` ${result.failed} tautan gagal diproses.` : ''}`);
      } else if (duplicates > 0) {
        showToast('warning', `Semua (${duplicates}) tautan sudah pernah disimpan dan dilewati.`, 6000);
      } else {
        showToast('error', `Batch selesai: ${result.failed} tautan gagal diproses.`);
      }
      return result;
    } catch {
      showToast('error', 'Gagal memproses batch link.');
      return null;
    } finally {
      setIsProcessing(false);
      finishMutation(true);
    }
  };

  const handleSaveDetail = async (id: string, updated: Partial<LinkItem>): Promise<boolean> => {
    if (pendingLinkIds.current.has(id)) {
      showToast('info', 'Perubahan tautan ini masih disimpan. Tunggu sebentar.');
      return false;
    }
    const previousItem = linksRef.current.find((item) => item.id === id);
    pendingLinkIds.current.add(id);
    beginMutation();
    setLinks((previous) => previous.map((item) => item.id === id ? applyLinkUpdate(item, updated) : item));
    try {
      const item = await api.updateLink(id, updated);
      setLinks((previous) => previous.map((entry) => entry.id === id ? item : entry));
      showToast('success', 'Kategori & metadata berhasil diperbarui.');
      return true;
    } catch {
      // Roll back only this item; preserve concurrent changes to other links.
      if (previousItem) setLinks((previous) => previous.map((item) => item.id === id ? previousItem : item));
      showToast('error', 'Gagal memperbarui metadata.');
      return false;
    } finally {
      pendingLinkIds.current.delete(id);
      finishMutation(true);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (pendingLinkIds.current.has(id)) {
      showToast('info', 'Perubahan tautan ini masih disimpan. Tunggu sebentar.');
      return;
    }
    if (!window.confirm('Apakah Anda yakin ingin menghapus tautan ini dari basis pengetahuan?')) return;
    const index = linksRef.current.findIndex((item) => item.id === id);
    const previousItem = linksRef.current[index];
    if (!previousItem) return;
    pendingLinkIds.current.add(id);
    beginMutation();
    setLinks((previous) => previous.filter((item) => item.id !== id));
    setTotalCount((previous) => Math.max(0, previous - 1));
    try {
      await api.deleteLink(id);
      showToast('info', 'Tautan telah dihapus.');
    } catch {
      setLinks((previous) => {
        if (previous.some((item) => item.id === id)) return previous;
        const restored = [...previous];
        restored.splice(Math.min(index, restored.length), 0, previousItem);
        return restored;
      });
      setTotalCount((previous) => previous + 1);
      showToast('error', 'Gagal menghapus tautan.');
    } finally {
      pendingLinkIds.current.delete(id);
      finishMutation(true);
    }
  };

  const handleCreateCategory = async (name: string): Promise<boolean> => {
    beginMutation();
    try {
      const category = await api.createCategory(name);
      setCategories((previous) => [...previous.filter((item) => item.id !== category.id), category]);
      showToast('success', `Kategori "${name}" berhasil dibuat.`);
      return true;
    } catch (err: any) {
      showToast('error', err.response?.data?.detail || 'Gagal membuat kategori.');
      return false;
    } finally {
      finishMutation();
    }
  };

  const handleDeleteCategory = async (id: string, force = false): Promise<boolean> => {
    const category = categories.find((item) => item.id === id);
    beginMutation();
    try {
      const result = await api.deleteCategory(id, force);
      setCategories((previous) => previous.filter((item) => item.id !== id));
      if (category) {
        setLinks((previous) => previous.map((item) => removeCategoryFromLink(item, category.name)));
        setFilters((previous) => previous.category === category.name ? { ...previous, category: 'All', page: 1 } : previous);
      }
      showToast('info', result.message || 'Kategori berhasil dihapus.');
      return true;
    } catch (err: any) {
      showToast('error', err.response?.data?.detail?.message || err.response?.data?.detail || 'Gagal menghapus kategori.');
      return false;
    } finally {
      finishMutation(true);
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
