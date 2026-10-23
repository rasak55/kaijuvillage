import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BottomNav } from './components/BottomNav';
import { Homepage } from './pages/Homepage';
import { Gallery } from './pages/Gallery';
import { GalleryDetail } from './pages/GalleryDetail';
import { Breeding } from './pages/Breeding';
import { Market } from './pages/Market';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';

function App() {
  const [route, setRoute] = useState({ page: 'home', param: '' });
  const [adminUser, setAdminUser] = useState<any | null>(null);

  // Load admin user session on mount
  useEffect(() => {
    const savedUser = sessionStorage.getItem('adminUser');
    if (savedUser) {
      try {
        setAdminUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse admin session:', err);
      }
    }
  }, []);

  // Listen to hash changes for routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash || hash === '#/') {
        setRoute({ page: 'home', param: '' });
      } else if (hash.startsWith('#/gallery')) {
        const filter = hash.includes('?') ? hash.split('?')[1] : '';
        setRoute({ page: 'gallery', param: filter });
      } else if (hash.startsWith('#/detail/')) {
        const uuid = hash.replace('#/detail/', '');
        setRoute({ page: 'detail', param: uuid });
      } else if (hash.startsWith('#/breeding/')) {
        const id = hash.replace('#/breeding/', '');
        setRoute({ page: 'breeding', param: id });
      } else if (hash === '#/breeding') {
        setRoute({ page: 'breeding', param: '' });
      } else if (hash === '#/market') {
        setRoute({ page: 'market', param: '' });
      } else if (hash === '#/admin/login') {
        setRoute({ page: 'admin-login', param: '' });
      } else if (hash === '#/admin/dashboard') {
        setRoute({ page: 'admin-dashboard', param: '' });
      } else {
        setRoute({ page: 'home', param: '' });
      }
      window.scrollTo(0, 0); // Always scroll to top on navigation
    };

    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: string, param?: string) => {
    if (page === 'home') {
      window.location.hash = '#/';
    } else if (page === 'gallery') {
      window.location.hash = param ? `#/gallery?${param}` : '#/gallery';
    } else if (page === 'detail' && param) {
      window.location.hash = `#/detail/${param}`;
    } else if (page === 'breeding') {
      window.location.hash = param ? `#/breeding/${param}` : '#/breeding';
    } else if (page === 'market') {
      window.location.hash = '#/market';
    } else if (page === 'admin-login') {
      window.location.hash = '#/admin/login';
    } else if (page === 'admin-dashboard') {
      window.location.hash = '#/admin/dashboard';
    }
  };

  const handleLoginSuccess = (user: any) => {
    setAdminUser(user);
    sessionStorage.setItem('adminUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setAdminUser(null);
    sessionStorage.removeItem('adminUser');
    navigateTo('home');
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header currentPage={route.page} navigateTo={navigateTo} adminUser={adminUser} />
      
      <div className="flex-grow">
        {route.page === 'home' && <Homepage navigateTo={navigateTo} />}
        {route.page === 'gallery' && <Gallery navigateTo={navigateTo} initialFilter={route.param} />}
        {route.page === 'detail' && <GalleryDetail uuid={route.param} navigateTo={navigateTo} />}
        {route.page === 'breeding' && <Breeding initialSnakeId={route.param} />}
        {route.page === 'market' && <Market />}
        {route.page === 'admin-login' && (
          <AdminLogin navigateTo={navigateTo} onLoginSuccess={handleLoginSuccess} />
        )}
        {route.page === 'admin-dashboard' && (
          <AdminDashboard navigateTo={navigateTo} adminUser={adminUser} onLogout={handleLogout} />
        )}
      </div>
      
      <Footer navigateTo={navigateTo} />
      <BottomNav currentPage={route.page} navigateTo={navigateTo} adminUser={adminUser} />
    </div>
  );
}

export default App;
