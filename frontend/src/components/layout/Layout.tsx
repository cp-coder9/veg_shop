import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { ShoppingCart, User as UserIcon, Menu, X, LogOut, ChevronRight } from 'lucide-react';
import logo from '../../assets/our-harvest-tote-logo.png';
import { OrderWindowBanner } from '../shop/OrderWindowBanner.js';
import ThemeToggle from '../ThemeToggle.tsx';

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
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/products' },
    { name: 'Orders', path: '/orders' },
    { name: 'Profile', path: '/profile' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] font-sans selection:bg-[var(--pigment-green)] selection:text-[var(--canvas)] flex flex-col">
      <OrderWindowBanner />
      {/* Universal Header */}
      <header className="sticky top-0 z-[100] px-8 py-6 flex justify-between items-center bg-[rgba(233,228,217,0.8)] backdrop-blur-md border-b border-[var(--pigment-ochre)]/10">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="text-[var(--ink)] hover:text-[var(--pigment-oxide)] transition-transform hover:scale-110"
            aria-label="Menu"
          >
            <Menu size={24} />
          </button>

          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="Logo" className="w-8 h-8 filter grayscale brightness-50 group-hover:grayscale-0 transition-all" />
            <span className="text-2xl font-black uppercase tracking-tighter text-[var(--pigment-green)] hidden sm:inline">
              Our Harvest Tote
            </span>
          </Link>
        </div>

        <div className="flex gap-6 items-center">
          <Link
            to={user ? "/profile" : "/login"}
            className={`text-[var(--ink)] hover:text-[var(--pigment-oxide)] transition-all hover:scale-110 hover:rotate-6 ${location.pathname === '/profile' ? 'text-[var(--pigment-oxide)]' : ''}`}
            aria-label="Profile"
          >
            <UserIcon size={22} />
          </Link>
          <Link
            to="/cart"
            className={`text-[var(--ink)] hover:text-[var(--pigment-oxide)] transition-all hover:scale-110 hover:rotate-6 relative ${location.pathname === '/cart' ? 'text-[var(--pigment-oxide)]' : ''}`}
            aria-label="Cart"
          >
            <ShoppingCart size={22} />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Slide-out Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[110] backdrop-blur-sm transition-opacity animate-[fadeIn_0.3s_ease-out]"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <aside className={`fixed top-0 left-0 bottom-0 w-full sm:w-[350px] bg-[var(--canvas)] z-[120] shadow-2xl transition-transform duration-500 cubic-bezier(0.23, 1, 0.32, 1) transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-[var(--pigment-ochre)]/20`}>
        <div className="p-8 flex flex-col h-full relative overflow-hidden">
          {/* Decorative Background for Sidebar */}
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[var(--pigment-green)]/3 blur-3xl rounded-full pointer-events-none" />

          <div className="flex items-center justify-between mb-16 relative z-10">
            <Link to="/" onClick={() => setIsMenuOpen(false)}>
              <img src={logo} alt="Logo" className="w-12 filter grayscale brightness-50" />
            </Link>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="text-[var(--ink)] p-2 hover:scale-110 hover:rotate-90 transition-all"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 space-y-2 relative z-10">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center justify-between group py-4 border-b border-[var(--pigment-ochre)]/10 transition-all
                  ${isActive ? 'text-[var(--pigment-oxide)] pl-4' : 'text-[var(--ink)] hover:pl-4'}
                `}
              >
                <span className="text-2xl font-black uppercase tracking-tighter">{item.name}</span>
                <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto relative z-10 pt-8">
            {user ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-white/30 p-4 border border-[var(--pigment-ochre)]/10 backdrop-blur-sm">
                  <div className="w-12 h-12 bg-[var(--pigment-green)] text-[var(--canvas)] flex items-center justify-center font-bold text-xl uppercase tracking-tighter shadow-lg">
                    {user.name?.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black uppercase tracking-tighter text-[var(--pigment-green)]">{user.name}</span>
                    <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">{user.role}</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-[var(--pigment-oxide)] text-[var(--canvas)] font-bold uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-center gap-3 py-4 bg-[var(--pigment-green)] text-[var(--canvas)] font-bold uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl"
              >
                <UserIcon size={18} />
                <span>Identification</span>
              </Link>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <Outlet />
      </main>

      {!isHomePage && (
        <footer className="px-8 py-16 text-center bg-[var(--canvas)] flex flex-col items-center gap-6 border-t border-[var(--pigment-ochre)]/10">
          <Link to="/" className="opacity-20 hover:opacity-100 transition-opacity">
            <img src={logo} alt="Logo" className="w-16 grayscale" />
          </Link>
          <div className="font-mono text-[10px] opacity-40 tracking-[0.3em] uppercase">
            &copy; {new Date().getFullYear()} OUR HARVEST TOTE. OXIDIZED BY NATURE.
          </div>
        </footer>
      )}
    </div>
  );
}

