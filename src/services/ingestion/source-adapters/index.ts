export { BaseSourceAdapter } from './base-adapter';
export { JsonLdAdapter } from './json-ld-adapter';
export { AllRecipesAdapter } from './allrecipes-adapter';
export { YouTubeAdapter } from './youtube-adapter';
export { TikTokAdapter } from './tiktok-adapter';
export { InstagramAdapter } from './instagram-adapter';

// Export all adapters for easy registration
export const AVAILABLE_ADAPTERS = [
  'YouTubeAdapter',
  'TikTokAdapter', 
  'InstagramAdapter',
  'AllRecipesAdapter',
  'JsonLdAdapter', // Keep as fallback - should be last
] as const;

export type AdapterName = typeof AVAILABLE_ADAPTERS[number];