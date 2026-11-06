import { FilterState, LinkItem } from '../types/link';

export function matchesFilters(item: LinkItem, filters: FilterState): boolean {
  if (filters.platform !== 'All' && item.platform !== filters.platform) return false;
  if (filters.category !== 'All' && ![item.primary_category, item.secondary_category].includes(filters.category)) return false;
  if (filters.tag && !item.tags.includes(filters.tag.trim().toLowerCase())) return false;
  const query = filters.query.trim().toLowerCase();
  return !query || [item.title, item.summary, item.subcategory, item.primary_language, item.url]
    .some((value) => value?.toLowerCase().includes(query));
}

export function mergeCreatedLinks(current: LinkItem[], created: LinkItem[], filters: FilterState): LinkItem[] {
  const items = new Map(current.map((item) => [item.id, item]));
  created.filter((item) => matchesFilters(item, filters)).forEach((item) => items.set(item.id, item));
  return Array.from(items.values()).sort((a, b) => {
    const order = filters.sortOrder === 'asc' ? 1 : -1;
    if (filters.sortBy === 'created_at') return order * (Date.parse(a.created_at) - Date.parse(b.created_at));
    return order * a[filters.sortBy].localeCompare(b[filters.sortBy]);
  }).slice(0, filters.limit);
}

export function applyLinkUpdate(item: LinkItem, updated: Partial<LinkItem>): LinkItem {
  const next = { ...item, ...updated };
  next.categories = Array.from(new Set([next.primary_category, next.secondary_category].filter((category): category is string => Boolean(category))));
  return next;
}

export function removeCategoryFromLink(item: LinkItem, category: string): LinkItem {
  const next = { ...item };
  if (next.secondary_category === category) next.secondary_category = undefined;
  if (next.primary_category === category) {
    next.primary_category = next.secondary_category || (next.platform.toLowerCase().includes('drive') ? 'GDrive' : next.platform.toLowerCase().includes('github') ? 'GitHub' : 'Produktivitas & Tools');
    next.secondary_category = undefined;
  }
  return applyLinkUpdate(next, {});
}
