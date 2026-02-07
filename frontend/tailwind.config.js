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
                    100: '#fdf6e8',
                    200: '#f7e7c6',
                    300: '#efcf8f',
                    400: '#e7b65a',
                    500: '#d89b3d',
                    600: '#bf7f2e', // Primary
                    700: '#9a5f22',
                    800: '#7a4a1b',
                    900: '#5a3414',
                },
                'warm-gray': {
                    50: '#faf7f2',
                    100: '#f3ede3',
                    200: '#e4d7c7',
                    300: '#d2bfa8',
                    400: '#b79a78',
                    500: '#9a7a5c',
                    600: '#7e5f45',
                    700: '#654a36',
                    800: '#4a3527',
                    900: '#352418',
                },
            },
            fontFamily: {
                sans: ['"Source Sans 3"', 'ui-sans-serif', 'system-ui'],
                display: ['"Cormorant Garamond"', 'ui-serif', 'Georgia'],
            },
            boxShadow: {
                'card': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
        },
    },
    plugins: [],
}
