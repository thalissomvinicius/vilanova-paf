import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Commit the portable renderer so Vercel does not need the sibling app checkout.
const root = new URL('../', import.meta.url);
const output = new URL('src/field/visit-report.generated.mjs', root);
const result = await build({
  entryPoints: [fileURLToPath(new URL('../paf-app/src/reports/visitReport.ts', root))],
  bundle: true, platform: 'browser', format: 'esm', write: false,
  banner: { js: '// Generated from paf-app by scripts/sync-visit-report.mjs. Do not edit.' },
});
const contents = result.outputFiles[0].text;
if (process.argv.includes('--check')) {
  if ((await readFile(output, 'utf8')).replaceAll('\r\n', '\n') !== contents) throw new Error('Report differs from app. Run node scripts/sync-visit-report.mjs.');
} else await writeFile(output, contents);
