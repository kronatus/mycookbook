# Responsive Design & Accessibility Enhancements

This document outlines the responsive design and accessibility improvements implemented in the Personal Cookbook application.

## Dark Mode Support

### Implementation
- **Theme Provider**: Context-based theme management with support for light, dark, and system preferences
- **Theme Toggle**: User-friendly toggle button in navigation
- **Persistent Preferences**: Theme choice saved to localStorage
- **System Preference Detection**: Automatically detects and respects OS dark mode settings
- **Smooth Transitions**: All color changes animate smoothly using CSS transitions

### Usage
```tsx
import { useTheme } from '@/components/ThemeProvider';

const { theme, setTheme, resolvedTheme } = useTheme();
```

### Dark Mode Classes
All components use Tailwind's `dark:` variant for dark mode styling:
- Background: `bg-white dark:bg-gray-800`
- Text: `text-gray-900 dark:text-gray-100`
- Borders: `border-gray-200 dark:border-gray-700`

## Mobile Optimization

### Touch-Friendly Controls
- **Minimum Touch Target Size**: All interactive elements are at least 44x44px (Apple HIG standard)
- **Touch Target Class**: `.touch-target` utility class ensures proper sizing
- **Active States**: Visual feedback on touch with `active:scale-95` for buttons
- **Tap Highlight**: Disabled default tap highlight for custom feedback

### Responsive Breakpoints
- **Mobile First**: Base styles target mobile devices
- **sm (640px)**: Small tablets and large phones
- **md (768px)**: Tablets
- **lg (1024px)**: Desktops

### Mobile Navigation
- **Slide-out Menu**: Full-height side panel on mobile
- **Backdrop**: Semi-transparent overlay when menu is open
- **Body Scroll Lock**: Prevents background scrolling when menu is open
- **Auto-close**: Menu closes on route change

### Responsive Typography
- Headings scale down on mobile: `text-2xl sm:text-3xl`
- Flexible layouts: `flex-col sm:flex-row`
- Responsive spacing: `gap-2 sm:gap-4`

## Accessibility Features

### Keyboard Navigation
- **Focus Visible**: Custom focus rings with `focus-visible:` pseudo-class
- **Skip Link**: "Skip to main content" link for keyboard users
- **Tab Order**: Logical tab order throughout the application
- **Escape Key**: Closes modals and menus

### Screen Reader Support
- **ARIA Labels**: All interactive elements have descriptive labels
- **ARIA Roles**: Proper roles for navigation, dialogs, and tabs
- **ARIA States**: `aria-expanded`, `aria-selected`, `aria-current` for dynamic content
- **Semantic HTML**: Proper use of `<nav>`, `<main>`, `<article>`, `<button>`, etc.
- **Hidden Decorative Content**: `aria-hidden="true"` for icons with text labels
- **Screen Reader Only Text**: `.sr-only` class for context

### Color Contrast
- **WCAG AA Compliant**: All text meets minimum contrast ratios
- **Dark Mode Contrast**: Adjusted colors for dark backgrounds
- **Focus Indicators**: High contrast focus rings (blue-500)

### Form Accessibility
- **Label Association**: All inputs have associated `<label>` elements with `htmlFor`
- **Placeholder Text**: Used as hints, not replacements for labels
- **Error Messages**: Descriptive validation messages
- **Input Types**: Proper input types for mobile keyboards (`number`, `email`, etc.)

## Safe Area Support

### Notched Devices
- **Safe Area Insets**: Support for iPhone notches and Android punch-holes
- **Viewport Fit**: `viewport-fit=cover` in meta tag
- **Safe Area Utilities**: Custom utilities for padding
  - `.pt-safe`: Top safe area
  - `.pb-safe`: Bottom safe area
  - `.pl-safe`: Left safe area
  - `.pr-safe`: Right safe area

## Performance Optimizations

### CSS Optimizations
- **Smooth Scrolling**: `-webkit-overflow-scrolling: touch` for iOS
- **Hardware Acceleration**: `transform` for animations
- **Reduced Motion**: Respects `prefers-reduced-motion` (future enhancement)

### Touch Optimizations
- **Touch Manipulation**: `touch-manipulation` prevents double-tap zoom
- **No Select**: `.no-select` utility for UI elements
- **Tap Highlight**: Transparent tap highlight color

## Component-Specific Enhancements

### Navigation
- Sticky positioning for easy access
- Responsive logo (abbreviated on mobile)
- Touch-friendly menu button
- Slide-in mobile menu with backdrop

### Recipe Cards
- Active state feedback on touch
- Flexible layouts for different screen sizes
- Proper semantic markup with `<article>`
- Screen reader friendly stats

### Recipe Editor
- Responsive form layouts
- Touch-friendly input fields
- Accessible tab navigation
- Mobile-optimized ingredient/instruction editing
- Proper ARIA labels for all form fields

### Modals
- Backdrop click to close
- Escape key support
- Focus trap (future enhancement)
- Responsive sizing with padding

## Testing Recommendations

### Manual Testing
1. **Mobile Devices**: Test on actual iOS and Android devices
2. **Screen Readers**: Test with VoiceOver (iOS/Mac) and TalkBack (Android)
3. **Keyboard Only**: Navigate entire app without mouse
4. **Dark Mode**: Toggle between light and dark modes
5. **Touch Gestures**: Verify all touch interactions work smoothly

### Automated Testing
1. **Lighthouse**: Run accessibility audits
2. **axe DevTools**: Check for WCAG violations
3. **Responsive Design Mode**: Test all breakpoints in browser DevTools

## Future Enhancements

### Planned Improvements
- [ ] Reduced motion support for animations
- [ ] High contrast mode
- [ ] Font size preferences
- [ ] Focus trap for modals
- [ ] Swipe gestures for mobile navigation
- [ ] Pull-to-refresh on mobile
- [ ] Haptic feedback on supported devices
- [ ] Voice control support

## Browser Support

### Minimum Requirements
- **iOS Safari**: 14+
- **Chrome/Edge**: 90+
- **Firefox**: 88+
- **Samsung Internet**: 14+

### Progressive Enhancement
- Dark mode: Falls back to light mode on older browsers
- CSS Grid: Falls back to flexbox where needed
- Safe area insets: Gracefully ignored on unsupported devices
