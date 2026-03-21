import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSendCode, useDevLogin } from '../hooks/useAuth.js';
import logo from '../assets/our-harvest-tote-logo.png';
import { ArrowLeft } from 'lucide-react';

const TEST_ACCOUNTS = [
  { email: 'admin@vegshop.com', name: 'Admin', role: 'admin' },
  { email: 'john@example.com', name: 'Customer', role: 'customer' },
  { email: 'packer@vegshop.com', name: 'Packer', role: 'packer' },
  { email: 'driver@vegshop.com', name: 'Driver', role: 'driver' },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const sendCode = useSendCode();
  const devLogin = useDevLogin();

  const [contact, setContact] = useState('');
  const [method, setMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  const [error, setError] = useState('');
  const [showQuickLogin, setShowQuickLogin] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!contact.trim()) {
      setError('Please enter your phone number or email');
      return;
    }

    const isEmail = contact.includes('@');
    const selectedMethod = isEmail ? 'email' : method;

    try {
      await sendCode.mutateAsync({
        contact: contact.trim(),
        method: selectedMethod,
      });

      navigate('/verify', {
        state: {
          contact: contact.trim(),
          method: selectedMethod,
        },
      });
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    }
  };

  const handleDevLogin = async (email: string) => {
    try {
      await devLogin.mutateAsync({ email });
      navigate('/');
    } catch (err) {
      setError('Dev login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col items-center justify-center px-6 py-12">
      {/* Dev Quick Logins */}
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <div className="bg-[var(--pigment-green)] text-[var(--canvas)] shadow-xl">
          <button
            onClick={() => setShowQuickLogin(!showQuickLogin)}
            className="w-full px-6 py-2 flex items-center justify-between hover:bg-black/10 transition-colors font-mono text-xs uppercase tracking-widest"
          >
            <span>🔧 Development Tools</span>
            <span>{showQuickLogin ? 'CLOSE' : 'OPEN'}</span>
          </button>

          {showQuickLogin && (
            <div className="px-6 pb-6 animate-[fadeIn_0.3s_ease-out]">
              <p className="text-[10px] opacity-60 mb-3 uppercase tracking-wider">Instant Access (Dev Only)</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {TEST_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => handleDevLogin(account.email)}
                    disabled={devLogin.isPending}
                    className="p-3 bg-white/10 hover:bg-white/20 border border-white/10 text-left transition-all hover:scale-[1.02]"
                  >
                    <div className="font-bold text-sm tracking-tight">{account.name}</div>
                    <div className="text-[10px] opacity-60 uppercase">{account.role}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`w-full max-w-sm transition-all duration-500 ${showQuickLogin ? 'mt-32' : ''}`}>
        <div className="relative bg-white/50 backdrop-blur-sm border border-[var(--pigment-ochre)]/20 p-8 lg:p-12 shadow-2xl">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-6 left-6 p-2 text-[var(--ink)] opacity-40 hover:opacity-100 hover:scale-110 transition-all"
            aria-label="Back to home"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="text-center mb-12">
            <img src={logo} alt="Our Harvest Tote" className="w-20 mx-auto mb-8 filter grayscale brightness-50" />
            <h1 className="text-4xl font-black uppercase tracking-tighter text-[var(--pigment-green)] mb-3">Welcome</h1>
            <p className="text-sm font-mono opacity-60 leading-relaxed capitalize">
              Harvesting connection <br /> through better food.
            </p>
          </div>

          <form onSubmit={handleSendCode} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Identity</label>
              <input
                type="text"
                placeholder="Phone or Email"
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  setError('');
                }}
                className="w-full bg-transparent border-b-2 border-[var(--pigment-green)]/20 focus:border-[var(--pigment-green)] py-3 px-1 text-lg outline-none transition-all placeholder:opacity-30"
              />
              {error && <p className="text-[10px] text-[var(--pigment-oxide)] font-bold uppercase mt-1">{error}</p>}
            </div>

            {!contact.includes('@') && (
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold tracking-widest opacity-60">Verification Path</label>
                <div className="flex gap-4">
                  {[
                    { id: 'whatsapp' as const, label: 'WhatsApp', icon: '📱' },
                    { id: 'email' as const, label: 'Email', icon: '📧' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMethod(opt.id)}
                      className={`flex-1 p-4 border transition-all flex flex-col items-center gap-2 ${method === opt.id
                        ? 'border-[var(--pigment-green)] bg-[var(--pigment-green)]/5'
                        : 'border-transparent bg-white/30 grayscale opacity-60 hover:opacity-100'
                        }`}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <span className="text-[10px] uppercase font-bold tracking-tighter">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={sendCode.isPending}
              className="w-full bg-[var(--pigment-green)] text-[var(--canvas)] py-4 font-bold uppercase tracking-[3px] hover:bg-[var(--pigment-oxide)] transition-all flex justify-center items-center gap-3 disabled:opacity-50"
            >
              {sendCode.isPending ? 'Processing...' : 'Enter'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest">
              Secured by nature — verified by code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

