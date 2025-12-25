import { useThemeStore } from '../stores/themeStore';

export default function ThemeToggle() {
    const { resolvedTheme, toggleTheme } = useThemeStore();
    const isDark = resolvedTheme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-lg bg-warm-gray-100 dark:bg-warm-gray-800 hover:bg-warm-gray-200 dark:hover:bg-warm-gray-700 transition-all duration-300 group"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            {/* Sun Icon */}
            <svg
                className={`w-5 h-5 transition-all duration-300 ${isDark
                        ? 'text-warm-gray-400 scale-75 opacity-0'
                        : 'text-amber-500 scale-100 opacity-100'
                    } absolute inset-0 m-auto`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
            </svg>

            {/* Moon Icon */}
            <svg
                className={`w-5 h-5 transition-all duration-300 ${isDark
                        ? 'text-organic-green-400 scale-100 opacity-100'
                        : 'text-warm-gray-400 scale-75 opacity-0'
                    }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
            </svg>
        </button>
    );
}
