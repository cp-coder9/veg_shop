import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';

export default function Header() {
  const { user, logout } = useAuthStore();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="glass-effect sticky top-0 z-50 shadow-soft backdrop-blur-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-organic-green-600 rounded-lg flex items-center justify-center group-hover:bg-organic-green-700 transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <span className="text-xl font-display font-bold text-organic-green-900 group-hover:text-organic-green-700 transition-colors">
              Organic Veg
            </span>
          </Link>
          
          {user && (
            <nav className="flex items-center gap-4">
              <NavLink to="/products" icon="products">Products</NavLink>
              <NavLink to="/cart" icon="cart" badge={totalItems}>Cart</NavLink>
              <NavLink to="/orders" icon="orders">Orders</NavLink>
              <NavLink to="/profile" icon="profile">Profile</NavLink>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-warm-gray-600 hover:text-organic-green-700 hover:bg-organic-green-50 rounded-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  icon: 'products' | 'cart' | 'orders' | 'profile';
  badge?: number;
}

function NavLink({ to, children, icon, badge }: NavLinkProps) {
  const icons = {
    products: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    ),
    cart: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    ),
    orders: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    ),
    profile: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    ),
  };

  return (
    <Link
      to={to}
      className="relative flex items-center gap-2 px-4 py-2 text-warm-gray-600 hover:text-organic-green-700 hover:bg-organic-green-50 rounded-lg transition-all duration-200 group"
    >
      <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icons[icon]}
      </svg>
      <span className="font-medium">{children}</span>
      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-organic-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
          {badge}
        </span>
      )}
    </Link>
  );
}
