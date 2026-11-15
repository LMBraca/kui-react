#!/usr/bin/env node
// Fails if `next` or any `next/*` module is reachable from the Next-free entries
// (./ui, ./app, ./chart). Next.js is an optional peer: those entries must work in a
// plain React app (Vite, Tauri), and only ./next (libs/adapters/next.tsx) may
// import it. Uses an esbuild metafile, so it follows the same import graph a
// bundler would, including re-exports, and not a text search.
//
// Usage: node scripts/check-next-free.mjs        (blocking in CI)

import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The package entries that must not reach Next, as in tsup.config.ts. */
const ENTRIES = {
  './ui': 'modules/ui/index.ts',
  './app': 'modules/app/index.ts',
  './chart': 'modules/ui/Chart/index.ts',
};

const isNext = (p) => p === 'next' || p.startsWith('next/');

/** Every import edge reachable from one entry: importer -> [{ path, external }]. */
async function graph(entry) {
  const result = await build({
    absWorkingDir: root,
    entryPoints: [entry],
    bundle: true,
    write: false,
    metafile: true,
    // Every package stays an import edge in the metafile instead of being bundled.
    packages: 'external',
    format: 'esm',
    platform: 'neutral',
    jsx: 'automatic',
    tsconfig: 'tsconfig.json',
    logLevel: 'silent',
    // Only the graph matters: stylesheets and assets are leaves.
    loader: { '.css': 'empty', '.svg': 'empty', '.png': 'empty', '.jpg': 'empty', '.json': 'json' },
  });
  return result.metafile.inputs;
}

/** A shortest import chain from `from` to `to` in the metafile, for the error message. */
function chain(inputs, from, to) {
  const prev = new Map([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const file = queue.shift();
    for (const imp of inputs[file]?.imports ?? []) {
      if (prev.has(imp.path)) continue;
      prev.set(imp.path, file);
      if (imp.path === to) {
        const out = [to];
        for (let f = file; f; f = prev.get(f)) out.unshift(f);
        return out;
      }
      if (!imp.external) queue.push(imp.path);
    }
  }
  return [from, '...', to];
}

let failed = false;
for (const [name, entry] of Object.entries(ENTRIES)) {
  const inputs = await graph(entry);
  const hits = [];
  for (const [file, info] of Object.entries(inputs)) {
    for (const imp of info.imports) {
      if (imp.external && isNext(imp.path)) hits.push({ file, spec: imp.path });
    }
  }
  if (hits.length === 0) {
    console.log(`ok   ${name.padEnd(8)} ${Object.keys(inputs).length} files, no next import`);
    continue;
  }
  failed = true;
  console.error(`FAIL ${name.padEnd(8)} reaches Next:`);
  for (const { file, spec } of hits) {
    console.error(`  ${spec}  via  ${chain(inputs, entry, file).join(' > ')}`);
  }
}

if (failed) {
  console.error(
    '\nThese entries must not import Next. Read the pathname and Link through libs/hooks/routeContext.tsx' +
      ' (RouteProvider), and put Next-only code in libs/adapters/next.tsx (the ./next entry).',
  );
  process.exit(1);
}
