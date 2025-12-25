import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

// Helper to get system preference
const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
};

// Helper to apply theme to DOM
const applyTheme = (theme: 'light' | 'dark') => {
    if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'system',
            resolvedTheme: getSystemTheme(),

            setTheme: (theme: Theme) => {
                const resolved = theme === 'system' ? getSystemTheme() : theme;
                applyTheme(resolved);
                set({ theme, resolvedTheme: resolved });
            },

            toggleTheme: () => {
                const current = get().resolvedTheme;
                const newTheme = current === 'light' ? 'dark' : 'light';
                applyTheme(newTheme);
                set({ theme: newTheme, resolvedTheme: newTheme });
            },
        }),
        {
            name: 'theme-storage',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    const resolved = state.theme === 'system' ? getSystemTheme() : state.theme;
                    applyTheme(resolved);
                }
            },
        }
    )
);

// Listen for system theme changes
if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const store = useThemeStore.getState();
        if (store.theme === 'system') {
            const newResolved = e.matches ? 'dark' : 'light';
            applyTheme(newResolved);
            useThemeStore.setState({ resolvedTheme: newResolved });
        }
    });
}
