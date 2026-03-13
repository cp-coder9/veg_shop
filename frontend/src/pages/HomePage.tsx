import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Button, CartIcon } from '../components/ui';
import logo from '../assets/our-harvest-tote-logo.png';

export default function HomePage() {
  const { user } = useAuthStore();

  // Redirect admins to admin panel
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* Hero Section */}
      <div className="py-12 flex flex-col items-center">
        <div className="mb-6">
          <img
            src={logo}
            alt="Our Harvest Tote"
            className="w-48 drop-shadow-sm"
          />
        </div>

        <div className="max-w-xl text-center px-6">
          <p className="font-sans text-xl text-gray-800 leading-relaxed font-medium mb-1">
            Fresh from regenerative farms straight to your door
          </p>
          <p className="font-sans text-xl text-gray-800 leading-relaxed font-medium">
            Farming that heals. food that nourishes.
          </p>
        </div>
      </div>

      {/* Pre-order Section */}
      <div className="py-16 flex flex-col items-center bg-cream border-b border-gray-300">
        <Link to="/products" className="w-full max-w-sm px-6">
          <Button
            variant="harvest"
            size="lg"
            leftIcon={<CartIcon className="w-5 h-5 text-white" strokeWidth={2} />}
            className="w-full py-4 font-sans text-xl normal-case tracking-normal"
          >
            Pre-order next weeks harvest
          </Button>
        </Link>
      </div>

      {/* How it Works Section */}
      <div className="py-12 bg-cream flex justify-center px-6">
        <div className="border border-gray-300 max-w-lg w-full p-8 space-y-10">
          <div className="flex gap-4">
            <div className="bg-[#0B3004] text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-sans font-bold text-xs">1</div>
            <div>
              <h3 className="font-sans font-bold text-lg text-black uppercase tracking-tight mb-1">Whats growing</h3>
              <p className="font-sans text-gray-800 leading-relaxed text-lg">Each week we share what our partner farms are harvesting</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-[#0B3004] text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-sans font-bold text-xs">2</div>
            <div>
              <h3 className="font-sans font-bold text-lg text-black uppercase tracking-tight mb-1">Pre-order</h3>
              <p className="font-sans text-gray-800 leading-relaxed text-lg">Place your order within the week prior to delivery so the farmers harvest exactly whats needed</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-[#0B3004] text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-sans font-bold text-xs">3</div>
            <div>
              <h3 className="font-sans font-bold text-lg text-black uppercase tracking-tight mb-1">Harvest & pack</h3>
              <p className="font-sans text-gray-800 leading-relaxed text-lg">Produce is harvested at peak freshness and often on the same day. Packed with minimal packaging and reusable where possible</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-[#0B3004] text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-sans font-bold text-xs">4</div>
            <div>
              <h3 className="font-sans font-bold text-lg text-black uppercase tracking-tight mb-1">Collection or Delivery</h3>
              <p className="font-sans text-gray-800 leading-relaxed text-lg">WhatsApp messages will be sent out once your order has been packed for collection or delivery</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-[#0B3004] text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-sans font-bold text-xs">5</div>
            <div>
              <h3 className="font-sans font-bold text-lg text-black uppercase tracking-tight mb-1">PROCESSING</h3>
              <p className="font-sans text-gray-800 leading-relaxed text-lg">If produce is unavailable post-ordering, a credit will be allocated to your account - login to your profile to view</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mustard Section */}
      <div className="bg-[#FFCC00] py-16 px-8 relative overflow-hidden border-t border-gray-300">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-sans font-bold text-2xl mb-8 uppercase tracking-tight text-black">A BETTER WAY TO BUY PRODUCE</h2>
          <p className="font-sans text-gray-800 text-xl mb-8 leading-relaxed font-medium">
            Instead of produce sitting in a warehouse or on a shelf for days, we work directly with a small farmers and harvest only what has already been ordered
          </p>
          <ul className="space-y-3 text-gray-800 text-xl font-sans leading-relaxed font-medium">
            <li>• Fresher food</li>
            <li>• Less waste</li>
            <li>• Fair trade</li>
            <li>• Better soil & eco system</li>
            <li>• Higher nutrient value</li>
          </ul>
        </div>

        {/* Floating icon at bottom right */}
        <div className="absolute bottom-8 right-8 bg-[#FFFF99] p-4 rounded-3xl shadow-lg cursor-pointer">
          <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 8V4h4m8 0h4v4m0 8v4h-4M8 20H4v-4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 9h10v6H7z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 12h10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
