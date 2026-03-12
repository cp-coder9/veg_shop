import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSendCode, useDevLogin } from '../hooks/useAuth';
import { Button, Input, Card } from '../components/ui';

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

    // Validate contact
    if (!contact.trim()) {
      setError('Please enter your phone number or email');
      return;
    }

    // Determine if contact is email or phone
    const isEmail = contact.includes('@');
    const selectedMethod = isEmail ? 'email' : method;

    try {
      await sendCode.mutateAsync({
        contact: contact.trim(),
        method: selectedMethod,
      });

      // Navigate to verification page
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
      // Navigate based on role - will be handled by the auth store/routing
      navigate('/');
    } catch (err) {
      setError('Dev login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      {/* Collapsible Quick Login Section */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-gray-800 text-white">
          <button
            onClick={() => setShowQuickLogin(!showQuickLogin)}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-700 transition-colors"
          >
            <span className="font-medium">🔧 Quick Logins (Development)</span>
            <span className="text-xl">{showQuickLogin ? '▼' : '▲'}</span>
          </button>

          {showQuickLogin && (
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-400 mb-3">
                Click to instantly login as a test user:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {TEST_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => handleDevLogin(account.email)}
                    disabled={devLogin.isPending}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left disabled:opacity-50"
                  >
                    <div className="font-medium text-sm">{account.name}</div>
                    <div className="text-xs text-gray-400">{account.role}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Auth Card - pushed down when quick login is shown */}
      <div className={`w-full max-w-md ${showQuickLogin ? 'mt-32' : ''}`}>
        <Card className="relative">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 p-2 text-warm-gray hover:text-primary-dark transition-colors"
            aria-label="Back to home"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="w-20 h-20 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <h1 className="font-display text-display-md text-primary-dark mb-2">Welcome</h1>
            <p className="font-body text-body-md text-warm-gray">
              Sign in or create an account to start ordering fresh produce
            </p>
          </div>

          <form onSubmit={handleSendCode} className="space-y-6">
            <Input
              label="Phone Number or Email"
              placeholder="Enter your phone or email"
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                setError('');
              }}
              error={error}
              inputSize="lg"
            />

            {/* Method Selection - Only show for phone numbers */}
            {!contact.includes('@') && (
              <div>
                <p className="font-accent text-caption text-warm-gray uppercase tracking-wider mb-2">
                  Receive code via
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod('whatsapp')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${method === 'whatsapp'
                        ? 'border-terracotta bg-terracotta/5'
                        : 'border-light-gray hover:border-warm-gray'
                      }`}
                  >
                    <span className="text-xl mb-1 block">📱</span>
                    <span className="font-body text-body-sm text-primary-dark">WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('email')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${method === 'email'
                        ? 'border-terracotta bg-terracotta/5'
                        : 'border-light-gray hover:border-warm-gray'
                      }`}
                  >
                    <span className="text-xl mb-1 block">📧</span>
                    <span className="font-body text-body-sm text-primary-dark">Email</span>
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={sendCode.isPending}
            >
              Continue
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-body text-body-sm text-warm-gray">
              By continuing, you agree to receive verification codes via{' '}
              {contact.includes('@') ? 'email' : method}.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
