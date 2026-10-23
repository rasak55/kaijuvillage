import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import type { SnakeImage, HistoryEvent } from '../types/schema';

interface GalleryDetailProps {
  uuid: string;
  navigateTo: (page: string, param?: string) => void;
}

export const GalleryDetail: React.FC<GalleryDetailProps> = ({ uuid, navigateTo }) => {
  const [snake, setSnake] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Fetch detailed snake record by UUID
  useEffect(() => {
    setLoading(true);
    db.getSnakeByUuid(uuid)
      .then(res => {
        setSnake(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching snake details:', err);
        setSnake(null);
        setLoading(false);
      });
  }, [uuid]);

  if (loading) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile py-20 text-center flex-grow flex flex-col items-center justify-center min-h-[50vh]">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-4">sync</span>
        <h2 className="text-headline-md text-primary font-bold">Querying Pedigree...</h2>
      </main>
    );
  }

  if (!snake) {
    return (
      <main className="max-w-container-max mx-auto px-margin-mobile py-20 text-center flex-grow">
        <h2 className="text-headline-lg text-primary font-bold mb-4">Specimen Not Found</h2>
        <p className="text-on-surface-variant mb-8">The requested herpetological specimen could not be found in our database.</p>
        <button 
          className="bg-primary text-on-primary px-6 py-2.5 rounded font-label-sm active:scale-95"
          onClick={() => navigateTo('gallery')}
        >
          Return to Registry
        </button>
      </main>
    );
  }

  // Formatting helpers
  const formatPrice = (cents: number, availability: string) => {
    if (availability === 'sold') return 'Sold';
    if (cents === 0) return 'Inquire';
    return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  // Get primary and secondary images
  const images = snake.images || [];
  const primaryImage = images.find((img: SnakeImage) => img.is_primary) || images[0];
  const galleryThumbnails = images.filter((img: SnakeImage) => img.id !== primaryImage?.id).slice(0, 4);

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12 text-left flex-grow mb-20">
      {/* Hero Section: Grid with Large Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        
        {/* Left: Gallery Bento */}
        <div className="lg:col-span-7 grid grid-cols-4 gap-4 h-fit">
          <div className="col-span-4 aspect-[3/2] rounded-xl overflow-hidden shadow-sm bg-surface-container">
            <img 
              className="w-full h-full object-cover" 
              src={primaryImage?.image_url || ''} 
              alt={snake.name}
            />
          </div>
          
          {galleryThumbnails.map((img: SnakeImage, i: number) => {
            const isLast = i === 3 && images.length > 5;
            return (
              <div 
                key={img.id} 
                className="col-span-1 aspect-square rounded-lg overflow-hidden relative cursor-pointer group bg-surface-container"
              >
                {isLast && (
                  <div className="absolute inset-0 bg-primary/40 flex items-center justify-center text-on-primary group-hover:bg-primary/60 transition-colors z-10">
                    <span className="font-headline-md font-bold">+{images.length - 4}</span>
                  </div>
                )}
                <img 
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200" 
                  src={img.image_url} 
                  alt={img.alt_text || snake.name}
                />
              </div>
            );
          })}
        </div>

        {/* Right: Identity & Specs */}
        <div className="lg:col-span-5 space-y-8 sticky top-24">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full font-label-sm text-label-sm font-bold ${
                snake.availability === 'available'
                  ? 'bg-primary/10 text-primary'
                  : snake.availability === 'reserved'
                  ? 'bg-tertiary-container/10 text-tertiary border border-on-tertiary-container/20'
                  : 'bg-surface-dim/20 text-on-surface-variant'
              }`}>
                {snake.availability.toUpperCase()}
              </span>
              <span className="text-on-surface-variant font-label-sm text-label-sm font-medium">REF: #772-{snake.uuid.substring(0, 5).toUpperCase()}</span>
            </div>
            <h2 className="font-display text-display leading-tight font-bold text-primary">{snake.name}</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">{snake.species} • {snake.morph}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-low">
              <span className="block text-on-surface-variant font-label-sm text-label-sm uppercase mb-1 font-bold">Gender</span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  {snake.detail?.gender === 'male' ? 'male' : snake.detail?.gender === 'female' ? 'female' : 'question_mark'}
                </span>
                <span className="font-headline-md font-bold capitalize">{snake.detail?.gender || 'unsexed'}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-low">
              <span className="block text-on-surface-variant font-label-sm text-label-sm uppercase mb-1 font-bold">Age</span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">event</span>
                <span className="font-headline-md font-bold">
                  {snake.detail?.age_years ? `${snake.detail.age_years} Year(s)` : 'N/A'}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-low">
              <span className="block text-on-surface-variant font-label-sm text-label-sm uppercase mb-1 font-bold">Length</span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">straighten</span>
                <span className="font-headline-md font-bold">
                  {snake.detail?.length_inches ? `${snake.detail.length_inches} Inches` : 'N/A'}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-low">
              <span className="block text-on-surface-variant font-label-sm text-label-sm uppercase mb-1 font-bold">Weight</span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">monitor_weight</span>
                <span className="font-headline-md font-bold">
                  {snake.detail?.weight_grams ? `${snake.detail.weight_grams}g` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-4 border-t border-outline-variant">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-on-surface-variant font-label-sm text-label-sm font-medium">Market Valuation</span>
                <p className="text-headline-lg font-headline-lg text-primary font-bold">
                  {formatPrice(snake.price_cents, snake.availability)}
                </p>
              </div>
              {snake.detail?.tax_included && (
                <span className="text-on-surface-variant font-body-md italic pb-1">Tax included</span>
              )}
            </div>
            {snake.availability === 'sold' ? (
              <button 
                disabled
                className="w-full bg-surface-dim text-on-surface-variant/40 font-headline-md py-4 rounded-xl flex items-center justify-center gap-3 font-bold cursor-not-allowed border border-outline-variant"
              >
                <span className="material-symbols-outlined">block</span>
                ขายแล้ว (Sold Out)
              </button>
            ) : snake.availability === 'reserved' ? (
              <button 
                onClick={() => setContactModalOpen(true)}
                className="w-full bg-amber-500 text-white hover:bg-amber-600 font-headline-md py-4 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-3 font-bold"
              >
                <span className="material-symbols-outlined">pending</span>
                ถูกจองแล้ว (Inquire for Backup)
              </button>
            ) : (
              <button 
                onClick={() => setContactModalOpen(true)}
                className="w-full bg-secondary text-on-secondary hover:bg-secondary/95 font-headline-md py-4 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-3 font-bold"
              >
                <span className="material-symbols-outlined">shopping_cart</span>
                สนใจซื้อ / ติดต่อผู้ขาย (Inquire to Buy)
              </button>
            )}
            <button className="w-full border-2 border-primary text-primary hover:bg-primary/5 font-headline-md py-4 rounded-xl transition-colors font-bold">
              Download PDF Pedigree
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Left Side: Genetics & History */}
        <div className="md:col-span-7 space-y-16">
          <section>
            <div className="flex items-center gap-4 mb-6">
              <span className="material-symbols-outlined text-primary">dns</span>
              <h3 className="font-display text-headline-lg font-bold text-primary">Genetics</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border-b border-outline-variant">
                <span className="font-headline-md font-medium text-primary">Visual Morph</span>
                <span className="font-data-point text-data-point bg-primary-container text-on-primary-container px-3 py-1 rounded font-medium">
                  {snake.morph || 'Normal'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 border-b border-outline-variant">
                <span className="font-headline-md font-medium text-primary">Heterozygous (Het)</span>
                <span className="font-data-point text-data-point bg-surface-container-high text-on-surface-variant px-3 py-1 rounded font-medium">
                  {snake.uuid === 'nebula-blue-morph' ? '100% Albino, 50% Pied' : 'None Detected'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 border-b border-outline-variant">
                <span className="font-headline-md font-medium text-primary">Provenance</span>
                <span className="font-body-md text-on-surface-variant">Captive Bred (F2 Generation)</span>
              </div>
              <p className="font-body-md text-on-surface-variant leading-relaxed pt-4">
                {snake.detail?.description || 'No detailed genetic description available.'}
              </p>
            </div>
          </section>

          {/* Timeline events */}
          {snake.history && snake.history.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-6">
                <span className="material-symbols-outlined text-primary">history</span>
                <h3 className="font-display text-headline-lg font-bold text-primary">Specimen History</h3>
              </div>
              <div className="space-y-6">
                {snake.history.map((evt: HistoryEvent, idx: number) => (
                  <div key={evt.id} className="relative pl-8 border-l-2 border-primary/20 text-left">
                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${idx === 0 ? 'bg-primary' : 'bg-outline'}`}></div>
                    <span className={`font-label-sm mb-1 block font-bold ${idx === 0 ? 'text-primary' : 'text-on-surface-variant'}`}>{evt.event_date}</span>
                    <h4 className="font-headline-md mb-2 font-bold text-primary">{evt.title}</h4>
                    <p className="text-on-surface-variant font-body-md">{evt.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Side: Family Tree (Lineage Pedigree) */}
        {snake.lineage && (
          <div className="md:col-span-5">
            <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant shadow-sm h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-10">
                  <span className="material-symbols-outlined text-primary">account_tree</span>
                  <h3 className="font-display text-headline-lg font-bold text-primary">Lineage Pedigree</h3>
                </div>
                
                <div className="relative flex flex-col items-center gap-16">
                  {/* Sire */}
                  {snake.lineage.sire && (
                    <div className="w-full relative">
                      <button 
                        onClick={() => navigateTo('detail', snake.lineage?.sire?.uuid)}
                        className="w-full group text-left block p-4 bg-white rounded-xl border-l-4 border-primary shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
                            <img className="w-full h-full object-cover" src={snake.lineage.sire.gallery_image_url || ''} alt="Sire" />
                          </div>
                          <div>
                            <span className="font-label-sm text-primary uppercase font-bold text-[10px]">Sire (Father)</span>
                            <h4 className="font-headline-md group-hover:text-secondary transition-colors font-bold text-primary">{snake.lineage.sire.name}</h4>
                            <span className="text-on-surface-variant text-label-sm font-data-point">{snake.lineage.sire.morph}</span>
                          </div>
                          <span className="material-symbols-outlined ml-auto text-outline group-hover:text-primary transition-colors">arrow_forward</span>
                        </div>
                      </button>
                      <div className="absolute -bottom-10 left-1/2 w-px h-10 bg-outline-variant"></div>
                    </div>
                  )}

                  {/* Current Subject (Highlighted) */}
                  <div className="w-4/5 z-10">
                    <div className="p-4 bg-secondary-container text-on-secondary-container rounded-xl border border-secondary shadow-[0px_4px_20px_rgba(115,92,0,0.15)] text-center ring-2 ring-secondary ring-offset-4 ring-offset-surface-container-low font-bold">
                      <span className="font-label-sm uppercase opacity-70 text-[10px] tracking-wider font-bold">Viewing Specimen</span>
                      <h4 className="font-headline-md">{snake.name}</h4>
                    </div>
                  </div>

                  {/* Dam */}
                  {snake.lineage.dam && (
                    <div className="w-full relative">
                      <div className="absolute -top-10 left-1/2 w-px h-10 bg-outline-variant"></div>
                      <button 
                        onClick={() => navigateTo('detail', snake.lineage?.dam?.uuid)}
                        className="w-full group text-left block p-4 bg-white rounded-xl border-l-4 border-primary shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
                            <img className="w-full h-full object-cover" src={snake.lineage.dam.gallery_image_url || ''} alt="Dam" />
                          </div>
                          <div>
                            <span className="font-label-sm text-primary uppercase font-bold text-[10px]">Dam (Mother)</span>
                            <h4 className="font-headline-md group-hover:text-secondary transition-colors font-bold text-primary">{snake.lineage.dam.name}</h4>
                            <span className="text-on-surface-variant text-label-sm font-data-point">{snake.lineage.dam.morph}</span>
                          </div>
                          <span className="material-symbols-outlined ml-auto text-outline group-hover:text-primary transition-colors">arrow_forward</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8 text-center">
                <button className="text-primary font-body-md underline decoration-primary/30 hover:decoration-primary transition-all font-medium">
                  View Full Ancestry Graph (5 Generations)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-outline-variant shadow-xl overflow-hidden text-left">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h3 className="font-display text-headline-md text-primary font-bold">
                สนใจสัตว์เลี้ยง (Inquire Specimen)
              </h3>
              <button 
                type="button" 
                className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
                onClick={() => setContactModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex gap-4 items-center bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                  <img src={primaryImage?.image_url || ''} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-body-lg text-primary">{snake.name}</h4>
                  <p className="text-xs text-on-surface-variant font-medium">{snake.species} • {snake.morph}</p>
                  <p className="text-sm font-bold text-primary mt-1">
                    {formatPrice(snake.price_cents, snake.availability)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  หากต้องการสอบถามข้อมูลเพิ่มเติม สั่งจอง หรือสั่งซื้อ สามารถติดต่อทีมงาน **KAIJUVILLAGE CO.LTD** ผ่านช่องทางติดต่อดังนี้:
                </p>
                
                <div className="space-y-3">
                  <a 
                    href="https://line.me/ti/p/@kaijuvillage" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 p-3.5 bg-green-50 hover:bg-green-100/80 rounded-xl text-green-800 transition-colors border border-green-200/50"
                  >
                    <span className="material-symbols-outlined font-bold">chat</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold block leading-none opacity-80">Line Official ID</span>
                      <span className="font-bold text-body-md font-mono">@kaijuvillage</span>
                    </div>
                  </a>

                  <a 
                    href="tel:0800000000" 
                    className="flex items-center gap-3 p-3.5 bg-blue-50 hover:bg-blue-100/80 rounded-xl text-blue-800 transition-colors border border-blue-200/50"
                  >
                    <span className="material-symbols-outlined font-bold">phone_in_talk</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold block leading-none opacity-80">Call Center</span>
                      <span className="font-bold text-body-md font-mono">080-000-0000</span>
                    </div>
                  </a>

                  <a 
                    href="mailto:contact@kaijuvillage.com" 
                    className="flex items-center gap-3 p-3.5 bg-surface-container-low hover:bg-surface-container-high rounded-xl text-on-surface transition-colors border border-outline-variant"
                  >
                    <span className="material-symbols-outlined font-bold">mail</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold block leading-none opacity-80">Email</span>
                      <span className="font-bold text-body-md font-mono">contact@kaijuvillage.com</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-outline-variant bg-surface-container-low text-right">
              <button 
                className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-label-sm font-bold hover:bg-primary/95 transition-colors active:scale-95"
                onClick={() => setContactModalOpen(false)}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
