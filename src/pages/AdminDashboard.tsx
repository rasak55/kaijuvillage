import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import type { Category } from '../types/schema';

interface AdminDashboardProps {
  navigateTo: (page: string, param?: string) => void;
  adminUser: any;
  onLogout: () => void;
}

interface FormState {
  id?: number;
  name: string;
  species: string;
  morph: string;
  category_id: string;
  price: string; // display as standard dollar string, e.g. "3200.00"
  availability: 'available' | 'reserved' | 'sold';
  gallery_image_url: string;
  gender: 'male' | 'female' | 'unsexed';
  age_years: string;
  length_inches: string;
  weight_grams: string;
  description: string;
  sire_id: string;
  dam_id: string;
  additional_images: string[];
}

const initialForm: FormState = {
  name: '',
  species: '',
  morph: '',
  category_id: '',
  price: '',
  availability: 'available',
  gallery_image_url: '',
  gender: 'unsexed',
  age_years: '',
  length_inches: '',
  weight_grams: '',
  description: '',
  sire_id: '',
  dam_id: '',
  additional_images: []
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigateTo, adminUser, onLogout }) => {
  const [snakes, setSnakes] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Form/Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  // Load snakes & categories on mount
  const loadData = async () => {
    setLoading(true);
    try {
      const [snakesList, categoriesList] = await Promise.all([
        db.getSnakes(),
        db.getCategories()
      ]);
      setSnakes(snakesList);
      setCategories(categoriesList);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminUser) {
      navigateTo('admin-login');
      return;
    }
    loadData();
  }, [adminUser]);

  // Filter snakes list in search
  const filteredSnakes = useMemo(() => {
    if (!search) return snakes;
    const q = search.toLowerCase();
    return snakes.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.species.toLowerCase().includes(q) ||
      (s.morph && s.morph.toLowerCase().includes(q))
    );
  }, [snakes, search]);

  // Options for Sire (Male parents) and Dam (Female parents)
  const sireOptions = useMemo(() => snakes.filter(s => s.detail?.gender === 'male' || s.detail?.gender === 'unsexed'), [snakes]);
  const damOptions = useMemo(() => snakes.filter(s => s.detail?.gender === 'female' || s.detail?.gender === 'unsexed'), [snakes]);

  // Open modal for Creating
  const handleAddClick = () => {
    setForm(initialForm);
    setFormError(null);
    setModalOpen(true);
  };

  // Open modal for Editing
  const handleEditClick = async (snakeItem: any) => {
    setFormError(null);
    try {
      setLoading(true);
      // Fetch full details including lineage
      const fullSnake = await db.getSnakeByUuid(snakeItem.uuid);
      if (!fullSnake) {
        setFormError('Failed to fetch specimen details');
        setLoading(false);
        return;
      }

      const additionalImages = (fullSnake.images || [])
        .filter((img: any) => !img.is_primary)
        .map((img: any) => (img.image_url || '').replace(/^snake\//, ''));

      setForm({
        id: fullSnake.id,
        name: fullSnake.name,
        species: fullSnake.species,
        morph: fullSnake.morph || '',
        category_id: fullSnake.category_id?.toString() || '',
        price: (fullSnake.price_cents / 100).toFixed(2),
        availability: fullSnake.availability,
        gallery_image_url: (fullSnake.gallery_image_url || '').replace(/^snake\//, ''),
        gender: fullSnake.detail?.gender || 'unsexed',
        age_years: fullSnake.detail?.age_years?.toString() || '',
        length_inches: fullSnake.detail?.length_inches?.toString() || '',
        weight_grams: fullSnake.detail?.weight_grams?.toString() || '',
        description: fullSnake.detail?.description || '',
        sire_id: fullSnake.lineage?.sire?.id?.toString() || '',
        dam_id: fullSnake.lineage?.dam?.id?.toString() || '',
        additional_images: additionalImages
      });
      setModalOpen(true);
    } catch (err) {
      console.error('Failed to load specimen edit state:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDeleteClick = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will also cascade delete details, images, and history records.`)) {
      return;
    }

    try {
      setLoading(true);
      await db.deleteSnake(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete specimen');
      setLoading(false);
    }
  };

  // Form submission handler (Insert / Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSaving(true);

    // Form validation
    if (!form.name.trim() || !form.species.trim()) {
      setFormError('Name and Species are required.');
      setFormSaving(false);
      return;
    }

    // Convert price to cents
    const priceCents = Math.round((parseFloat(form.price) || 0) * 100);

    const payload = {
      id: form.id,
      name: form.name.trim(),
      species: form.species.trim(),
      morph: form.morph.trim() || null,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      price_cents: priceCents,
      availability: form.availability,
      gallery_image_url: form.gallery_image_url.trim().replace(/^snake\//, '') || null,
      gender: form.gender,
      age_years: form.age_years !== '' ? parseFloat(form.age_years) : null,
      length_inches: form.length_inches !== '' ? parseFloat(form.length_inches) : null,
      weight_grams: form.weight_grams !== '' ? parseFloat(form.weight_grams) : null,
      description: form.description.trim() || null,
      sire_id: form.sire_id ? parseInt(form.sire_id) : null,
      dam_id: form.dam_id ? parseInt(form.dam_id) : null,
      additional_images: (form.additional_images || [])
        .map((url) => url.trim().replace(/^snake\//, ''))
        .filter((url) => url !== '')
    };

    try {
      if (form.id) {
        await db.updateSnake(payload);
      } else {
        await db.createSnake(payload);
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save specimen details.');
    } finally {
      setFormSaving(false);
    }
  };

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 flex-grow text-left">
      
      {/* Dashboard Top bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm uppercase mb-1">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>Welcome, {adminUser?.display_name || adminUser?.username} (Admin)</span>
          </div>
          <h2 className="font-display text-headline-lg text-primary font-bold">Control Room</h2>
        </div>
        <div className="flex gap-3">
          <button 
            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-sm font-bold flex items-center gap-2 hover:bg-primary/95 transition-colors active:scale-95 shadow-sm"
            onClick={handleAddClick}
          >
            <span className="material-symbols-outlined">add</span>
            Add Specimen
          </button>
          <button 
            className="border-2 border-outline text-on-surface-variant hover:bg-surface-container-high px-5 py-2.5 rounded-xl font-label-sm font-bold transition-all active:scale-95"
            onClick={onLogout}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Filter and Search Registry */}
      <div className="bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden mb-12">
        <div className="p-6 border-b border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-display text-headline-md text-primary font-bold">Registry Inventory</h3>
          <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant w-full md:w-80">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
            <input 
              type="text" 
              placeholder="Search by name, species..." 
              className="bg-transparent border-none outline-none text-body-md w-full focus:ring-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Data List table */}
        <div className="overflow-x-auto relative min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 bg-surface/40 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="material-symbols-outlined text-3xl animate-spin text-primary">sync</span>
            </div>
          )}
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant font-label-sm text-[12px] uppercase">
                <th className="p-4 pl-6">Specimen</th>
                <th className="p-4">Species &amp; Morph</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Availability</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-md">
              {filteredSnakes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant italic">
                    No registry specimens found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredSnakes.map((snake) => (
                  <tr key={snake.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="p-4 pl-6 font-bold text-primary flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                        <img className="w-full h-full object-cover" src={snake.gallery_image_url || ''} alt="" />
                      </div>
                      <span>{snake.name}</span>
                    </td>
                    <td className="p-4 text-on-surface">
                      <div className="font-medium">{snake.species}</div>
                      <div className="text-sm text-on-surface-variant font-mono">{snake.morph || 'Normal'}</div>
                    </td>
                    <td className="p-4 text-on-surface-variant font-medium">
                      {snake.category_name || 'Unassigned'}
                    </td>
                    <td className="p-4 font-mono font-bold text-primary">
                      {snake.availability === 'sold' ? 'Sold' : snake.price_cents === 0 ? 'Inquire' : `$${(snake.price_cents / 100).toLocaleString()}`}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        snake.availability === 'available'
                          ? 'bg-primary/10 text-primary'
                          : snake.availability === 'reserved'
                          ? 'bg-secondary-container/20 text-secondary'
                          : 'bg-surface-dim text-on-surface-variant'
                      }`}>
                        {snake.availability}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button 
                        className="p-2 border border-outline-variant rounded-lg text-primary hover:bg-primary-container/10 transition-colors"
                        onClick={() => handleEditClick(snake)}
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button 
                        className="p-2 border border-error/20 rounded-lg text-error hover:bg-error-container/20 transition-colors"
                        onClick={() => handleDeleteClick(snake.id, snake.name)}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Edit/Create Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-outline-variant shadow-xl flex flex-col justify-between">
            <form onSubmit={handleFormSubmit}>
              
              {/* Modal Header */}
              <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                <h3 className="font-display text-headline-md text-primary font-bold">
                  {form.id ? 'Edit Herpetological Specimen' : 'Add New Registry Specimen'}
                </h3>
                <button 
                  type="button" 
                  className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
                  onClick={() => setModalOpen(false)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Modal Body form fields */}
              <div className="p-6 space-y-6">
                
                {formError && (
                  <div className="bg-error-container text-on-error-container p-4 rounded-xl border border-error/20 flex gap-2 items-center">
                    <span className="material-symbols-outlined text-error">error</span>
                    <span className="font-body-md font-medium">{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-1 font-bold">Specimen Name</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary"
                      placeholder="e.g. Aurelius"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-1 font-bold">Scientific Species</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary"
                      placeholder="e.g. Python regius"
                      value={form.species}
                      onChange={(e) => setForm({ ...form, species: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-1 font-bold">Morph Expression</label>
                    <input 
                      type="text" 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary"
                      placeholder="e.g. Banana Clown Pied"
                      value={form.morph}
                      onChange={(e) => setForm({ ...form, morph: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-1 font-bold">Category</label>
                    <select 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary"
                      value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    >
                      <option value="">Choose category...</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-1 font-bold">Price (USD)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary"
                      placeholder="e.g. 3200.00"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-1 font-bold">Availability</label>
                    <select 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary"
                      value={form.availability}
                      onChange={(e) => setForm({ ...form, availability: e.target.value as any })}
                    >
                      <option value="available">Available Now</option>
                      <option value="reserved">Reserved</option>
                      <option value="sold">Sold (Reference)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-1 font-bold">Main Image URL</label>
                    <input 
                      type="text" 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary"
                      placeholder="https://example.com/image.jpg"
                      value={form.gallery_image_url}
                      onChange={(e) => setForm({ ...form, gallery_image_url: e.target.value })}
                    />
                  </div>
                </div>

                {/* Additional Images Section */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="font-display font-bold text-primary">Additional Gallery Images</h4>
                      <p className="text-xs text-on-surface-variant">Manage secondary images displayed in the specimen's details page.</p>
                    </div>
                    <button
                      type="button"
                      className="text-xs bg-primary text-on-primary hover:bg-primary/90 px-3.5 py-2 rounded-xl transition-colors font-bold active:scale-95 flex items-center gap-1"
                      onClick={() => setForm({ ...form, additional_images: [...(form.additional_images || []), ''] })}
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span>Add Image URL</span>
                    </button>
                  </div>
                  
                  {(!form.additional_images || form.additional_images.length === 0) ? (
                    <div className="border border-dashed border-outline-variant rounded-xl p-6 text-center">
                      <span className="material-symbols-outlined text-outline text-[32px] mb-1">image_not_supported</span>
                      <p className="text-on-surface-variant text-sm italic">No additional gallery images added yet.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                      {form.additional_images.map((url, idx) => (
                        <div key={idx} className="flex gap-3 items-center">
                          <span className="font-mono text-xs text-outline w-6 text-right">#{idx + 1}</span>
                          <input 
                            type="text" 
                            className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
                            placeholder="https://example.com/additional-image.jpg"
                            value={url}
                            onChange={(e) => {
                              const newImages = [...form.additional_images];
                              newImages[idx] = e.target.value;
                              setForm({ ...form, additional_images: newImages });
                            }}
                          />
                          <button
                            type="button"
                            className="text-error hover:bg-error-container/20 p-2 rounded-xl transition-colors active:scale-95 flex items-center justify-center border border-outline-variant"
                            onClick={() => {
                              const newImages = form.additional_images.filter((_, i) => i !== idx);
                              setForm({ ...form, additional_images: newImages });
                            }}
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Snake physical parameters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-1 font-bold">Gender</label>
                    <select 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary"
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                    >
                      <option value="unsexed">Unsexed</option>
                      <option value="male">Male (1.0)</option>
                      <option value="female">Female (0.1)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-1 font-bold">Age (Years)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary"
                      placeholder="e.g. 1.5"
                      value={form.age_years}
                      onChange={(e) => setForm({ ...form, age_years: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-1 font-bold">Length (Inches)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary"
                      placeholder="e.g. 42"
                      value={form.length_inches}
                      onChange={(e) => setForm({ ...form, length_inches: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-1 font-bold">Weight (Grams)</label>
                    <input 
                      type="number" 
                      step="1" 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary"
                      placeholder="e.g. 840"
                      value={form.weight_grams}
                      onChange={(e) => setForm({ ...form, weight_grams: e.target.value })}
                    />
                  </div>
                </div>

                {/* Lineage parent links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-1 font-bold">Sire Parent (Father)</label>
                    <select 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary"
                      value={form.sire_id}
                      onChange={(e) => setForm({ ...form, sire_id: e.target.value })}
                    >
                      <option value="">Unknown / None</option>
                      {sireOptions
                        .filter(s => s.id !== form.id)
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.morph || 'Normal'})</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-1 font-bold">Dam Parent (Mother)</label>
                    <select 
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary"
                      value={form.dam_id}
                      onChange={(e) => setForm({ ...form, dam_id: e.target.value })}
                    >
                      <option value="">Unknown / None</option>
                      {damOptions
                        .filter(s => s.id !== form.id)
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.morph || 'Normal'})</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-1 font-bold">Provenance &amp; Description</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 outline-none focus:border-primary text-body-md"
                    placeholder="Enter visual genes, breeding provenance, behavioral habits, and feeding schedule..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Modal Footer buttons */}
              <div className="p-6 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-low">
                <button 
                  type="button" 
                  className="px-5 py-2.5 border border-outline-variant rounded-xl font-label-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={formSaving}
                  className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-label-sm font-bold flex items-center gap-2 hover:bg-primary/95 transition-colors active:scale-95 disabled:opacity-50"
                >
                  {formSaving ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                      Saving...
                    </>
                  ) : (
                    'Save Record'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
