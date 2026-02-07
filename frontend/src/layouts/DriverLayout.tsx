import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import logo from '../assets/our-harvest-tote-logo.png';

export default function DriverLayout() {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-warm-gray-50 flex flex-col">
            {/* Mobile Header */}
            <header className="bg-organic-green-700 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center space-x-3">
                    <img
                        src={logo}
                        alt="Our Harvest Tote"
                        className="w-10 h-10 rounded-lg bg-white/90 p-1"
                    />
                    <span className="text-xl font-bold">
                        {user?.role === 'packer' ? '📦 Packer App' : '🚛 Driver App'}
                    </span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                    <span className="text-organic-green-50">{user?.name || user?.role}</span>
                    <button
                        onClick={handleLogout}
                        className="bg-organic-green-800 p-2 rounded hover:bg-organic-green-900"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-4 pb-20 overflow-y-auto">
                <Outlet />
            </main>

            {/* Mobile Bottom Nav - Only for Drivers for now */}
            {user?.role === 'driver' && (
                <nav className="fixed bottom-0 w-full bg-white border-t border-warm-gray-200 flex justify-around p-3 pb-6 z-50 shadow-lg">
                    <button
                        onClick={() => navigate('/driver')}
                        className={`flex flex-col items-center hover:text-organic-green-700 active:text-organic-green-700 ${location.pathname === '/driver' ? 'text-organic-green-700' : 'text-warm-gray-600'}`}
                    >
                        <span className="text-2xl">📦</span>
                        <span className="text-xs font-medium">Deliveries</span>
                    </button>
                    <button
                        onClick={() => navigate('/driver/logs')}
                        className={`flex flex-col items-center hover:text-organic-green-700 active:text-organic-green-700 ${location.pathname === '/driver/logs' ? 'text-organic-green-700' : 'text-warm-gray-600'}`}
                    >
                        <span className="text-2xl">📝</span>
                        <span className="text-xs font-medium">Logbook</span>
                    </button>
                </nav>
            )}
        </div>
    );
}
