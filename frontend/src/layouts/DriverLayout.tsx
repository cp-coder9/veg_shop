import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.js';
import ThemeToggle from '../components/ThemeToggle.tsx';
import logo from '../assets/our-harvest-tote-logo.png';

export default function DriverLayout() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    {
      name: 'Dashboard',
      path: '/driver',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Logbook',
      path: '/driver/logs',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => {
    if (path === '/driver') return location.pathname === '/driver';
    if (path === '/packer') return location.pathname === '/packer';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-light-gray px-5 py-4 sticky top-0 z-40 safe-area-top">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="text-primary-dark p-2 hover:bg-cream rounded-lg transition-colors"
              aria-label="Menu"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 8h16M4 16h10" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg shadow-sm" />
              <div className="flex flex-col">
                <span className="font-display text-lg text-primary-dark leading-tight">Driver Portal</span>
                <span className="text-[10px] text-warm-gray uppercase tracking-widest font-bold">Operations</span>
              </div>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3" onClick={() => navigate('/profile')}>
              <div className="w-8 h-8 rounded-full bg-sage-green flex items-center justify-center text-white font-bold text-xs">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          <ThemeToggle className="ml-auto" />
        </div>
      </header>

      {/* Slide-out Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Slide-out Menu (Drawer) */}
      <aside className={`fixed top-0 left-0 bottom-0 w-72 bg-white z-[70] shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-6 py-8 border-b border-light-gray flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg" />
            <span className="font-display text-lg text-primary-dark">Portal</span>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="text-warm-gray" aria-label="Close menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive(item.path)
                ? 'bg-cream text-primary-dark font-semibold'
                : 'text-warm-gray hover:bg-cream hover:text-primary-dark'
                }`}
            >
              <div className={isActive(item.path) ? 'text-primary-dark' : 'text-warm-gray'}>
                {item.icon}
              </div>
              <span className="font-body">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-light-gray flex items-center gap-3 pb-safe">
          <div className="w-10 h-10 rounded-full bg-sage-green flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-primary-dark truncate">{user?.name}</span>
            <span className="text-xs text-warm-gray capitalize">{user?.role}</span>
          </div>
        </div>
      </aside>

      {/* Bottom Tab Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-light-gray pb-safe z-30 flex justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-4 transition-colors ${isActive ? 'text-sage-green' : 'text-warm-gray'}`
            }
          >
            {item.icon}
            <span className="text-[10px] mt-1 font-bold uppercase tracking-tighter">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 p-4 md:p-6 lg:p-10 max-w-7xl mx-auto w-full pb-24 md:pb-6 lg:pb-10">
        <Outlet />
      </main>
    </div >
  );
}
