import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVerifyCode } from '../hooks/useAuth';
import { Button, Input, Card } from '../components/ui';

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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* Icon */}
          <div className="w-16 h-16 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          <h1 className="font-display text-display-md text-primary-dark mb-2">Verify Code</h1>
          <p className="font-body text-body-md text-warm-gray">
            We sent a 6-digit code to{' '}
            <span className="font-medium text-primary-dark">{contact}</span> via{' '}
            <span className="capitalize">{method}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Verification Code"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={handleCodeChange}
            error={error}
            inputSize="lg"
            className="text-center text-2xl tracking-widest"
            maxLength={6}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={code.length !== 6}
            isLoading={verifyCode.isPending}
          >
            Verify & Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="font-body text-body-sm text-warm-gray mb-2">
            Didn't receive the code?
          </p>
          <Button variant="ghost" onClick={handleResend}>
            Resend Code
          </Button>
        </div>

        {/* Back to login link */}
        <div className="mt-6 pt-6 border-t border-light-gray text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-body text-body-sm text-terracotta hover:underline"
          >
            ← Back to Login
          </button>
        </div>
      </Card>
    </div>
  );
}
