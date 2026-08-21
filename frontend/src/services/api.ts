import axios from 'axios';
import {
  LinkItem,
  LinkListResponse,
  BatchProcessResponse,
  AnalyticsStats,
  FilterState,
} from '../types/link';

// Get backend URL from Vercel / Vite env, fallback to relative path
const BACKEND_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_URL = `${BACKEND_BASE}/api/v1`;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Process Single URL
  processLink: async (url: string): Promise<LinkItem> => {
    const res = await apiClient.post<LinkItem>('/links/process', { url });
    return res.data;
  },

  // Process Batch URLs
  processBatch: async (urls: string[]): Promise<BatchProcessResponse> => {
    const res = await apiClient.post<BatchProcessResponse>('/links/batch', { urls });
    return res.data;
  },

  // Get Links with filtering, search, pagination, and sorting
  getLinks: async (filters: Partial<FilterState>): Promise<LinkListResponse> => {
    const params = new URLSearchParams();
    if (filters.query) params.append('query', filters.query);
    if (filters.platform && filters.platform !== 'All') params.append('platform', filters.platform);
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.tag) params.append('tag', filters.tag);
    if (filters.sortBy) params.append('sort_by', filters.sortBy);
    if (filters.sortOrder) params.append('sort_order', filters.sortOrder);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const res = await apiClient.get<LinkListResponse>(`/links?${params.toString()}`);
    return res.data;
  },

  // Get Link Detail
  getLinkDetail: async (id: string): Promise<LinkItem> => {
    const res = await apiClient.get<LinkItem>(`/links/${id}`);
    return res.data;
  },

  // Update Link
  updateLink: async (id: string, data: Partial<LinkItem>): Promise<LinkItem> => {
    const res = await apiClient.put<LinkItem>(`/links/${id}`, data);
    return res.data;
  },

  // Delete Link
  deleteLink: async (id: string): Promise<void> => {
    await apiClient.delete(`/links/${id}`);
  },

  // Get Analytics Stats
  getAnalytics: async (): Promise<AnalyticsStats> => {
    const res = await apiClient.get<AnalyticsStats>('/analytics/stats');
    return res.data;
  },

  // Check Health Status
  getHealth: async (): Promise<{ status: string; gemini_model: string; ai_active: boolean }> => {
    const healthUrl = `${BACKEND_BASE}/health`;
    const res = await axios.get(healthUrl);
    return res.data;
  },

  // Build Export URL
  getExportUrl: (format: 'excel' | 'csv' | 'pdf', filters: Partial<FilterState>): string => {
    const params = new URLSearchParams();
    if (filters.query) params.append('query', filters.query);
    if (filters.platform && filters.platform !== 'All') params.append('platform', filters.platform);
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.tag) params.append('tag', filters.tag);

    return `${API_URL}/export/${format}?${params.toString()}`;
  },
};
