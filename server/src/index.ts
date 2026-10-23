import express from 'express';
import cors from 'cors';
import pool from './db.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API route 1: GET /api/categories
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// API route 2: GET /api/snakes
app.get('/api/snakes', async (req, res) => {
  try {
    const { category_id, availability, gender, search, max_price } = req.query;

    let query = `
      SELECT s.*, c.name AS category_name, sd.gender, sd.weight_grams, sd.age_years
      FROM snakes s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN snake_details sd ON s.id = sd.snake_id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filter by category_id
    if (category_id) {
      query += ' AND s.category_id = ?';
      params.push(Number(category_id));
    }

    // Filter by search query
    if (search) {
      query += ' AND (s.name LIKE ? OR s.species LIKE ? OR s.morph LIKE ?)';
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard);
    }

    // Filter by max_price (in cents)
    if (max_price) {
      query += ' AND s.price_cents <= ?';
      params.push(Number(max_price));
    }

    // Filter by availability (comma separated list, e.g. "available,reserved")
    if (availability) {
      const availabilities = (availability as string).split(',');
      if (availabilities.length > 0) {
        query += ` AND s.availability IN (${availabilities.map(() => '?').join(',')})`;
        params.push(...availabilities);
      }
    }

    // Filter by gender (comma separated list, e.g. "male,female")
    if (gender) {
      const genders = (gender as string).split(',');
      if (genders.length > 0) {
        query += ` AND sd.gender IN (${genders.map(() => '?').join(',')})`;
        params.push(...genders);
      }
    }

    query += ' ORDER BY s.created_at DESC';

    const [rows]: any = await pool.query(query, params);

    // Format output to match the frontend expectations
    const formattedRows = rows.map((row: any) => {
      const detail = row.gender ? {
        snake_id: row.id,
        gender: row.gender,
        age_years: row.age_years,
        weight_grams: row.weight_grams,
        length_inches: row.length_inches,
        market_valuation_cents: row.price_cents,
        tax_included: true,
        description: null
      } : undefined;

      return {
        id: row.id,
        uuid: row.uuid,
        name: row.name,
        species: row.species,
        morph: row.morph,
        price_cents: row.price_cents,
        availability: row.availability,
        thumbnail_url: row.thumbnail_url,
        gallery_image_url: row.gallery_image_url,
        category_id: row.category_id,
        category_name: row.category_name,
        detail
      };
    });

    res.json(formattedRows);
  } catch (error: any) {
    console.error('Error fetching snakes:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// API route 3: GET /api/snakes/:uuid
app.get('/api/snakes/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;

    // 1. Fetch Snake and Details
    const snakeQuery = `
      SELECT s.*, c.name AS category_name, 
             sd.gender, sd.age_years, sd.length_inches, sd.weight_grams, sd.market_valuation_cents, sd.tax_included, sd.description
      FROM snakes s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN snake_details sd ON s.id = sd.snake_id
      WHERE s.uuid = ?
    `;
    const [snakes]: any = await pool.query(snakeQuery, [uuid]);
    if (snakes.length === 0) {
      return res.status(404).json({ error: 'Specimen not found' });
    }
    const row = snakes[0];

    // 2. Fetch Images
    const [images]: any = await pool.query(
      'SELECT * FROM snake_images WHERE snake_id = ? ORDER BY sort_order',
      [row.id]
    );

    // 3. Fetch History Timeline Events
    const [history]: any = await pool.query(
      'SELECT * FROM history_events WHERE snake_id = ? ORDER BY event_date DESC',
      [row.id]
    );

    // 4. Fetch Lineage Sire and Dam
    const [lineages]: any = await pool.query(
      'SELECT sire_id, dam_id FROM lineage WHERE snake_id = ?',
      [row.id]
    );

    let lineageData: any = null;
    if (lineages.length > 0) {
      const { sire_id, dam_id } = lineages[0];
      const parentIds: number[] = [];
      if (sire_id) parentIds.push(sire_id);
      if (dam_id) parentIds.push(dam_id);

      if (parentIds.length > 0) {
        const parentQuery = `
          SELECT s.*, sd.gender, sd.weight_grams, sd.age_years
          FROM snakes s
          LEFT JOIN snake_details sd ON s.id = sd.snake_id
          WHERE s.id IN (${parentIds.map(() => '?').join(',')})
        `;
        const [parents]: any = await pool.query(parentQuery, parentIds);
        
        const sire = parents.find((p: any) => p.id === sire_id);
        const dam = parents.find((p: any) => p.id === dam_id);

        lineageData = {
          sire: sire ? {
            ...sire,
            detail: sire.gender ? { gender: sire.gender, age_years: sire.age_years, weight_grams: sire.weight_grams } : undefined
          } : null,
          dam: dam ? {
            ...dam,
            detail: dam.gender ? { gender: dam.gender, age_years: dam.age_years, weight_grams: dam.weight_grams } : undefined
          } : null
        };
      }
    }

    // Map to frontend response format
    const formattedSnake = {
      id: row.id,
      uuid: row.uuid,
      name: row.name,
      species: row.species,
      morph: row.morph,
      price_cents: row.price_cents,
      availability: row.availability,
      thumbnail_url: row.thumbnail_url,
      gallery_image_url: row.gallery_image_url,
      category_id: row.category_id,
      category_name: row.category_name,
      detail: row.gender ? {
        snake_id: row.id,
        gender: row.gender,
        age_years: row.age_years,
        length_inches: row.length_inches,
        weight_grams: row.weight_grams,
        market_valuation_cents: row.market_valuation_cents,
        tax_included: row.tax_included === 1,
        description: row.description
      } : null,
      images: images.length > 0 ? images : [
        {
          id: 999,
          snake_id: row.id,
          image_url: row.gallery_image_url || row.thumbnail_url || '',
          alt_text: row.name,
          sort_order: 1,
          is_primary: true
        }
      ],
      history: history.map((evt: any) => ({
        id: evt.id,
        snake_id: evt.snake_id,
        event_date: evt.event_date,
        title: evt.title,
        description: evt.description
      })),
      lineage: lineageData
    };

    res.json(formattedSnake);
  } catch (error: any) {
    console.error('Error fetching snake details:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
