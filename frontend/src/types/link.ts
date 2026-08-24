export interface GDriveFile {
  id: string;
  file_name: string;
  mime_type?: string;
  file_size_bytes?: number;
  web_view_link?: string;
}

export interface Category {
  id: string;
  name: string;
  is_system: boolean;
  usage_count: number;
  created_at?: string;
}

export interface LinkItem {
  id: string;
  url: string;
  platform: 'Google Drive' | 'GitHub' | 'Web' | string;
  title: string;
  primary_category: string;
  secondary_category?: string;
  categories?: string[];
  subcategory?: string;
  summary?: string;
  original_description?: string;
  primary_language?: string;
  item_count?: number;
  total_size_bytes?: number;
  favicon_url?: string;
  raw_metadata?: Record<string, any>;
  tags: string[];
  gdrive_files: GDriveFile[];
  created_at: string;
  updated_at: string;
}

export interface LinkListResponse {
  items: LinkItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface BatchProcessError {
  url: string;
  error: string;
}

export interface BatchProcessResponse {
  total_submitted: number;
  successful: number;
  failed: number;
  items: LinkItem[];
  errors: BatchProcessError[];
}

export interface AnalyticsStats {
  total_links: number;
  platform_counts: {
    'Google Drive': number;
    'GitHub': number;
    'Web': number;
    [key: string]: number;
  };
  top_categories: { category: string; count: number }[];
  top_tags: { tag: string; count: number }[];
  recent_count_7d: number;
}

export interface FilterState {
  query: string;
  platform: string;
  category: string;
  tag: string;
  sortBy: 'created_at' | 'title' | 'platform';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}
