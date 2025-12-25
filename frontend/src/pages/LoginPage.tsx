import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSendCode, useDevLogin } from '../hooks/useAuth';

export default function LoginPage() {
  const [contact, setContact] = useState('');
  const [method, setMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  const navigate = useNavigate();
  const sendCode = useSendCode();
  const devLogin = useDevLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await sendCode.mutateAsync({ contact, method });
      navigate('/verify', { state: { contact, method } });
    } catch (error) {
      console.error('Failed to send code:', error);
    }
  };

  const handleDevLogin = async (email: string) => {
    try {
      await devLogin.mutateAsync({ email });
      navigate('/');
    } catch (error) {
      console.error('Failed to dev login:', error);
    }
  };

  const isEmail = contact.includes('@');
  const suggestedMethod = isEmail ? 'email' : 'whatsapp';

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-organic-green-50 via-organic-green-100 to-organic-green-200">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-organic-green-300 rounded-full filter blur-3xl opacity-20 animate-pulse-soft"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-earth-brown-300 rounded-full filter blur-3xl opacity-20 animate-pulse-soft" style={{animationDelay: '1s'}}></div>
      
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="card">
          {/* Header */}
          <div className="p-8 pb-6 text-center border-b border-warm-gray-200">
            <div className="w-16 h-16 bg-organic-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-organic-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h1 className="text-3xl font-display font-bold text-organic-green-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-warm-gray-600">
              Sign in to your Organic Veg account
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="contact" className="block text-sm font-medium text-warm-gray-700 mb-3">
                  Phone Number or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-warm-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="contact"
                    type="text"
                    value={contact}
                    onChange={(e) => {
                      setContact(e.target.value);
                      setMethod(e.target.value.includes('@') ? 'email' : 'whatsapp');
                    }}
                    placeholder="Enter phone or email"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-gray-700 mb-3">
                  Verification Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                    method === 'whatsapp' 
                      ? 'border-organic-green-500 bg-organic-green-50' 
                      : 'border-warm-gray-300 hover:border-warm-gray-400'
                  } ${isEmail ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="radio"
                      value="whatsapp"
                      checked={method === 'whatsapp'}
                      onChange={(e) => setMethod(e.target.value as 'whatsapp')}
                      className="sr-only"
                      disabled={isEmail}
                    />
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-organic-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-2.4-.322l-3.6.96a1.5 1.5 0 01-1.8-1.8l.96-3.6A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                      </svg>
                      <span className={`font-medium ${
                        method === 'whatsapp' ? 'text-organic-green-900' : 'text-warm-gray-700'
                      }`}>WhatsApp</span>
                    </div>
                  </label>
                  
                  <label className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                    method === 'email' 
                      ? 'border-organic-green-500 bg-organic-green-50' 
                      : 'border-warm-gray-300 hover:border-warm-gray-400'
                  }`}>
                    <input
                      type="radio"
                      value="email"
                      checked={method === 'email'}
                      onChange={(e) => setMethod(e.target.value as 'email')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-organic-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className={`font-medium ${
                        method === 'email' ? 'text-organic-green-900' : 'text-warm-gray-700'
                      }`}>Email</span>
                    </div>
                  </label>
                </div>
                {contact && method !== suggestedMethod && (
                  <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tip: {suggestedMethod === 'email' ? 'Email' : 'WhatsApp'} is recommended for this contact
                  </p>
                )}
              </div>

              {sendCode.isError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800">Failed to send verification code</p>
                      <p className="text-sm text-red-600 mt-1">Please check your contact information and try again.</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={sendCode.isPending || !contact}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {sendCode.isPending ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="loading-spinner h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Sending verification code...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Send Verification Code
                  </span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-warm-gray-600">
                New to Organic Veg?{' '}
                <Link to="/" className="font-medium text-organic-green-600 hover:text-organic-green-700">
                  Learn more about us
                </Link>
              </p>
            </div>

            {import.meta.env.DEV && (
              <div className="mt-8 pt-8 border-t border-warm-gray-200">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-warm-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-warm-gray-500 font-medium">
                      Development Mode
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDevLogin('admin@vegshop.com')}
                    disabled={devLogin.isPending}
                    className="w-full inline-flex justify-center py-3 px-4 border-2 border-organic-green-200 rounded-xl bg-organic-green-50 text-sm font-semibold text-organic-green-700 hover:bg-organic-green-100 transition-all disabled:opacity-50"
                  >
                    {devLogin.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="loading-spinner h-4 w-4 border-2 border-organic-green-600 border-t-transparent"></div>
                        Logging in...
                      </span>
                    ) : (
                      'Login as Admin'
                    )}
                  </button>
                  <button
                    onClick={() => handleDevLogin('john@example.com')}
                    disabled={devLogin.isPending}
                    className="w-full inline-flex justify-center py-3 px-4 border-2 border-organic-green-200 rounded-xl bg-organic-green-50 text-sm font-semibold text-organic-green-700 hover:bg-organic-green-100 transition-all disabled:opacity-50"
                  >
                    {devLogin.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="loading-spinner h-4 w-4 border-2 border-organic-green-600 border-t-transparent"></div>
                        Logging in...
                      </span>
                    ) : (
                      'Login as Customer'
                    )}
                  </button>
                </div>
                {devLogin.isError && (
                  <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <p className="text-sm text-red-700">
                      Failed to login. Make sure the seed users exist and the backend is running.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-warm-gray-500">
            Secure login with verification code
          </p>
        </div>
      </div>
    </div>
  );
}