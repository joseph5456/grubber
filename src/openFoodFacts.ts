import { FlagTag, Grade, Nutrition, Product, ProductDetails } from './types';

const API_BASE = 'https://world.openfoodfacts.org/api/v2';
const SEARCH_BASE = 'https://search.openfoodfacts.org/search';
const USER_AGENT = 'my-app/1.0 (https://github.com/joseph5456/my-app)';
const TIMEOUT_MS = 10000;

const FIELDS = [
  'code',
  'product_name',
  'product_name_en',
  'generic_name',
  'brands',
  'categories_tags',
  'quantity',
  'serving_size',
  'image_front_url',
  'nutriments',
  'nutrient_levels',
  'nutriscore_grade',
  'nova_group',
  'ingredients_text',
  'ingredients_text_en',
  'ingredients_tags',
  'allergens_tags',
  'labels_tags',
  'additives_tags',
].join(',');

const SEARCH_FIELDS = 'code,product_name,brands,quantity,nutriscore_grade,image_front_small_url';

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  brands?: string | string[];
  categories_tags?: string[];
  quantity?: string;
  serving_size?: string;
  image_front_url?: string;
  nutriments?: Record<string, number | string | undefined>;
  nutrient_levels?: Partial<Record<NutrientLevelKey, 'low' | 'moderate' | 'high'>>;
  nutriscore_grade?: string;
  nova_group?: number;
  ingredients_text?: string;
  ingredients_text_en?: string;
  ingredients_tags?: string[];
  allergens_tags?: string[];
  labels_tags?: string[];
  additives_tags?: string[];
}

type NutrientLevelKey = 'fat' | 'saturated-fat' | 'sugars' | 'salt';

export type LookupResult = { status: 'found'; product: Product } | { status: 'not_found' };

/** Lightweight search hit; call `lookupBarcode(hit.code)` for the full product. */
export interface SearchHit {
  code: string;
  name: string;
  brand?: string;
  quantity?: string;
  nutriScore?: ProductDetails['nutriScore'];
  imageUrl?: string;
}

export function scoreToGrade(score: number): Grade {
  if (score >= 75) return 'excellent';
  if (score >= 50) return 'good';
  if (score >= 25) return 'poor';
  return 'bad';
}

/**
 * Looks a barcode up in Open Food Facts. Resolves `not_found` when the database has no entry;
 * rejects on network/timeout errors so the caller can tell the two apart.
 */
export async function lookupBarcode(barcode: string): Promise<LookupResult> {
  for (const code of candidateCodes(barcode)) {
    const json = await getJson(`${API_BASE}/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`);
    if (json?.status === 1 && json.product) {
      return { status: 'found', product: toProduct(code, json.product as OffProduct) };
    }
  }
  return { status: 'not_found' };
}

/**
 * Full-text product search, limited to the device's country when we can tell what it is
 * (falls back to worldwide if that returns nothing).
 */
export async function searchProducts(query: string, signal?: AbortSignal): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const country = deviceCountryTag();
  const run = async (filter: string) => {
    const params = `q=${encodeURIComponent(q + filter)}&page_size=30&fields=${SEARCH_FIELDS}`;
    const json = await getJson(`${SEARCH_BASE}?${params}`, signal);
    return toSearchHits(json?.hits ?? []);
  };
  if (country) {
    const local = await run(` countries_tags:"${country}"`);
    if (local.length) return local;
  }
  return run('');
}

/**
 * Best-scoring popular product in the same category (and country, if known) that beats
 * `product` by a meaningful margin. Undefined when nothing better is found.
 */
export async function findBetterAlternative(product: Product): Promise<Product | undefined> {
  const category = product.details?.categoryTag;
  if (!category) return undefined;
  const country = deviceCountryTag();
  const run = async (countryFilter: string) => {
    const q = `categories_tags:"${category}" nutriscore_grade:(a OR b OR c)${countryFilter}`;
    const params = `q=${encodeURIComponent(q)}&sort_by=-popularity_key&page_size=40&fields=${FIELDS}`;
    const json = await getJson(`${SEARCH_BASE}?${params}`);
    return ((json?.hits ?? []) as OffProduct[])
      .filter((p) => p.code && p.code !== product.barcode && (p.product_name || p.product_name_en))
      .map((p) => toProduct(p.code!, p))
      .filter((p) => p.score >= product.score + 10);
  };
  let candidates = country ? await run(` countries_tags:"${country}"`) : [];
  if (!candidates.length) candidates = await run('');
  // Search results omit some fields (additives, ingredient text), so their scores run optimistic —
  // confirm the top few against the full record before recommending one.
  for (const candidate of candidates.sort((a, b) => b.score - a.score).slice(0, 3)) {
    const full = await lookupBarcode(candidate.barcode).catch(() => undefined);
    if (full?.status === 'found' && full.product.score >= product.score + 10) return full.product;
  }
  return undefined;
}

/** UPC-A (12 digits) and EAN-13 with a leading 0 are the same product; scanners report either. */
function candidateCodes(barcode: string): string[] {
  const code = barcode.trim();
  if (/^\d{12}$/.test(code)) return [code, `0${code}`];
  if (/^0\d{12}$/.test(code)) return [code, code.slice(1)];
  return [code];
}

/** GET + parse JSON with a timeout. Resolves null on 404; rejects on other failures. */
async function getJson(url: string, signal?: AbortSignal): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

function toSearchHits(hits: any[]): SearchHit[] {
  const seen = new Set<string>();
  const out: SearchHit[] = [];
  for (const h of hits) {
    const name = typeof h.product_name === 'string' ? h.product_name.trim() : '';
    if (!h.code || !name || seen.has(h.code)) continue;
    seen.add(h.code);
    const brands: string[] = Array.isArray(h.brands) ? h.brands : typeof h.brands === 'string' ? h.brands.split(',') : [];
    const grade = typeof h.nutriscore_grade === 'string' ? h.nutriscore_grade.toLowerCase() : '';
    out.push({
      code: h.code,
      name,
      brand: brands[0]?.trim() || undefined,
      quantity: h.quantity || undefined,
      nutriScore: 'abcde'.includes(grade) && grade.length === 1 ? (grade as SearchHit['nutriScore']) : undefined,
      imageUrl: h.image_front_small_url || undefined,
    });
  }
  return out;
}

/** Open Food Facts country tags for common device regions (unlisted regions search worldwide). */
const REGION_COUNTRY_TAG: Record<string, string> = {
  US: 'en:united-states', CA: 'en:canada', GB: 'en:united-kingdom', IE: 'en:ireland',
  AU: 'en:australia', NZ: 'en:new-zealand', FR: 'en:france', DE: 'en:germany', ES: 'en:spain',
  IT: 'en:italy', NL: 'en:netherlands', BE: 'en:belgium', CH: 'en:switzerland', AT: 'en:austria',
  PT: 'en:portugal', SE: 'en:sweden', NO: 'en:norway', DK: 'en:denmark', FI: 'en:finland',
  PL: 'en:poland', MX: 'en:mexico', BR: 'en:brazil', IN: 'en:india', JP: 'en:japan',
  SG: 'en:singapore', PH: 'en:philippines', VN: 'en:vietnam', ZA: 'en:south-africa',
};

function deviceCountryTag(): string | undefined {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = locale.split(/[-_]/).find((part, i) => i > 0 && /^[A-Z]{2}$/.test(part));
    return region ? REGION_COUNTRY_TAG[region] : undefined;
  } catch {
    return undefined;
  }
}

// --- Mapping --------------------------------------------------------------------------------

/** Additives commonly flagged as higher-concern (artificial colors, sweeteners, nitrites, etc.). */
const HIGH_CONCERN_ADDITIVES = new Set([
  'e102', 'e104', 'e110', 'e122', 'e124', 'e127', 'e129', 'e131', 'e132', 'e133', 'e142',
  'e150c', 'e150d', 'e151', 'e155', 'e171', 'e249', 'e250', 'e251', 'e252', 'e320', 'e321',
  'e950', 'e951', 'e952', 'e954', 'e955', 'e961', 'e962',
]);
const ARTIFICIAL_COLORS = new Set([
  'e102', 'e104', 'e110', 'e122', 'e124', 'e127', 'e129', 'e131', 'e132', 'e133', 'e142',
  'e143', 'e151', 'e155', 'e180',
]);
const ARTIFICIAL_SWEETENERS = new Set(['e950', 'e951', 'e952', 'e954', 'e955', 'e961', 'e962', 'e969']);
const ORGANIC_LABELS = new Set(['organic', 'eu organic', 'usda organic', 'ab agriculture biologique', 'bio']);

const SEED_OIL = /(canola|rapeseed|sunflower|soy|soya|soybean|corn|maize|cottonseed|safflower|grape ?seed|rice bran|vegetable)( seed)? oil/;
const ADDED_SUGAR = /\b(sugar|syrup|dextrose|sucrose|fructose|glucose|maltose|invert sugar|honey|molasses|agave)\b/;
const GLUTEN_GRAIN = /\b(wheat|barley|rye|spelt|malt)\b/;
// Deliberately excludes bare "butter"/"cream"/"milk" so cocoa butter, coconut milk, etc. don't match;
// the allergen tag catches real dairy in most cases.
const DAIRY = /\b(whey|casein|caseinate|lactose|milk powder|skimmed milk|whole milk|milk solids|milk ?fat|cheese)\b/;
const SWEETENER = /\b(aspartame|sucralose|acesulfame|saccharin|cyclamate|neotame|advantame)\b/;
const ART_COLOR = /\b(red|yellow|blue|green) ?\d|artificial colou?r/;

/** "en:skimmed-milk-powder" → "skimmed milk powder" (language prefix dropped). */
function tagText(tag: string): string {
  const i = tag.indexOf(':');
  return (i >= 0 ? tag.slice(i + 1) : tag).replace(/-/g, ' ').toLowerCase().trim();
}

function prettyTag(tag: string): string {
  const text = tagText(tag);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function num(value: number | string | undefined): number | undefined {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}

function readNutrition(
  nutriments: OffProduct['nutriments'] = {},
  suffix: '_100g' | '_serving',
): Nutrition {
  const get = (key: string) => num(nutriments[`${key}${suffix}`]);
  const energyKj = get('energy-kj') ?? get('energy');
  return {
    energyKcal: get('energy-kcal') ?? (energyKj !== undefined ? energyKj / 4.184 : undefined),
    fat: get('fat'),
    saturatedFat: get('saturated-fat'),
    carbohydrates: get('carbohydrates'),
    sugars: get('sugars'),
    fiber: get('fiber'),
    proteins: get('proteins'),
    salt: get('salt'),
    sodium: get('sodium'),
  };
}

function hasAnyValue(n: Nutrition): boolean {
  return Object.values(n).some((v) => v !== undefined);
}

const NUTRISCORE_POINTS: Record<NonNullable<ProductDetails['nutriScore']>, number> = {
  a: 90, b: 70, c: 50, d: 30, e: 10,
};
const LEVEL_PENALTY = { low: 0, moderate: 10, high: 25 };
const LEVEL_LABEL: Record<NutrientLevelKey, string> = {
  fat: 'fat',
  'saturated-fat': 'saturated fat',
  sugars: 'sugar',
  salt: 'salt',
};
const LEVEL_VALUE_KEY: Record<NutrientLevelKey, keyof Nutrition> = {
  fat: 'fat',
  'saturated-fat': 'saturatedFat',
  sugars: 'sugars',
  salt: 'salt',
};

function toProduct(code: string, off: OffProduct): Product {
  const per100g = readNutrition(off.nutriments, '_100g');
  const perServing = readNutrition(off.nutriments, '_serving');

  const grade = off.nutriscore_grade?.toLowerCase();
  const nutriScore = grade && grade in NUTRISCORE_POINTS ? (grade as ProductDetails['nutriScore']) : undefined;
  const novaGroup = [1, 2, 3, 4].includes(Number(off.nova_group))
    ? (Number(off.nova_group) as ProductDetails['novaGroup'])
    : undefined;

  const additiveCodes = (off.additives_tags ?? []).map(tagText);
  const labelTexts = (off.labels_tags ?? []).map(tagText);
  const allergenTexts = (off.allergens_tags ?? []).map(tagText);
  const ingredientTexts = (off.ingredients_tags ?? []).map(tagText);
  const ingredientsText = off.ingredients_text_en || off.ingredients_text || undefined;
  const ingredientsBlob = `${ingredientTexts.join(' | ')} | ${ingredientsText ?? ''}`.toLowerCase();
  const levels = off.nutrient_levels ?? {};
  const isOrganic = labelTexts.some((l) => ORGANIC_LABELS.has(l));
  const concerning = additiveCodes.filter((a) => HIGH_CONCERN_ADDITIVES.has(a.replace(/[^a-z0-9]/g, '')));

  // Sub-scores, mirroring the generator's 60/30/10 weighting.
  let nutrition: number;
  if (nutriScore) {
    nutrition = NUTRISCORE_POINTS[nutriScore];
  } else {
    const levelKeys = Object.keys(levels) as NutrientLevelKey[];
    nutrition = levelKeys.length
      ? Math.max(0, 100 - levelKeys.reduce((sum, k) => sum + LEVEL_PENALTY[levels[k] ?? 'low'], 0))
      : 50;
  }
  const additives = Math.max(0, 100 - additiveCodes.length * 10 - concerning.length * 15);
  const organic = isOrganic ? 100 : 0;
  const score = Math.round(nutrition * 0.6 + additives * 0.3 + organic * 0.1);

  // Pros / cons.
  const pros: string[] = [];
  const cons: string[] = [];
  for (const key of ['sugars', 'saturated-fat', 'salt', 'fat'] as NutrientLevelKey[]) {
    const level = levels[key];
    const value = per100g[LEVEL_VALUE_KEY[key]];
    const amount = value !== undefined ? ` (${round1(value)} g/100g)` : '';
    if (level === 'high') cons.push(`High in ${LEVEL_LABEL[key]}${amount}`);
    else if (level === 'low') pros.push(`Low in ${LEVEL_LABEL[key]}${amount}`);
  }
  if ((per100g.fiber ?? 0) >= 6) pros.push(`High in fiber (${round1(per100g.fiber!)} g/100g)`);
  else if ((per100g.fiber ?? 0) >= 3) pros.push(`Good source of fiber (${round1(per100g.fiber!)} g/100g)`);
  if ((per100g.proteins ?? 0) >= 10) pros.push(`Good source of protein (${round1(per100g.proteins!)} g/100g)`);
  if (novaGroup === 4) cons.push('Ultra-processed food (NOVA 4)');
  else if (novaGroup === 1) pros.push('Unprocessed or minimally processed (NOVA 1)');
  if (concerning.length) {
    cons.push(`Contains additives of concern: ${concerning.map((a) => a.toUpperCase()).join(', ')}`);
  } else if (additiveCodes.length >= 3) {
    cons.push(`Contains ${additiveCodes.length} additives`);
  } else if (additiveCodes.length === 0 && off.additives_tags) {
    pros.push('No additives');
  }
  if (isOrganic) pros.push('Certified organic');

  // Personal avoid-list flags.
  const tags: FlagTag[] = [];
  const hasAdditive = (set: Set<string>) => additiveCodes.some((a) => set.has(a.replace(/[^a-z0-9]/g, '')));
  if (ingredientTexts.some((t) => SEED_OIL.test(t)) || SEED_OIL.test(ingredientsBlob)) tags.push('seed_oils');
  if (allergenTexts.includes('gluten') || GLUTEN_GRAIN.test(ingredientsBlob)) tags.push('gluten');
  if (allergenTexts.includes('milk') || DAIRY.test(ingredientsBlob)) tags.push('dairy');
  if (ingredientTexts.some((t) => ADDED_SUGAR.test(t))) tags.push('added_sugar');
  if (hasAdditive(ARTIFICIAL_SWEETENERS) || SWEETENER.test(ingredientsBlob)) tags.push('artificial_sweeteners');
  if (levels.salt === 'high' || (per100g.salt ?? 0) > 1.5) tags.push('high_sodium');
  if (hasAdditive(ARTIFICIAL_COLORS) || ART_COLOR.test(ingredientsBlob)) tags.push('artificial_colors');

  const category = off.categories_tags?.filter((t) => t.startsWith('en:')).pop();

  return {
    barcode: off.code || code,
    name: off.product_name || off.product_name_en || off.generic_name || 'Unnamed product',
    brand: (Array.isArray(off.brands) ? off.brands[0] : off.brands?.split(',')[0])?.trim() || 'Unknown brand',
    category: category ? prettyTag(category) : 'Food',
    score,
    grade: scoreToGrade(score),
    breakdown: { nutrition, additives, organic },
    pros,
    cons,
    tags,
    source: 'openfoodfacts',
    details: {
      imageUrl: off.image_front_url,
      categoryTag: category,
      quantity: off.quantity || undefined,
      servingSize: off.serving_size || undefined,
      nutritionPer100g: per100g,
      nutritionPerServing: hasAnyValue(perServing) ? perServing : undefined,
      nutriScore,
      novaGroup,
      ingredientsText,
      allergens: allergenTexts.map((a) => prettyTag(a)),
      labels: (off.labels_tags ?? []).map(prettyTag),
      additives: additiveCodes.map((a) => a.toUpperCase()),
    },
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
