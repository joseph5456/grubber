export type Grade = 'excellent' | 'good' | 'poor' | 'bad';

export type FlagTag =
  | 'seed_oils'
  | 'gluten'
  | 'dairy'
  | 'added_sugar'
  | 'artificial_sweeteners'
  | 'high_sodium'
  | 'artificial_colors';

export interface Product {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  score: number;
  grade: Grade;
  breakdown: {
    nutrition: number;
    additives: number;
    organic: number;
  };
  pros: string[];
  cons: string[];
  tags: FlagTag[];
  /** 'openfoodfacts' for looked-up products; absent/'simulated' for demo products saved by older versions. */
  source?: ProductSource;
  details?: ProductDetails;
}

export type ProductSource = 'openfoodfacts' | 'simulated';

/** Per-100g (or per-100ml) values; any field may be missing if the database doesn't have it. */
export interface Nutrition {
  energyKcal?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrates?: number;
  sugars?: number;
  fiber?: number;
  proteins?: number;
  salt?: number;
  sodium?: number;
}

export interface ProductDetails {
  imageUrl?: string;
  /** Most specific Open Food Facts category tag (e.g. "en:greek-style-yogurts"), for alternatives. */
  categoryTag?: string;
  quantity?: string;
  servingSize?: string;
  nutritionPer100g: Nutrition;
  nutritionPerServing?: Nutrition;
  /** a–e, or undefined when not computed for this product. */
  nutriScore?: 'a' | 'b' | 'c' | 'd' | 'e';
  /** 1 (unprocessed) – 4 (ultra-processed). */
  novaGroup?: 1 | 2 | 3 | 4;
  ingredientsText?: string;
  allergens: string[];
  labels: string[];
  additives: string[];
}

export const GRADE_COLOR: Record<Grade, string> = {
  excellent: '#1E8F4E',
  good: '#8BC34A',
  poor: '#FF9800',
  bad: '#E53935',
};

export const GRADE_LABEL: Record<Grade, string> = {
  excellent: 'Excellent',
  good: 'Good',
  poor: 'Poor',
  bad: 'Bad',
};

export const FLAG_LABELS: Record<FlagTag, string> = {
  seed_oils: 'Seed oils',
  gluten: 'Gluten',
  dairy: 'Dairy',
  added_sugar: 'Added sugar',
  artificial_sweeteners: 'Artificial sweeteners',
  high_sodium: 'High sodium',
  artificial_colors: 'Artificial colors',
};

export const ALL_FLAG_TAGS: FlagTag[] = [
  'seed_oils',
  'gluten',
  'dairy',
  'added_sugar',
  'artificial_sweeteners',
  'high_sodium',
  'artificial_colors',
];
