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
                // Primary Colors
                'primary-dark': '#1A1A1A',
                'primary-light': '#FFFFFF',
                'cream': '#F5F0E8',
                
                // Secondary Colors
                'warm-gray': '#8B8178',
                'light-gray': '#E8E4DE',
                'soft-black': '#2D2926',
                
                // Accent Colors
                'terracotta': '#C17F59',
                'sage-green': '#8B9A7D',
                'muted-gold': '#B8A77A',
                
                // Semantic Colors
                'success': '#7A9E7E',
                'warning': '#D4A574',
                'error': '#C75D5D',
                'info': '#7B8FA2',
                
                // Legacy colors for backward compatibility
                'organic-green': {
                    100: '#fdf6e8',
                    200: '#f7e7c6',
                    300: '#efcf8f',
                    400: '#e7b65a',
                    500: '#d89b3d',
                    600: '#bf7f2e',
                    700: '#9a5f22',
                    800: '#7a4a1b',
                    900: '#5a3414',
                },
            },
            fontFamily: {
                // Display font for headlines, product names
                'display': ['"Playfair Display"', 'Georgia', 'serif'],
                // Body font for body text, UI elements
                'body': ['Inter', '-apple-system', 'sans-serif'],
                // Accent font for labels, captions
                'accent': ['"DM Sans"', 'sans-serif'],
                // Legacy fonts for backward compatibility
                'sans': ['Inter', '-apple-system', 'sans-serif'],
                'league': ['"League Spartan"', 'sans-serif'],
            },
            fontSize: {
                // Display sizes
                'display-lg': ['48px', {
                    lineHeight: '1.1',
                    letterSpacing: '-0.02em',
                }],
                'display-md': ['36px', {
                    lineHeight: '1.2',
                    letterSpacing: '-0.01em',
                }],
                'display-sm': ['28px', {
                    lineHeight: '1.25',
                    letterSpacing: '-0.01em',
                }],
                // Body sizes
                'body-lg': ['18px', {
                    lineHeight: '1.5',
                }],
                'body-md': ['16px', {
                    lineHeight: '1.5',
                }],
                'body-sm': ['14px', {
                    lineHeight: '1.5',
                }],
                // Caption and overline
                'caption': ['12px', {
                    lineHeight: '1.4',
                    letterSpacing: '0.02em',
                }],
                'overline': ['10px', {
                    lineHeight: '1.5',
                    letterSpacing: '0.1em',
                }],
            },
            borderRadius: {
                'sm': '4px',
                'md': '8px',
                'lg': '12px',
                'xl': '16px',
                '2xl': '24px',
            },
            boxShadow: {
                'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
                'md': '0 4px 6px rgba(0, 0, 0, 0.07)',
                'lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
                'xl': '0 20px 25px rgba(0, 0, 0, 0.12)',
                // Legacy shadows for backward compatibility
                'card': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
        },
    },
    plugins: [],
}
