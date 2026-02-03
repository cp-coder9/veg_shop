/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'organic-green': {
                    100: '#f0fdf4',
                    200: '#dcfce7',
                    300: '#bbf7d0',
                    400: '#86efac',
                    500: '#4ade80',
                    600: '#16a34a', // Primary
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                'warm-gray': {
                    50: '#fafaf9',
                    100: '#f5f5f4',
                    200: '#e7e5e4',
                    300: '#d6d3d1',
                    400: '#a8a29e',
                    500: '#78716c',
                    600: '#57534e',
                    700: '#44403c',
                    800: '#292524',
                    900: '#1c1917',
                },
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
                display: ['Poppins', 'ui-sans-serif', 'system-ui'],
            },
            boxShadow: {
                'card': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
        },
    },
    plugins: [],
}
