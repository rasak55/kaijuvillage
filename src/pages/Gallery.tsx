import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';

interface GalleryProps {
  navigateTo: (page: string, param?: string) => void;
  initialFilter?: string;
}

export const Gallery: React.FC<GalleryProps> = ({ navigateTo, initialFilter }) => {
  // Filter states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [availability, setAvailability] = useState<('available' | 'reserved' | 'sold')[]>(
    initialFilter === 'filter:available' ? ['available'] : ['available', 'reserved', 'sold']
  );
  const [genders, setGenders] = useState<('male' | 'female' | 'unsexed')[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(10000); // Max $10,000

  const [categories, setCategories] = useState<any[]>([]);
  const [filteredSnakes, setFilteredSnakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const totalPages = useMemo(() => {
    return Math.ceil(filteredSnakes.length / itemsPerPage) || 1;
  }, [filteredSnakes.length, itemsPerPage]);

  const currentSnakes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSnakes.slice(start, start + itemsPerPage);
  }, [filteredSnakes, currentPage, itemsPerPage]);

  // Fetch categories on mount
  React.useEffect(() => {
    db.getCategories()
      .then(res => setCategories(res))
      .catch(err => console.error('Error loading categories:', err));
  }, []);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, availability, genders, search, maxPrice]);

  // Fetch snakes dynamically based on filter state changes
  useEffect(() => {
    setLoading(true);
    db.getSnakes({
      category_id: selectedCategory || undefined,
      availability: availability,
      gender: genders.length > 0 ? genders : undefined,
      search: search || undefined,
      maxPriceCents: maxPrice < 10000 ? maxPrice * 100 : undefined
    })
      .then(res => {
        setFilteredSnakes(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading snakes:', err);
        setLoading(false);
      });
  }, [selectedCategory, availability, genders, search, maxPrice]);

  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
  };

  const handleAvailabilityToggle = (status: 'available' | 'reserved' | 'sold') => {
    if (availability.includes(status)) {
      setAvailability(availability.filter(s => s !== status));
    } else {
      setAvailability([...availability, status]);
    }
  };

  const handleGenderToggle = (gender: 'male' | 'female') => {
    if (genders.includes(gender)) {
      setGenders(genders.filter(g => g !== gender));
    } else {
      setGenders([...genders, gender]);
    }
  };

  // Format currency helpers
  const formatPrice = (cents: number, status: string) => {
    if (status === 'sold') return 'Sold';
    if (cents === 0) return 'Inquire';
    return `$${(cents / 100).toLocaleString()}`;
  };

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 mb-20 text-left flex-grow">
      {/* Search and Filter Header */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-headline-lg text-primary font-bold mb-2">Genetic Registry</h2>
            <p className="font-body-md text-on-surface-variant max-w-2xl">
              Explore the definitive herpetology database. Search through thousands of verified bloodlines, morph phenotypes, and breeder listings.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant w-full md:w-96 shadow-sm">
            <span className="material-symbols-outlined text-on-surface-variant">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 w-full text-body-md outline-none" 
              placeholder="Search by morph, species, or breeder..." 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        {/* Category Filters */}
        <div className="flex gap-3 overflow-x-auto py-6 no-scrollbar">
          <button 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-label-sm whitespace-nowrap transition-transform active:scale-95 ${
              selectedCategory === null 
                ? 'bg-primary text-on-primary' 
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
            onClick={() => handleCategoryClick(null)}
          >
            All Specimens
          </button>
          {categories.map((cat) => (
            <button 
              key={cat.id}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-label-sm whitespace-nowrap transition-transform active:scale-95 ${
                selectedCategory === cat.id 
                  ? 'bg-primary text-on-primary' 
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
              onClick={() => handleCategoryClick(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content Layout (Sidebar + Grid) */}
      <div className="flex flex-col lg:flex-row gap-gutter">
        {/* Sidebar Filters (Desktop Only) */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-8">
          <div>
            <h3 className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mb-4 font-bold">Availability</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  checked={availability.includes('available')} 
                  onChange={() => handleAvailabilityToggle('available')}
                  className="rounded-sm border-outline text-primary focus:ring-primary w-5 h-5 cursor-pointer" 
                  type="checkbox"
                />
                <span className="font-body-md group-hover:text-primary transition-colors">Available Now</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  checked={availability.includes('reserved')} 
                  onChange={() => handleAvailabilityToggle('reserved')}
                  className="rounded-sm border-outline text-primary focus:ring-primary w-5 h-5 cursor-pointer" 
                  type="checkbox"
                />
                <span className="font-body-md group-hover:text-primary transition-colors">Reserved</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  checked={availability.includes('sold')} 
                  onChange={() => handleAvailabilityToggle('sold')}
                  className="rounded-sm border-outline text-primary focus:ring-primary w-5 h-5 cursor-pointer" 
                  type="checkbox"
                />
                <span className="font-body-md group-hover:text-primary transition-colors">Reference Only (Sold)</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mb-4 font-bold">Gender</h3>
            <div className="flex gap-2">
              <button 
                className={`flex-1 py-2 border rounded hover:bg-surface-container-high transition-colors font-label-sm ${
                  genders.includes('male') ? 'border-primary bg-primary-container/10 text-primary font-bold' : 'border-outline-variant'
                }`}
                onClick={() => handleGenderToggle('male')}
              >
                Male
              </button>
              <button 
                className={`flex-1 py-2 border rounded hover:bg-surface-container-high transition-colors font-label-sm ${
                  genders.includes('female') ? 'border-primary bg-primary-container/10 text-primary font-bold' : 'border-outline-variant'
                }`}
                onClick={() => handleGenderToggle('female')}
              >
                Female
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mb-4 font-bold">Max Price</h3>
            <input 
              className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary" 
              type="range"
              min="500"
              max="10000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
            <div className="flex justify-between mt-2">
              <span className="font-label-sm">$500</span>
              <span className="font-label-sm font-bold text-primary">
                {maxPrice === 10000 ? 'Any Price' : `$${maxPrice.toLocaleString()}`}
              </span>
              <span className="font-label-sm">$10k+</span>
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <span className="font-label-sm text-on-surface-variant font-medium">
              Showing {filteredSnakes.length === 0 ? 0 : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(filteredSnakes.length, currentPage * itemsPerPage)} of ${filteredSnakes.length}`} Results
            </span>
            <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
              <span className="font-label-sm">Sort by: Newest</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 relative min-h-[300px]">
            {loading && (
              <div className="absolute inset-0 bg-surface/50 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-xl">
                <div className="flex flex-col items-center gap-4 p-6 bg-white shadow-lg border border-outline-variant rounded-2xl">
                  <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
                  <span className="font-label-sm text-primary font-bold">Querying MySQL...</span>
                </div>
              </div>
            )}
            {currentSnakes.map((snake: any) => {
              // Get details for displaying specs
              const genderText = snake.detail?.gender === 'male' ? 'Male (1.0)' : snake.detail?.gender === 'female' ? 'Female (0.1)' : 'Unsexed';
              const weightText = snake.detail?.weight_grams ? `${snake.detail.weight_grams}g` : 'N/A';
              
              // Render standard cards
              return (
                <div 
                  key={snake.id} 
                  className="bg-white rounded-xl overflow-hidden border border-tertiary/10 shadow-[0px_4px_20px_rgba(27,48,34,0.04)] group hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[3/2] overflow-hidden">
                      <img 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        src={snake.gallery_image_url || ''} 
                        alt={snake.name}
                      />
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-label-sm font-medium backdrop-blur-sm ${
                          snake.availability === 'available'
                            ? 'bg-primary/90 text-on-primary'
                            : snake.availability === 'reserved'
                            ? 'bg-tertiary-container/90 text-on-tertiary-container border border-on-tertiary-container/20'
                            : 'bg-surface-dim/90 text-on-surface-variant'
                        }`}>
                          {snake.availability.charAt(0).toUpperCase() + snake.availability.slice(1)}
                        </span>
                      </div>
                      {(snake.sire_id || snake.dam_id) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateTo('breeding', snake.id.toString());
                          }}
                          className="absolute bottom-3 right-3 bg-primary/80 hover:bg-primary text-on-primary p-2 rounded-full backdrop-blur-sm transition-all duration-200 z-10 shadow-sm flex items-center justify-center cursor-pointer active:scale-95"
                          title="ดูสายเลือด (View Pedigree)"
                        >
                          <span className="material-symbols-outlined text-[16px]">account_tree</span>
                        </button>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-headline-md text-headline-md text-primary font-bold">{snake.name}</h4>
                        <span className="font-label-sm text-primary font-bold">
                          {formatPrice(snake.price_cents, snake.availability)}
                        </span>
                      </div>
                      <p className="font-label-sm text-tertiary-container mb-4">{snake.species} • {snake.morph}</p>
                      
                      <div className="flex border-t border-outline-variant pt-4 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-on-surface-variant font-bold tracking-tighter">Gender</span>
                          <span className="font-data-point text-data-point">{genderText}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-on-surface-variant font-bold tracking-tighter">Hatch Date</span>
                          <span className="font-data-point text-data-point">Sept 2023</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-on-surface-variant font-bold tracking-tighter">Weight</span>
                          <span className="font-data-point text-data-point">{weightText}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 pb-6 pt-0">
                    <button 
                      onClick={() => navigateTo('detail', snake.uuid)}
                      className={`w-full mt-2 py-3 rounded font-label-sm transition-colors active:scale-[0.98] ${
                        snake.availability === 'available'
                          ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                          : snake.availability === 'reserved'
                          ? 'border border-primary text-primary hover:bg-surface-container-high'
                          : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {snake.availability === 'available' ? 'View Profile & Buy' : 'View Full Pedigree'}
                    </button>
                  </div>
                </div>
              );
            })}

          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-16 flex items-center justify-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded border border-outline-variant hover:bg-surface-container text-on-surface-variant active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNumber = idx + 1;
                const isActive = pageNumber === currentPage;
                return (
                  <button 
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-10 h-10 flex items-center justify-center rounded font-label-sm font-bold active:scale-95 transition-all ${
                      isActive 
                        ? 'bg-primary text-on-primary' 
                        : 'border border-outline-variant hover:bg-surface-container'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded border border-outline-variant hover:bg-surface-container text-on-surface-variant active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
