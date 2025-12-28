/**
 * Shared product categories and units
 * This ensures consistent validation and data handling across the application
 */

export const PRODUCT_CATEGORIES = [
    'bakery',
    'broths',
    'nuts_fruit',
    'vegetables',
    'fruit',
    'local_produce',
    'plant_based',
    'dairy',
    'meat',
] as const;

export const PRODUCT_UNITS = [
    'pack',
    'bottle',
    'jar',
    'tub',
    'block',
    'wedge',
    'round',
    'tray',
    'box',
    'head',
    'each',
    'kg',
    'g',
    'L',
    'ml',
    'loaf',
    'bunch',
    'piece',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
export type ProductUnit = typeof PRODUCT_UNITS[number];
