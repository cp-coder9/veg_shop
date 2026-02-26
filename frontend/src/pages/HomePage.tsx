import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui';
import logo from '../assets/our-harvest-tote-logo.png';

export default function HomePage() {
  const { user } = useAuthStore();

  // Redirect admins to admin panel
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cream">
      {/* Logo - Desktop */}
      <div className="absolute top-0 left-6 z-10 hidden md:block">
        <img
          src={logo}
          alt="Our Harvest Tote"
          className="w-72 lg:w-80 drop-shadow-xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-5 max-w-4xl mx-auto pt-0 md:pt-0">
        <div className="animate-fade-in">
          {/* Mobile Logo */}
          <div className="md:hidden flex justify-center mb-1">
            <img
              src={logo}
              alt="Our Harvest Tote"
              className="w-64 drop-shadow-xl"
            />
          </div>

          {/* Hero badge */}
          <div className="inline-flex flex-col items-center gap-1 bg-transparent px-10 py-4 border-2 border-muted-gold mb-10">
            <span className="font-body text-body-md tracking-wider text-center text-primary-dark">
              Curated. Harvested for you not the shelf.
            </span>
            <span className="font-body text-body-md tracking-wider text-center text-primary-dark">
              Farming that heals. Food that nourishes.
            </span>
          </div>

          {/* Pre-order button */}
          <div className="flex justify-center mb-10">
            <Link to="/products">
              <Button
                size="lg"
                className="text-[22px] gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 whitespace-nowrap bg-terracotta hover:bg-terracotta/90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Pre-order next weeks harvest
              </Button>
            </Link>
          </div>

          {user && (
            <p className="font-body text-body-md text-primary-dark mb-3 tracking-wide">
              Welcome back, {user.name}
            </p>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto animate-slide-up">
            <div className="p-6 text-left border-2 border-muted-gold bg-transparent">
              <h3 className="font-display text-body-lg mb-3 uppercase text-primary-dark">THE BETTER WAY TO BUY PRODUCE</h3>
              <p className="font-body text-body-md text-primary-dark mb-4">
                Instead of produce sitting in a warehouse or on a shelf for days, we work directly with small farmers and harvest only what has already been ordered.
              </p>
              <ul className="font-body text-body-sm text-primary-dark space-y-1">
                <li>• Fresher food</li>
                <li>• Less waste</li>
                <li>• Fairer returns for farmers</li>
                <li>• Better soil & eco system</li>
                <li>• Higher nutrient value</li>
              </ul>
            </div>

            <div className="p-6 text-left border-2 border-muted-gold bg-transparent">
              <h3 className="font-display text-body-lg mb-3 uppercase text-primary-dark">HOW IT WORKS</h3>
              <div className="space-y-4 font-body text-body-sm text-primary-dark">
                <div>
                  <p className="text-primary-dark uppercase font-medium">SEE WHATS AVAILABLE</p>
                  <p>Each week we share what our partner farms are harvesting</p>
                </div>
                <div>
                  <p className="text-primary-dark uppercase font-medium">PRE-ORDER</p>
                  <p>Place your order within the week prior to delivery so the farmers harvest exactly what's needed</p>
                </div>
                <div>
                  <p className="text-primary-dark uppercase font-medium">HARVEST & PACK</p>
                  <p>Produce is harvested at peak freshness and often harvested on the same day. Packed with minimal packaging and choosing reusable where possible.</p>
                </div>
                <div>
                  <p className="text-primary-dark uppercase font-medium">COLLECTION OR DELIVERY</p>
                  <p>WhatsApp messages will be sent out once your order has been packed for either collection or delivery.</p>
                </div>
              </div>
            </div>

            <div className="p-6 text-left border-2 border-muted-gold bg-transparent">
              <h3 className="font-display text-body-lg mb-3 uppercase text-primary-dark">ABOUT THE PRODUCE</h3>
              <p className="font-body text-body-md text-primary-dark mb-4">Food grown the right way, we focus on produce that is:</p>
              <ul className="font-body text-body-sm text-primary-dark space-y-1">
                <li>• Organic or chemical free</li>
                <li>• Grown using regenerative farming methods</li>
                <li>• From biodiverse farms, not monocultures</li>
                <li>• Seasonal and naturally ripened</li>
                <li>• Carefully selected for flavor and quality</li>
              </ul>
              <p className="font-body text-body-sm text-primary-dark mt-4">
                Better farming practices lead to healthier soil, stronger farms and better food for everyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
