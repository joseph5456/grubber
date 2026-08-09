import { ADJECTIVES, NOUNS, generateProduct } from './productGenerator';
import { Product } from './types';

export interface CatalogEntry {
  name: string;
  category: string;
  syntheticKey: string;
}

let cache: CatalogEntry[] | null = null;

/** Every ADJECTIVE x NOUN combination — reuses the same fabricated vocabulary as random scans. */
export function getCatalog(): CatalogEntry[] {
  if (cache) return cache;
  cache = ADJECTIVES.flatMap((adjective) =>
    NOUNS.map((noun) => ({
      name: `${adjective} ${noun}`,
      category: noun,
      syntheticKey: `catalog:${adjective}:${noun}`,
    })),
  );
  return cache;
}

export function searchCatalog(query: string): CatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getCatalog().filter((entry) => entry.name.toLowerCase().includes(q));
}

export function productFromCatalogEntry(entry: CatalogEntry): Product {
  return generateProduct(entry.syntheticKey, { name: entry.name, category: entry.category });
}

/** Best same-category alternative, excluding the product just scanned. */
export function findBetterAlternative(category: string, excludeKey: string): Product | undefined {
  const candidates = getCatalog().filter(
    (entry) => entry.category === category && entry.syntheticKey !== excludeKey,
  );

  let best: Product | undefined;
  for (const entry of candidates) {
    const product = productFromCatalogEntry(entry);
    if (product.score >= 80) return product;
    if (!best || product.score > best.score) best = product;
  }
  return best;
}
