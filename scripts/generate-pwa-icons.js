// Simple script to create placeholder PWA icons
// In production, you should use proper icon generation tools like:
// - https://realfavicongenerator.net/
// - https://www.pwabuilder.com/imageGenerator

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple SVG icon template
const createSVGIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#f97316"/>
  <g transform="translate(${size * 0.25}, ${size * 0.25})">
    <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="white">
      <path d="M12 2C13.1 2 14 2.9 14 4V5H19C20.1 5 21 5.9 21 7V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V7C3 5.9 3.9 5 5 5H10V4C10 2.9 10.9 2 12 2ZM12 4V6H10V4H12ZM19 7H5V19H19V7ZM7 9H17V11H7V9ZM7 13H17V15H7V13ZM7 17H14V19H7V17Z"/>
    </svg>
  </g>
</svg>`;
};

// Generate SVG files for each size
sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`Created ${filename}`);
});

// Create shortcut icons
const shortcuts = ['add-recipe', 'search', 'wishlist'];
shortcuts.forEach(shortcut => {
  const svgContent = createSVGIcon(96);
  const filename = `${shortcut}-96x96.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`Created ${filename}`);
});

console.log('\nPWA icons generated successfully!');
console.log('\nNote: These are placeholder SVG icons.');
console.log('For production, generate proper PNG icons using:');
console.log('- https://realfavicongenerator.net/');
console.log('- https://www.pwabuilder.com/imageGenerator');
console.log('\nOr convert these SVGs to PNGs using an image conversion tool.');
