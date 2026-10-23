import React, { useState } from 'react';
import { db } from '../services/db';
import type { Snake } from '../types/schema';

interface HomepageProps {
  navigateTo: (page: string, param?: string) => void;
}

interface ModalState {
  isOpen: boolean;
  src: string;
  name: string;
  species: string;
}

export const Homepage: React.FC<HomepageProps> = () => {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    src: '',
    name: '',
    species: ''
  });

  const [featuredSnakes, setFeaturedSnakes] = useState<Snake[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  React.useEffect(() => {
    db.getSnakes()
      .then(snakes => {
        const snakesWithImages = snakes.filter(s => s.gallery_image_url);
        const shuffled = [...snakesWithImages].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 6);
        setFeaturedSnakes(selected);
        if (selected.length > 0) {
          setActiveIndex(selected.length - 1);
        }
      })
      .catch(err => console.error('Error loading featured snakes:', err));
  }, []);

  const scrollLeft = () => {
    if (featuredSnakes.length > 0) {
      setActiveIndex((prev) => (prev - 1 + featuredSnakes.length) % featuredSnakes.length);
    }
  };

  const scrollRight = () => {
    if (featuredSnakes.length > 0) {
      setActiveIndex((prev) => (prev + 1) % featuredSnakes.length);
    }
  };

  const handleItemClick = (index: number, snake: Snake) => {
    if (index === activeIndex) {
      openModal(snake.gallery_image_url || '', snake.name, snake.species);
    } else {
      setActiveIndex(index);
    }
  };

  const openModal = (src: string, name: string, species: string) => {
    setModal({ isOpen: true, src, name, species });
  };

  const closeModal = () => {
    setModal({ isOpen: false, src: '', name: '', species: '' });
  };

  // Manage body scroll lock
  React.useEffect(() => {
    if (modal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modal.isOpen]);

  // Close modal on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="w-full flex-grow bg-surface">
      {/* Serpentine Heritage Gallery Carousel */}
      <section className="py-12 bg-surface text-left">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mb-8 flex justify-between items-end">
          <div>
            <h2 className="font-display text-headline-lg text-primary font-bold">Serpentine Heritage</h2>
            <p className="font-body-md text-on-surface-variant">Exploring the world's most exquisite biological masterpieces.</p>
          </div>
          <div className="flex gap-2">
            <button 
              className="w-12 h-12 flex items-center justify-center rounded-full border border-outline-variant hover:bg-surface-container transition-colors active:scale-95" 
              onClick={scrollLeft}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <button 
              className="w-12 h-12 flex items-center justify-center rounded-full border border-outline-variant hover:bg-surface-container transition-colors active:scale-95" 
              onClick={scrollRight}
            >
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>

        <div 
          className="flex gap-[1px] px-margin-mobile md:px-margin-desktop pb-12 w-full h-[480px] md:h-[580px] overflow-hidden"
        >
          {featuredSnakes.map((snake, index) => {
            const isActive = index === activeIndex;
            return (
              <div 
                key={snake.id}
                className={`h-full overflow-hidden relative cursor-pointer transition-all duration-700 ease-out group ${
                  isActive ? 'flex-1 min-w-0' : 'w-[100px] shrink-0'
                }`}
                onClick={() => handleItemClick(index, snake)}
              >
                <img 
                  alt={snake.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" 
                  src={snake.gallery_image_url || ''}
                />
                
                {/* Overlay gradient */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-700 ${
                  isActive ? 'opacity-85' : 'opacity-40'
                }`}></div>

                {/* Collapsed label (Vertical index number) */}
                {!isActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                    <span className="text-white/60 font-mono text-sm tracking-wider uppercase rotate-90 whitespace-nowrap">
                      {index + 1}
                    </span>
                  </div>
                )}

                {/* Snake Info */}
                <div className={`absolute bottom-6 left-6 right-6 text-white text-left transition-all duration-700 delay-100 ${
                  isActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
                }`}>
                  <p className="font-label-sm text-label-sm text-secondary-fixed mb-1 uppercase tracking-widest">
                    {snake.species}
                  </p>
                  <h3 className="font-display text-headline-md leading-tight font-bold">{snake.name}</h3>
                </div>

                {/* Fullscreen icon */}
                {isActive && (
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="material-symbols-outlined text-white bg-black/40 p-2.5 rounded-full backdrop-blur-sm">fullscreen</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>


      {/* Modal Lightbox for Expansion */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <button 
            className="absolute top-8 right-8 text-white p-2 hover:bg-white/10 rounded-full transition-colors" 
            onClick={closeModal}
          >
            <span className="material-symbols-outlined text-4xl">close</span>
          </button>
          <div className="max-w-5xl w-full h-full flex flex-col items-center justify-center">
            <img 
              alt={modal.name} 
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl mb-8" 
              src={modal.src}
            />
            <div className="text-center text-white">
              <p className="font-label-sm text-label-sm text-secondary-fixed uppercase tracking-widest mb-2">
                {modal.species}
              </p>
              <h2 className="font-display text-display leading-none font-bold">{modal.name}</h2>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
