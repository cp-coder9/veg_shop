import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSendCode, useDevLogin, useRegister, useLogin } from '../hooks/useAuth';
import logo from '../assets/our-harvest-tote-logo.png';

type AuthMethod = 'whatsapp' | 'email-password';
type AuthMode = 'login' | 'register';

export default function AuthPage() {
    const [mode, setMode] = useState<AuthMode>('login');
    const [method, setMethod] = useState<AuthMethod>('whatsapp');

    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // WhatsApp/Phone State
    const [phoneContact, setPhoneContact] = useState('');

    // Register State
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regAddress, setRegAddress] = useState('');
    const [regBirthday, setRegBirthday] = useState('');

    const navigate = useNavigate();

    // Hooks
    const sendCode = useSendCode();
    const verifyLogin = useLogin();
    const registerUser = useRegister();
    const devLogin = useDevLogin();

    const handleWhatsAppSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await sendCode.mutateAsync({ contact: phoneContact, method: 'whatsapp' });
            navigate('/verify', { state: { contact: phoneContact, method: 'whatsapp' } });
        } catch (error) {
            console.error('Failed to send code:', error);
        }
    };

    const handleNavigationByRole = (role: string) => {
        switch (role) {
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
    };

    const handleEmailLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = await verifyLogin.mutateAsync({ email: loginEmail, password: loginPassword });
            handleNavigationByRole(data.user.role);
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = await registerUser.mutateAsync({
                name: regName,
                email: regEmail,
                password: regPassword,
                phone: regPhone,
                address: regAddress,
                birthday: regBirthday,
            });
            handleNavigationByRole(data.user.role);
        } catch (error) {
            console.error('Registration failed:', error);
        }
    };

    const handleDevLogin = async (email: string) => {
        try {
            const data = await devLogin.mutateAsync({ email });
            handleNavigationByRole(data.user.role);
        } catch (error) {
            console.error('Failed to dev login:', error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-organic-green-50 via-organic-green-100 to-organic-green-200">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-organic-green-300 rounded-full filter blur-3xl opacity-20 animate-pulse-soft"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-earth-brown-300 rounded-full filter blur-3xl opacity-20 animate-pulse-soft" style={{ animationDelay: '1s' }}></div>

            <div className="relative z-10 w-full max-w-md px-4 py-8">
                <div className="card overflow-hidden">
                    {/* Header */}
                    <div className="p-8 pb-6 text-center border-b border-warm-gray-200">
                        <div className="w-16 h-16 bg-organic-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <img src={logo} alt="Our Harvest Tote" className="w-10 h-10" />
                        </div>
                        <h1 className="text-3xl font-display font-bold text-organic-green-900 mb-2">
                            {mode === 'login' ? 'Great to have you here' : 'Create Account'}
                        </h1>
                        <p className="text-warm-gray-600">
                            {mode === 'login' ? 'Sign back into your account or register to order' : 'Join our community'}
                        </p>
                    </div>

                    {/* Mode Tabs */}
                    <div className="flex border-b border-warm-gray-200">
                        <button
                            className={`flex-1 py-4 text-center font-medium transition-colors ${mode === 'login' ? 'text-organic-green-700 border-b-2 border-organic-green-700 bg-organic-green-50' : 'text-warm-gray-500 hover:text-warm-gray-700'
                                }`}
                            onClick={() => setMode('login')}
                        >
                            Login
                        </button>
                        <button
                            className={`flex-1 py-4 text-center font-medium transition-colors ${mode === 'register' ? 'text-organic-green-700 border-b-2 border-organic-green-700 bg-organic-green-50' : 'text-warm-gray-500 hover:text-warm-gray-700'
                                }`}
                            onClick={() => setMode('register')}
                        >
                            Register
                        </button>
                    </div>

                    <div className="p-8">
                        {mode === 'login' && (
                            <div className="space-y-6">
                                {/* Method Toggle */}
                                <div className="flex bg-warm-gray-100 p-1 rounded-xl">
                                    <button
                                        onClick={() => setMethod('whatsapp')}
                                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${method === 'whatsapp' ? 'bg-white shadow text-organic-green-700' : 'text-warm-gray-600 hover:text-warm-gray-800'
                                            }`}
                                    >
                                        WhatsApp Login
                                    </button>
                                    <button
                                        onClick={() => setMethod('email-password')}
                                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${method === 'email-password' ? 'bg-white shadow text-organic-green-700' : 'text-warm-gray-600 hover:text-warm-gray-800'
                                            }`}
                                    >
                                        Email Login
                                    </button>
                                </div>

                                {method === 'whatsapp' ? (
                                    <form onSubmit={handleWhatsAppSubmit} className="space-y-6">
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-warm-gray-700 mb-2">
                                                WhatsApp Number
                                            </label>
                                            <input
                                                id="phone"
                                                type="tel"
                                                value={phoneContact}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneContact(e.target.value)}
                                                placeholder="+27 82 123 4567"
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={sendCode.isPending}
                                            className="w-full btn-primary"
                                        >
                                            {sendCode.isPending ? 'Sending Code...' : 'Send Verification Code'}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleEmailLoginSubmit} className="space-y-6">
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-warm-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                id="email"
                                                type="email"
                                                value={loginEmail}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="password" className="block text-sm font-medium text-warm-gray-700 mb-2">
                                                Password
                                            </label>
                                            <input
                                                id="password"
                                                type="password"
                                                value={loginPassword}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                        {verifyLogin.isError && (
                                            <div className="text-red-600 text-sm">Invalid email or password.</div>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={verifyLogin.isPending}
                                            className="w-full btn-primary"
                                        >
                                            {verifyLogin.isPending ? 'Logging in...' : 'Login'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {mode === 'register' && (
                            <form onSubmit={handleRegisterSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-warm-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={regName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegName(e.target.value)}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warm-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={regEmail}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegEmail(e.target.value)}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warm-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={regPassword}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegPassword(e.target.value)}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warm-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={regPhone}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegPhone(e.target.value)}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warm-gray-700 mb-1">Address</label>
                                    <input
                                        type="text"
                                        value={regAddress}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegAddress(e.target.value)}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-warm-gray-700 mb-1">Birthday</label>
                                    <input
                                        type="date"
                                        value={regBirthday}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegBirthday(e.target.value)}
                                        className="input-field"
                                    />
                                    <p className="text-xs text-warm-gray-500 mt-1">We’d like to wish you on the day.</p>
                                </div>

                                {registerUser.isError && (
                                    <div className="text-red-600 text-sm">
                                        Registration failed. Email or phone might be in use.
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={registerUser.isPending}
                                    className="w-full btn-primary"
                                >
                                    {registerUser.isPending ? 'Create Account...' : 'Create Account'}
                                </button>
                            </form>
                        )}

                        {import.meta.env.DEV && (
                            <div className="mt-8 pt-6 border-t border-warm-gray-200">
                                <p className="text-xs text-center text-warm-gray-500 mb-4">DEV MODE</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleDevLogin('admin@vegshop.com')} className="px-3 py-2 text-xs bg-gray-100 rounded hover:bg-gray-200">
                                        Login Admin
                                    </button>
                                    <button onClick={() => handleDevLogin('john@example.com')} className="px-3 py-2 text-xs bg-gray-100 rounded hover:bg-gray-200">
                                        Login Customer
                                    </button>
                                    <button onClick={() => handleDevLogin('packer@vegshop.com')} className="px-3 py-2 text-xs bg-gray-100 rounded hover:bg-gray-200">
                                        Login Packer
                                    </button>
                                    <button onClick={() => handleDevLogin('driver@vegshop.com')} className="px-3 py-2 text-xs bg-gray-100 rounded hover:bg-gray-200">
                                        Login Driver
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
