import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/utils/collection.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 } });
const { matchesFilters, mergeCreatedLinks, removeCategoryFromLink, applyLinkUpdate } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const filters = { query: '', platform: 'All', category: 'All', tag: '', sortBy: 'created_at', sortOrder: 'desc', page: 1, limit: 100 };
const link = { id: 'one', url: 'https://example.com/one', platform: 'Web', title: 'CSS reference', primary_category: 'Frontend', secondary_category: 'Design', summary: 'Layout guide', tags: ['css'], created_at: '2026-11-01T00:00:00Z', gdrive_files: [] };

test('a saved link appears immediately in date order without duplicate IDs', () => {
  const added = { ...link, id: 'two', created_at: '2026-11-06T00:00:00Z' };
  assert.deepEqual(mergeCreatedLinks([link], [added, added], filters).map((item) => item.id), ['two', 'one']);
});
test('new links respect active source, both category slots, tag, and text filters', () => {
  assert.equal(matchesFilters(link, { ...filters, category: 'Design', tag: 'css', query: 'LAYOUT' }), true);
  for (const override of [{ platform: 'GitHub' }, { category: 'Backend' }, { tag: 'python' }, { query: 'unrelated' }]) {
    assert.deepEqual(mergeCreatedLinks([], [link], { ...filters, ...override }), []);
  }
});
test('local insertion respects alphabetical sort and page size', () => {
  const added = { ...link, id: 'two', title: 'Accessibility' };
  assert.deepEqual(mergeCreatedLinks([link], [added], { ...filters, sortBy: 'title', sortOrder: 'asc', limit: 1 }).map((item) => item.id), ['two']);
});
test('removing a primary category promotes the surviving secondary category', () => {
  const item = removeCategoryFromLink(link, 'Frontend');
  assert.equal(item.primary_category, 'Design');
  assert.equal(item.secondary_category, undefined);
  assert.deepEqual(item.categories, ['Design']);
  assert.equal(link.primary_category, 'Frontend');
});
test('category removal uses platform fallbacks and preserves unrelated metadata', () => {
  for (const [platform, expected] of [['Web', 'Produktivitas & Tools'], ['GitHub', 'GitHub'], ['Google Drive', 'GDrive']]) {
    const item = removeCategoryFromLink({ ...link, platform, secondary_category: 'Frontend' }, 'Frontend');
    assert.equal(item.primary_category, expected);
    assert.deepEqual(item.tags, ['css']);
  }
});
test('clearing only the second category preserves the primary and unrelated fields', () => {
  const item = removeCategoryFromLink(link, 'Design');
  assert.equal(item.primary_category, 'Frontend');
  assert.equal(item.secondary_category, undefined);
  assert.deepEqual(applyLinkUpdate(link, { secondary_category: '' }).categories, ['Frontend']);
});
