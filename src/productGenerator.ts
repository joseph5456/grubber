import { ALL_FLAG_TAGS, FlagTag, Grade, Product } from './types';

export const ADJECTIVES = [
  'Crunchy', 'Zesty', 'Golden', 'Classic', 'Smoky', 'Tangy',
  'Wholesome', 'Rich', 'Light', 'Toasted', 'Creamy', 'Spiced',
];

export const NOUNS = [
  'Granola Bar', 'Tomato Sauce', 'Potato Chips', 'Yogurt Cup', 'Cereal Bowl',
  'Fruit Snack', 'Veggie Wrap', 'Trail Mix', 'Soda', 'Protein Bar',
  'Cookie Pack', 'Soup Can', 'Peanut Spread', 'Granola Cluster', 'Juice Box',
];

const BRANDS = [
  'Demo Foods Co.', 'Sample Market', 'FreshTest Brand', 'Placeholder Pantry', 'Everyday Basics',
];

const NUTRITION_PROS = [
  'Good source of fiber', 'Low in saturated fat', 'Contains lean protein',
  'Low sugar content', 'Good source of vitamins',
];
const NUTRITION_CONS = [
  'High in sugar', 'High in saturated fat', 'High in salt', 'Low nutritional value',
];
const ADDITIVE_PROS = ['No risky additives detected', 'Minimal processing'];
const ADDITIVE_CONS = ['Contains additives with moderate risk', 'Contains several preservatives'];

export function hashBarcode(barcode: string): number {
  let hash = 0;
  for (let i = 0; i < barcode.length; i++) {
    hash = (Math.imul(31, hash) + barcode.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

function makeRng(seed: number) {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967295;
  };
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length) % items.length];
}

export function scoreToGrade(score: number): Grade {
  if (score >= 75) return 'excellent';
  if (score >= 50) return 'good';
  if (score >= 25) return 'poor';
  return 'bad';
}

/** Zero-padded numeric string so catalog-sourced products still display like a barcode. */
export function pseudoBarcode(key: string): string {
  return String(hashBarcode(key)).padStart(12, '0').slice(0, 12);
}

export function generateProduct(
  key: string,
  override?: { name: string; category: string },
): Product {
  const rng = makeRng(hashBarcode(key));

  const nutrition = Math.round(rng() * 100);
  const additives = Math.round(rng() * 100);
  const organic = Math.round(rng() * 100);

  const score = Math.round(nutrition * 0.6 + additives * 0.3 + organic * 0.1);
  const grade = scoreToGrade(score);

  const pros: string[] = [];
  const cons: string[] = [];

  if (nutrition >= 60) pros.push(pick(rng, NUTRITION_PROS));
  else cons.push(pick(rng, NUTRITION_CONS));

  if (additives >= 60) pros.push(pick(rng, ADDITIVE_PROS));
  else cons.push(pick(rng, ADDITIVE_CONS));

  if (organic >= 60) pros.push('Made with organic ingredients');

  const tags: FlagTag[] = ALL_FLAG_TAGS.filter(() => rng() < 0.3);

  const name = override ? override.name : `${pick(rng, ADJECTIVES)} ${pick(rng, NOUNS)}`;
  const category = override ? override.category : name.split(' ').slice(1).join(' ');

  return {
    barcode: override ? pseudoBarcode(key) : key,
    name,
    brand: pick(rng, BRANDS),
    category,
    score,
    grade,
    breakdown: { nutrition, additives, organic },
    pros,
    cons,
    tags,
    source: 'simulated',
  };
}
