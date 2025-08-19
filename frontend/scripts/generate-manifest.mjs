import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Generate a manifest of available concept-map datasets by scanning the
// public/data directory.  This keeps the dropdown in sync whenever JSON
// files are added or removed without relying on manual edits.
async function main() {
  const dataDir = new URL('../public/data/', import.meta.url);
  const files = await readdir(dataDir);
  const datasets = [];

  for (const file of files) {
    // Only consider JSON files; ignore the manifest itself and auxiliary data
    if (!file.endsWith('.json') || file === 'manifest.json' || file.startsWith('term_')) {
      continue;
    }

    const fileUrl = new URL(file, dataDir);
    let name = path.basename(file, '.json');

    try {
      const raw = await readFile(fileUrl, 'utf8');
      const json = JSON.parse(raw);
      // Prefer explicit titles; fall back to first node's name or filename
      name = json?.metadata?.name || json?.metadata?.title || json?.nodes?.[0]?.name || name;
    } catch (err) {
      // If a file fails to parse we still include it with its filename-based name
      console.warn(`Could not parse ${file}:`, err);
    }

    datasets.push({ file, name });
  }

  // Sort for stable ordering in the UI
  datasets.sort((a, b) => a.name.localeCompare(b.name));

  // If two datasets report the same display name we append the filename so
  // users can still distinguish them in the dropdown.
  const counts = datasets.reduce((acc, d) => {
    acc[d.name] = (acc[d.name] || 0) + 1;
    return acc;
  }, {});
  for (const d of datasets) {
    if (counts[d.name] > 1) d.name += ` (${d.file})`;
  }

  const manifestPath = new URL('manifest.json', dataDir);
  await writeFile(manifestPath, JSON.stringify(datasets, null, 2) + '\n');
  console.log(`Wrote ${datasets.length} entries to`, manifestPath.pathname);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
