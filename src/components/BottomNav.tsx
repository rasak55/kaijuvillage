import React from 'react';

interface BottomNavProps {
  currentPage: string;
  navigateTo: (page: string, param?: string) => void;
  adminUser?: any;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, navigateTo, adminUser }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-16 px-2 bg-surface-container-lowest shadow-[0px_-4px_20px_rgba(27,48,34,0.08)] z-50 border-t border-outline-variant">
      <button 
        className={`flex flex-col items-center justify-center px-4 py-1 transition-colors ${
          currentPage === 'home' ? 'text-primary font-bold' : 'text-on-surface-variant'
        }`}
        onClick={() => navigateTo('home')}
      >
        <span className="material-symbols-outlined">home</span>
        <span className="font-label-sm text-[10px]">Home</span>
      </button>

      <button 
        className={`flex flex-col items-center justify-center px-4 py-1 transition-colors ${
          currentPage === 'gallery' ? 'text-primary font-bold' : 'text-on-surface-variant'
        }`}
        onClick={() => navigateTo('gallery')}
      >
        <span className="material-symbols-outlined">visibility</span>
        <span className="font-label-sm text-[10px]">Gallery</span>
      </button>

      <button 
        className={`flex flex-col items-center justify-center px-4 py-1 transition-colors ${
          currentPage === 'market' ? 'text-primary font-bold' : 'text-on-surface-variant'
        }`}
        onClick={() => navigateTo('market')}
      >
        <span className="material-symbols-outlined">shopping_bag</span>
        <span className="font-label-sm text-[10px]">ตลาดซื้อขาย</span>
      </button>

      <button 
        className={`flex flex-col items-center justify-center px-4 py-1 transition-colors ${
          currentPage === 'admin-login' || currentPage === 'admin-dashboard' 
            ? 'text-primary font-bold' 
            : 'text-on-surface-variant'
        }`}
        onClick={() => navigateTo(adminUser ? 'admin-dashboard' : 'admin-login')}
      >
        <span className="material-symbols-outlined">account_circle</span>
        <span className="font-label-sm text-[10px]">{adminUser ? 'จัดการข้อมูล' : 'เข้าระบบ'}</span>
      </button>
    </nav>
  );
};
