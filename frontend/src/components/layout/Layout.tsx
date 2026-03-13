import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { UserIcon, CartIcon } from '../ui';
import logo from '../../assets/our-harvest-tote-logo.png';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Shop',
      path: '/products',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      name: 'Orders',
      path: '/orders',
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

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Mobile-only Header for Hamburger (Visible when guest on home page or everywhere else) */}
      <header className="bg-[#F2F2F7] md:hidden border-b border-gray-300 px-5 py-4 sticky top-0 z-40 flex items-center justify-between">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="text-primary-dark p-1"
          aria-label="Menu"
        >
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M4 8h16M4 16h10" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        <NavLink to="/" className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg" />
        </NavLink>

        <div className="flex items-center gap-4">
          <button onClick={() => navigate(user ? '/profile' : '/login')} className="text-warm-gray">
            <UserIcon width={24} height={24} strokeWidth={1.5} />
          </button>
          <button onClick={() => navigate(user ? '/cart' : '/login')} className="text-warm-gray">
            <CartIcon width={24} height={24} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block bg-[#F2F2F7] border-b border-gray-300 px-5 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="text-primary-dark p-1"
              aria-label="Menu"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 8h16M4 16h10" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
            <NavLink to="/" className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg" />
              <span className="font-display text-display-sm text-primary-dark">Our Harvest Tote</span>
            </NavLink>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => navigate(user ? '/profile' : '/login')} className="text-warm-gray hover:text-primary-dark transition-colors">
              <UserIcon strokeWidth={1.2} />
            </button>
            <button onClick={() => navigate(user ? '/cart' : '/login')} className="text-warm-gray hover:text-primary-dark transition-colors">
              <CartIcon strokeWidth={1.2} />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm transition-opacity"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <aside className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[70] shadow-2xl transition-transform duration-300 ease-in-out transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-10">
            <img src={logo} alt="Logo" className="w-12 h-12 rounded-xl" />
            <button onClick={() => setIsMenuOpen(false)} className="text-warm-gray p-2" aria-label="Close menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 space-y-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive(item.path) ? 'bg-cream text-primary-dark font-semibold' : 'text-warm-gray hover:bg-cream hover:text-primary-dark'}`}
              >
                <div className={isActive(item.path) ? 'text-primary-dark' : 'text-warm-gray'}>
                  {item.icon}
                </div>
                <span className="font-body text-lg">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="pt-6 border-t border-light-gray space-y-4">
            {user && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-error bg-error/5 hover:bg-error/10 transition-colors font-medium border border-error/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            )}

            {!user && (
              <button
                onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-dark text-white hover:bg-primary-dark/90 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Login</span>
              </button>
            )}

            <div className="flex items-center gap-4 px-2">
              <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-primary-dark font-medium">{user?.name || 'Guest'}</span>
                <span className="text-caption text-warm-gray capitalize">{user?.role || 'Visitor'}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
