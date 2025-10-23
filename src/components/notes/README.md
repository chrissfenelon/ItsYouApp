# Message Container Customization System

This system allows users to fully customize the "Yon ti mesaj pou Bae" message container with real-time preview.

## Features

### 🎨 Visual Customization
- **Blur Effects**: Adjustable blur intensity (0-50) and type (light/dark/regular)
- **Opacity Controls**: Independent opacity for background, borders, and content
- **Color Schemes**: Customizable colors for background gradients, borders, text, and particles
- **Border Styling**: Configurable width, radius, and style (solid/dashed/dotted)

### ✨ Effects & Animation
- **Particle System**: Animated floating particles with customizable:
  - Count (0-100 particles)
  - Size (1-10px)
  - Speed (0.1-5x)
  - Color and opacity
- **Animations**: Configurable fade-in duration, delay, and pulse effects
- **Shadows**: Customizable shadow with color, opacity, radius, and offset

### 📐 Layout Controls
- **Dimensions**: Adjustable width (50%-100% of screen), padding, and margins
- **Positioning**: Smart positioning system that adapts to content

## Components

### 1. `CustomizableDailyMessage`
Enhanced version of the original DailyMessage component with full customization support.

```tsx
<CustomizableDailyMessage
  customStyle={user?.messageCustomization}
  previewMode={true} // For real-time preview
/>
```

### 2. `ParticleSystem`
Animated particle system that creates floating, pulsing particles around the message container.

```tsx
<ParticleSystem
  count={30}
  size={3}
  speed={1}
  color="rgba(255, 105, 180, 0.6)"
  opacity={0.6}
  containerWidth={300}
  containerHeight={120}
  enabled={true}
/>
```

### 3. `MessageCustomizationScreen`
Full-featured customization interface with:
- **Presets Tab**: 6 pre-designed styles (Classic, Romantic Glow, Ethereal Blue, etc.)
- **Colors Tab**: Color pickers for all visual elements
- **Effects Tab**: Controls for blur, particles, and animations
- **Layout Tab**: Dimension and positioning controls

### 4. Data Structure

```typescript
interface MessageContainerStyle {
  // Blur effects
  blurAmount: number;
  blurType: 'light' | 'dark' | 'regular';

  // Opacity settings
  backgroundOpacity: number;
  borderOpacity: number;
  contentOpacity: number;

  // Colors
  backgroundColor: {
    primary: string;
    secondary: string;
    tertiary: string;
  };

  // Particles
  particles: {
    enabled: boolean;
    count: number;
    size: number;
    speed: number;
    color: string;
    opacity: number;
  };

  // And more...
}
```

## Preset Styles

1. **Classique**: Default elegant romantic style
2. **Éclat Romantique**: Intense pink glow with sparkling particles
3. **Bleu Éthéré**: Soft blue tones with mystical atmosphere
4. **Coucher Doré**: Warm golden colors like a sunset
5. **Verre Minimal**: Clean design with subtle glass effect
6. **Néon Vibrant**: Colorful neon style with dynamic effects

## Integration

### Settings Integration
Added to Settings > Apparence > Message du jour

### User Profile Storage
Customization settings are stored in the user profile:
```typescript
interface User {
  messageCustomization?: MessageContainerStyle;
}
```

### Real-time Preview
The customization screen shows a live preview that updates instantly as users adjust settings.

## Technical Details

### Performance Optimizations
- Memoized styles to prevent unnecessary re-renders
- Efficient particle animation using `Animated.Value`
- Debounced auto-save (1 second delay)

### Cross-platform Compatibility
- Uses `react-native-linear-gradient` for gradients
- `@react-native-community/blur` for blur effects
- `@react-native-community/slider` for controls
- Fallback colors for reduced transparency scenarios

### Storage & Persistence
- Settings saved to AsyncStorage via `updateUserProfile`
- Preserved during app restarts and auth state changes
- Clean data structure prevents Firebase undefined value errors

## Usage Example

```typescript
// In HomeScreen.tsx
<CustomizableDailyMessage
  customStyle={user?.messageCustomization}
  style={styles.customMessageContainer}
/>

// Navigate to customization
navigateToScreen('messageCustomization')
```

This creates a fully customizable, romantic message container that enhances the couple's app experience with personalized visual flair! 💕