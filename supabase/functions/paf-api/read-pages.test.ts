import { readPages } from './read-pages.ts';

Deno.test('legacy reads preserve more than one thousand rows without incomplete summaries', async () => {
  const source = Array.from({ length: 1257 }, (_, id) => ({ id }));
  const ranges: number[][] = [];
  const rows = await readPages(async (from, to) => { ranges.push([from, to]); return { data: source.slice(from, to + 1), error: null }; }, 'Read failed');
  if (rows.length !== 1257 || rows[1256].id !== 1256 || ranges.length !== 3) throw new Error('Pagination lost rows');
});
Deno.test('partial reads fail rather than returning inaccurate totals', async () => {
  let failed = false;
  try { await readPages(async from => from === 0 ? { data: new Array(500).fill({ id: 1 }), error: null } : { data: null, error: { message: 'private database detail' } }, 'Could not read'); }
  catch (error) { failed = error instanceof Error && error.message === 'Could not read'; }
  if (!failed) throw new Error('Incomplete data accepted');
});
