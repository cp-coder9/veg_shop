import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import logo from '../assets/our-harvest-tote-logo.png';

/**
 * Driver/Packer layout with mobile-first design
 * Features bottom tab navigation for mobile workers
 */
export default function DriverLayout() {
  const { user } = useAuthStore();
  const location = useLocation();

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
      name: 'Packer',
      path: '/packer',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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
    if (path === '/driver') {
      return location.pathname === '/driver';
    }
    if (path === '/packer') {
      return location.pathname === '/packer';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header - Hidden on mobile, visible on tablet/desktop */}
      <header className="hidden md:block bg-white border-b border-light-gray px-5 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Our Harvest Tote"
              className="w-10 h-10 rounded-lg"
            />
            <div className="flex flex-col">
              <span className="font-display text-display-sm text-primary-dark">
                Driver Portal
              </span>
              <span className="text-caption text-warm-gray">Operations</span>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sage-green flex items-center justify-center">
                <span className="text-white font-medium text-body-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'D'}
                </span>
              </div>
              <span className="text-body-md text-primary-dark font-medium">
                {user.name}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 md:p-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-light-gray z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 px-4 transition-colors ${
                isActive(item.path)
                  ? 'text-primary-dark'
                  : 'text-warm-gray hover:text-primary-dark'
              }`}
            >
              {item.icon}
              <span className="text-caption font-medium mt-1">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
