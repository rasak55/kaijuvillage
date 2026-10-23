import React from 'react';

interface FooterProps {
  navigateTo: (page: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigateTo }) => {
  return (
    <footer className="w-full py-16 bg-primary-container text-on-primary-container mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-left">
        <div className="space-y-4">
          <h2 className="font-display text-headline-lg text-white mb-6">KAIJUVILLAGE CO.LTD</h2>
          <p className="font-body-md text-body-md opacity-80 pr-4">
            The premier global destination for high-end herpetology, lineage tracking, and ethical trade.
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="font-headline-md text-headline-md mb-2 text-white font-bold">Marketplace</h4>
          <button 
            className="text-left font-label-sm text-label-sm opacity-80 hover:opacity-100 hover:text-secondary-fixed transition-colors"
            onClick={() => navigateTo('gallery')}
          >
            Snakes for Sale
          </button>
          <button className="text-left font-label-sm text-label-sm opacity-80 hover:opacity-100 hover:text-secondary-fixed transition-colors">
            Geckos &amp; Lizards
          </button>
          <button className="text-left font-label-sm text-label-sm opacity-80 hover:opacity-100 hover:text-secondary-fixed transition-colors">
            Turtles &amp; Tortoises
          </button>
          <button className="text-left font-label-sm text-label-sm opacity-80 hover:opacity-100 hover:text-secondary-fixed transition-colors">
            Equipment
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="font-headline-md text-headline-md mb-2 text-white font-bold">Resources</h4>
          <button className="text-left font-label-sm text-label-sm opacity-80 hover:opacity-100 hover:text-secondary-fixed transition-colors">
            Community Guidelines
          </button>
          <button className="text-left font-label-sm text-label-sm opacity-80 hover:opacity-100 hover:text-secondary-fixed transition-colors">
            Breeder Directory
          </button>
          <button className="text-left font-label-sm text-label-sm opacity-80 hover:opacity-100 hover:text-secondary-fixed transition-colors">
            Herpetology Resources
          </button>
          <button className="text-left font-label-sm text-label-sm opacity-80 hover:opacity-100 hover:text-secondary-fixed transition-colors">
            Shipping Guide
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="font-headline-md text-headline-md mb-2 text-white font-bold">Support</h4>
          <button className="text-left font-label-sm text-label-sm opacity-80 hover:opacity-100 hover:text-secondary-fixed transition-colors">
            Privacy Policy
          </button>
          <button className="text-left font-label-sm text-label-sm opacity-80 hover:opacity-100 hover:text-secondary-fixed transition-colors">
            Terms of Service
          </button>
          <button className="text-left font-label-sm text-label-sm opacity-80 hover:opacity-100 hover:text-secondary-fixed transition-colors">
            Contact Us
          </button>
          <div className="flex gap-6 mt-4">
            <span className="material-symbols-outlined cursor-pointer hover:text-secondary-fixed text-white">public</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-secondary-fixed text-white">mail</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-secondary-fixed text-white">share</span>
          </div>
        </div>
      </div>
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-16 pt-8 border-t border-white/10 text-center">
        <p className="font-label-sm text-label-sm opacity-60 text-white">© 2026 KAIJUVILLAGE CO.LTD. All rights reserved.</p>
      </div>
    </footer>
  );
};
