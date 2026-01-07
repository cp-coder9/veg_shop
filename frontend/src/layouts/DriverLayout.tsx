import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function DriverLayout() {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Mobile Header */}
            <header className="bg-green-700 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold">🚛 Driver App</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                    <span>{user?.name || 'Driver'}</span>
                    <button
                        onClick={handleLogout}
                        className="bg-green-800 p-2 rounded hover:bg-green-900"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-4 pb-20 overflow-y-auto">
                <Outlet />
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 pb-6 z-50 shadow-lg">
                <button
                    onClick={() => navigate('/driver')}
                    className="flex flex-col items-center text-gray-600 hover:text-green-700 active:text-green-700"
                >
                    <span className="text-2xl">📦</span>
                    <span className="text-xs font-medium">Deliveries</span>
                </button>
                <button
                    onClick={() => navigate('/driver/logs')}
                    className="flex flex-col items-center text-gray-600 hover:text-green-700 active:text-green-700"
                >
                    <span className="text-2xl">📝</span>
                    <span className="text-xs font-medium">Logbook</span>
                </button>
            </nav>
        </div>
    );
}
