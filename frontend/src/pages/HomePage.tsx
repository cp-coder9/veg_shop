import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

import heroImage from '../assets/hero-harvest.png';

export default function HomePage() {
  const { user } = useAuthStore();

  // Redirect admins to admin panel
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Bountiful vegetable harvest"
          className="w-full h-full object-cover filter brightness-[0.85]"
        />
        <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>

      {/* Content followed by existing content... */}

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="animate-fade-in">
          {/* Hero badge */}
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm mb-6">
            <span className="w-2 h-2 bg-organic-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-organic-green-700">Fresh & Organic</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight drop-shadow-md">
            Fresh Organic
            <span className="block text-organic-green-300">Produce Delivered</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-100 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            Farm-fresh vegetables straight from our fields to your door.
            Sustainable, organic, and always in season.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {user ? (
              <Link
                to="/products"
                className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Browse Products
              </Link>
            ) : (
              <>
                <Link
                  to="/products"
                  className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Browse Products
                </Link>
                <Link
                  to="/login"
                  className="btn-secondary text-lg px-8 py-4 inline-flex items-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-slide-up">
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 card-hover shadow-lg">
              <div className="w-12 h-12 bg-organic-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-organic-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-display font-semibold text-lg text-organic-green-900 mb-2">100% Organic</h3>
              <p className="text-warm-gray-600">Certified organic produce grown without harmful chemicals</p>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 card-hover shadow-lg">
              <div className="w-12 h-12 bg-earth-brown-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-earth-brown-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-display font-semibold text-lg text-organic-green-900 mb-2">Fast Delivery</h3>
              <p className="text-warm-gray-600">Next-day delivery for orders placed before 6 PM</p>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 card-hover shadow-lg">
              <div className="w-12 h-12 bg-organic-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-organic-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-display font-semibold text-lg text-organic-green-900 mb-2">Farm Fresh</h3>
              <p className="text-warm-gray-600">Picked daily from local farms for maximum freshness</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
