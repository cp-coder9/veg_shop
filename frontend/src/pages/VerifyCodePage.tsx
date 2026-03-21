import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVerifyCode } from '../hooks/useAuth.js';
import logo from '../assets/our-harvest-tote-logo.png';
import { ShieldCheck, ArrowLeft, RotateCcw } from 'lucide-react';

export default function VerifyCodePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const verifyCode = useVerifyCode();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  // Get contact info from navigation state
  const contact = location.state?.contact || '';
  const method = location.state?.method || 'email';

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numeric input, max 6 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      await verifyCode.mutateAsync({
        contact,
        code,
      });
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    }
  };

  const handleResend = () => {
    // Navigate back to login to resend code
    navigate('/login', {
      state: {
        contact,
        message: 'A new verification code has been sent.',
      },
    });
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="relative bg-white/50 backdrop-blur-sm border border-[var(--pigment-ochre)]/20 p-8 lg:p-12 shadow-2xl">
          {/* Back Button */}
          <button
            onClick={() => navigate('/login')}
            className="absolute top-6 left-6 p-2 text-[var(--ink)] opacity-40 hover:opacity-100 hover:scale-110 transition-all"
            aria-label="Back to login"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="text-center mb-12">
            <img src={logo} alt="Our Harvest Tote" className="w-20 mx-auto mb-8 filter grayscale brightness-50" />

            <div className="mb-6 flex justify-center">
              <div className="w-12 h-12 bg-[var(--pigment-green)]/10 rounded-full flex items-center justify-center text-[var(--pigment-green)]">
                <ShieldCheck size={28} />
              </div>
            </div>

            <h1 className="text-3xl font-black uppercase tracking-tighter text-[var(--pigment-green)] mb-3">Verify</h1>
            <p className="text-[11px] font-mono opacity-60 leading-relaxed uppercase tracking-widest">
              Check your {method} — <br />
              <span className="text-[var(--ink)] opacity-100 font-bold">{contact}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-60">6-Digit Code</label>
              <input
                type="text"
                placeholder="000000"
                value={code}
                onChange={handleCodeChange}
                className="w-full bg-transparent border-b-2 border-[var(--pigment-green)]/20 focus:border-[var(--pigment-green)] py-3 text-center text-3xl font-black tracking-[0.5em] outline-none transition-all placeholder:opacity-10"
                maxLength={6}
              />
              {error && <p className="text-[10px] text-[var(--pigment-oxide)] font-bold uppercase mt-1 text-center">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={code.length !== 6 || verifyCode.isPending}
              className="w-full bg-[var(--pigment-green)] text-[var(--canvas)] py-4 font-bold uppercase tracking-[3px] hover:bg-[var(--pigment-oxide)] transition-all flex justify-center items-center gap-3 disabled:opacity-50"
            >
              {verifyCode.isPending ? 'Validating...' : 'Confirm'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-[var(--pigment-ochre)]/10 text-center space-y-4">
            <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest">
              Didn't receive it?
            </p>
            <button
              onClick={handleResend}
              className="flex items-center gap-2 mx-auto text-[10px] font-bold uppercase tracking-wider text-[var(--pigment-oxide)] hover:scale-105 transition-transform"
            >
              <RotateCcw size={12} /> Resend Pulse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

