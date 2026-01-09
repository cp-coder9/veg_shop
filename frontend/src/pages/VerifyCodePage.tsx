import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVerifyCode } from '../hooks/useAuth';

export default function VerifyCodePage() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const verifyCode = useVerifyCode();

  const contact = location.state?.contact;
  const method = location.state?.method;

  if (!contact) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = await verifyCode.mutateAsync({ contact, code });

      switch (data.user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'driver':
          navigate('/driver');
          break;
        case 'packer':
          navigate('/packer');
          break;
        default:
          navigate('/dashboard');
          break;
      }
    } catch (error) {
      console.error('Failed to verify code:', error);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Code</h1>
          <p className="text-gray-600">
            We sent a 6-digit code to {contact} via {method === 'whatsapp' ? 'WhatsApp' : 'email'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              maxLength={6}
              required
              autoFocus
            />
          </div>

          {verifyCode.isError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              Invalid or expired code. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={verifyCode.isPending || code.length !== 6}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {verifyCode.isPending ? 'Verifying...' : 'Verify & Sign In'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full text-gray-600 hover:text-gray-900 text-sm"
          >
            Back to login
          </button>
        </form>
      </div>
    </div>
  );
}
