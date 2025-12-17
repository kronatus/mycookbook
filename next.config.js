const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14, no need for experimental flag
  
  // Image optimization configuration
  images: {
    // Enable image optimization
    formats: ['image/webp', 'image/avif'],
    
    // Configure image domains for external images
    domains: [
      // Add common recipe image domains
      'images.unsplash.com',
      'via.placeholder.com',
      // Add your own domain if hosting images
    ],
    
    // Configure image sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Enable image optimization for better performance
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    
    // Disable static imports for better control
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Performance optimizations
  swcMinify: true,
  
  // Compression
  compress: true,
  
  // Enable experimental features for better performance
  experimental: {
    // Enable optimized CSS loading
    optimizeCss: true,
    
    // Enable server components optimization
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

module.exports = withPWA(nextConfig)