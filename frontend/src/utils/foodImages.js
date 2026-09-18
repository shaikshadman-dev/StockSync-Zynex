// Centralized Food Item Image Utilities and Category Presets

export const CATEGORY_IMAGE_PRESETS = {
  'Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80',
  'Starter': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80',
  'Chicken Curry': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=80',
  'Mutton Curry': 'https://images.unsplash.com/photo-1545247181-516773cae7be?w=500&auto=format&fit=crop&q=80',
  'Dessert': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80',
  'Dessert / Beverage': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80',
  'Breads / Rice': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
  'Default': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'
};

/**
 * Returns a high-res image URL for any dish, falling back to category presets.
 */
export function getDishImage(dish) {
  if (!dish) {
    return CATEGORY_IMAGE_PRESETS['Default'];
  }
  if (dish.image && typeof dish.image === 'string' && dish.image.trim().length > 0) {
    return dish.image;
  }
  if (dish.category && CATEGORY_IMAGE_PRESETS[dish.category]) {
    return CATEGORY_IMAGE_PRESETS[dish.category];
  }
  return CATEGORY_IMAGE_PRESETS['Default'];
}
