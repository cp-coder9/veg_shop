# Never.Regular.Studio Design System

## Table of Contents

1. [Overview](#overview)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Border Radius](#border-radius)
6. [Shadows](#shadows)
7. [Button Styles](#button-styles)
8. [Form Input Styles](#form-input-styles)
9. [Card Styles](#card-styles)
10. [Navigation Styles](#navigation-styles)
11. [Logo Placement Specifications](#logo-placement-specifications)
12. [Tailwind Configuration](#tailwind-configuration)

---

## Overview

**Project:** Never.Regular.Studio - Our harvest tote  
**Platform:** Mobile-first design (iPhone 14 Pro Max)  
**Style:** Minimalist, artisanal, handcrafted aesthetic

This design system is for a handcrafted tote bag product showcase app. The design emphasizes:
- Clean, minimalist layouts
- Natural, earthy color palette
- Product-focused imagery
- Artisanal branding elements

### Design Files Reference
- **Figma URL:** https://www.figma.com/design/pBwjKNPXBOoK01QR11Zmwg/Never.Regular.Studio
- **Prototype URL:** https://www.figma.com/proto/pBwjKNPXBOoK01QR11Zmwg/Never.Regular.Studio
- **Total Frames:** 9 screens
- **Device Target:** iPhone 14 Pro Max (430 x 932 px)

---

## Color Palette

### Primary Colors

| Name | Hex Code | RGB | Usage |
|------|----------|-----|-------|
| Primary Dark | `#1A1A1A` | rgb(26, 26, 26) | Primary text, headings |
| Primary Light | `#FFFFFF` | rgb(255, 255, 255) | Backgrounds, text on dark |
| Cream | `#F5F0E8` | rgb(245, 240, 232) | Secondary background |

### Secondary Colors

| Name | Hex Code | RGB | Usage |
|------|----------|-----|-------|
| Warm Gray | `#8B8178` | rgb(139, 129, 120) | Secondary text, borders |
| Light Gray | `#E8E4DE` | rgb(232, 228, 222) | Dividers, subtle backgrounds |
| Soft Black | `#2D2926` | rgb(45, 41, 38) | Accent elements |

### Accent Colors

| Name | Hex Code | RGB | Usage |
|------|----------|-----|-------|
| Terracotta | `#C17F59` | rgb(193, 127, 89) | CTAs, highlights |
| Sage Green | `#8B9A7D` | rgb(139, 154, 125) | Secondary accents |
| Muted Gold | `#B8A77A` | rgb(184, 167, 122) | Premium elements |

### Semantic Colors

| Name | Hex Code | Usage |
|------|----------|-------|
| Success | `#7A9E7E` | Success states, confirmations |
| Warning | `#D4A574` | Warning states |
| Error | `#C75D5D` | Error states, destructive actions |
| Info | `#7B8FA2` | Informational elements |

### CSS Variables

```css
:root {
  /* Primary */
  --color-primary-dark: #1A1A1A;
  --color-primary-light: #FFFFFF;
  --color-cream: #F5F0E8;
  
  /* Secondary */
  --color-warm-gray: #8B8178;
  --color-light-gray: #E8E4DE;
  --color-soft-black: #2D2926;
  
  /* Accent */
  --color-terracotta: #C17F59;
  --color-sage-green: #8B9A7D;
  --color-muted-gold: #B8A77A;
  
  /* Semantic */
  --color-success: #7A9E7E;
  --color-warning: #D4A574;
  --color-error: #C75D5D;
  --color-info: #7B8FA2;
}
```

---

## Typography

### Font Families

| Category | Font | Fallback | Usage |
|----------|------|----------|-------|
| Display | `Playfair Display` | Georgia, serif | Headlines, product names |
| Body | `Inter` | -apple-system, sans-serif | Body text, UI elements |
| Accent | `DM Sans` | sans-serif | Labels, captions |

### Font Sizes

| Name | Size | Line Height | Letter Spacing | Usage |
|------|------|-------------|----------------|-------|
| Display Large | 48px | 1.1 | -0.02em | Hero headlines |
| Display Medium | 36px | 1.2 | -0.01em | Section headings |
| Display Small | 28px | 1.25 | -0.01em | Subheadings |
| Body Large | 18px | 1.5 | 0 | Lead paragraphs |
| Body Medium | 16px | 1.5 | 0 | Default body text |
| Body Small | 14px | 1.5 | 0 | Secondary text |
| Caption | 12px | 1.4 | 0.02em | Labels, captions |
| Overline | 10px | 1.5 | 0.1em | Overline text |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Light | 300 | Large display text |
| Regular | 400 | Body text |
| Medium | 500 | Emphasis, labels |
| Semibold | 600 | Subheadings |
| Bold | 700 | Headlines, CTAs |

### CSS Typography

```css
:root {
  /* Font Families */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', -apple-system, sans-serif;
  --font-accent: 'DM Sans', sans-serif;
  
  /* Font Sizes */
  --text-display-lg: 48px;
  --text-display-md: 36px;
  --text-display-sm: 28px;
  --text-body-lg: 18px;
  --text-body-md: 16px;
  --text-body-sm: 14px;
  --text-caption: 12px;
  --text-overline: 10px;
  
  /* Line Heights */
  --leading-tight: 1.1;
  --leading-snug: 1.25;
  --leading-normal: 1.5;
  
  /* Letter Spacing */
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.02em;
  --tracking-wider: 0.1em;
}
```

---

## Spacing System

Based on an **8px base unit** with 4px increments for fine adjustments.

### Spacing Scale

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| space-0 | 0 | 0px | No spacing |
| space-1 | 0.25rem | 4px | Tight spacing |
| space-2 | 0.5rem | 8px | Base unit |
| space-3 | 0.75rem | 12px | Small gaps |
| space-4 | 1rem | 16px | Default spacing |
| space-5 | 1.25rem | 20px | Medium spacing |
| space-6 | 1.5rem | 24px | Section gaps |
| space-8 | 2rem | 32px | Large spacing |
| space-10 | 2.5rem | 40px | XL spacing |
| space-12 | 3rem | 48px | Section padding |
| space-16 | 4rem | 64px | Large sections |
| space-20 | 5rem | 80px | Hero spacing |
| space-24 | 6rem | 96px | Page sections |

### Component Spacing

| Component | Padding | Margin |
|-----------|---------|--------|
| Button | 12px 24px | - |
| Card | 20px | 16px |
| Input | 14px 16px | - |
| Modal | 24px | - |
| Section | - | 48px bottom |
| Container | 20px horizontal | - |

### CSS Variables

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  --space-20: 5rem;    /* 80px */
  --space-24: 6rem;    /* 96px */
}
```

---

## Border Radius

### Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| radius-none | 0 | Sharp corners |
| radius-sm | 4px | Small elements, tags |
| radius-md | 8px | Buttons, inputs |
| radius-lg | 12px | Cards, modals |
| radius-xl | 16px | Large cards |
| radius-2xl | 24px | Feature cards |
| radius-full | 9999px | Pills, avatars |

### Component Radius

| Component | Radius |
|-----------|--------|
| Button | 8px |
| Input | 8px |
| Card | 12px |
| Modal | 16px |
| Tag/Badge | 4px |
| Avatar | 9999px (full) |
| Image Container | 12px |

### CSS Variables

```css
:root {
  --radius-none: 0;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
}
```

---

## Shadows

### Shadow Scale

| Token | Value | Usage |
|-------|-------|-------|
| shadow-sm | `0 1px 2px rgba(0, 0, 0, 0.05)` | Subtle lift |
| shadow-md | `0 4px 6px rgba(0, 0, 0, 0.07)` | Cards, dropdowns |
| shadow-lg | `0 10px 15px rgba(0, 0, 0, 0.1)` | Modals, popovers |
| shadow-xl | `0 20px 25px rgba(0, 0, 0, 0.12)` | Floating elements |

### Component Shadows

| Component | Shadow |
|-----------|--------|
| Card (resting) | shadow-sm |
| Card (hover) | shadow-md |
| Dropdown | shadow-lg |
| Modal | shadow-xl |
| Button (elevated) | shadow-sm |

### CSS Variables

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.12);
}
```

---

## Button Styles

### Button Variants

#### Primary Button
```css
.btn-primary {
  background-color: #1A1A1A;
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #2D2926;
}

.btn-primary:active {
  background-color: #1A1A1A;
  transform: scale(0.98);
}
```

#### Secondary Button
```css
.btn-secondary {
  background-color: transparent;
  color: #1A1A1A;
  padding: 12px 24px;
  border-radius: 8px;
  border: 1px solid #E8E4DE;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: #F5F0E8;
  border-color: #8B8178;
}
```

#### Ghost Button
```css
.btn-ghost {
  background-color: transparent;
  color: #1A1A1A;
  padding: 12px 24px;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
```

### Button Sizes

| Size | Padding | Font Size |
|------|---------|-----------|
| Small | 8px 16px | 12px |
| Medium | 12px 24px | 14px |
| Large | 16px 32px | 16px |

---

## Form Input Styles

### Text Input
```css
.input {
  background-color: #FFFFFF;
  border: 1px solid #E8E4DE;
  border-radius: 8px;
  padding: 14px 16px;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  color: #1A1A1A;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #1A1A1A;
  box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1);
}

.input::placeholder {
  color: #8B8178;
}
```

### Input States

| State | Border Color | Background |
|-------|--------------|------------|
| Default | #E8E4DE | #FFFFFF |
| Focus | #1A1A1A | #FFFFFF |
| Error | #C75D5D | #FFF5F5 |
| Disabled | #E8E4DE | #F5F0E8 |

---

## Card Styles

### Product Card
```css
.card {
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  transform: translateY(-2px);
}

.card-image {
  border-radius: 12px;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}
```

### Card Variants

| Variant | Background | Shadow |
|---------|------------|--------|
| Default | #FFFFFF | shadow-sm |
| Elevated | #FFFFFF | shadow-md |
| Outlined | #FFFFFF | none, border: 1px solid #E8E4DE |
| Filled | #F5F0E8 | none |

---

## Navigation Styles

### Mobile Navigation (Bottom Tab Bar)
```css
.nav-tab-bar {
  background-color: #FFFFFF;
  border-top: 1px solid #E8E4DE;
  padding: 8px 0;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  color: #8B8178;
  font-size: 10px;
  font-weight: 500;
}

.nav-tab.active {
  color: #1A1A1A;
}
```

### Header Navigation
```css
.header {
  background-color: #FFFFFF;
  padding: 16px 20px;
  border-bottom: 1px solid #E8E4DE;
}

.header-title {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 600;
  color: #1A1A1A;
}
```

---

## Logo Placement Specifications

### Landing Page Logo Position

Based on the Figma design analysis, the logo placement area is indicated for the landing page:

| Property | Value | Notes |
|----------|-------|-------|
| Position | Top center | Horizontally centered |
| Top Margin | 60px | From top of viewport |
| Left/Right Margin | Auto | Centered |
| Width | 120px | Recommended logo width |
| Height | 40px | Recommended logo height |

### Logo Container CSS
```css
.logo-container {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
```

### Mobile Logo Position
```css
@media (max-width: 768px) {
  .logo-container {
    top: 40px;
    width: 100px;
    height: 32px;
  }
}
```

**Note:** The green square indicator in the Figma file marks the exact position where the site logo should be placed on the landing page. This area should be reserved for brand identity placement.

---

## Tailwind Configuration

### Complete Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary
        'primary-dark': '#1A1A1A',
        'primary-light': '#FFFFFF',
        'cream': '#F5F0E8',
        
        // Secondary
        'warm-gray': '#8B8178',
        'light-gray': '#E8E4DE',
        'soft-black': '#2D2926',
        
        // Accent
        'terracotta': '#C17F59',
        'sage-green': '#8B9A7D',
        'muted-gold': '#B8A77A',
        
        // Semantic
        'success': '#7A9E7E',
        'warning': '#D4A574',
        'error': '#C75D5D',
        'info': '#7B8FA2',
      },
      fontFamily: {
        'display': ['Playfair Display', 'Georgia', 'serif'],
        'body': ['Inter', '-apple-system', 'sans-serif'],
        'accent': ['DM Sans', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['36px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['28px', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'body-lg': ['18px', { lineHeight: '1.5' }],
        'body-md': ['16px', { lineHeight: '1.5' }],
        'body-sm': ['14px', { lineHeight: '1.5' }],
        'caption': ['12px', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        'overline': ['10px', { lineHeight: '1.5', letterSpacing: '0.1em' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
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
      },
    },
  },
  plugins: [],
}
```

### Usage Examples

```jsx
// Primary Button
<button className="bg-primary-dark text-white px-6 py-3 rounded-md font-medium text-sm tracking-wide hover:bg-soft-black transition-all">
  Add to Cart
</button>

// Secondary Button
<button className="bg-transparent text-primary-dark px-6 py-3 rounded-md border border-light-gray font-medium text-sm hover:bg-cream transition-all">
  Learn More
</button>

// Card Component
<div className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-all">
  <img className="rounded-lg aspect-square object-cover" src="..." alt="..." />
  <h3 className="font-display text-display-sm mt-4">Product Name</h3>
  <p className="text-warm-gray text-body-sm mt-2">Description text</p>
</div>

// Logo Container
<div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[120px] h-[40px] flex items-center justify-center">
  <img className="max-w-full max-h-full object-contain" src="logo.svg" alt="Logo" />
</div>
```

---

## Design Patterns

### Mobile Screen Layout
- Safe area padding: 20px horizontal
- Status bar height: 47px (iPhone 14 Pro Max)
- Navigation bar height: 44px
- Tab bar height: 83px (with home indicator)

### Image Guidelines
- Product images: 1:1 aspect ratio
- Hero images: 4:3 aspect ratio
- Thumbnail images: 80x80px
- Border radius: 12px for all images

### Animation Guidelines
- Transition duration: 200ms (fast), 300ms (normal)
- Easing: ease-out for enter, ease-in for exit
- Hover scale: 0.98 for buttons, 1.02 for cards

---

## Notes

### Limitations
This design system documentation was created based on visual analysis of the Figma prototype. Detailed specifications such as exact color values, typography settings, and spacing may require adjustment after accessing the Figma Dev Mode for precise measurements.

### Recommendations
1. Verify all color values with Figma Dev Mode access
2. Confirm typography settings with the design team
3. Test spacing and sizing on actual devices
4. Validate logo placement with the green square indicator in the Figma file

---

*Document created: February 2024*  
*Figma File: Never.Regular.Studio - Our harvest tote*  
*Target Platform: iOS Mobile App*
