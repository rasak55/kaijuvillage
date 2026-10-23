import React from 'react';

interface HeaderProps {
  currentPage: string;
  navigateTo: (page: string, param?: string) => void;
  adminUser?: any;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, navigateTo, adminUser }) => {
  return (
    <header className="w-full sticky top-0 z-50 bg-surface dark:bg-surface-dim border-b border-outline-variant dark:border-outline shadow-sm">
      <div className="flex items-center justify-between px-margin-mobile md:px-margin-desktop py-4 w-full">
        <div 
          className="flex items-center gap-4 cursor-pointer active:opacity-80"
          onClick={() => navigateTo('home')}
        >
          <span className="material-symbols-outlined text-primary">menu</span>
          <h1 className="font-display text-headline-md text-primary tracking-tight font-bold">KAIJUVILLAGE CO.LTD</h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <button 
            className={`font-label-sm text-label-sm px-2 py-1 rounded transition-colors ${
              currentPage === 'home' 
                ? 'text-primary font-bold border-b-2 border-primary' 
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
            onClick={() => navigateTo('home')}
          >
            Home
          </button>
          <button 
            className={`font-label-sm text-label-sm px-2 py-1 rounded transition-colors ${
              currentPage === 'gallery' 
                ? 'text-primary font-bold border-b-2 border-primary' 
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
            onClick={() => navigateTo('gallery')}
          >
            Gallery
          </button>
          <button 
            className={`font-label-sm text-label-sm px-2 py-1 rounded transition-colors ${
              currentPage === 'market' 
                ? 'text-primary font-bold border-b-2 border-primary' 
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
            onClick={() => navigateTo('market')}
          >
            ตลาดซื้อขาย
          </button>
          <button 
            className={`font-label-sm text-label-sm px-2 py-1 rounded transition-colors ${
              currentPage === 'breeding' 
                ? 'text-primary font-bold border-b-2 border-primary' 
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
            onClick={() => navigateTo('breeding')}
          >
            สายเลือด
          </button>
          {adminUser ? (
            <button 
              className={`font-label-sm text-label-sm px-2 py-1 rounded transition-colors ${
                currentPage === 'admin-dashboard' 
                  ? 'text-primary font-bold border-b-2 border-primary' 
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
              onClick={() => navigateTo('admin-dashboard')}
            >
              จัดการข้อมูล
            </button>
          ) : (
            <button 
              className={`font-label-sm text-label-sm px-2 py-1 rounded transition-colors ${
                currentPage === 'admin-login' 
                  ? 'text-primary font-bold border-b-2 border-primary' 
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
              onClick={() => navigateTo('admin-login')}
            >
              เข้าระบบ
            </button>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <span 
            className="material-symbols-outlined text-primary cursor-pointer active:opacity-80" 
            onClick={() => navigateTo('gallery')}
          >
            search
          </span>
        </div>
      </div>
    </header>
  );
};
