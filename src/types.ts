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
