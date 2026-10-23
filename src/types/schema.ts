export interface Page {
  id: number;
  slug: 'home' | 'gallery' | 'detail';
  title: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Snake {
  id: number;
  uuid: string; // public identifier (e.g. 'aurelius', 'nebula', 'viridian', 'nebula-blue-morph')
  name: string;
  species: string;
  morph: string | null;
  price_cents: number;
  availability: 'available' | 'reserved' | 'sold';
  thumbnail_url: string | null;
  gallery_image_url: string | null;
  category_id: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface SnakeImage {
  id: number;
  snake_id: number;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at?: string;
}

export interface SnakeDetail {
  snake_id: number;
  gender: 'male' | 'female' | 'unsexed';
  age_years: number | null;
  length_inches: number | null;
  weight_grams: number | null;
  market_valuation_cents: number | null;
  tax_included: boolean;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Lineage {
  snake_id: number;
  sire_id: number | null; // Sire (father)
  dam_id: number | null;  // Dam (mother)
}

export interface HistoryEvent {
  id: number;
  snake_id: number;
  event_date: string;
  title: string;
  description: string | null;
  created_at?: string;
}
