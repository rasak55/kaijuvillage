import type { Category, Snake, SnakeImage, SnakeDetail, HistoryEvent } from '../types/schema';

const formatImageUrl = (url: string | null): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') || 
    trimmed.startsWith('https://') || 
    trimmed.startsWith('data:') || 
    trimmed.startsWith('/') ||
    trimmed.startsWith('snake/')
  ) {
    return trimmed;
  }
  return `snake/${trimmed}`;
};

const formatSnakeImages = <T extends { gallery_image_url?: string | null; thumbnail_url?: string | null; images?: any[] }>(snake: T): T => {
  if (snake.gallery_image_url) {
    snake.gallery_image_url = formatImageUrl(snake.gallery_image_url);
  }
  if (snake.thumbnail_url) {
    snake.thumbnail_url = formatImageUrl(snake.thumbnail_url);
  }
  if (snake.images && Array.isArray(snake.images)) {
    snake.images = snake.images.map(img => ({
      ...img,
      image_url: formatImageUrl(img.image_url) || ''
    }));
  }
  return snake;
};

// Database API Queries (fetching from the PHP MySQL backend via relative paths)
export const db = {
  // GET api/categories.php
  getCategories: async (): Promise<Category[]> => {
    const res = await fetch('api/categories.php');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  // GET api/snakes.php with query parameters
  getSnakes: async (filters?: {
    category_id?: number;
    availability?: ('available' | 'reserved' | 'sold')[];
    gender?: ('male' | 'female' | 'unsexed')[];
    search?: string;
    maxPriceCents?: number;
  }): Promise<(Snake & { category_name?: string; detail?: SnakeDetail })[]> => {
    const params = new URLSearchParams();
    if (filters?.category_id) {
      params.append('category_id', filters.category_id.toString());
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.maxPriceCents) {
      params.append('max_price', filters.maxPriceCents.toString());
    }
    if (filters?.availability && filters.availability.length > 0) {
      params.append('availability', filters.availability.join(','));
    }
    if (filters?.gender && filters.gender.length > 0) {
      params.append('gender', filters.gender.join(','));
    }

    const url = `api/snakes.php?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch snakes');
    const data = await res.json();
    return data.map((s: any) => formatSnakeImages(s));
  },

  // GET api/detail.php?uuid=:uuid
  getSnakeByUuid: async (uuid: string): Promise<(Snake & {
    category_name?: string;
    detail?: SnakeDetail;
    images?: SnakeImage[];
    history?: HistoryEvent[];
    lineage?: {
      sire?: Snake & { detail?: SnakeDetail };
      dam?: Snake & { detail?: SnakeDetail };
    };
  }) | null> => {
    const res = await fetch(`api/detail.php?uuid=${uuid}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch snake details');
    const data = await res.json();
    const formatted = formatSnakeImages(data);
    if (formatted.lineage?.sire) {
      formatted.lineage.sire = formatSnakeImages(formatted.lineage.sire);
    }
    if (formatted.lineage?.dam) {
      formatted.lineage.dam = formatSnakeImages(formatted.lineage.dam);
    }
    return formatted;
  },

  // POST api/login.php
  login: async (username: string, password: string): Promise<any> => {
    const res = await fetch('api/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Invalid credentials');
    }
    return res.json();
  },

  // POST api/create_snake.php
  createSnake: async (data: any): Promise<any> => {
    const res = await fetch('api/create_snake.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create specimen');
    }
    return res.json();
  },

  // POST api/update_snake.php
  updateSnake: async (data: any): Promise<any> => {
    const res = await fetch('api/update_snake.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update specimen');
    }
    return res.json();
  },

  // POST api/delete_snake.php
  deleteSnake: async (id: number): Promise<any> => {
    const res = await fetch('api/delete_snake.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete specimen');
    }
    return res.json();
  }
};
