/** @type {import('tailwindcss').Config} */
module.exports = {
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
 
                 // Artisanal Palette
                 'canvas': 'var(--canvas)',
                 'pigment-green': 'var(--pigment-green)',
                 'pigment-ochre': 'var(--pigment-ochre)',
                 'pigment-oxide': 'var(--pigment-oxide)',
                 'ink': 'var(--ink)',
 
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
                     50: '#fdf6e8',
                     100: '#f7e7c6',
                     200: '#efcf8f',
                     300: '#e7b65a',
                     400: '#d89b3d',
                     500: '#bf7f2e',
                     600: '#9a5f22',
                     700: '#7a4a1b',
                     800: '#5a3414',
                     900: '#3c2b0e',
                 },
                 
                 // Extended warm-gray scale
                 'warm-gray': {
                     50: '#f8f6f3',
                     100: '#f1ede8',
                     200: '#e9e4dd',
                     300: '#d8cfc8',
                     400: '#c2b8af',
                     500: '#8B8178',
                     600: '#6f6860',
                     700: '#585048',
                     800: '#413b33',
                     900: '#2a251e',
                 },
                 
                 // Amber scale (based on warning color)
                 'amber': {
                     50: '#fdf7f3',
                     100: '#fbece0',
                     200: '#f8dfc8',
                     300: '#f5d2af',
                     400: '#f2c597',
                     500: '#D4A574',
                     600: '#aa855d',
                     700: '#806245',
                     800: '#57402e',
                     900: '#2e2017',
                 },
             },
            fontFamily: {
                // Display font for headlines, product names
                'display': ['"Playfair Display"', 'Georgia', 'serif'],
                // Body font for body text, UI elements
                'body': ['Inter', '-apple-system', 'sans-serif'],
                // Accent font for labels, captions
                'accent': ['"DM Sans"', 'sans-serif'],
                // Serif font
                'serif': ['"Playfair Display"', 'Georgia', 'serif'],
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
