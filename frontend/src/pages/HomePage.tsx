import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

import heroImage from '../assets/hero-harvest.png';
import logo from '../assets/our-harvest-tote-logo.png';

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

      <div className="absolute top-6 left-6 z-10">
        <img
          src={logo}
          alt="Our Harvest Tote"
          className="w-28 md:w-36 lg:w-40 drop-shadow-xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-24">
        <div className="animate-fade-in">
          {/* Hero badge */}
          <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm mb-6">
            <span className="text-sm font-medium text-organic-green-700">Fresh from Regenerative Farms to your Door</span>
          </div>

          {user && (
            <p className="text-white/90 text-sm md:text-base mb-3 tracking-wide">
              Welcome back, {user.name}
            </p>
          )}

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight drop-shadow-md">
            Fresh from Regenerative Farms
            <span className="block text-organic-green-300">to your Door</span>
          </h1>

          <p className="text-lg md:text-2xl text-gray-100 mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-sm">
            We bring together the best organic, regenerative and biodiverse produce from small local farmers, harvest it at peak freshness, and deliver it directly to your home.
          </p>
          <p className="text-base md:text-lg text-gray-100 mb-10 max-w-3xl mx-auto leading-relaxed drop-shadow-sm">
            Pre-order weekly, eat with the season, enjoy food that actually tastes like food and support real farms.
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
                Pre-order next weeks harvest
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
                  Pre-order next weeks harvest
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto animate-slide-up">
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 card-hover shadow-lg">
              <div className="w-12 h-12 bg-organic-green-100 rounded-lg flex items-center justify-center mb-4 text-2xl">
                🌿
              </div>
              <h3 className="font-display font-semibold text-lg text-organic-green-900 mb-3">The Better way to buy produce</h3>
              <p className="text-warm-gray-700 mb-4">
                Instead of produce sitting in a warehouse or on a shelf for days, we work directly with small farmers and harvest only what has already been ordered.
              </p>
              <ul className="text-warm-gray-700 space-y-1 text-sm">
                <li>• Fresher food</li>
                <li>• Less waste</li>
                <li>• Fairer returns for farms</li>
                <li>• Better soil & eco system</li>
                <li>• Higher nutrient value</li>
              </ul>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 card-hover shadow-lg">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4 text-2xl">
                🧺
              </div>
              <h3 className="font-display font-semibold text-lg text-organic-green-900 mb-3">How it works</h3>
              <div className="space-y-4 text-warm-gray-700 text-sm">
                <div>
                  <p className="font-semibold text-organic-green-900">SEE WHATS AVAILABLE</p>
                  <p>Each week we share what our partner farms are harvesting</p>
                </div>
                <div>
                  <p className="font-semibold text-organic-green-900">PRE-ORDER</p>
                  <p>Place your order within the week prior to delivery so the farmers harvest exactly what’s needed</p>
                </div>
                <div>
                  <p className="font-semibold text-organic-green-900">HARVEST & PACK</p>
                  <p>Produce is harvested at peak freshness and often harvested on the same day. Packed with minimal packaging and choosing reusable where possible.</p>
                </div>
                <div>
                  <p className="font-semibold text-organic-green-900">COLLECTION OR DELIVERY</p>
                  <p>WhatsApp messages will be sent out once your order has been packed for either collection or delivery.</p>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 card-hover shadow-lg">
              <div className="w-12 h-12 bg-organic-green-100 rounded-lg flex items-center justify-center mb-4 text-2xl">
                🥬
              </div>
              <h3 className="font-display font-semibold text-lg text-organic-green-900 mb-3">ABOUT THE PRODUCE</h3>
              <p className="text-warm-gray-700 mb-4">Food grown the right way, we focus on produce that is:</p>
              <ul className="text-warm-gray-700 space-y-1 text-sm">
                <li>• Organic or chemical free</li>
                <li>• Grown using regenerative farming methods</li>
                <li>• From biodiverse farms, not monocultures</li>
                <li>• Seasonal and naturally ripened</li>
                <li>• Carefully selected for flavor and quality</li>
              </ul>
              <p className="text-warm-gray-700 text-sm mt-4">
                Better farming practices lead to healthier soil, stringer farms and better food for everyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
